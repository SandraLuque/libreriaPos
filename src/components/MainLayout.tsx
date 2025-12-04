import { useSidebar } from '../hook/useSidebar';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './layout/Header';

export const MainLayout = () => {
   const { isOpen: sidebarOpen, setSidebarOpen } = useSidebar();
  return (
    <div className="flex flex-col h-screen">
      <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
      <div  className={` overflow-hidden transition-all duration-300 pt-header ${
        sidebarOpen ? "lg:ml-52" : "lg:ml-20"
      }`}> 
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /> 
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
