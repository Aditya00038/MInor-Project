import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
      
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search issues..."
            className="pl-10 pr-4 py-2 w-64 rounded-lg border border-slate-200 
              focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
              text-sm"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell size={20} className="text-slate-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
            <User size={18} className="text-white" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-700">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
