import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bcrypt from 'bcryptjs';
import { useAuth } from '../hook/useAuth';
import Logo from '../components/ui/Logo';



export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const usuario = await window.electronAPI.authenticate(username);

      if (!usuario) {
        setError('Usuario o contraseña incorrectos.'); // Mejor no dar pistas sobre cuál es incorrecto
        setLoading(false);
        return;
      }

      // Verificar contraseña con bcrypt
      // NOTA: Si `bcrypt` no funciona en el render process (por problemas de compilación en Electron),
      // esta verificación debe moverse al proceso principal (main.cjs) por seguridad y compatibilidad.
      const passwordValida = await bcrypt.compare(password, usuario.password_hash);

      if (!passwordValida) {
        setError('Usuario o contraseña incorrectos.');
        setLoading(false);
        return;
      }

      // 1. Datos para la sesión
      const userData = {
        usuario_id: usuario.usuario_id,
        nombre_completo: usuario.nombre_completo,
        username: usuario.username,
        rol: usuario.rol
      };

      // 2. Guardar sesión usando el Contexto
      login(userData); // <--- USAR FUNCIÓN DEL CONTEXTO

      // 3. Actualizar último acceso (sigue en Electron/Main)
      await window.electronAPI.run(
        "UPDATE usuarios SET ultimo_acceso = datetime('now','localtime') WHERE usuario_id = ?",
        [usuario.usuario_id]
      );

      // Redirigir al dashboard (Manejado por el useEffect o directamente aquí si lo prefieres)
      navigate('/dashboard'); 

    } catch (err) {
      console.error('Error en login:', err);
      setError('Error de conexión con el sistema.');
    } finally {
      setLoading(false);
    }

  };

  // Función temporal para resetear contraseña (solo desarrollo)
  const resetPassword = async () => {
    try {
      const newHash = bcrypt.hashSync('admin123', 10);
      
      await window.electronAPI.run(
        'UPDATE usuarios SET password_hash = ? WHERE username = ?',
        [newHash, 'admin']
      );
      
      alert('Contraseña de admin reseteada a: admin123');
    } catch (err) {
      console.error('Error al resetear:', err);
      alert('Error al resetear contraseña');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary via-primary to-primary">
      <div className="card-box w-full max-w-96 p-6">
        {/* Logo o título */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center mb-6 gap-4">
          <Logo width={200} height={100} />
          <h1 className="title text-xl text-center text-primary">
            Sistema POS
          </h1>
          <p className="text-center text-sm text-brand light-text">
            Inicie sesión para acceder a su sistema de punto de venta
          </p>
        </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Campo Usuario */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-800"
                placeholder="Ingresa tu usuario"
                required
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-800"
                placeholder="Ingresa tu contraseña"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Botón Login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Info de prueba (remover en producción) */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 font-semibold mb-2">Usuarios de prueba:</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p><span className="font-medium">Admin:</span> admin / admin123</p>
            <p><span className="font-medium">Vendedor:</span> vendedor / admin123</p>
          </div>
          
          {/* Botón temporal para resetear contraseña (solo desarrollo) */}
          <button
            type="button"
            onClick={resetPassword}
            className="mt-3 w-full text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-2 rounded border border-yellow-300 transition-colors"
          >
            🔧 [DEV] Resetear contraseña admin
          </button>
          <button
  type="button"
  onClick={async () => {
    try {
      // Ver usuarios
      const usuarios = await window.electronAPI.query('SELECT username, password_hash, activo FROM usuarios');
      console.log('=== USUARIOS ===');
      console.table(usuarios);
      
      // Generar nuevo hash
      const nuevoHash = bcrypt.hashSync('admin123', 10);
      console.log('Nuevo hash:', nuevoHash);
      
      // Actualizar ambos
      await window.electronAPI.run('UPDATE usuarios SET password_hash = ? WHERE username = ?', [nuevoHash, 'admin']);
      await window.electronAPI.run('UPDATE usuarios SET password_hash = ? WHERE username = ?', [nuevoHash, 'vendedor']);
      
      alert('Contraseñas actualizadas. Revisa la consola (F12).');
    } catch (err) {
      console.error('Error:', err);
      alert('Error: ' + ( err instanceof Error ? err.message : String(err)) );
    }
  }}
  className="w-full text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 py-2 rounded border border-purple-300 transition-colors"
>
  🔍 [DEV] Diagnóstico completo
</button>
        </div>
      </div>
    </div>
  );
}