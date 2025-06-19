//'use client';
import { Carrito, Productos } from "../Interfaces/BasesDatos";
import Image from 'next/image';



interface Props {
  value?: number;
}

// Simulación de datos (reemplaza por fetch real si tienes backend)
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

export default async function Carrito2(){
    
    const productosSucursal = productos.filter(
      (producto) => producto.id_sucursal === carrito.id_sucursal
    );

    return (
  
<div className='flex items-center justify-center min-h-screen from-[#F9F5F3] via-[#F9F5F3] to-[#F9F5F3] bg-gradient-to-br px-2'>
    <div className='w-full max-w-md  mx-auto bg-white rounded-3xl shadow-xl overflow-hidden'>
        <div className='max-w-md mx-auto'>
  
          <div className='h-[236px]' >
           </div>
          <div className='p-4 sm:p-6'>
            <p className='font-bold text-gray-700 text-[22px] leading-7 mb-4'>Menú de productos</p>
            <ul>
              {productosSucursal.map((producto) => (
                <li key={producto.id} className='mb-6 border-b pb-4'>
                  <p className='font-bold text-gray-700 text-[18px]'>{producto.nombre}</p>
                  <p className='text-[#7C7C80] text-[15px]'>{producto.descripcion}</p>
                  <p className='text-[17px] font-bold text-[#0FB478]'>${producto.precio}</p>
                </li>
              ))}
            </ul>
              <a target='_blank' href='foodiesapp://food/1001' className='block mt-10 w-full px-4 py-3 font-medium tracking-wide text-center capitalize transition-colors duration-300 transform bg-[#FFC933] rounded-[14px] hover:bg-[#FFC933DD] focus:outline-none focus:ring focus:ring-teal-300 focus:ring-opacity-80'>
                  View on foodies
              </a>
            <a target='_blank' href="https://apps.apple.com/us/app/id1493631471" className='block mt-1.5 w-full px-4 py-3 font-medium tracking-wide text-center capitalize transition-colors duration-300 transform rounded-[14px] hover:bg-[#F2ECE7] hover:text-[#000000dd] focus:outline-none focus:ring focus:ring-teal-300 focus:ring-opacity-80'>
                  Download app
              </a>
          </div>
        </div>
    </div>
</div>
    )
}