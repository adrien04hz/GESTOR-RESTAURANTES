/*
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserData {
  id: number;
  nombre: string;
  apellido: string;
  id_rol: number;
  id_sucursal: number;
  nombre_sucursal?: string;
}

interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
  id_rol: number;
}

interface Horario {
  dia: string;
  entrada: string;
  salida: string;
}

export default function Horarios() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<number | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([
    { dia: 'Lunes', entrada: '09:00', salida: '18:00' },
    { dia: 'Martes', entrada: '09:00', salida: '18:00' },
    { dia: 'Miércoles', entrada: '09:00', salida: '18:00' },
    { dia: 'Jueves', entrada: '09:00', salida: '18:00' },
    { dia: 'Viernes', entrada: '09:00', salida: '18:00' },
    { dia: 'Sábado', entrada: '', salida: '' },
    { dia: 'Domingo', entrada: '', salida: '' }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Obtener datos de sesión
    const data = sessionStorage.getItem('userData');
    if (!data) {
      router.push('../../../');
      return;
    }

    const parsedData: UserData = JSON.parse(data);
    setUserData(parsedData);
    
    // Obtener empleados de la misma sucursal
    fetchEmpleados(parsedData.id_sucursal);
  }, [router]);

  const fetchEmpleados = async (idSucursal: number) => {
    try {
      const response = await fetch(`/api/sucursales/${idSucursal}/empleados`);
      if (!response.ok) throw new Error('Error al obtener empleados');
      
      const data: Empleado[] = await response.json();
      // Filtrar para excluir gerentes (si es necesario)
      setEmpleados(data.filter(e => e.id_rol !== 1));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHorarioChange = (index: number, field: 'entrada' | 'salida', value: string) => {
    const nuevosHorarios = [...horarios];
    nuevosHorarios[index][field] = value;
    setHorarios(nuevosHorarios);
  };

  const handleSubmit = async () => {
    if (!empleadoSeleccionado) {
      alert('Por favor selecciona un empleado');
      return;
    }

    try {
      const response = await fetch('/api/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_empleado: empleadoSeleccionado,
          horarios: horarios
        })
      });

      if (!response.ok) throw new Error('Error al guardar horarios');

      setSuccess('Horarios asignados correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al asignar horarios');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-600">Cargando...</div>;
  if (!userData) return <div className="p-8 text-center text-gray-600">No autorizado</div>;

  return (
    <div className="min-h-screen bg-green-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Asignación de Horarios - {userData.nombre_sucursal || 'Sucursal'}
          </h1>
          <Link 
            href="/Home/pagina-gerente" 
            className="text-blue-600 hover:underline"
          >
            Volver al panel
          </Link>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Seleccionar Empleado:</label>
          <select
            className="text-gray-600 w-full p-2 border border-gray-300 rounded"
            onChange={(e) => setEmpleadoSeleccionado(Number(e.target.value))}
            disabled={empleados.length === 0}
          >
            <option value="">-- Seleccione un empleado --</option>
            {empleados.map(empleado => (
              <option key={empleado.id} value={empleado.id}>
                {empleado.nombre} {empleado.apellido}
              </option>
            ))}
          </select>
          {empleados.length === 0 && (
            <p className="text-red-500 text-sm mt-1">No hay empleados disponibles</p>
          )}
        </div>

        <div className="overflow-x-auto mb-6">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border text-gray-600">Día</th>
                <th className="py-2 px-4 border text-gray-600">Hora de Entrada</th>
                <th className="py-2 px-4 border text-gray-600">Hora de Salida</th>
              </tr>
            </thead>
            <tbody>
              {horarios.map((horario, index) => (
                <tr key={horario.dia} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border font-medium text-gray-600">{horario.dia}</td>
                  <td className="py-2 px-4 border border-gray-600">
                    <input
                      type="time"
                      className="text-gray-600 w-full p-1 border rounded"
                      value={horario.entrada}
                      onChange={(e) => handleHorarioChange(index, 'entrada', e.target.value)}
                    />
                  </td>
                  <td className="py-2 px-4 border border-gray-600">
                    <input
                      type="time"
                      className="text-gray-600 w-full p-1 border rounded"
                      value={horario.salida}
                      onChange={(e) => handleHorarioChange(index, 'salida', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!empleadoSeleccionado}
            className={`bg-green-600 text-white font-bold py-2 px-6 rounded ${
              !empleadoSeleccionado ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
            }`}
          >
            Guardar Horarios
          </button>
        </div>

        {success && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded text-center">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
*/

// horarios_page.tsx
'use client';
import { useState, useEffect } from 'react';

interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
  id_rol: number;
  email?: string;
  id_sucursal?: number;
}

interface Horario {
  dia: string;
  entrada: string;
  salida: string;
}

// Define la interfaz para los datos del usuario que se almacenarán
interface UserData {
  id: number;
  nombre: string;
  apellido: string;
  id_rol: number;
  id_sucursal?: number;
  nombre_sucursal?: string;
}

