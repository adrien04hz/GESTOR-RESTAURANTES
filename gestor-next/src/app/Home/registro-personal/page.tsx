"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export interface Sucursales {
    success: boolean;
    data:    Datum[];
}

export interface Datum {
    id:     number;
    nombre: string;
}


interface EmpleadoForm {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    confirm_password: string;
    id_empleado: string;
    id_rol: string;
    id_sucursal: string;
}

interface Rol {
    id: string;
    nombre: string;
    descripcion: string;
}

interface UserData {
    id: number;
    nombre: string;
    apellido: string;
    id_rol: number;
    id_sucursal: number;
    nombre_sucursal?: string;
    rol_nombre?: string;
}


interface Sucursal{
    id : number;
    nombre: string;
}

export default function RegistroEmpleadoRRHH() {
    const router = useRouter();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [formData, setFormData] = useState<EmpleadoForm>({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        confirm_password: '',
        id_empleado: '',
        id_rol: '',
        id_sucursal: ''
    });

    const [roles, setRoles] = useState<Rol[]>([]);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [errors, setErrors] = useState<Partial<EmpleadoForm & { submit: string }>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingRoles, setIsLoadingRoles] = useState(true);
    const [isLoadingSucursales, setIsLoadingSucursales] = useState(true);

    // Verificar sesión y cargar datos iniciales
    useEffect(() => {
        const data = sessionStorage.getItem('userData');
        if (!data) {
            router.push('../');
            return;
        }

        const parsedData: UserData = JSON.parse(data);
        setUserData(parsedData);

        // Solo RRHH puede registrar empleados
        if (parsedData.rol_nombre !== "Empleado Depto. Recursos Humanos") {
            router.push('/acceso-denegado');
            return;
        }

        // Cargar datos necesarios
        const loadData = async () => {
            try {
                // Cargar roles (excluyendo RRHH y Admin)
                const rolesResponse = await fetch('http://127.0.0.1:8000/roles');
                if (rolesResponse.ok) {
                    const rolesData = await rolesResponse.json();
                    setRoles(rolesData.filter((rol: Rol) => 
                        !["Empleado de Recursos Humanos", "Administrador"].includes(rol.nombre)
                    ));
                }

                // Cargar sucursales
                const sucursalesResponse = await fetch('http://127.0.0.1:8000/sucursales');
                if (sucursalesResponse.ok) {
                    const sucursalesData : Sucursales = await sucursalesResponse.json();
                    const { data } = sucursalesData;
                    setSucursales(data);
                }
            } catch (error) {
                setErrors(prev => ({ ...prev, submit: 'Error al cargar datos iniciales' }));
            } finally {
                setIsLoadingRoles(false);
                setIsLoadingSucursales(false);
                setIsLoading(false);
            }
        };

        loadData();
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof EmpleadoForm]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<EmpleadoForm> = {};

        if (!formData.nombre.trim()) newErrors.nombre = 'Nombre es requerido';
        if (!formData.apellido.trim()) newErrors.apellido = 'Apellido es requerido';
        if (!formData.email.includes('@')) newErrors.email = 'Email inválido';
        if (formData.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
        if (formData.password !== formData.confirm_password)
            newErrors.confirm_password = 'Las contraseñas no coinciden';
        if (!formData.id_empleado.trim()) newErrors.id_empleado = 'ID Empleado requerido';
        if (!formData.id_rol.trim()) newErrors.id_rol = 'Debe seleccionar un rol';
        if (!formData.id_sucursal.trim()) newErrors.id_sucursal = 'Debe seleccionar una sucursal';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const { confirm_password, ...empleadoData } = formData;

            const response = await fetch('http://tu-backend-fastapi.com/empleados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(empleadoData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error en el registro');
            }

            // Limpiar formulario y mostrar mensaje de éxito
            setFormData({
                nombre: '',
                apellido: '',
                email: '',
                password: '',
                confirm_password: '',
                id_empleado: '',
                id_rol: '',
                id_sucursal: ''
            });
            setErrors({ submit: 'Empleado registrado exitosamente.' });
        } catch (error) {
            setErrors({ submit: error instanceof Error ? error.message : 'Error al registrar empleado' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Cargando...</div>;
    if (!userData) return <div className="p-8 text-center">No autorizado</div>;

    return (
        <div className="antialiased bg-blue-50">
            <div className="min-h-screen flex flex-col">
                <div className="container max-w-3xl mx-auto flex-1 flex flex-col items-center justify-center px-2">
                    <div className="bg-white px-8 py-8 rounded-lg shadow-md w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-800">
                                Registrar Nuevo Empleado
                            </h1>
                            <Link 
                                href="/rrhh/empleados" 
                                className="text-blue-600 hover:underline"
                            >
                                Volver a lista de empleados
                            </Link>
                        </div>

                        {errors.submit && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded">
                                <p>{errors.submit}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-700 mb-2">Nombre*</label>
                                    <input
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        className={`w-full p-3 border rounded-lg text-gray-700 ${errors.nombre ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Ej: Juan"
                                    />
                                    {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2">Apellido*</label>
                                    <input
                                        name="apellido"
                                        value={formData.apellido}
                                        onChange={handleChange}
                                        className={`w-full p-3 border rounded-lg text-gray-700 ${errors.apellido ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Ej: Pérez"
                                    />
                                    {errors.apellido && <p className="text-red-500 text-sm mt-1">{errors.apellido}</p>}
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2">Email*</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`w-full p-3 border rounded-lg text-gray-700 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="ejemplo@correo.com"
                                    />
                                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2">ID Empleado*</label>
                                    <input
                                        name="id_empleado"
                                        value={formData.id_empleado}
                                        onChange={handleChange}
                                        className={`w-full p-3 border rounded-lg text-gray-700 ${errors.id_empleado ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Identificador único"
                                    />
                                    {errors.id_empleado && <p className="text-red-500 text-sm mt-1">{errors.id_empleado}</p>}
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2">Rol*</label>
                                    <select
                                        name="id_rol"
                                        value={formData.id_rol}
                                        onChange={handleChange}
                                        className={`w-full p-3 border rounded-lg text-gray-700 ${errors.id_rol ? 'border-red-500' : 'border-gray-300'}`}
                                        disabled={isLoadingRoles}
                                    >
                                        <option value="">Seleccione un rol</option>
                                        {roles.map((rol) => (
                                            <option key={rol.id} value={rol.id}>
                                                {rol.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.id_rol && <p className="text-red-500 text-sm mt-1">{errors.id_rol}</p>}
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2">Sucursal*</label>
                                    <select
                                        name="id_sucursal"
                                        value={formData.id_sucursal}
                                        onChange={handleChange}
                                        className={`w-full p-3 border rounded-lg text-gray-700 ${errors.id_sucursal ? 'border-red-500' : 'border-gray-300'}`}
                                        disabled={isLoadingSucursales}
                                    >
                                        <option value="">Seleccione una sucursal</option>
                                        {sucursales.map((sucursal) => (
                                            <option key={sucursal.id} value={sucursal.id}>
                                                {sucursal.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.id_sucursal && <p className="text-red-500 text-sm mt-1">{errors.id_sucursal}</p>}
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2">Contraseña*</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`w-full p-3 border rounded-lg text-gray-700 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2">Confirmar Contraseña*</label>
                                    <input
                                        type="password"
                                        name="confirm_password"
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                        className={`w-full p-3 border rounded-lg text-gray-700 ${errors.confirm_password ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Repite tu contraseña"
                                    />
                                    {errors.confirm_password && <p className="text-red-500 text-sm mt-1">{errors.confirm_password}</p>}
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || isLoadingRoles || isLoadingSucursales}
                                    className={`w-full py-3 px-4 rounded-lg text-white font-medium text-lg ${
                                        isSubmitting || isLoadingRoles || isLoadingSucursales 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-blue-600 hover:bg-blue-700 transition-colors'
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Registrando...
                                        </span>
                                    ) : 'Registrar Empleado'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}