interface Roles{
    id: number;
    nombre: string;
    descripcion: string;
}


interface Empleados{
    id : number;
    id_rol: number;
    id_sucursal: number;
    nombre: string;
    apellido: string;
    email: string;
    password: string;
}


interface Sucursales{
    id: number;
    nombre: string;
}


interface Departamentos{
    id: number;
    nombre: string;
}


interface EmpleadosAdmin{
    id : number;
    id_rolAdmin: number;
    id_depto : number;
    nombre: string;
    apellido: string;
    email: string;
    password: string;
}


interface RolesAdmin{
    id: number;
    nombre: string;
    descripcion: string;
}


interface Clientes{
    id : number;
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    telefono: string;
    direccion: string;
}


interface TarjetasDebitoCliente{
    id: number;
    id_cliente: number;
    titular: string;
    numero_tarjeta: string;
    fecha_vencimiento: string;
    cvv: string;
}


interface TarjetasCreditoCliente{
    id: number;
    id_cliente: number;
    titular: string;
    numero_tarjeta: string;
    fecha_vencimiento: string;
    cvv: string;
    linea_credito: number;
}


interface PayPalCliente{
    id: number;
    id_cliente: number;
    email: string;
    password: string;
}


// el menu de cada sucursal
 export interface Productos{
    id : number;
    id_sucursal: number;
    nombre: string;
    descripcion: string;
    precio: number;
    imagen: string;
}


// carritos de los clientes
interface Carrito{
    id : number;
    id_cliente: number;
    id_sucursal: number;
}


interface DetalleCarrito{
    id_carrito: number;
    id_producto: number;
    cantidad: number;
}


interface PedidosCliente{
    id : number;
    id_cliente: number;
    id_estado: number;
    id_estado_pagado: number; // nueva coleccion
    id_sucursal: number;
    monto_total: number;
    fecha: string;
}

interface ProductoPedido{
    id_pedido: number;
    id_producto: number;
    cantidad: number;
}


interface EstadosPedido{
    id: number;
    estado: string;
}

// nueva coleccion
interface EstadosPedidoPagado{
    id: number;
    estado_pagado: string;
}



// nueva coleccion
interface EstadosPedidoPagado{
    id: number;
    estado_pagado: string;
}


interface LogSistemaEmpleado{
    id : number;
    id_empleado: number;
    accion: string;
    fecha: string;
    hora: string;
}


interface LogSistemaAdmin{
    id : number;
    id_admin: number;
    accion: string;
    fecha: string;
    hora: string;
}


interface HorariosEmpleados{
    id: number;
    id_empleado: number;
    inicio: string;
    fin: string;
    id_sucursal: number;
}

interface HorariosAdmin{
    id: number;
    id_admin: number;
    inicio: string;
    fin: string;
    id_depto: number;
}