export default function Horarios() {
  // Estado para almacenar los datos del usuario.
  // Inicializamos con null y usamos la interfaz UserData o null.
  const [userData, setUserData] = useState<UserData | null>(null);
  
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<number | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([
    { dia: 'Lunes', entrada: '09:00', salida: '18:00' },
    { dia: 'Martes', entrada: '09:00', salida: '18:00' },
    { dia: 'Miércoles', entrada: '09:00', salida: '18:00' },
    { dia: 'Jueves', entrada: '09:00', salida: '18:00' },
    { dia: 'Viernes', entrada: '09:00', salida: '18:00' },
    { dia: 'Sábado', entrada: '', salida: '' },
    { dia: 'Domingo', entrada: '', salida: '' }
  ]);
  const [success, setSuccess] = useState('');
  const [message, setMessage] = useState('');

  // Primer useEffect: Cargar userData de sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') { // Asegura que el código se ejecute solo en el cliente
      const storedUserData = sessionStorage.getItem('userData');
      if (storedUserData) {
        try {
          // Parseamos el JSON y lo tipamos como UserData
          setUserData(JSON.parse(storedUserData) as UserData);
        } catch (e) {
          console.error("Error parsing userData from sessionStorage", e);
          setError('Error al cargar los datos del usuario. Formato incorrecto.');
        }
      } else {
        // Si no hay datos de usuario, podrías redirigir al login o mostrar un error
        setError('No se encontraron datos de usuario. Por favor, inicia sesión de nuevo.');
      }
    }
  }, []); // Se ejecuta solo una vez al montar el componente

  // Segundo useEffect: Obtener la lista de empleados (depende de que userData esté cargado)
  useEffect(() => {
    // Solo intenta cargar empleados si userData ya ha sido cargado y no hay un error previo
    if (userData && !error) { 
      const fetchEmployees = async () => {
        setLoading(true);
        setError(null);
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            setError('No hay token de autenticación. Por favor, inicia sesión.');
            setLoading(false);
            return;
          }

          const response = await fetch('http://localhost:8000/get-employees', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error al cargar los empleados.');
          }

          const data = await response.json();
          setEmpleados(data.data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error desconocido al cargar empleados.');
          console.error("Error al cargar empleados:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchEmployees();
    } else if (!userData && !loading) {
        // Si userData es null y no estamos cargando, significa que no se encontró
        // y el error ya debería haberse establecido en el primer useEffect.
        // No hacer nada aquí, el estado de error ya se encargará del renderizado.
    }
  }, [userData, error]); // Este efecto se ejecuta cuando userData o error cambian

  const handleHorarioChange = (index: number, field: 'entrada' | 'salida', value: string) => {
    const nuevosHorarios = [...horarios];
    nuevosHorarios[index][field] = value;
    setHorarios(nuevosHorarios);
  };

  const handleSubmit = () => {
    if (!empleadoSeleccionado) {
      setMessage('Por favor selecciona un empleado');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    console.log('Horarios a guardar:', {
      id_empleado: empleadoSeleccionado,
      horarios: horarios
    });
    
    setSuccess('Horarios asignados correctamente (modo demo)');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Muestra un mensaje mientras userData se carga o si no se encuentra
  if (!userData) { 
    return (
      <div className="min-h-screen bg-green-100 p-6 flex justify-center items-center">
        <p className="text-gray-700 text-lg">Cargando datos de usuario...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-green-100 p-6 flex justify-center items-center">
        <p className="text-gray-700 text-lg">Cargando empleados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-100 p-6 flex justify-center items-center">
        <p className="text-red-700 text-lg">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          {/* Se accede a las propiedades de userData de forma segura */}
          <h1 className="text-2xl font-bold text-gray-800">
            Asignación de Horarios - {userData?.nombre_sucursal || 'Cargando...'}
          </h1>
          <a
            href="/Home/pagina-gerente"
            className="text-blue-600 hover:underline"
          >
            Volver al panel
          </a>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Seleccionar Empleado:</label>
          <select
            className="text-gray-600 w-full p-2 border border-gray-300 rounded"
            onChange={(e) => setEmpleadoSeleccionado(Number(e.target.value))}
            value={empleadoSeleccionado || ''}
          >
            <option value="">-- Seleccione un empleado --</option>
            {empleados.map(empleado => (
              <option key={empleado.id} value={empleado.id}>
                {empleado.nombre} {empleado.apellido}
              </option>
            ))}
          </select>
        </div>

        {message && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded text-center">
            {message}
          </div>
        )}

        <div className="overflow-x-auto mb-6">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border text-gray-600">Día</th>
                <th className="py-2 px-4 border text-gray-600">Hora de Entrada</th>
                <th className="py-2 px-4 border text-gray-600">Hora de Salida</th>
              </tr>
            </thead>
            <tbody>
              {horarios.map((horario, index) => (
                <tr key={horario.dia} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border font-medium text-gray-600">{horario.dia}</td>
                  <td className="py-2 px-4 border border-gray-600">
                    <input
                      type="time"
                      className="w-full p-1 border rounded text-gray-600"
                      value={horario.entrada}
                      onChange={(e) => handleHorarioChange(index, 'entrada', e.target.value)}
                    />
                  </td>
                  <td className="py-2 px-4 border border-gray-600">
                    <input
                      type="time"
                      className="w-full p-1 border rounded text-gray-600"
                      value={horario.salida}
                      onChange={(e) => handleHorarioChange(index, 'salida', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!empleadoSeleccionado}
            className={`bg-green-600 text-white font-bold py-2 px-6 rounded ${
              !empleadoSeleccionado ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
            }`}
          >
            Guardar Horarios
          </button>
        </div>

        {success && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded text-center">
            {success}
          </div>
        )}

        {/* Banner de advertencia de modo demo */}
        <div className="mt-6 p-3 bg-yellow-100 text-yellow-800 rounded text-center text-sm">
          <p>Estás en modo demostración. Los datos no se guardarán realmente.</p>
        </div>
      </div>
    </div>
  );
}
