// src/components/PrivateRoute.tsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hook/useAuth';
import type { Role } from '../context/AuthContext';
// Importamos el tipo Role que debe estar exportado desde AuthContext
 

interface PrivateRouteProps {
    /** * Lista opcional de roles permitidos para acceder a esta ruta. 
     * Si no se proporciona, cualquier usuario autenticado tiene acceso.
     */
    allowedRoles?: Role[]; 
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
    // Obtenemos el estado de autenticación y los datos del usuario
    // Asumimos que useAuth() también proporciona 'loading'
    const { user, isAuthenticated, loading } = useAuth(); 

    // 1. Manejo del estado de carga (mientras se verifica la sesión)
    if (loading) {
        // Muestra un indicador de carga simple para evitar parpadeos
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <p className="text-xl text-blue-700 font-semibold">Cargando sesión...</p>
            </div>
        );
    }

    // 2. Verificación de autenticación
    if (!isAuthenticated) {
        // Si no está autenticado, redirige al login
        return <Navigate to="/login" replace />;
    }

    // 3. Verificación de rol (si la ruta es restringida)
    const userRole = user?.rol;

    if (allowedRoles && userRole) {
        // Comprobamos si el rol del usuario está incluido en los roles permitidos
        if (!allowedRoles.includes(userRole)) {
            // Rol no permitido: Redirige a una ruta accesible, como el dashboard
            console.warn(`Acceso denegado. Rol ${userRole} no autorizado para esta ruta.`);
            return <Navigate to="/dashboard" replace />;
        }
    }

    // 4. Acceso concedido: Renderiza la ruta anidada (el componente de la vista)
    return <Outlet />;
};

// Si tu hook useAuth() no tiene 'loading', asegúrate de definirlo en tu contexto
// o eliminar la comprobación 'if (loading) { ... }' si el contexto lo maneja de otra forma.