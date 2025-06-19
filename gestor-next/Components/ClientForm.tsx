"use client"

import type React from "react"

import { useState } from "react"
import { User, Phone, BadgeIcon as IdCard, ArrowRight } from "lucide-react"

type PaymentData = {
  clientId: string
  clientName: string
  clientMendo: string
  phone: string
}

interface ClientFormProps {
  initialData: Partial<PaymentData>
  onNext: (data: Partial<PaymentData>) => void
}

export default function ClientForm({ initialData, onNext }: ClientFormProps) {
  const [formData, setFormData] = useState({
    clientId: initialData.clientId || "",
    clientName: initialData.clientName || "",
    clientMendo: initialData.clientMendo || "",
    phone: initialData.phone || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validación básica
    const newErrors: Record<string, string> = {}

    if (!formData.clientName.trim()) {
      newErrors.clientName = "El nombre es requerido"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido"
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "El teléfono debe tener 10 dígitos"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onNext(formData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Información del Cliente</h3>
        <p className="text-slate-600">Ingresa los datos del cliente para procesar el pago</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <IdCard className="w-4 h-4 inline mr-2" />
              ID del Cliente
            </label>
            <input
              type="text"
              value={formData.clientId}
              onChange={(e) => handleInputChange("clientId", e.target.value)}
              placeholder="Ej: CLI001"
              className="w-full p-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Nombre Completo *
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => handleInputChange("clientName", e.target.value)}
              placeholder="Juan Pérez García"
              className={`w-full p-4 border rounded-xl focus:ring-4 transition-all ${
                errors.clientName
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
              }`}
              required
            />
            {errors.clientName && <p className="text-red-500 text-sm mt-1">{errors.clientName}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Teléfono *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="555-123-4567"
              className={`w-full p-4 border rounded-xl focus:ring-4 transition-all ${
                errors.phone
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
              }`}
              required
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Referencia Cliente</label>
            <input
              type="text"
              value={formData.clientMendo}
              onChange={(e) => handleInputChange("clientMendo", e.target.value)}
              placeholder="Referencia opcional"
              className="w-full p-4 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            Continuar
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
