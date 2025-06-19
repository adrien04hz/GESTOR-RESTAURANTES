'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Productos } from '../Interfaces/BasesDatos'; // Asegúrate de que la ruta sea correcta
import { motion } from 'framer-motion';





export const CartItem = ({ producto }: { producto: Productos }) => {

    const [cantidad, setCantidad] = useState(0);

    const removeToCart = async () => {
        try {
          const response = await fetch(`http://localhost:8000/removeItem/${producto.id}`, {
            method: 'DELETE',
          });
          const data = await response.json();
          if (data.success) {
            // Opcional: actualizar el estado del carrito o mostrar un mensaje
            setCantidad(0);
            location.reload(); // Recargar la página para reflejar los cambios
          } else {
            // Manejar error si es necesario
            console.error(data.message);
          }
        } catch (error) {
          console.error('Error al eliminar el producto del carrito:', error);
        }
    }

    return (
        <div className=" flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className='rounded-xl overflow-hidden h-[180px] w-[180px] flex items-center justify-center'>
                  <Image
                    src={producto.imagen}
                    height={200}
                    width={200}
                    alt="asdf"
                    className='object-cover'

                  />
                </div>
                <div>
                  <p className='font-bold text-gray-700 text-[18px]'>{producto.nombre}</p>
                  <p className='text-[17px] font-bold text-[#0FB478]'>{producto.precio}</p>
                </div>
              </div>
              <div>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-red-500" onClick={removeToCart}>quitar</motion.button>
              </div>
        </div>
    );
};