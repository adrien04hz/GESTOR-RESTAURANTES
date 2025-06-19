'use client';
import { useEffect, useState } from "react";
import { Carrito, Productos } from "../../../../../Interfaces/BasesDatos"
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CartItem } from "../../../../../Components/CartItem";


export interface CarritoDetalles {
  success: boolean;
  data:    Productos[];
}




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

export default function DetalleProductoCarrito() {
  const router = useRouter();
  const { id } = useParams()
  const idParam = parseInt(id as string, 10);
 


  const [estadoPago, setEstadoPago] = useState(estados[0].estado); // "Pendiente"
  const [procesando, setProcesando] = useState(false);
  const [productos, setProductos] = useState<Productos[]>([]);

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



  useEffect(() => {
    const carrito = async () => {
      const resp  = await fetch(`http://127.0.0.1:8000/cart/${idParam}`).then(res => res.json());
      const { data }: CarritoDetalles = resp;
      setProductos(data);
    }

    carrito()
  }, [])


  const realizarPedido = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/pedidosEnLinea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_cliente: carrito.id_cliente,
          id_sucursal: carrito.id_sucursal,
        }),
      });
      const data = await response.json();
      // Puedes manejar la respuesta aquí, por ejemplo redirigir o mostrar un mensaje
      if (data.success) {
        setEstadoPago("Pagado");
        // router.push("/Home/Carrito"); // Si quieres redirigir
      } else {
        setEstadoPago("Error de pago");
      }
    } catch (error) {
      setEstadoPago("Error de pago");
    }
  }

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-[#F9F5F3] via-[#F9F5F3] to-[#F9F5F3] px-2'>
      <div className='mx-auto bg-white rounded-3xl shadow-xl overflow-hidden w-[900px] h-[700]'>
        <div className='w-full h-full border mx-auto p-6'>
          <p className='font-bold text-gray-700 text-[22px] leading-7 mb-4'>Detalle del carrito</p>
          <div className='mb-6 border px-5 overflow-y-auto h-[500px]'>
            {productos.map((producto,idx) => (
              <CartItem key={idx} producto={producto} />
            ))}

          </div>
          {/* <div className="mb-4">
            <p className="text-[15px] font-semibold">Estado del pago: <span className="text-blue-600">{estadoPago}</span></p>
          </div> */}
          <button
            onClick={realizarPedido}
            disabled={procesando || estadoPago === "Pagado"}
            className={`block w-full px-4 py-3 font-medium tracking-wide text-center capitalize transition-colors duration-300 transform rounded-[14px] focus:outline-none focus:ring focus:ring-teal-300 focus:ring-opacity-80
              ${estadoPago === "Pagado" ? "bg-green-400 cursor-not-allowed" : "bg-[#FFC933] hover:bg-[#FFC933DD]"}`}
          >
            Realizar Pedido
          </button>
          <Link
            href="/Home/Carrito"
            className='block mt-2 w-full px-4 py-3 font-medium tracking-wide text-center capitalize transition-colors duration-300 transform rounded-[14px] hover:bg-[#F2ECE7] hover:text-[#000000dd] focus:outline-none focus:ring focus:ring-teal-300 focus:ring-opacity-80'
          >
            Volver al menú
          </Link>
        </div>
      </div>
    </div>
  );
}
