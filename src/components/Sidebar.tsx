import { NavLink } from 'react-router-dom';
import { useAuth } from "../hook/useAuth";
import Logo from './ui/Logo';
import IconLogo from './ui/IconLogo';
import { FileBarChart, Handshake, LogOut, Package, Settings, ShoppingCart, Store, Users } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}
// Tipo auxiliar para asegurar consistencia en los roles
type Role = 'ADMIN' | 'VENDEDOR';

interface NavItem {
   name: string;
   path: string;
   icon: React.ReactNode; // Para usar iconos SVG o de librería
   roles?: Role[]; // Roles que pueden ver este ítem
}

const navItems: NavItem[] = [
   { 
     name: 'Dashboard', 
     path: '/dashboard', 
     icon: <Store className="h-5 w-5" />,
     roles: ['ADMIN', 'VENDEDOR'] 
   },
   { 
     name: 'Punto de Venta', 
     path: '/pos', 
     icon: <ShoppingCart className="h-5 w-5" />, 
     roles: ['ADMIN', 'VENDEDOR'] 
   },
   { 
     name: 'Inventario', 
     path: '/inventario', 
     icon: <Package className="h-5 w-5" />,
     roles: ['ADMIN'] // Solo visible para ADMIN
   },
   { 
     name: 'Clientes', 
     path: '/clientes', 
     icon: <Handshake className="h-5 w-5" />,
     roles: ['ADMIN', 'VENDEDOR'] 
   },
   { 
     name: 'Reportes', 
     path: '/reportes', 
     icon: <FileBarChart className="h-5 w-5" />,
     roles: ['ADMIN'] // Solo visible para ADMIN
   },
   // NUEVO: Gestión de Usuarios
   { 
     name: 'Usuarios', 
     path: '/usuarios', 
     icon: <Users className="h-5 w-5" />,
     roles: ['ADMIN']
   },
   // Item de Configuración (solo para ADMIN)
   { 
     name: 'Configuración', 
     path: '/configuracion', 
     icon: <Settings className="h-5 w-5" />,
     roles: ['ADMIN']
   },
];

// ----------------------------------------------------------------------
// 2. COMPONENTE SIDEBAR
// ----------------------------------------------------------------------
export default function Sidebar({ isOpen }: SidebarProps) {
     // user ahora tiene el tipo Role, lo que ayuda a evitar errores en tiempo de ejecución.
     const { user, logout } = useAuth();
  console.log('Usuario en Sidebar:', isOpen);
   // Filtrar ítems de navegación según el rol del usuario
   const filteredItems = navItems.filter(item => 
     // Utilizamos el tipo Role para la verificación
     item.roles?.includes(user?.rol as Role)
   );

   const linkClass = ({ isActive }: { isActive: boolean }) => 
     `flex items-center p-2 rounded-lg transition-colors duration-200 inline-flex w-full ${
        isActive 
          ? 'bg-accent text-white shadow-md' 
          : 'text-gray-300 hover:bg-accent hover:text-primary'
     }`;

   return (
     <div className={`
        fixed top-0  left-0 z-50 h-screen  bg-primary flex flex-col
        transition-all duration-300 ease-in-out
        ${isOpen ? "w-52" : "w-30 lg:w-20 items-center"}
      `} >
        {/* Encabezado/Logo */}
        <div className="p-2 border-b border-b-blue-900 h-header flex items-center justify-center bg-white w-full">
          
          {isOpen ? (
                <Logo width={100} height={40} />
              ) : (
                <IconLogo width={30} height={40} />
              )}
          
        </div>

        {/* Menú de Navegación */}
        <nav className="flex-grow p-4 space-y-2 ">
          {filteredItems.map((item) => (
            <div className='relative group' key={item.path} >
             <NavLink
               to={item.path} 
               className={linkClass}
             >
               <span className={`${isOpen ? "mr-2" : ""}`}>{item.icon}</span>
               {isOpen &&<span className="font-medium">{item.name}</span>}
             </NavLink>
             {!isOpen && (
                <div className="absolute left-18 top-0 px-3 py-2 bg-primary text-white text-sm rounded-lg shadow-lg scale-0 group-hover:scale-100 transition-transform duration-200 origin-left z-50 whitespace-nowrap">
                  {item.name}
                  {/* Flecha del tooltip */}
                  <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-6 border-b-6 border-r-6 border-transparent border-r-primary"></div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer/Perfil y Logout */}
        <div className="p-4 border-t border-b-blue-900">
        
          <button
             onClick={logout}
             className="w-full flex items-center justify-center p-3 text-red-300 bg-blue-700 hover:bg-red-700 hover:text-white rounded-lg transition-colors"
          >
             {isOpen ? (
                  <div className="flex items-center space-x-2"> 
                      <LogOut className="h-5 w-5"/>
                      <span>Cerrar Sesión</span>
                  </div>
              ) : (
                  <LogOut className="h-5 w-5"/>
              )}
          </button>
        </div>
     </div>
   );
};