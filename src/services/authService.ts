// src/services/authService.ts

/**
 * Nota: En un entorno de producción, esta lógica estaría en un backend
 * y solo manejaríamos la llamada API y la gestión del token.
 * Aquí simulamos la base de datos de usuarios.
 */

// Importamos el tipo Role de nuestro AuthContext para consistencia
import { Role } from '../context/AuthContext';

// Interfaz que debe coincidir con UserData en AuthContext
interface UserData {
    usuario_id: number;
    nombre_completo: string;
    username: string;
    rol: Role;
}

// Interfaz para la autenticación (incluye la "contraseña" simple)
interface MockAuthUser extends UserData {
    password_hash: string;
}

// Base de datos simulada de usuarios
const mockUsers: MockAuthUser[] = [
    { 
    usuario_id: 101, 
    nombre_completo: 'Administrador Maestro', 
    username: 'admin', 
    rol: 'ADMIN', 
    password_hash: 'admin123' 
    },
    { 
    usuario_id: 102, 
    nombre_completo: 'Vendedor de Tienda', 
    username: 'vendedor', 
    rol: 'VENDEDOR', 
    password_hash: 'admin123' // Contraseña simple de prueba
    },
    { 
    usuario_id: 103, 
    nombre_completo: 'Vendedor Auxiliar', 
    username: 'vendedor2', 
    rol: 'VENDEDOR', 
    password_hash: 'password' 
    },
];

/**
 * Simula la llamada a la API de login.
 * @param username Nombre de usuario.
 * @param password Contraseña sin cifrar (solo para simulación).
 * @returns Promesa que resuelve con UserData si es exitoso.
 */
export const authService = {
    login: async (username: string, password: string): Promise<UserData> => {
    // Simular latencia de red
    await new Promise(resolve => setTimeout(resolve, 500)); 

    // 1. Buscar el usuario por nombre de usuario
    const userRecord = mockUsers.find(
            user => user.username.toLowerCase() === username.toLowerCase()
    );

    if (!userRecord) {
            throw new Error('Usuario no encontrado.');
    }

    // 2. Verificar la contraseña (simulación: compara hash plano)
    if (userRecord.password_hash !== password) {
            throw new Error('Contraseña incorrecta.');
    }

    // 3. Devolver los datos del usuario (sin el hash de la contraseña)
    const { password_hash, ...userData } = userRecord;
    return userData;
    },
};