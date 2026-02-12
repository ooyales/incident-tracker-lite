import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Bug,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const sections: { title: string; items: SidebarItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Incidents',
    items: [
      { to: '/incidents', label: 'All Incidents', icon: <AlertTriangle className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Analysis',
    items: [
      { to: '/problems', label: 'Problems', icon: <Bug className="w-5 h-5" /> },
      { to: '/metrics', label: 'Metrics', icon: <BarChart3 className="w-5 h-5" /> },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed top-14 left-0 bottom-0 bg-white border-r border-eaw-border transition-all duration-200 z-40 flex flex-col ${
        collapsed ? 'w-12' : 'w-56'
      }`}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 px-3 py-3 text-sm text-eaw-muted hover:bg-gray-50 border-b border-eaw-border w-full"
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5 mx-auto" />
        ) : (
          <>
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Navigation</span>
          </>
        )}
      </button>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-2">
        {sections.map((section) => (
          <div key={section.title} className="mb-2">
            {!collapsed && (
              <div className="px-3 py-1.5 text-[10px] font-semibold text-eaw-muted uppercase tracking-wider">
                {section.title}
              </div>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-eaw-primary text-white'
                      : 'text-eaw-font hover:bg-gray-50'
                  }`
                }
                title={item.label}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
