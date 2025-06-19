"use client"

import { CheckCircle, Download, RotateCcw, Calendar, Hash, User, CreditCard } from "lucide-react"

type PaymentData = {
  clientId: string
  clientName: string
  clientMendo: string
  phone: string
  method: "cash" | "card" | "transfer" | null
  amount: number
  taxes: number
  total: number
  reference: string
  ticarioNumber: string
  legalioValidated: boolean
}

interface ReceiptProps {
  paymentData: PaymentData
  onReset: () => void
}

export default function Receipt({ paymentData, onReset }: ReceiptProps) {
  const currentDate = new Date().toLocaleString("es-MX")
  const transactionId = `TXN-${Date.now()}`

  const getMethodName = (method: string | null) => {
    switch (method) {
      case "cash":
        return "Efectivo"
      case "card":
        return "Tarjeta"
      case "transfer":
        return "Transferencia"
      default:
        return "No especificado"
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">¡Pago Procesado Exitosamente!</h3>
        <p className="text-slate-600">El comprobante ha sido generado</p>
      </div>

      {/* Receipt */}
      <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-8 mb-8">
        <div className="text-center border-b border-slate-200 pb-6 mb-6">
          <h4 className="text-xl font-bold text-slate-800">COMPROBANTE DE PAGO</h4>
          <p className="text-sm text-slate-500 mt-1">Sistema de Punto de Venta</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Transacción:
              </p>
              <p className="font-mono text-sm font-medium">{transactionId}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fecha:
              </p>
              <p className="text-sm font-medium">{currentDate}</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h5 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Información del Cliente
            </h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Nombre:</span>
                <p className="font-medium">{paymentData.clientName}</p>
              </div>
              <div>
                <span className="text-slate-500">Teléfono:</span>
                <p className="font-medium">{paymentData.phone}</p>
              </div>
              {paymentData.clientId && (
                <div>
                  <span className="text-slate-500">ID Cliente:</span>
                  <p className="font-medium">{paymentData.clientId}</p>
                </div>
              )}
              {paymentData.clientMendo && (
                <div>
                  <span className="text-slate-500">Referencia:</span>
                  <p className="font-medium">{paymentData.clientMendo}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h5 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Detalles del Pago
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Método de Pago:</span>
                <span className="font-medium">{getMethodName(paymentData.method)}</span>
              </div>
              {paymentData.reference && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Referencia:</span>
                  <span className="font-medium">{paymentData.reference}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-medium">${paymentData.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">IVA (16%):</span>
                <span className="font-medium">${paymentData.taxes.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Pagado:</span>
                  <span className="text-green-600">${paymentData.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500">Gracias por su preferencia</p>
          <p className="text-xs text-slate-400 mt-1">Conserve este comprobante para cualquier aclaración</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Download className="w-5 h-5" />
          Imprimir Comprobante
        </button>

        <button
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
        >
          <RotateCcw className="w-5 h-5" />
          Nueva Transacción
        </button>
      </div>
    </div>
  )
}
