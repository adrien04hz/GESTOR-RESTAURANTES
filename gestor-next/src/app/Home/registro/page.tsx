"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ClienteForm {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
  direccion: string;
  confirm_password: string;
}

export default function Registro() {
  const router = useRouter();
  const [formData, setFormData] = useState<ClienteForm>({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
    confirm_password: ''
  });

  const [errors, setErrors] = useState<Partial<ClienteForm & { submit: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error cuando el usuario escribe
    if (errors[name as keyof ClienteForm]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ClienteForm> = {};
    
    if (!formData.nombre.trim()) newErrors.nombre = 'Nombre es requerido';
    if (!formData.apellido.trim()) newErrors.apellido = 'Apellido es requerido';
    if (!formData.email.includes('@')) newErrors.email = 'Email inválido';
    if (formData.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    if (!/^[0-9]{10}$/.test(formData.telefono)) newErrors.telefono = 'Teléfono debe tener 10 dígitos';
    if (!formData.direccion.trim()) newErrors.direccion = 'Dirección es requerida';
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Eliminamos confirm_password antes de enviar
      const { confirm_password, ...clienteData } = formData;
      
      const response = await fetch('http://tu-backend-fastapi.com/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clienteData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en el registro');
      }
      
      router.push('/login');
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Error al registrar' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="antialiased  bg-green-200">
      <div className="min-h-screen flex flex-col">
        <div className=" container max-w-md mx-auto flex-1 flex flex-col items-center justify-center px-2">
          <div className="bg-white px-8 py-6 rounded shadow-md w-full">
            <h1 className="mb-6 text-2xl font-bold text-center text-gray-600">Registro de Cliente</h1>
            
            {errors.submit && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4">
                <p>{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">Nombre*</label>
                  <input
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded text-gray-600 ${errors.nombre ? 'border-red-500' : 'border-black'}`}
                    placeholder="Ej: Juan"
                  />
                  {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Apellido*</label>
                  <input
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded text-gray-600 ${errors.apellido ? 'border-red-500' : 'border-black'}`}
                    placeholder="Ej: Pérez"
                  />
                  {errors.apellido && <p className="text-red-500 text-sm mt-1">{errors.apellido}</p>}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Email*</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded text-gray-600 ${errors.email ? 'border-red-500' : 'border-black'}`}
                  placeholder="ejemplo@correo.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">Teléfono*</label>
                  <input
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded text-gray-600 ${errors.telefono ? 'border-red-500' : 'border-black'}`}
                    placeholder="10 dígitos"
                    maxLength={10}
                  />
                  {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>}
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Dirección*</label>
                  <input
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded text-gray-600 ${errors.direccion ? 'border-red-500' : 'border-black'}`}
                    placeholder="Calle, número, ciudad"
                  />
                  {errors.direccion && <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">Contraseña*</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded text-gray-600 ${errors.password ? 'border-red-500' : 'border-black'}`}
                    placeholder="Mínimo 6 caracteres"
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Confirmar Contraseña*</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded text-gray-600 ${errors.confirm_password ? 'border-red-500' : 'border-black'}`}
                    placeholder="Repite tu contraseña"
                  />
                  {errors.confirm_password && <p className="text-red-500 text-sm mt-1">{errors.confirm_password}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 mt-6 rounded text-white font-medium ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 transition-colors'}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registrando...
                  </span>
                ) : 'Registrarse'}
              </button>
            </form>

            <div className="text-center mt-6 text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-green-600 hover:underline font-medium">
                Inicia sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}