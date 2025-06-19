'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Productos } from '../Interfaces/BasesDatos'; // Asegúrate de que la ruta sea correcta
import { motion } from 'framer-motion';

export const ProductCard = ({ producto }: { producto: Productos }) => {

    const [cantidad, setCantidad] = useState(0);

    const addToCart = async () => {
        await fetch('http://127.0.0.1:8000/addToCart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_carrito: producto.id_sucursal,
                id_producto: producto.id,
                id_sucursal: producto.id_sucursal,
            }),
        });
    }

    return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative h-72 w-full">
        <Image
            src={producto.imagen}
            alt={producto.nombre}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
        />
        </div>
        
        <div className="p-5">
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-gray-800">{producto.nombre}</h3>
            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold">
            {producto.precio}
            </span>
        </div>
        
        <p className="text-gray-600 mt-2 text-sm">{producto.descripcion}</p>
        
        <div className="mt-4 flex justify-between items-center">
            {/* <div className="flex items-center space-x-2">
            <button 
                onClick={() => setCantidad(Math.max(0, cantidad - 1))}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
            >
                -
            </button>
            <span className="font-medium">{cantidad}</span>
            <button 
                onClick={() => setCantidad(cantidad + 1)}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
            >
                +
            </button>
            </div> */}

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => addToCart()} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
            Añadir al carrito
            </motion.button>
        </div>
        </div>
    </div>
    );
};