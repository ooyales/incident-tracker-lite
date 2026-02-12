import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      const observer = new MutationObserver(() => {
        const isCollapsed = sidebar.classList.contains('w-12');
        setSidebarCollapsed(isCollapsed);
      });
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }
  }, []);

  return (
    <div className="min-h-screen bg-eaw-background">
      <Navbar />
      <Sidebar />
      <main
        className={`pt-14 transition-all duration-200 ${
          sidebarCollapsed ? 'ml-12' : 'ml-56'
        }`}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
