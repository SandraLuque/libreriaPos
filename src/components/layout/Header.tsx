// src/components/layout/Header.tsx

import { useNavigate } from "react-router-dom";

import { SidebarTrigger } from "../ui/SidebarTrigger";
import LogoText from "../ui/LogoText";
import { useAuth } from "../../hook/useAuth";

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-40 p-sm  header">
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "lg:ml-52" : "lg:ml-18"
        }`}
      >
        <div className="flex justify-between items-center ch">
          {/* Left Side - Menu Button */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-dark-300 hover:text-primary hover:bg-brand-medium transition-colors lg:hidden"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="text-sm text-primary light-text">
              <SidebarTrigger />
            </div>

            {/* Breadcrumb or Page Title */}
            <div className="ml-2 lg:ml-0">
              {/* <h1 className="text-xl font-semibold text-primary title">
                Bienvenido
              </h1> */}
              {!sidebarOpen && <LogoText width={100} height={35} />}
            </div>
          </div>

          {/* Right Side - User Menu */}
          <div className="flex items-center ">
            {/* Notifications */}

            {/* User */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-primary light-text">
                    {user?.username}
                  </p>
                  <p className="text-xs text-dark-400">
                    {user?.rol === 'ADMIN' ? 'Administrador' : 'Vendedor'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-amaranth hover:bg-amaranth-200 hover:text-amaranth-600 transition-colors light-text"
              >
                Cerrar Sesión
              </button>

              {/* Dropdown Menu */}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
