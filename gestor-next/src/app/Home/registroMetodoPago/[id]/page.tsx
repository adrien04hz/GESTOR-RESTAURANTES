"use client"

import type React from "react"

import { useState } from "react"
// Para la navegación usaremos window.history y window.location

import { CreditCard, Mail, Plus, ArrowLeft, Loader2, Shield, Lock } from "lucide-react"

type MetodoPago = "tarjeta" | "debito" | "paypal" | "otros"

export default function Page() {
  // Obtenemos el clienteId del almacenamiento local, que debería haberse guardado en el login
  const getClientIdFromStorage = () => {
    if (typeof window !== 'undefined') {
      const userDataString = sessionStorage.getItem('userData');
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          return userData.id.toString(); // Asumiendo que el ID del cliente es un número
        } catch (e) {
          console.error("Error parsing user data from session storage", e);
        }
      }
    }
    return ""; // Valor por defecto si no se encuentra
  };

  const clienteId = getClientIdFromStorage();

  // Estados del formulario
  const [tipoMetodo, setTipoMetodo] = useState<MetodoPago>("tarjeta")
  const [datosTarjeta, setDatosTarjeta] = useState({
    numero_tarjeta: "", // Coincide con el modelo FastAPI
    titular: "",      // Coincide con el modelo FastAPI
    fecha_vencimiento: "", // Coincide con el modelo FastAPI (MM/YY)
    cvv: "",
    linea_credito: 0, // Para CreditCardRequest
  })
  const [emailPayPal, setEmailPayPal] = useState("")
  const [passwordPayPal, setPasswordPayPal] = useState("") // Necesario para PaypalRequest
  const [otrosMetodo, setOtrosMetodo] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validación básica de clienteId
    if (!clienteId) {
      setError("ID de cliente no encontrado. Por favor, inicia sesión de nuevo.");
      setIsLoading(false);
      return;
    }

    try {
      let endpoint = "";
      // El id_cliente debe ser un número entero para FastAPI
      let payload: any = { id_cliente: parseInt(clienteId) }; 

      if (tipoMetodo === "tarjeta") {
        endpoint = "add-credit-card";
        if (datosTarjeta.numero_tarjeta.replace(/\D/g, "").length < 13) {
          throw new Error("Número de tarjeta de crédito inválido");
        }
        if (datosTarjeta.cvv.replace(/\D/g, "").length < 3) {
          throw new Error("CVV de tarjeta de crédito inválido");
        }
        if (!/^\d{2}\/\d{2}$/.test(datosTarjeta.fecha_vencimiento)) {
          throw new Error("Formato de fecha de vencimiento (MM/AA) incorrecto.");
        }
        
        payload = {
          ...payload,
          titular: datosTarjeta.titular,
          numero_tarjeta: datosTarjeta.numero_tarjeta.replace(/\D/g, ""), // Limpiar antes de enviar
          fecha_vencimiento: datosTarjeta.fecha_vencimiento,
          cvv: datosTarjeta.cvv.replace(/\D/g, ""), // Limpiar antes de enviar
          linea_credito: datosTarjeta.linea_credito, // Incluir linea_credito
        };
      } else if (tipoMetodo === "debito") {
        endpoint = "add-debit-card";
        if (datosTarjeta.numero_tarjeta.replace(/\D/g, "").length < 13) {
          throw new Error("Número de tarjeta de débito inválido");
        }
        if (datosTarjeta.cvv.replace(/\D/g, "").length < 3) {
          throw new Error("CVV de tarjeta de débito inválido");
        }
        if (!/^\d{2}\/\d{2}$/.test(datosTarjeta.fecha_vencimiento)) {
          throw new Error("Formato de fecha de vencimiento (MM/AA) incorrecto.");
        }

        payload = {
          ...payload,
          titular: datosTarjeta.titular,
          numero_tarjeta: datosTarjeta.numero_tarjeta.replace(/\D/g, ""),
          fecha_vencimiento: datosTarjeta.fecha_vencimiento,
          cvv: datosTarjeta.cvv.replace(/\D/g, ""),
        };
      } else if (tipoMetodo === "paypal") {
        endpoint = "add-paypal";
        if (!emailPayPal.includes("@") || passwordPayPal.length < 6) { // Validar email y contraseña
          throw new Error("Email de PayPal o contraseña inválidos");
        }
        payload = {
          ...payload,
          email: emailPayPal,
          password: passwordPayPal,
        };
      } else {
        throw new Error("Tipo de método de pago 'Otros' no soportado por la API.");
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
      }

      const response = await fetch(`http://localhost:8000/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Mejor manejo del error 422 de FastAPI
        if (response.status === 422 && errorData.detail) {
          // Si el error es de validación de Pydantic, muestra los detalles
          const validationErrors = errorData.detail.map((err: any) => `${err.loc.join('.')} ${err.msg}`).join('; ');
          throw new Error(`Error de validación: ${validationErrors}`);
        }
        throw new Error(errorData.detail || "Error al registrar método de pago.");
      }

      //window.location.href = `/Home/perfil-cliente`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumeroTarjeta = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{4})/g, "$1 ")
      .trim()
  }

  const formatExpiracion = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + "/" + cleaned.substring(2, 4)
    }
    return cleaned
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => window.history.back()} // Usar window.history.back()
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Agregar Método de Pago</h1>
            {/* Mostrar clienteId si está disponible */}
            <p className="text-slate-600">Cliente #{clienteId || 'N/A'} • Información segura y encriptada</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Security Banner */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Conexión Segura</p>
                <p className="text-xs text-green-600">Tus datos están protegidos con encriptación SSL</p>
              </div>
              <Lock className="w-4 h-4 text-green-600 ml-auto" />
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Payment Method Selection */}
              <div>
                <label className="block text-lg font-semibold text-slate-800 mb-4">Selecciona tu método de pago</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    type="button"
                    onClick={() => setTipoMetodo("tarjeta")}
                    className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                      tipoMetodo === "tarjeta"
                        ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <CreditCard
                        className={`w-8 h-8 mb-3 ${tipoMetodo === "tarjeta" ? "text-blue-600" : "text-slate-400"}`}
                      />
                      <span className={`font-medium ${tipoMetodo === "tarjeta" ? "text-blue-800" : "text-slate-600"}`}>
                        Tarjeta de Crédito
                      </span>
                      <span className="text-xs text-slate-500 mt-1">Visa, Mastercard, etc.</span>
                    </div>
                    {tipoMetodo === "tarjeta" && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoMetodo("debito")}
                    className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                      tipoMetodo === "debito"
                        ? "border-green-500 bg-green-50 shadow-lg scale-105"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <CreditCard
                        className={`w-8 h-8 mb-3 ${tipoMetodo === "debito" ? "text-green-600" : "text-slate-400"}`}
                      />
                      <span className={`font-medium ${tipoMetodo === "debito" ? "text-green-800" : "text-slate-600"}`}>
                        Tarjeta de Débito
                      </span>
                      <span className="text-xs text-slate-500 mt-1">Débito bancario</span>
                    </div>
                    {tipoMetodo === "debito" && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoMetodo("paypal")}
                    className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                      tipoMetodo === "paypal"
                        ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <Mail
                        className={`w-8 h-8 mb-3 ${tipoMetodo === "paypal" ? "text-blue-600" : "text-slate-400"}`}
                      />
                      <span className={`font-medium ${tipoMetodo === "paypal" ? "text-blue-800" : "text-slate-600"}`}>
                        PayPal
                      </span>
                      <span className="text-xs text-slate-500 mt-1">Pago con email</span>
                    </div>
                    {tipoMetodo === "paypal" && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoMetodo("otros")}
                    className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                      tipoMetodo === "otros"
                        ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <Plus className={`w-8 h-8 mb-3 ${tipoMetodo === "otros" ? "text-blue-600" : "text-slate-400"}`} />
                      <span className={`font-medium ${tipoMetodo === "otros" ? "text-blue-800" : "text-slate-600"}`}>
                        Otro Método
                      </span>
                      <span className="text-xs text-slate-500 mt-1">Transferencia, etc.</span>
                    </div>
                    {tipoMetodo === "otros" && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-slate-50 rounded-xl p-6">
                {(tipoMetodo === "tarjeta" || tipoMetodo === "debito") && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      {tipoMetodo === "tarjeta"
                        ? "Información de la Tarjeta de Crédito"
                        : "Información de la Tarjeta de Débito"}
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Número de tarjeta</label>
                        <input
                          type="text"
                          value={formatNumeroTarjeta(datosTarjeta.numero_tarjeta)}
                          onChange={(e) => setDatosTarjeta({ ...datosTarjeta, numero_tarjeta: e.target.value })}
                          placeholder="1234 5678 9012 3456"
                          className="w-full p-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-lg font-mono"
                          maxLength={19}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del titular</label>
                        <input
                          type="text"
                          value={datosTarjeta.titular}
                          onChange={(e) => setDatosTarjeta({ ...datosTarjeta, titular: e.target.value.toUpperCase() })}
                          placeholder="JUAN PÉREZ"
                          className="w-full p-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all uppercase"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de expiración</label>
                          <input
                            type="text"
                            value={datosTarjeta.fecha_vencimiento}
                            onChange={(e) =>
                              setDatosTarjeta({ ...datosTarjeta, fecha_vencimiento: formatExpiracion(e.target.value) })
                            }
                            placeholder="MM/AA"
                            className="w-full p-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-mono"
                            maxLength={5}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">CVV</label>
                          <input
                            type="password"
                            value={datosTarjeta.cvv}
                            onChange={(e) =>
                              setDatosTarjeta({ ...datosTarjeta, cvv: e.target.value.replace(/\D/g, "") })
                            }
                            placeholder="123"
                            className="w-full p-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-mono"
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>
                      {tipoMetodo === "tarjeta" && ( // Solo para tarjetas de crédito
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Línea de Crédito</label>
                          <input
                            type="number"
                            value={datosTarjeta.linea_credito}
                            onChange={(e) =>
                              setDatosTarjeta({ ...datosTarjeta, linea_credito: parseFloat(e.target.value) || 0 })
                            }
                            placeholder="0"
                            className="w-full p-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-lg font-mono"
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {tipoMetodo === "paypal" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Cuenta PayPal
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email de PayPal</label>
                      <input
                        type="email"
                        value={emailPayPal}
                        onChange={(e) => setEmailPayPal(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full p-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña de PayPal</label>
                      <input
                        type="password"
                        value={passwordPayPal}
                        onChange={(e) => setPasswordPayPal(e.target.value)}
                        placeholder="Ingresa tu contraseña de PayPal"
                        className="w-full p-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                {tipoMetodo === "otros" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Otro Método de Pago
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Descripción del método</label>
                      <input
                        type="text"
                        value={otrosMetodo}
                        onChange={(e) => setOtrosMetodo(e.target.value)}
                        placeholder="Ej: Transferencia bancaria, efectivo, etc."
                        className="w-full p-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="flex-1 px-6 py-4 border-2 border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-400 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Registrando método...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Registrar Método Seguro
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-amber-800 font-medium text-sm">Modo Demostración</p>
              <p className="text-amber-700 text-sm mt-1">
                Esta es una versión de prueba. Los datos ingresados no se almacenarán de forma permanente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
