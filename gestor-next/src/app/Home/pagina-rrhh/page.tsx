'use client';
import { CgProfile } from "react-icons/cg";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function PaginaRRHH() {
    const router = useRouter();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Obtener datos de sesión al cargar el componente
        const data = sessionStorage.getItem('userData');
        if (!data) {
            router.push('../../');
            return;
        }

        const parsedData: UserData = JSON.parse(data);

        // Verificar que el usuario sea de RRHH
        if (parsedData.rol_nombre !== "Empleado de Recursos Humanos") {
            router.push('/acceso-denegado');
            return;
        }

        setUserData(parsedData);
        setLoading(false);
    }, [router]);

    if (loading) {
        return (
            <div className="bg-blue-100 font-sans h-screen w-full flex flex-row justify-center items-center">
                <div className="text-xl text-gray-700">Cargando datos...</div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="bg-blue-100 font-sans h-screen w-full flex flex-row justify-center items-center">
                <div className="text-xl text-gray-700">No se encontraron datos de usuario</div>
            </div>
        );
    }

    return (
        <div className="bg-blue-100 font-sans h-screen w-full flex flex-row justify-center items-center">
            <div className="card w-96 mx-auto bg-white shadow-xl hover:shadow-md transition-shadow duration-300">
                <div className="flex justify-center mt-6">
                    <CgProfile className="text-6xl text-blue-600" />
                </div>
                <div className="text-center mt-4 px-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {userData.nombre} {userData.apellido}
                    </h2>
                    <p className="text-lg text-blue-600 mt-1">
                        {userData.rol_nombre}
                    </p>
                    {userData.nombre_sucursal && (
                        <p className="text-gray-600 mt-1">
                            Sucursal: {userData.nombre_sucursal}
                        </p>
                    )}
                </div>

                <div className="relative mt-6 mx-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                </div>

                <div className="p-6 flex flex-col space-y-4">
                    <Link
                        href="../registro-personal"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300 text-center"
                    >
                        Registrar Nuevo Empleado
                    </Link>
                </div>
            </div>
        </div>
    );
}