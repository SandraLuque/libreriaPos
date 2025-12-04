// src/reportes/Reportes.tsx

import React, { useState, useEffect } from 'react';

import { Bar } from 'react-chartjs-2'; // Asume que estás usando react-chartjs-2 o similar
import { useAuth } from '../hook/useAuth';

import {
  Chart as ChartJS,
  CategoryScale, // Necesario para el eje X
  LinearScale,   // Necesario para el eje Y (es la escala "linear" que falta)
  BarElement,    // Necesario para las barras
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Nota: Para usar gráficos, debes instalar y configurar Chart.js y react-chartjs-2
// (p. ej., npm install chart.js react-chartjs-2) e importar los elementos de Chart.js necesarios.

// ----------------------------------------------------------------------
// 1. INTERFACES DE DATOS (Basadas en las vistas de la BD)
// ----------------------------------------------------------------------

interface Estadisticas {
  totalProductos: number;
  totalVentasHoy: number;
  totalIngresosHoy: number;
  productosStockBajo: number;
}

interface ProductoVendido {
  nombre: string;
  total_vendido: number;
  cantidad_vendida: number;
}

interface ResumenDiario {
  fecha: string; // Formato YYYY-MM-DD
  ventas_totales: number;
  total_ingreso: number;
  total_descuento: number;
}

interface ProductoBajoStock {
  producto_id: number;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
}

// ----------------------------------------------------------------------
// 2. CONFIGURACIÓN DEL GRÁFICO (Chart.js)
// Simulación de importación y registro si usas Chart.js
// Si no lo tienes instalado, esta parte no funcionará.
// ----------------------------------------------------------------------
/* import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
*/

// ----------------------------------------------------------------------
// 3. COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------

export default function Reportes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [productosVendidos, setProductosVendidos] = useState<ProductoVendido[]>([]);
  const [resumenDiario, setResumenDiario] = useState<ResumenDiario[]>([]);
  const [productosBajoStock, setProductosBajoStock] = useState<ProductoBajoStock[]>([]);
  const [diasReporte, setDiasReporte] = useState(30);

  useEffect(() => {
    if (user) {
      loadReportes();
    }
  }, [user, diasReporte]);

  const loadReportes = async () => {
    setLoading(true);
    try {
      // 1. Estadísticas de Resumen
      const stats: Estadisticas = await window.electronAPI.getEstadisticas();
      setEstadisticas(stats);

      // 2. Productos Más Vendidos (Límite 10)
      const topVentas: ProductoVendido[] = await window.electronAPI.getProductosMasVendidos(10);
      setProductosVendidos(topVentas);

      // 3. Resumen de Ventas Diarias
      const ventasDia: ResumenDiario[] = await window.electronAPI.getResumenVentasDiarias(diasReporte);
      setResumenDiario(ventasDia.reverse()); // Invertir para que la gráfica muestre de más antiguo a más reciente
    // console.log('Datos de Ventas Diarias:', ventasDia);
      // 4. Productos Bajo Stock
      const stockBajo: ProductoBajoStock[] = await window.electronAPI.getProductosBajoStock();
      setProductosBajoStock(stockBajo);

    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // ----------------------------------------------------------------------
  // 4. PREPARACIÓN DE DATOS PARA GRÁFICO (Si Chart.js está instalado)
  // ----------------------------------------------------------------------

  const chartData = {
    labels: resumenDiario.map(d => d.fecha.slice(5)), // Solo mes/día
    datasets: [
      {
        label: 'Ventas Totales (S/)',
        data: resumenDiario.map(d => d.total_ingreso),
        backgroundColor: 'rgba(59, 130, 246, 0.7)', // Azul Tailwind
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };
// console.log('Datos preparados para Chart.js:', chartData);
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Ingresos Diarios de los Últimos ${diasReporte} Días`,
      },
    },
    scales: {
        y: {
            beginAtZero: true,
            title: {
                display: true,
                text: 'Ingreso (S/)'
            }
        },
        x: {
            title: {
                display: true,
                text: 'Fecha (Mes/Día)'
            }
        }
    }
  };

  if (!user || user.rol !== 'ADMIN') {
      return <div className="p-6 text-center text-red-500">Acceso denegado. Solo administradores pueden ver reportes.</div>;
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Cargando reportes...</div>;
  }
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">📈 Módulo de Reportes</h1>
      
      {/* 4. TARJETAS DE RESUMEN (KPIs) */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Productos" value={estadisticas?.totalProductos || 0} icon="📦" color="bg-blue-500" />
        <StatCard title="Ventas Hoy" value={estadisticas?.totalVentasHoy || 0} icon="🧾" color="bg-green-500" />
        <StatCard title="Ingreso Hoy" value={`S/ ${(estadisticas?.totalIngresosHoy || 0).toFixed(2)}`} icon="💵" color="bg-indigo-500" />
        <StatCard title="Stock Crítico" value={estadisticas?.productosStockBajo || 0} icon="🚨" color="bg-red-500" />
      </div>

      <hr className="my-8" />
      
      {/* 5. GRÁFICO DE VENTAS DIARIAS */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-semibold text-gray-700">Resumen de Ingresos Diarios</h2>
             <select 
                value={diasReporte} 
                onChange={(e) => setDiasReporte(parseInt(e.target.value))}
                className="p-2 border rounded-md"
             >
                <option value={7}>Últimos 7 días</option>
                <option value={30}>Últimos 30 días</option>
                <option value={90}>Últimos 90 días</option>
             </select>
        </div>
        
        {/* Usar el componente Bar de Chart.js (requiere instalación) */}
        <Bar key={diasReporte} options={chartOptions} data={chartData} />
        
      </div>

      <hr className="my-8" />
      
      {/* 6. TABLAS DETALLADAS (Top Ventas y Stock Crítico) */}
      <div className="grid grid-cols-2 gap-6">
        {/* Productos Más Vendidos */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">🏆 Top 10 Productos Más Vendidos</h2>
          <ReporteTabla
            headers={['Producto', 'Cantidad', 'Ingreso Total']}
            data={productosVendidos.map(p => ([
                p.nombre,
                p.cantidad_vendida,
                `S/ ${p.total_vendido.toFixed(2)}`
            ]))}
            emptyMessage="No hay datos de ventas recientes."
          />
        </div>

        {/* Productos Bajo Stock */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">⚠️ Productos con Stock Crítico</h2>
          <ReporteTabla
            headers={['ID', 'Producto', 'Stock Actual', 'Stock Mínimo']}
            data={productosBajoStock.map(p => ([
                p.producto_id,
                p.nombre,
                <span className="font-bold text-red-500">{p.stock_actual}</span>,
                p.stock_minimo
            ]))}
            emptyMessage="Ningún producto tiene stock bajo."
          />
        </div>
      </div>
      
    </div>
  );
}

// ----------------------------------------------------------------------
// 7. COMPONENTES AUXILIARES
// ----------------------------------------------------------------------

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
    <div className={`flex items-center p-4 ${color} text-white rounded-xl shadow-lg`}>
        <div className="text-3xl mr-4">{icon}</div>
        <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

interface ReporteTablaProps {
    headers: string[];
    data: (string | number | React.ReactNode)[][];
    emptyMessage: string;
}

const ReporteTabla: React.FC<ReporteTablaProps> = ({ headers, data, emptyMessage }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    {headers.map(header => (
                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {data.length > 0 ? (
                    data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50 transition duration-100">
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={headers.length} className="px-6 py-10 text-center text-gray-500 italic">
                            {emptyMessage}
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);