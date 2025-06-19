"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProductCard } from '../../../../Components/ProductCard';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  id_sucursal: number;
}

export default function Page() {
  const params = useParams();
  const id_sucursal = params.id_sucursal as string;
  const [productos, setProductos] = useState<Producto[] | null>(null);

  useEffect(() => {
    if (!id_sucursal) return;

    fetch(`http://localhost:8000/Productos/${id_sucursal}`)
      .then(res => res.json())
      .then(data => setProductos(data.data || []))
      .catch(console.error);
  }, [id_sucursal]);

  if (productos === null) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-pulse text-2xl font-bold text-amber-600">Cargando menú...</div>
    </div>
  );



  return (
  <div className="bg-gray-50 min-h-screen">
    <header className="bg-amber-600 text-white py-6 shadow-md">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold">Sucursal #{id_sucursal}</h1>
      </div>
    </header>

    <main className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-orange-500">Todos los productos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {productos.map((producto) => (
          // <div key={producto.id} className="bg-white p-4 rounded shadow">
          //   <h3 className="font-bold">{producto.nombre}</h3>
          //   <p>${producto.precio}</p>
          //   {/* Render básico sin Image para pruebas */}
          // </div>
          <ProductCard key={producto.id} producto={producto} />
        ))}
      </div>
    </main>
  </div>
);
}