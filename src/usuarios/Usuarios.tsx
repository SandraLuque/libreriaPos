// src/usuarios/Usuarios.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hook/useAuth';


// ----------------------------------------------------------------------
// 1. INTERFACES Y TIPOS
// ----------------------------------------------------------------------

interface Usuario {
  usuario_id: number;
  nombre_completo: string;
  username: string;
  rol: 'ADMIN' | 'VENDEDOR'; // Basado en la tabla de BD
  activo: 0 | 1; // 1 si está activo, 0 si está inactivo
}

// ----------------------------------------------------------------------
// 2. FUNCIÓN PRINCIPAL DEL COMPONENTE
// ----------------------------------------------------------------------

export default function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    if (user?.rol !== 'ADMIN') {
      setError("Acceso denegado. Solo administradores pueden gestionar usuarios.");
      setLoading(false);
      return;
    }

    try {
      const results: Usuario[] = await window.electronAPI.getUsuarios();
      setUsuarios(results);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      setError("Error al cargar la lista de usuarios desde la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------------
  // 3. RENDERIZADO
  // ----------------------------------------------------------------------

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Cargando usuarios...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600 font-semibold">{error}</div>;
  }
  
  if (user?.rol !== 'ADMIN') {
    return <div className="p-6 text-center text-red-600 font-semibold">Acceso denegado. Se requiere rol de Administrador.</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">👥 Gestión de Usuarios</h1>
        {/* Aquí se añadiría un botón para "Agregar Nuevo Usuario" */}
        <button
          onClick={() => alert('Funcionalidad de Agregar Usuario Pendiente.')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          + Nuevo Usuario
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <TablaUsuarios usuarios={usuarios} />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 4. COMPONENTE AUXILIAR: Tabla de Usuarios
// ----------------------------------------------------------------------

interface TablaUsuariosProps {
  usuarios: Usuario[];
}

const TablaUsuarios: React.FC<TablaUsuariosProps> = ({ usuarios }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre Completo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Username
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rol
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {usuarios.length > 0 ? (
            usuarios.map(u => (
              <tr key={u.usuario_id} className="hover:bg-gray-50 transition duration-100">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.usuario_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.nombre_completo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    u.rol === 'ADMIN' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {u.rol}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    u.activo === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {u.activo === 1 ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Aquí se añadirían botones para Editar/Desactivar */}
                  <a href="#" className="text-indigo-600 hover:text-indigo-900 mr-4">Editar</a>
                  <a href="#" className="text-red-600 hover:text-red-900">Desactivar</a>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-6 py-10 text-center text-gray-500 italic">
                No se encontraron usuarios.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};