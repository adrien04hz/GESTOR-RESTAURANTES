'use client';
import { useState } from "react";
import { Carrito, Productos } from "../../../Interfaces/BasesDatos";
import { useRouter } from "next/navigation";

interface Params {
  id: string;
}


const productos: Productos[] = [
  { id: 1, id_sucursal: 1, nombre: "Pizza", descripcion: "Pizza de queso", precio: 120, imagen: "" },
  { id: 2, id_sucursal: 1, nombre: "Hamburguesa", descripcion: "Hamburguesa doble", precio: 90, imagen: "" },
  { id: 3, id_sucursal: 2, nombre: "Ensalada", descripcion: "Ensalada fresca", precio: 60, imagen: "" },
];

const carrito: Carrito = {
  id: 1,
  id_cliente: 1,
  id_sucursal: 1,
};

const estados = [
  { id: 1, estado: "Pendiente" },
  { id: 2, estado: "Pagado" },
  { id: 3, estado: "Error de pago" },
];

export default function DetalleProductoCarrito({ params }: { params: Params }) {
  const router = useRouter();
  const idProducto = Number(params.id);

  // Filtrar productos por  id_sucursal 
  const productosSucursal = productos.filter(
    (producto) => producto.id_sucursal === carrito.id_sucursal
  );

  // Buscar el producto por id
  const producto = productosSucursal.find((p) => p.id === idProducto);

 
  const [estadoPago, setEstadoPago] = useState(estados[0].estado); // "Pendiente"
  const [procesando, setProcesando] = useState(false);

  if (!producto) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Producto no encontrado.</p>
      </div>
    );
  }

  // Simulación de pago en línea
  const handlePagar = async () => {
    setProcesando(true);
    setEstadoPago("Procesando pago...");
    //  llamada a servicio de pago
    setTimeout(() => {
      // Simula éxito o error
      const exito = Math.random() > 0.2;
      if (exito) {
        setEstadoPago(estados[1].estado); 
      } else {
        setEstadoPago(estados[2].estado); // "Error de pago"
      }
      setProcesando(false);
    }, 2000);
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-[#F9F5F3] via-[#F9F5F3] to-[#F9F5F3] px-2'>
      <div className='w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden'>
        <div className='max-w-md mx-auto p-6'>
          <p className='font-bold text-gray-700 text-[22px] leading-7 mb-4'>Detalle del producto</p>
          <div className='mb-6'>
            <p className='font-bold text-gray-700 text-[18px]'>{producto.nombre}</p>
            <p className='text-[#7C7C80] text-[15px]'>{producto.descripcion}</p>
            <p className='text-[17px] font-bold text-[#0FB478]'>${producto.precio}</p>
            <p className='text-[14px] text-gray-500 mt-2'>ID Producto: {producto.id}</p>
            <p className='text-[14px] text-gray-500'>Sucursal: {producto.id_sucursal}</p>
          </div>
          <div className="mb-4">
            <p className="text-[15px] font-semibold">Estado del pago: <span className="text-blue-600">{estadoPago}</span></p>
          </div>
          <button
            onClick={handlePagar}
            disabled={procesando || estadoPago === "Pagado"}
            className={`block w-full px-4 py-3 font-medium tracking-wide text-center capitalize transition-colors duration-300 transform rounded-[14px] focus:outline-none focus:ring focus:ring-teal-300 focus:ring-opacity-80
              ${estadoPago === "Pagado" ? "bg-green-400 cursor-not-allowed" : "bg-[#FFC933] hover:bg-[#FFC933DD]"}`}
          >
            {procesando
              ? "Procesando pago..."
              : estadoPago === "Pagado"
              ? "Pagado"
              : "Pagar en línea"}
          </button>
          <a
            href="/Home/Carrito"
            className='block mt-2 w-full px-4 py-3 font-medium tracking-wide text-center capitalize transition-colors duration-300 transform rounded-[14px] hover:bg-[#F2ECE7] hover:text-[#000000dd] focus:outline-none focus:ring focus:ring-teal-300 focus:ring-opacity-80'
          >
            Volver al menú
          </a>
        </div>
      </div>
    </div>
  );
}
