"use client"

import { useState } from "react"
import {
  CreditCard,
  User,
  ReceiptIcon,
  ArrowLeft,
  ShoppingCart,
  CheckCircle,
  Circle,
  Store,
  UserCircle,
} from "lucide-react"
import ClientForm from "../../../../Components/ClientForm"
import PaymentMethod from "../../../../Components/PaymentMethod"
import Receipt from "../../../../Components/Receipt"

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

const steps = [
  {
    id: 1,
    title: "Datos del Cliente",
    description: "Información personal",
    icon: User,
  },
  {
    id: 2,
    title: "Método de Pago",
    description: "Seleccionar forma de pago",
    icon: CreditCard,
  },
  {
    id: 3,
    title: "Comprobante",
    description: "Recibo de pago",
    icon: ReceiptIcon,
  },
]

export default function PagoSucursal() {
  const [step, setStep] = useState<number>(1)
  const [paymentData, setPaymentData] = useState<Partial<PaymentData>>({})

  const handleNextStep = (data: Partial<PaymentData>) => {
    setPaymentData((prev) => ({ ...prev, ...data }))
    setStep((prev) => prev + 1)
  }

  const handlePrevStep = () => {
    setStep((prev) => prev - 1)
  }

  const handleReset = () => {
    setPaymentData({})
    setStep(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Sistema de Pago</h1>
                <p className="text-sm text-slate-600">Punto de Venta - Sucursal</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 rounded-full px-4 py-2">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">Cajero Principal</p>
                <p className="text-xs text-slate-500">En línea</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((stepItem, index) => {
              const StepIcon = stepItem.icon
              const isActive = step === stepItem.id
              const isCompleted = step > stepItem.id
              const isUpcoming = step < stepItem.id

              return (
                <div key={stepItem.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? "bg-green-500 text-white shadow-lg"
                          : isActive
                            ? "bg-blue-500 text-white shadow-lg scale-110"
                            : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <StepIcon className="w-6 h-6" />}

                      {isActive && (
                        <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-25"></div>
                      )}
                    </div>

                    <div className="mt-3 text-center">
                      <p
                        className={`text-sm font-medium ${
                          isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-slate-500"
                        }`}
                      >
                        {stepItem.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{stepItem.description}</p>
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 rounded-full transition-all duration-300 ${
                        step > stepItem.id ? "bg-green-500" : "bg-slate-200"
                      }`}
                      style={{ minWidth: "80px" }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 px-8 py-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">{steps.find((s) => s.id === step)?.title}</h2>
                    <p className="text-sm text-slate-600">
                      Paso {step} de {steps.length} - {steps.find((s) => s.id === step)?.description}
                    </p>
                  </div>
                </div>

                {step > 1 && (
                  <button
                    onClick={handlePrevStep}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all duration-200 hover:shadow-md"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Anterior
                  </button>
                )}
              </div>
            </div>

            {/* Card Content */}
            <div className="p-8">
              <div className="transition-all duration-300 ease-in-out">
                {step === 1 && (
                  <div className="animate-in slide-in-from-right-5 duration-300">
                    <ClientForm initialData={paymentData} onNext={handleNextStep} />
                  </div>
                )}

                {step === 2 && (
                  <div className="animate-in slide-in-from-right-5 duration-300">
                    <PaymentMethod initialData={paymentData} onNext={handleNextStep} onPrev={handlePrevStep} />
                  </div>
                )}

                {step === 3 && (
                  <div className="animate-in slide-in-from-right-5 duration-300">
                    <Receipt paymentData={paymentData as PaymentData} onReset={handleReset} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Help Card */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Circle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-1">¿Necesitas ayuda?</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Si tienes problemas con el proceso de pago, contacta al supervisor o consulta el manual de
                  procedimientos.
                </p>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    F1 - Ayuda
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    F2 - Supervisor
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}