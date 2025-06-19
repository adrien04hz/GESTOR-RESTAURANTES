"use client";
import { useState } from "react";
import { CreditCard, Banknote, ArrowRight, ArrowLeft, Smartphone } from "lucide-react";

// Tipos
export type PaymentData = {
  clientId: number;
  method: "cash" | "card" | "transfer" | null;
  amount: number;
  taxes: number;
  total: number;
  reference: number;  //  = order_id
};

type PaymentMethodProps = {
  initialData: Partial<PaymentData>;
  onNext: (data: Partial<PaymentData>) => void;
  onPrev: () => void;
};

export default function PaymentMethod({ initialData, onNext, onPrev }: PaymentMethodProps) {
  const [formData, setFormData] = useState({
    method: initialData.method ?? null,
    amount: initialData.amount ?? 0,
    reference: initialData.reference ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.method) newErrors.method = "Selecciona un método de pago";
    if (formData.amount <= 0) newErrors.amount = "El monto debe ser mayor a 0";
    if (!initialData.clientId) newErrors.clientId = "Falta ID de cliente";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    // Calcular IVA y total
    const taxes = formData.amount * 0.16;
    const total  = formData.amount + taxes;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("No hay sesión activa. Inicia sesión de nuevo.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/pay-at-branch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_id: Number(initialData.clientId),
          order_id: Number(formData.reference),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al procesar pago");

      // Fusionar ticket backend + datos locales
      onNext({ ...formData, taxes, total, ...data.ticket });
    } catch (err: any) {
      alert(err.message || "Fallo de red");
    }
  };

  const paymentMethods = [
    {
      id: "cash" as const,
      name: "Efectivo",
      description: "Pago en efectivo",
      icon: Banknote,
      color: "green",
    },
    {
      id: "card" as const,
      name: "Tarjeta",
      description: "Débito o crédito",
      icon: CreditCard,
      color: "blue",
    },
    {
      id: "transfer" as const,
      name: "Transferencia",
      description: "Transferencia bancaria",
      icon: Smartphone,
      color: "purple",
    },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CreditCard className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Método de Pago</h3>
        <p className="text-slate-600">Selecciona la forma de pago y el monto</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Monto */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Monto a Cobrar *</label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData((prev) => ({ ...prev, amount: Number.parseFloat(e.target.value) || 0 }))}
            placeholder="0.00"
            className={`w-full p-4 border rounded-xl focus:ring-4 transition-all text-2xl font-bold text-center ${
              errors.amount
                ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
            }`}
            required
          />
          {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
        </div>

        {/* Métodos de Pago */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-4">Método de Pago *</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              const isSelected = formData.method === method.id

              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, method: method.id }))}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? `border-${method.color}-500 bg-${method.color}-50 shadow-lg scale-105`
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <Icon className={`w-8 h-8 mb-3 ${isSelected ? `text-${method.color}-600` : "text-slate-400"}`} />
                    <span className={`font-medium ${isSelected ? `text-${method.color}-800` : "text-slate-600"}`}>
                      {method.name}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">{method.description}</span>
                  </div>
                  {isSelected && (
                    <div
                      className={`absolute -top-2 -right-2 w-6 h-6 bg-${method.color}-500 rounded-full flex items-center justify-center`}
                    >
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          {errors.method && <p className="text-red-500 text-sm mt-2">{errors.method}</p>}
        </div>

        {/* Referencia */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Referencia de Pago</label>
          <input
            type="text"
            value={formData.reference}
            onChange={(e) => setFormData((prev) => ({ ...prev, reference: e.target.value }))}
            placeholder="Número de referencia (opcional)"
            className="w-full p-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
          />
        </div>

        {/* Resumen */}
        {formData.amount > 0 && (
          <div className="bg-slate-50 rounded-xl p-6">
            <h4 className="font-medium text-slate-800 mb-4">Resumen del Pago</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-medium">${formData.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">IVA (16%):</span>
                <span className="font-medium">${(formData.amount * 0.16).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${(formData.amount * 1.16).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onPrev}
            className="flex items-center gap-2 px-6 py-3 border-2 border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-400 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
          >
            Procesar Pago
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}