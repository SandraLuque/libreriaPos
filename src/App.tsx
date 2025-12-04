import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./login/Login";
import { AuthProvider } from "./context/AuthContext";
import Dashboard from "./dashboard/Dashboard";
import { PrivateRoute } from "./components/PrivateRoute";
import { MainLayout } from "./components/MainLayout";
import Productos from "./inventario/Productos";
import PuntoVenta from "./pos/PuntoVenta";
import Clientes from "./clientes/Clientes";
import Reportes from "./reportes/Reportes";
import Usuarios from "./usuarios/Usuarios";
import { SidebarProvider } from "./context/SidebarProvider";


function App() {
  return (
    <BrowserRouter basename="/">
      <AuthProvider>
        <SidebarProvider>
      <Routes>
          <Route path="/login" element={<Login />} />
             
             {/* -------------------- GRUPO DE RUTAS PROTEGIDAS -------------------- */}
             {/* PrivateRoute sin allowedRoles: Solo requiere autenticación (ADMIN o VENDEDOR) */}
             <Route element={<PrivateRoute />}> 
               <Route element={<MainLayout />}> {/* MainLayout proporciona el Sidebar */}
                  
                  {/* Rutas disponibles para VENDEDOR y ADMIN */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/pos" element={<PuntoVenta />} />
                  <Route path="/clientes" element={<Clientes />} />
                  
                  {/* Rutas protegidas solo para ADMIN */}
                  <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
                    <Route path="/inventario" element={<Productos />} />
                    <Route path="/reportes" element={<Reportes/>} />
                    <Route path="/usuarios" element={<Usuarios />} /> {/* NUEVA RUTA */}
                    <Route path="/configuracion" element={<div>Configuración View (Pendiente)</div>} />
                  </Route>

                  {/* Ruta de redirección por defecto */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
               </Route>
             </Route>
             {/* --------------------------------------------------------------------- */}
        </Routes>
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
