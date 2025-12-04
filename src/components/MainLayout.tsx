// src/components/MainLayout.tsx
import { useSidebar } from '../hook/useSidebar';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './layout/Header';

export const MainLayout = () => {
   const { isOpen: sidebarOpen, setSidebarOpen } = useSidebar();
  
   // Nota: Asumiendo que 'pt-header' es una clase que compensa la altura del Header.
   // Si el Header tiene una altura fija (ej. h-16), 'pt-16' o una clase personalizada
   // que represente esa altura es necesaria para que el contenido no quede debajo del Header.

  return (
    // 1. Contenedor Raíz: Fija la altura total de la vista.
    <div className="flex flex-col h-screen">
      
      {/* 2. Header: Fijo en la parte superior. */}
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      
      {/* 3. Contenedor Principal (Sidebar + Main Content): 
          - flex-1: Ocupa todo el espacio vertical restante.
          - flex: Establece la distribución horizontal de Sidebar y Main. 
          - overflow-hidden: Evita que el scroll de la sidebar cause scroll en este contenedor.
      */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar (Se controla con la posición fixed/absolute si el Header es fixed) */}
        {/* Nota: Asegúrate de que Sidebar está diseñado para no empujar el contenido 
           (ej. usando position: fixed/absolute o transform/translate).
           Si Sidebar usa fixed/absolute, debe ir aquí, pero si usa el mismo 
           flujo que main, debe ir *antes* del main.
           Si Sidebar es fijo y se superpone, el siguiente div debe ser el que use 'flex-1'.
        */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /> 

        {/* 4. Contenedor del Main Content:
            - flex-1: Ocupa todo el ancho restante (después de Sidebar).
            - overflow-y-auto: HABILITA el scroll vertical.
            - transition-all, lg:ml-xx: Aplica el margen para compensar el ancho de la Sidebar.
        */}
        <main 
          className={`
            main 
            flex-1 
            overflow-y-auto 
            transition-all duration-300 
            ${sidebarOpen ? "lg:ml-52" : "lg:ml-20"}
          `}
        >
          {/* El contenido de la página se renderiza aquí */}
          <Outlet />
        </main>
      </div>
    </div>
  )
}