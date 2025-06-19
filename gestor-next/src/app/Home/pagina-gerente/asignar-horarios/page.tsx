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

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Empleados } from '../../../../../Interfaces/BasesDatos';



interface Response{
  success: boolean;
  data: Empleados[];
}


interface DiasSemana{
  dia : string;
  hora_entrada: string;
  hora_salida: string;
}


interface HorarioRequest{
  id_gerente: number;
  id_empleado: number;
  email_empleado: string;
  id_sucursal: number;
  horarios: DiasSemana[];
}




export default function Horarios() {
  const [empleados, setEmpleados] = useState<Empleados[]>([]);
  // Mock data - Eliminar cuando tengas el backend
  const userData = {
    id: 1,
    nombre: "Gerente",
    apellido: "Demo",
    id_rol: 1,
    id_sucursal: 1,
    nombre_sucursal: "Sucursal Principal"
  };

  // const [empleados] = useState<Empleado[]>([
  //   { id: 2, nombre: "Juan", apellido: "Pérez", id_rol: 2 },
  //   { id: 3, nombre: "María", apellido: "Gómez", id_rol: 2 },
  //   { id: 4, nombre: "Carlos", apellido: "López", id_rol: 2 }
  // ]);

  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<number | null>(null);
  const [empleado, setEmpleado] = useState<Empleados | null>(null);
  const [horarios, setHorarios] = useState<DiasSemana[]>([
    { dia: 'Lunes', hora_entrada: '09:00', hora_salida: '18:00' },
    { dia: 'Martes', hora_entrada: '09:00', hora_salida: '18:00' },
    { dia: 'Miércoles', hora_entrada: '09:00', hora_salida: '18:00' },
    { dia: 'Jueves', hora_entrada: '09:00', hora_salida: '18:00' },
    { dia: 'Viernes', hora_entrada: '09:00', hora_salida: '18:00' },
    { dia: 'Sábado', hora_entrada: '', hora_salida: '' },
    { dia: 'Domingo', hora_entrada: '', hora_salida: '' }
  ]);
  const [success, setSuccess] = useState('');

  const handleHorarioChange = (index: number, field: 'hora_entrada' | 'hora_salida', value: string) => {
    const nuevosHorarios = [...horarios];
    nuevosHorarios[index][field] = value;
    setHorarios(nuevosHorarios);
  };

  const handleSubmit = () => {
    if (!empleadoSeleccionado) {
      alert('Por favor selecciona un empleado');
      return;
    }

    const postHorarios = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/gestionHorarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_gerente: 1,
            id_empleado: empleado?.id,
            email_empleado: empleado?.email,
            id_sucursal: empleado?.id_sucursal,
            horarios: horarios
          })
        });
        const data = await response.json();
        console.log('POST /gestionHorarios response:', data);
      } catch (error) {
        console.error('Error posting horarios:', error);
      }
    };
    postHorarios();
    
    // Simular envío exitoso
    console.log('Horarios a guardar:', {
      id_empleado: empleadoSeleccionado,
      horarios: horarios
    });
    
    setSuccess('Horarios asignados correctamente (modo demo)');
    setTimeout(() => setSuccess(''), 3000);
  };


  useEffect(() => {
    const mortales = async () => {
      const response = await fetch('http://localhost:8000/empleados');
      const data: Response = await response.json();
      if (data.success) {
        setEmpleados(data.data);
      }
    };
    mortales();
  },[])


  useEffect(() => {

  }, []);


  console.log("Empleados:", empleados);
  console.log("Empleado seleccionado:", empleado);
  return (
    <div className="min-h-screen bg-green-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Asignación de Horarios - {userData.nombre_sucursal}
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
            value={empleadoSeleccionado ?? ""}
            onChange={(e) => {
              const id = Number(e.target.value);
              setEmpleadoSeleccionado(id);
              const emp = empleados.find(emp => emp.id === id) || null;
              setEmpleado(emp);
            }}
          >
            <option value="">-- Seleccione un empleado --</option>
            {empleados.map(empleado => (
              <option key={empleado.id} value={empleado.id}>
                {empleado.nombre} {empleado.apellido}
              </option>
            ))}
          </select>
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
                      className="w-full p-1 border rounded text-gray-600"
                      value={horario.hora_entrada}
                      onChange={(e) => handleHorarioChange(index, 'hora_entrada', e.target.value)}
                    />
                  </td>
                  <td className="py-2 px-4 border border-gray-600">
                    <input
                      type="time"
                      className="w-full p-1 border rounded text-gray-600"
                      value={horario.hora_salida}
                      onChange={(e) => handleHorarioChange(index, 'hora_salida', e.target.value)}
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