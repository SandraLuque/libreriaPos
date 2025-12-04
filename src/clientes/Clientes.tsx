// src/clientes/Clientes.tsx

import React, { useState, useEffect } from 'react';

// ----------------------------------------------------------------------
// 1. TIPOS DE DATOS
// ----------------------------------------------------------------------

interface Cliente {
  cliente_id: number;
  nombre_completo: string;
  documento_identidad: string | null;
  tipo_documento: 'DNI' | 'RUC' | 'CE' | 'OTRO' | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  activo: 1 | 0; // Para eliminación lógica
}

// Interfaz para el estado del formulario (omitimos ID y activo)
type FormCliente = Omit<Cliente, 'cliente_id' | 'activo'>;

// ----------------------------------------------------------------------
// 2. COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  
  // Estado para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState<Cliente | null>(null);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    setLoading(true);
    try {
      // Nota: getClientes debe excluir al 'Público General' (ID 1) si quieres solo clientes reales
      const fetchedClientes: Cliente[] = await window.electronAPI.getClientes();
      setClientes(fetchedClientes.filter(c => c.cliente_id !== 1)); // Filtra cliente general
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------------
  // 3. HANDLERS DE ACCIÓN
  // ----------------------------------------------------------------------

  const handleBuscar = async (termino: string) => {
    setTerminoBusqueda(termino);
    // Usamos el mismo método de búsqueda que en el POS, pero aquí listamos los resultados
    if (termino.length > 2 || termino.length === 0) {
        try {
            const results: Cliente[] = await window.electronAPI.buscarCliente(termino);
            // Filtra cliente general y desactiva
            setClientes(results.filter(c => c.cliente_id !== 1 && c.activo === 1)); 
        } catch (error) {
            console.error('Error en búsqueda de clientes:', error);
        }
    }
  };

  const handleOpenModal = (cliente: Cliente | null = null) => {
    setClienteAEditar(cliente);
    setIsModalOpen(true);
  };

  const handleSaveCliente = async (formData: FormCliente, id: number | null) => {
    try {
      if (id) {
        await window.electronAPI.actualizarCliente(id, formData);
        alert('Cliente actualizado con éxito.');
      } else {
        await window.electronAPI.agregarCliente(formData);
        alert('Cliente agregado con éxito.');
      }
      setIsModalOpen(false);
      loadClientes(); // Recargar la lista
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      alert('Error al guardar el cliente. Verifique los datos.');
    }
  };

  const handleEliminarCliente = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas desactivar este cliente? Sus registros de venta se mantendrán.')) {
        try {
            await window.electronAPI.eliminarCliente(id); // Usa UPDATE SET activo = 0
            alert('Cliente desactivado con éxito.');
            loadClientes();
        } catch (error) {
            console.error('Error al desactivar cliente:', error);
            alert('Error al desactivar el cliente.');
        }
    }
  };

  // ----------------------------------------------------------------------
  // 4. RENDERING
  // ----------------------------------------------------------------------

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Cargando clientes...</div>;
  }
  
  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">👥 Gestión de Clientes</h1>
        <button
          onClick={() => handleOpenModal(null)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition"
        >
          + Agregar Nuevo Cliente
        </button>
      </div>
      
      {/* Barra de Herramientas y Búsqueda */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre, documento de identidad..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          value={terminoBusqueda}
          onChange={(e) => handleBuscar(e.target.value)}
        />
      </div>

      {/* Tabla de Clientes */}
      <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre Completo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clientes.map((c) => (
              <tr key={c.cliente_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {c.nombre_completo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {c.tipo_documento}: {c.documento_identidad}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <p>{c.telefono}</p>
                    <p className="text-xs truncate">{c.email}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {c.direccion || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <button onClick={() => handleOpenModal(c)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                    Editar
                  </button>
                  <button onClick={() => handleEliminarCliente(c.cliente_id)} className="text-red-600 hover:text-red-900">
                    Desactivar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clientes.length === 0 && (
             <div className="p-10 text-center text-gray-500">No se encontraron clientes activos.</div>
        )}
      </div>

      {/* Modal de Creación/Edición */}
      {isModalOpen && (
        <ClienteModal
          cliente={clienteAEditar}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveCliente}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 5. COMPONENTE MODAL PARA CLIENTES
// ----------------------------------------------------------------------

interface ClienteModalProps {
    cliente: Cliente | null;
    onClose: () => void;
    onSave: (formData: FormCliente, id: number | null) => void;
}

const ClienteModal: React.FC<ClienteModalProps> = ({ cliente, onClose, onSave }) => {
    const isEdit = !!cliente;
    const [formData, setFormData] = useState<FormCliente>({
        nombre_completo: cliente?.nombre_completo || '',
        documento_identidad: cliente?.documento_identidad || null,
        tipo_documento: cliente?.tipo_documento || 'DNI',
        email: cliente?.email || null,
        telefono: cliente?.telefono || null,
        direccion: cliente?.direccion || null,
    });
    
    // Handler para cambios en el formulario
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value === '' ? null : value, // Permite que algunos campos sean null
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, cliente?.cliente_id || null);
    };
    
    // Opciones de tipo de documento
    const tipoDocumentoOpciones = ['DNI', 'RUC', 'CE', 'OTRO'];

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border w-1/3 shadow-2xl rounded-xl bg-white">
                <h3 className="text-2xl font-bold mb-5 border-b pb-2">{isEdit ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    <InputGroup label="Nombre Completo" name="nombre_completo" value={formData.nombre_completo || ''} onChange={handleChange} type="text" required={true} />
                    
                    {/* Tipo y Número de Documento */}
                    <div className="flex space-x-4">
                        <div className="w-1/3">
                            <label className="block text-sm font-medium text-gray-700">Tipo Documento</label>
                            <select
                                name="tipo_documento"
                                value={formData.tipo_documento || 'DNI'}
                                onChange={handleChange}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            >
                                {tipoDocumentoOpciones.map(tipo => (
                                    <option key={tipo} value={tipo}>
                                        {tipo}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-2/3">
                            <InputGroup label="Número de Documento" name="documento_identidad" value={formData.documento_identidad || ''} onChange={handleChange} type="text" required={false} />
                        </div>
                    </div>

                    {/* Contacto */}
                    <div className="flex space-x-4">
                        <InputGroup label="Teléfono" name="telefono" value={formData.telefono || ''} onChange={handleChange} type="text" required={false} />
                        <InputGroup label="Email" name="email" value={formData.email || ''} onChange={handleChange} type="email" required={false} />
                    </div>

                    {/* Dirección */}
                    <div>
                        <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
                            Dirección
                        </label>
                        <textarea
                            id="direccion"
                            name="direccion"
                            value={formData.direccion || ''}
                            onChange={handleChange}
                            rows={2}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                            {isEdit ? 'Guardar Cambios' : 'Registrar Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Componente para agrupar Label e Input (reutilizado)
interface InputGroupProps {
    label: string;
    name: keyof FormCliente;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    type: string;
    required: boolean;
    step?: string;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, name, value, onChange, type, required, step }) => (
    <div>
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