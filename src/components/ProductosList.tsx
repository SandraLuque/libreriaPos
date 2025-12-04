// src/components/ProductosList.tsx
import { useEffect, useState } from 'react';

interface Producto {
  producto_id: number;
  nombre: string;
  precio_venta: number;
  stock_actual: number;
}

export default function ProductosList() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const data = await window.electronAPI.getProductos();
      setProductos(data);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {productos.map(producto => (
        <div key={producto.producto_id} className="border p-4 rounded">
          <h3 className="font-bold">{producto.nombre}</h3>
          <p>Precio: S/ {producto.precio_venta.toFixed(2)}</p>
          <p>Stock: {producto.stock_actual}</p>
        </div>
      ))}
    </div>
  );
}