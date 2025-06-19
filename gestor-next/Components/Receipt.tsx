"use client";
import { CheckCircle, Download, RotateCcw, Calendar, Hash, User, CreditCard } from "lucide-react";

export type PaymentData = {
  clientId?: number;
  clientName?: string;
  phone?: string;
  method: "cash" | "card" | "transfer" | null;
  amount: number;
  taxes: number;
  total: number;
  reference?: number;
  // Campos añadidos por backend
  order_id?: number;
  payment_type?: string;
  status_pago?: number;
  estado_pedido?: number;
  cajero_nombre?: string;
  date?: string;
};

type Props = { paymentData: PaymentData; onReset: () => void };

export default function Receipt({ paymentData, onReset }: Props) {
  const currentDate = paymentData.date ?? new Date().toLocaleString("es-MX");
  const transactionId = paymentData.order_id ? `ORD-${paymentData.order_id}` : `TXN-${Date.now()}`;

  const getMethodName = (m: string | null) =>
    m === "cash" ? "Efectivo" : m === "card" ? "Tarjeta" : m === "transfer" ? "Transferencia" : "No especificado";

  const handlePrint = () => window.print();

  return (
    <div className="max-w-2xl mx-auto">
      {/* encabezado */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">¡Pago Procesado Exitosamente!</h3>
        <p className="text-slate-600">El comprobante ha sido generado</p>
      </div>

      {/* comprobante */}
      <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-8 mb-8">
        <div className="text-center border-b border-slate-200 pb-6 mb-6">
          <h4 className="text-xl font-bold text-slate-800">COMPROBANTE DE PAGO</h4>
          <p className="text-sm text-slate-500 mt-1">Sistema de Punto de Venta</p>
        </div>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="flex items-center gap-2 text-slate-500"><Hash className="w-4 h-4" />Transacción:</p>
              <p className="font-mono font-medium">{transactionId}</p>
            </div>
            <div>
              <p className="flex items-center gap-2 text-slate-500"><Calendar className="w-4 h-4" />Fecha:</p>
              <p className="font-medium">{currentDate}</p>
            </div>
          </div>

          {/* Datos del cliente */}
          <div className="border-t border-slate-200 pt-4">
            <h5 className="font-medium text-slate-800 mb-3 flex items-center gap-2"><User className="w-4 h-4" />Cliente</h5>
            <div className="grid grid-cols-2 gap-4">
              {paymentData.clientName && (
                <p><span className="text-slate-500">Nombre:</span> {paymentData.clientName}</p>
              )}
              {paymentData.phone && (
                <p><span className="text-slate-500">Teléfono:</span> {paymentData.phone}</p>
              )}
              {paymentData.clientId && (
                <p><span className="text-slate-500">ID Cliente:</span> {paymentData.clientId}</p>
              )}
            </div>
          </div>

          {/* Detalles del pago */}
          <div className="border-t border-slate-200 pt-4 space-y-2">
            <h5 className="font-medium text-slate-800 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" />Pago</h5>
            <div className="flex justify-between"><span>Método:</span><span>{getMethodName(paymentData.method)}</span></div>
            {paymentData.reference && (
              <div className="flex justify-between"><span>Referencia:</span><span>{paymentData.reference}</span></div>
            )}
            <div className="flex justify-between"><span>Subtotal:</span><span>${paymentData.amount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>IVA:</span><span>${paymentData.taxes.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg border-t border-slate-200 pt-2"><span>Total:</span><span className="text-green-600">${paymentData.total.toFixed(2)}</span></div>
            {paymentData.status_pago && (
              <div className="flex justify-between"><span>Estado de Pago:</span><span>{paymentData.status_pago}</span></div>
            )}
            {paymentData.estado_pedido && (
              <div className="flex justify-between"><span>Estado del Pedido:</span><span>{paymentData.estado_pedido}</span></div>
            )}
            {paymentData.cajero_nombre && (
              <div className="flex justify-between"><span>Cajero:</span><span>{paymentData.cajero_nombre}</span></div>
            )}
          </div>
        </div>
      </div>

      {/* acciones */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
          <Download className="w-5 h-5" /> Imprimir
        </button>
        <button onClick={onReset} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700">
          <RotateCcw className="w-5 h-5" /> Nueva Transacción
        </button>
      </div>
    </div>
  );
}