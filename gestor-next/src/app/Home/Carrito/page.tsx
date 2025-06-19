'use client';
import { useState } from "react";
import { Carrito, Productos, Clientes, DetalleCarrito } from "../../../Interfaces/BasesDatos";

// Productos simulados
const productos: Productos[] = [
  { id: 1, id_sucursal: 1, nombre: "Pizza", descripcion: "Pizza de queso", precio: 120, imagen: "" },
  { id: 2, id_sucursal: 1, nombre: "Hamburguesa", descripcion: "Hamburguesa doble", precio: 90, imagen: "" },
  { id: 3, id_sucursal: 2, nombre: "Ensalada", descripcion: "Ensalada fresca", precio: 60, imagen: "" },
  { id: 4, id_sucursal: 2, nombre: "Tacos", descripcion: "Tacos al pastor", precio: 80, imagen: "" },
  { id: 5, id_sucursal: 1, nombre: "Sushi", descripcion: "Sushi variado", precio: 150, imagen: "" },
  { id: 6, id_sucursal: 3, nombre: "Pollo Frito", descripcion: "Pollo crujiente", precio: 110, imagen: "" },
];

// Clientes simulados
const clientes: Clientes[] = [
  { id: 1, nombre: "Juan", apellido: "Pérez", email: "juan@mail.com", password: "1234", telefono: "555-1111", direccion: "Calle 1" },
  { id: 2, nombre: "Ana", apellido: "García", email: "ana@mail.com", password: "abcd", telefono: "555-2222", direccion: "Calle 2" },
  { id: 3, nombre: "Luis", apellido: "Martínez", email: "luis@mail.com", password: "pass", telefono: "555-3333", direccion: "Calle 3" },
];

// Carrito simulado
const carrito: Carrito = {
  id: 1,
  id_cliente: 1,
  id_sucursal: 1,
};

// Detalle inicial del carrito (productos y cantidades)
const detalleCarritoInicial: DetalleCarrito[] = [
  { id_carrito: 1, id_producto: 1, cantidad: 2 },
  { id_carrito: 1, id_producto: 2, cantidad: 1 },
  { id_carrito: 1, id_producto: 5, cantidad: 3 },
];

// Estados de pago
const estados = [
  { id: 1, estado: "Pendiente" },
  { id: 2, estado: "Pagado" },
  { id: 3, estado: "Error de pago" },
];

