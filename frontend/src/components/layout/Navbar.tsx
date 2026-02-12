import { Search, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-gray-800 text-white flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-3">
        <span className="bg-eaw-primary text-white text-xs font-bold px-2 py-1 rounded">
          IR
        </span>
        <span className="text-base font-semibold tracking-tight">
          Incident Tracker Lite
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search incidents..."
            className="pl-8 pr-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 outline-none focus:border-eaw-primary w-56"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <User className="w-4 h-4" />
          <span>{user?.username ?? 'User'}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
