import { Search, User, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface NavbarProps {
  isMobile?: boolean;
  onMenuToggle?: () => void;
}

export default function Navbar({ isMobile = false, onMenuToggle }: NavbarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-gray-800 text-white flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={onMenuToggle}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <span className="bg-eaw-primary text-white text-xs font-bold px-2 py-1 rounded">
            IR
          </span>
          <span className="hidden sm:inline text-base font-semibold tracking-tight">
            Incident Tracker Lite
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search incidents..."
            className="pl-8 pr-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 outline-none focus:border-eaw-primary w-40 sm:w-56"
          />
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-300">
          <User className="w-4 h-4" />
          <span>{user?.username ?? 'User'}</span>
        </div>
        <button
          onClick={logout}
          className="p-2 flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