export default function CarritoAmazon() {
  const [detalleCarrito, setDetalleCarrito] = useState<DetalleCarrito[]>(detalleCarritoInicial);
  const [estadoPago, setEstadoPago] = useState(estados[0].estado);
  const [procesando, setProcesando] = useState(false);

  // Filtrar productos del carrito y sucursal
  const productosCarrito = detalleCarrito
    .filter(dc => dc.id_carrito === carrito.id)
    .map(dc => {
      const producto = productos.find(
        p => p.id === dc.id_producto && p.id_sucursal === carrito.id_sucursal
      );
      return producto ? { ...producto, cantidad: dc.cantidad } : null;
    })
    .filter(Boolean) as (Productos & { cantidad: number })[];

  const cliente = clientes.find(c => c.id === carrito.id_cliente);

  // Calcular total
  const total = productosCarrito.reduce(
    (sum, prod) => sum + prod.precio * prod.cantidad, 0
  );

  // Agregar producto (aumentar cantidad o agregar nuevo)
  const agregarProducto = (id_producto: number) => {
    setDetalleCarrito(prev => {
      const existe = prev.find(dc => dc.id_producto === id_producto && dc.id_carrito === carrito.id);
      if (existe) {
        return prev.map(dc =>
          dc.id_producto === id_producto && dc.id_carrito === carrito.id
            ? { ...dc, cantidad: dc.cantidad + 1 }
            : dc
        );
      } else {
        return [...prev, { id_carrito: carrito.id, id_producto, cantidad: 1 }];
      }
    });
  };

  // Eliminar producto (disminuir cantidad o quitar del carrito)
  const eliminarProducto = (id_producto: number) => {
    setDetalleCarrito(prev => {
      const existe = prev.find(dc => dc.id_producto === id_producto && dc.id_carrito === carrito.id);
      if (existe && existe.cantidad > 1) {
        return prev.map(dc =>
          dc.id_producto === id_producto && dc.id_carrito === carrito.id
            ? { ...dc, cantidad: dc.cantidad - 1 }
            : dc
        );
      } else {
        return prev.filter(dc => !(dc.id_producto === id_producto && dc.id_carrito === carrito.id));
      }
    });
  };

  // Simulación de pago de todo el carrito
  const handlePagar = async () => {
    setProcesando(true);
    setEstadoPago("Procesando pago...");
    setTimeout(() => {
      const exito = Math.random() > 0.2;
      if (exito) {
        setEstadoPago(estados[1].estado); // Pagado
      } else {
        setEstadoPago(estados[2].estado); // Error de pago
      }
      setProcesando(false);
    }, 2000);
  };

  // Productos disponibles para agregar (de la sucursal)
  const productosDisponibles = productos.filter(
    p => p.id_sucursal === carrito.id_sucursal &&
      !detalleCarrito.some(dc => dc.id_producto === p.id_producto && dc.id_carrito === carrito.id)
  );

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-[#F9F5F3] via-[#F9F5F3] to-[#F9F5F3] px-2'>
      <div className='w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden'>
        <div className='max-w-2xl mx-auto p-6'>
          <p className='font-bold text-gray-700 text-[22px] leading-7 mb-4'>Carrito de compras</p>
          <div className='mb-6'>
            <p className='text-[15px] text-gray-600 mb-2'>Cliente: <span className="font-semibold">{cliente?.nombre} {cliente?.apellido}</span> ({cliente?.email})</p>
            <ul>
              {productosCarrito.length === 0 && (
                <li className="text-gray-500">No hay productos en el carrito.</li>
              )}
              {productosCarrito.map((producto) => (
                <li key={producto.id} className='mb-4 border-b pb-2 flex justify-between items-center'>
                  <div>
                    <p className='font-bold text-gray-700 text-[18px]'>{producto.nombre}</p>
                    <p className='text-[#7C7C80] text-[15px]'>{producto.descripcion}</p>
                    <p className='text-[14px] text-gray-500'>Cantidad: {producto.cantidad}</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        className="px-2 py-1 bg-[#FFC933] rounded hover:bg-[#FFC933DD] font-bold"
                        onClick={() => agregarProducto(producto.id)}
                        disabled={estadoPago === "Pagado"}
                      >+</button>
                      <button
                        className="px-2 py-1 bg-red-300 rounded hover:bg-red-400 font-bold"
                        onClick={() => eliminarProducto(producto.id)}
                        disabled={estadoPago === "Pagado"}
                      >-</button>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-[17px] font-bold text-[#0FB478]'>${producto.precio * producto.cantidad}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className='flex justify-between items-center mt-6'>
              <span className='font-bold text-[18px]'>Total:</span>
              <span className='font-bold text-[20px] text-[#0FB478]'>${total}</span>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-[15px] font-semibold">Estado del pago: <span className="text-blue-600">{estadoPago}</span></p>
          </div>
          <button
            onClick={handlePagar}
            disabled={procesando || estadoPago === "Pagado" || productosCarrito.length === 0}
            className={`block w-full px-4 py-3 font-medium tracking-wide text-center capitalize transition-colors duration-300 transform rounded-[14px] focus:outline-none focus:ring focus:ring-teal-300 focus:ring-opacity-80
              ${estadoPago === "Pagado" || productosCarrito.length === 0 ? "bg-green-400 cursor-not-allowed" : "bg-[#FFC933] hover:bg-[#FFC933DD]"}`}
          >
            {procesando
              ? "Procesando pago..."
              : estadoPago === "Pagado"
              ? "Pagado"
              : "Pagar todo el carrito"}
          </button>
          <div className="mt-6">
            <p className="font-bold mb-2">Agregar producto al carrito:</p>
            <ul>
              {productos
                .filter(p => p.id_sucursal === carrito.id_sucursal)
                .map(producto => (
                  <li key={producto.id} className="flex justify-between items-center mb-2">
                    <span>{producto.nombre} <span className="text-gray-500">(${producto.precio})</span></span>
                    <button
                      className="px-2 py-1 bg-blue-300 rounded hover:bg-blue-400 font-bold"
                      onClick={() => agregarProducto(producto.id)}
                      disabled={estadoPago === "Pagado"}
                    >Agregar</button>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
