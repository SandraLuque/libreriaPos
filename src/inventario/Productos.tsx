// src/inventario/Productos.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hook/useAuth';

// Importa el componente Modal (asume que existe o usa una implementación simple)
// import Modal from '../components/Modal'; 

// ----------------------------------------------------------------------
// 1. TIPOS DE DATOS
// ----------------------------------------------------------------------

interface Producto {
  producto_id: number;
  codigo_barras: string;
  sku: string;
  nombre: string;
  precio_venta: number;
  precio_costo: number;
  stock_actual: number;
  stock_minimo: number;
  categoria_id: number;
  categoria_nombre: string;
  estado_stock: 'OK' | 'ADVERTENCIA' | 'BAJO STOCK' | 'SIN STOCK';
  descripcion?: string;
  marca?: string;
  activo: 1 | 0;
}

interface Categoria {
  categoria_id: number;
  nombre: string;
}

// Interfaz para el estado del formulario
type FormProducto = Omit<Producto, 'producto_id' | 'categoria_nombre' | 'estado_stock' | 'activo'>;

// ----------------------------------------------------------------------
// 2. COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------

export default function Productos() {
  const { user } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  
  // Estado para el modal de edición/creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);

  // Carga inicial de datos
  useEffect(() => {
    if (user?.rol !== 'ADMIN') {
        alert('Acceso denegado. Solo administradores pueden gestionar el inventario.');
        return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Usamos la vista v_productos_info que ya trae la categoría
      const fetchedProductos: Producto[] = await window.electronAPI.getProductos();
      setProductos(fetchedProductos);

      const fetchedCategorias: Categoria[] = await window.electronAPI.getCategorias();
      setCategorias(fetchedCategorias);
    } catch (error) {
      console.error('Error cargando datos del inventario:', error);
      alert('Error al cargar datos.');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------------
  // 3. HANDLERS DE ACCIÓN
  // ----------------------------------------------------------------------

  const handleBuscar = async (termino: string) => {
    setTerminoBusqueda(termino);
    if (termino.length > 2 || termino.length === 0) {
        try {
            const results: Producto[] = await window.electronAPI.buscarProductos(termino);
            setProductos(results);
        } catch (error) {
            console.error('Error en búsqueda:', error);
        }
    }
  };

  const handleOpenModal = (producto: Producto | null = null) => {
    setProductoAEditar(producto);
    setIsModalOpen(true);
  };

  const handleSaveProducto = async (formData: FormProducto, id: number | null) => {
    try {
      if (id) {
        await window.electronAPI.actualizarProducto(id, formData);
        alert('Producto actualizado con éxito.');
      } else {
        await window.electronAPI.agregarProducto(formData);
        alert('Producto agregado con éxito.');
      }
      setIsModalOpen(false);
      loadData(); // Recargar la lista
    } catch (error) {
      console.error('Error al guardar producto:', error);
      alert('Error al guardar el producto. Verifique los datos.');
    }
  };

  const handleEliminarProducto = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas desactivar este producto? Se mantendrán sus registros de venta.')) {
        try {
            await window.electronAPI.eliminarProducto(id); // Usa UPDATE SET activo = 0
            alert('Producto desactivado con éxito.');
            loadData();
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            alert('Error al desactivar el producto.');
        }
    }
  };

  // ----------------------------------------------------------------------
  // 4. RENDERING
  // ----------------------------------------------------------------------

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Cargando inventario...</div>;
  }
  
  // Filtrar productos basados en el término de búsqueda si el handler no ha actualizado la lista
  const productosFiltrados = productos.filter(p => 
      p.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      p.sku?.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      p.codigo_barras?.includes(terminoBusqueda)
  );

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📦 Gestión de Inventario</h1>
        <button
          onClick={() => handleOpenModal(null)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          + Agregar Nuevo Producto
        </button>
      </div>
      
      {/* Barra de Herramientas y Búsqueda */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Buscar por nombre, código o SKU..."
          className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          value={terminoBusqueda}
          onChange={(e) => handleBuscar(e.target.value)}
        />
        {/* Aquí se podría agregar un filtro por categoría */}
      </div>

      {/* Tabla de Productos */}
      <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productosFiltrados.map((p) => (
              <tr key={p.producto_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {p.nombre}
                  <p className="text-xs text-gray-500">SKU: {p.sku}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.categoria_nombre || 'Sin Cat.'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">S/ {p.precio_venta.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">S/ {p.precio_costo?.toFixed(2) || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold">{p.stock_actual}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <StockBadge estado={p.estado_stock} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <button onClick={() => handleOpenModal(p)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                    Editar
                  </button>
                  <button onClick={() => handleEliminarProducto(p.producto_id)} className="text-red-600 hover:text-red-900">
                    Desactivar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {productosFiltrados.length === 0 && (
             <div className="p-10 text-center text-gray-500">No se encontraron productos.</div>
        )}
      </div>

      {/* Modal de Creación/Edición */}
      {isModalOpen && (
        <ProductoModal
          producto={productoAEditar}
          categorias={categorias}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProducto}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 5. COMPONENTES AUXILIARES
// ----------------------------------------------------------------------

// Componente para la etiqueta de estado de stock
const StockBadge: React.FC<{ estado: string }> = ({ estado }) => {
    let colorClass = 'bg-gray-100 text-gray-800';
    if (estado === 'OK') colorClass = 'bg-green-100 text-green-800';
    if (estado === 'ADVERTENCIA') colorClass = 'bg-yellow-100 text-yellow-800';
    if (estado === 'BAJO STOCK' || estado === 'SIN STOCK') colorClass = 'bg-red-100 text-red-800';

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}>
            {estado}
        </span>
    );
};

// Componente Modal simple para edición
interface ProductoModalProps {
    producto: Producto | null;
    categorias: Categoria[];
    onClose: () => void;
    onSave: (formData: FormProducto, id: number | null) => void;
}

const ProductoModal: React.FC<ProductoModalProps> = ({ producto, categorias, onClose, onSave }) => {
    const isEdit = !!producto;
    const [formData, setFormData] = useState<FormProducto>({
        codigo_barras: producto?.codigo_barras || '',
        sku: producto?.sku || '',
        nombre: producto?.nombre || '',
        descripcion: producto?.descripcion || '',
        marca: producto?.marca || '',
        categoria_id: producto?.categoria_id || (categorias.length > 0 ? categorias[0].categoria_id : 0),
        precio_venta: producto?.precio_venta || 0,
        precio_costo: producto?.precio_costo || 0,
        stock_actual: producto?.stock_actual || 0,
        stock_minimo: producto?.stock_minimo || 5,
    });
    
    // Handler para cambios en el formulario
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'categoria_id' || name.startsWith('precio_') || name.startsWith('stock_') 
                     ? parseFloat(value) || 0 
                     : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, producto?.producto_id || null);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-1/2 shadow-lg rounded-md bg-white">
                <h3 className="text-xl font-bold mb-4">{isEdit ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campos de SKU y Código */}
                    <div className="flex space-x-4">
                        <InputGroup label="SKU" name="sku" value={formData.sku} onChange={handleChange} type="text" required={false} />
                        <InputGroup label="Código de Barras" name="codigo_barras" value={formData.codigo_barras} onChange={handleChange} type="text" required={false} />
                    </div>
                    
                    {/* Nombre y Categoría */}
                    <div className="flex space-x-4">
                        <InputGroup label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} type="text" required={true} flexGrow={true} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Categoría</label>
                            <select
                                name="categoria_id"
                                value={formData.categoria_id}
                                onChange={handleChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            >
                                <option value="">Seleccione Categoría</option>
                                {categorias.map(cat => (
                                    <option key={cat.categoria_id} value={cat.categoria_id}>
                                        {cat.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    {/* Precios */}
                    <div className="flex space-x-4">
                        <InputGroup label="Precio de Venta (S/)" name="precio_venta" value={formData.precio_venta} onChange={handleChange} type="number" step="0.01" required={true} />
                        <InputGroup label="Precio de Costo (S/)" name="precio_costo" value={formData.precio_costo} onChange={handleChange} type="number" step="0.01" required={false} />
                    </div>

                    {/* Stock */}
                    <div className="flex space-x-4">
                        <InputGroup label="Stock Actual" name="stock_actual" value={formData.stock_actual} onChange={handleChange} type="number" step="1" required={true} />
                        <InputGroup label="Stock Mínimo" name="stock_minimo" value={formData.stock_minimo} onChange={handleChange} type="number" step="1" required={false} />
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                            {isEdit ? 'Guardar Cambios' : 'Crear Producto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Componente para agrupar Label e Input
interface InputGroupProps {
    label: string;
    name: keyof FormProducto;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    type: string;
    required: boolean;
    step?: string;
    flexGrow?: boolean;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, name, value, onChange, type, required, step, flexGrow = false }) => (
    <div className={flexGrow ? "flex-grow" : ""}>
        <label htmlFor={name as string} className="block text-sm font-medium text-gray-700">
            {label}
        </label>
        <input
            id={name as string}
            name={name as string}
            type={type}
            step={step}
            value={value}
            onChange={onChange}
            required={required}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
    </div>
);