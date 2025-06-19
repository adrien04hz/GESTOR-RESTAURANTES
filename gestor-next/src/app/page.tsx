// login_page.tsx (Este es el archivo de login original que el usuario ha proporcionado)
"use client";
import router from 'next/router';
import { useState } from 'react';
// Eliminado: import { useRouter } from 'next/navigation'; // Ya no se usa useRouter

interface UserData {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  id_rol: number;
  rol_nombre: string;
  id_sucursal?: number; // Para gerentes/empleados
  nombre_sucursal?: string; // Para gerentes/empleados
}

export default function LoginPage() {
  // Eliminado: const router = useRouter(); // useRouter ya no es necesario
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    login: '' // Error general de autenticación
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error al escribir
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '', login: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      email: formData.email.includes('@') ? '' : 'Email inválido',
      password: formData.password.length >= 6 ? '' : 'Mínimo 6 caracteres',
      login: ''
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    setIsSubmitting(true);
    setErrors(prev => ({ ...prev, login: '' }));
  
    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
  
      if (!response.ok) {
        throw new Error('Credenciales incorrectas');
      }
  
      const data = await response.json();
      const token = data.access_token;
      const userData: UserData = data.user;
  
      localStorage.setItem('token', token);
      sessionStorage.setItem('userData', JSON.stringify(userData)); // Guardar userData en sessionStorage
  
      // Usar window.location.href para la navegación
      if (userData.id_rol === 1) {
        router.push('/Home/pagina-gerente');
      } else if (userData.id_rol === 3) {
        router.push('/Home/pagina-rrhh');
      }else if(userData.id_rol === 5){
        router.push('/Home/pagoSucursal');

      } else {
        router.push('/Home/Catalogo/' + 1);
      }
  
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        login: error instanceof Error ? error.message : 'Error al iniciar sesión'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="antialiased bg-gradient-to-br from-green-200 to-white">
      <div className="container px-6 mx-auto">
        <div className="flex flex-col text-center md:text-left md:flex-row h-screen justify-evenly md:items-center">
          <div className="flex flex-col w-full">
            <h1 className="text-5xl text-gray-800 font-bold">Iniciar Sesión</h1>
            <p className="w-5/12 mx-auto md:mx-0 text-gray-500">
              Entra a nuestro catálogo de productos y disfruta de una experiencia inolvidable.
            </p>
          </div>
          
          <div className="w-full md:w-full lg:w-9/12 mx-auto md:mx-0">
            <div className="bg-white p-10 flex flex-col w-full shadow-xl rounded-xl">
              <h2 className="text-2xl font-bold text-gray-800 text-left mb-5">
                Inicia Sesión
              </h2>

              {errors.login && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {errors.login}
                </div>
              )}

              <form onSubmit={handleSubmit} className="w-full">
                <div className="flex flex-col w-full my-5">
                  <label htmlFor="email" className="text-gray-500 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Ingresa tu email"
                    className={`appearance-none border-2 rounded-lg px-4 py-3 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600 focus:shadow-lg ${
                      errors.email ? 'border-red-500' : 'border-gray-100'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="flex flex-col w-full my-5">
                  <label htmlFor="password" className="text-gray-500 mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Ingresa tu contraseña"
                    className={`appearance-none border-2 rounded-lg px-4 py-3 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600 focus:shadow-lg ${
                      errors.password ? 'border-red-500' : 'border-gray-100'
                    }`}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                <div className="flex flex-col w-full my-5">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 rounded-lg text-white ${
                      isSubmitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                    } transition-colors`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </span>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </button>

                  <div className="flex justify-center mt-5">
                    {/* Se reemplaza Link por <a> y se usa window.location.href para la navegación */}
                    <a
                      href="/Home/registro-cliente"
                      className="text-center font-medium text-gray-500 hover:text-green-600 transition-colors"
                    >
                      ¿No tienes cuenta? Regístrate
                    </a>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
