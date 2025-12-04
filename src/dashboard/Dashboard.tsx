// src/dashboard/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hook/useAuth';

// ----------------------------------------------------------------------
// 1. TIPOS DE DATOS
// ----------------------------------------------------------------------

interface Estadisticas {
  totalProductos: number;
  totalVentasHoy: number;
  totalIngresosHoy: number;
  productosStockBajo: number;
}

interface ProductoBajoStock {
  producto_id: number;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  nivel_alerta: string;
}

interface VentaDiaria {
  fecha: string;
  monto_total: number;
  total_ventas: number;
  ticket_promedio: number;
}

// ----------------------------------------------------------------------
// 2. COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------

export default function Dashboard() {
  const { user } = useAuth(); // Obtener datos del usuario
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [productosStockBajo, setProductosStockBajo] = useState<ProductoBajoStock[]>([]);
  const [resumenVentasDiarias, setResumenVentasDiarias] = useState<VentaDiaria[]>([]);

  // Función para cargar todos los datos del dashboard
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Cargar Estadísticas Clave
      const stats: Estadisticas = await window.electronAPI.getEstadisticas();
      setEstadisticas(stats);

      // Cargar Alertas de Stock
      const bajoStock: ProductoBajoStock[] = await window.electronAPI.getProductosBajoStock();
      setProductosStockBajo(bajoStock);

      // Cargar Resumen de Ventas de los últimos 7 días
      const resumenVentas: VentaDiaria[] = await window.electronAPI.getResumenVentasDiarias(7);
      setResumenVentasDiarias(resumenVentas);

    } catch (error) {
      console.error('Error cargando datos del Dashboard:', error);
      // Podrías usar un estado de error para mostrar un mensaje al usuario
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full text-lg text-gray-500">
        Cargando datos del negocio...
      </div>
    );
  }

  // Helper para formatear moneda
  const formatCurrency = (amount: number) => `S/ ${amount.toFixed(2)}`;

  return (
    <div className="p-6 bg-white min-h-screen min-w-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        👋 ¡Hola, {user?.nombre_completo.split(' ')[0] || 'Usuario'}!
      </h1>
      <p className="text-gray-600 mb-6">Resumen de actividad y alertas en tiempo real.</p>
      
      {/* ------------------- TARJETAS CLAVE ------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Tarjeta 1: Ingresos de Hoy */}
        <Card 
          title="Ingresos Hoy" 
          value={formatCurrency(estadisticas?.totalIngresosHoy || 0)}
          icon="💸"
          color="bg-green-500"
        />
        {/* Tarjeta 2: Ventas Completadas Hoy */}
        <Card 
          title="Ventas Hoy" 
          value={estadisticas?.totalVentasHoy.toString() || '0'}
          icon="🧾"
          color="bg-blue-500"
        />
        {/* Tarjeta 3: Alerta de Bajo Stock */}
        <Card 
          title="Productos Bajo Stock" 
          value={estadisticas?.productosStockBajo.toString() || '0'}
          icon="🚨"
          color={estadisticas && estadisticas.productosStockBajo > 0 ? "bg-red-500" : "bg-yellow-500"}
          link="/inventario"
        />
        {/* Tarjeta 4: Productos Activos */}
        <Card 
          title="Total Productos" 
          value={estadisticas?.totalProductos.toString() || '0'}
          icon="📦"
          color="bg-purple-500"
        />
      </div>

      {/* ------------------- SECCIÓN DE ALERTAS Y GRÁFICOS ------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Alertas de Stock */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <span className="mr-2">⚠️</span> Alertas de Inventario
          </h2>
          {productosStockBajo.length > 0 ? (
            <div className="space-y-3">
              {productosStockBajo.slice(0, 5).map((p) => (
                <div key={p.producto_id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium text-red-800 truncate">{p.nombre}</p>
                  <p className="text-sm text-red-600">
                    Stock Actual: **{p.stock_actual}** (Mínimo: {p.stock_minimo})
                  </p>
                </div>
              ))}
              <Link to="/inventario" className="text-blue-600 hover:text-blue-800 text-sm block mt-2 font-medium">
                Ver todos los {productosStockBajo.length} ítems en alerta &rarr;
              </Link>
            </div>
          ) : (
            <p className="text-gray-500 italic">Inventario en buen estado. ¡Sin alertas!</p>
          )}
        </div>

        {/* Columna Derecha: Resumen Semanal de Ventas */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <span className="mr-2">📈</span> Resumen de Ventas (Últimos 7 Días)
          </h2>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ventas Totales</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ticket Promedio</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Monto Recaudado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {resumenVentasDiarias.map((venta) => (
                <tr key={venta.fecha}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{venta.fecha}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{venta.total_ventas}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">S/ {venta.ticket_promedio.toFixed(2)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-right text-green-700">S/ {venta.monto_total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to="/reportes" className="text-blue-600 hover:text-blue-800 text-sm block mt-4 font-medium">
            Ver Reporte Completo de Ventas &rarr;
          </Link>
        </div>
      </div>
      
    </div>
  );
}

// ----------------------------------------------------------------------
// 3. COMPONENTE AUXILIAR (Card para estadísticas)
// ----------------------------------------------------------------------

interface CardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  link?: string;
}

const Card: React.FC<CardProps> = ({ title, value, icon, color, link }) => (
  <Link to={link || '#'} className={`transform hover:scale-[1.02] transition duration-300 ${link ? 'cursor-pointer' : ''}`}>
    <div className={`p-5 rounded-xl text-white shadow-xl ${color} flex items-center justify-between`}>
      <div>
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="text-3xl font-extrabold mt-1">{value}</p>
      </div>
      <div className="text-4xl opacity-70">{icon}</div>
    </div>
  </Link>
);