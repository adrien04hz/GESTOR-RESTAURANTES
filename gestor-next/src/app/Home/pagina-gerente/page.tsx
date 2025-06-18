'use client';
import { CgProfile } from "react-icons/cg";
import Link from "next/link";
import { useEffect, useState } from "react";

interface UserData {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  id_rol: number;
  rol_nombre: string;
  id_sucursal?: number;
  nombre_sucursal?: string;
}

export default function PaginaGerente() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Obtener datos de sesión al cargar el componente
        const data = sessionStorage.getItem('userData');
        if (data) {
            setUserData(JSON.parse(data));
        } else {
            // Redirigir a login si no hay sesión
            window.location.href = '../../';
        }
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="bg-green-200 font-sans h-screen w-full flex flex-row justify-center items-center">
                <div className="text-xl">Cargando datos...</div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="bg-green-200 font-sans h-screen w-full flex flex-row justify-center items-center">
                <div className="text-xl">No se encontraron datos de usuario</div>
            </div>
        );
    }

    return (
        <div className="bg-green-200 font-sans h-screen w-full flex flex-row justify-center items-center">
            <div className="card w-96 mx-auto bg-white shadow-xl hover:shadow">
                <div className="flex justify-center mt-4">
                    <CgProfile className="text-5xl text-gray-600" />
                </div>
                <div className="text-gray-600 text-center mt-2 text-3xl font-medium">
                    {userData.nombre} {userData.apellido}
                </div>
                <div className="text-center font-medium text-gray-600 text-lg">
                    {userData.rol_nombre}
                    {userData.nombre_sucursal && ` - ${userData.nombre_sucursal}`}
                </div>
                
                <div className="relative mt-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                </div>

                <div className="p-6 flex flex-col space-y-4">
                    <Link 
                        href="./pagina-gerente/asignar-horarios" 
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 text-center"
                    >
                        Asignar horarios
                    </Link>
                    
                    <Link 
                        href="./pagina-gerente/ver-empleados" 
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 text-center"
                    >
                        Ver empleados
                    </Link>
                </div>
            </div>
        </div>
    );
}