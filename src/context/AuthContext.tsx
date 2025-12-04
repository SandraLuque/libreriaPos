// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

// ----------------------------------------------------------------------
// TIPOS EXPORTADOS
// ----------------------------------------------------------------------

// Exportamos el tipo de Rol para que otros componentes (como PrivateRoute) puedan usarlo
export type Role = 'ADMIN' | 'VENDEDOR';

// Interfaz para los datos del usuario almacenados en la sesión
interface UserData {
   usuario_id: number;
   nombre_completo: string;
   username: string;
   rol: Role; // Usamos el tipo Role exportado
//   password_hash: string;
}

// Interfaz para el contexto
interface AuthContextType {
   user: UserData | null;
   isAuthenticated: boolean;
   login: (userData: UserData) => void;
   logout: () => void;
   loading: boolean;
}

// ----------------------------------------------------------------------
// CONTEXTO
// ----------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ----------------------------------------------------------------------
// PROVIDER
// ----------------------------------------------------------------------

interface AuthProviderProps {
   children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
   const [user, setUser] = useState<UserData | null>(null);
   const [loading, setLoading] = useState(true);
   const navigate = useNavigate();

   // Cargar sesión del localStorage al iniciar la aplicación
   useEffect(() => {
     const storedUser = localStorage.getItem('user');
     if (storedUser) {
        try {
          const userData: UserData = JSON.parse(storedUser);
          setUser(userData);
        } catch (error) {
          console.error('Error parseando usuario de localStorage:', error);
          localStorage.removeItem('user');
        }
     }
     setLoading(false);
   }, []);

   // Función para iniciar sesión
   const login = (userData: UserData) => {
     setUser(userData);
     localStorage.setItem('user', JSON.stringify(userData));
   };

   // Función para cerrar sesión
   const logout = () => {
     setUser(null);
     localStorage.removeItem('user');
     navigate('/login'); // Redirigir al login
   };

   const isAuthenticated = !!user;

   const value = {
     user,
     isAuthenticated,
     login,
     logout,
     loading
   };

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };