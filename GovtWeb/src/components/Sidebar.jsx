import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileQuestion,
  Building2, 
  Users, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  FolderOpen
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
  const { user, logout, isAdmin, isDepartment } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Admin sees everything
  const adminNavItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/pending', icon: FileQuestion, label: 'Pending Review' },
    { path: '/issues', icon: ClipboardList, label: 'All Issues' },
    { path: '/departments', icon: Building2, label: 'Departments' },
    { path: '/workers', icon: Users, label: 'All Workers' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  // Department manager sees only their dept stuff
  const departmentNavItems = [
    { path: `/department/${user?.department_id}`, icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/issues', icon: FolderOpen, label: 'My Issues' },
    { path: '/workers', icon: Users, label: 'My Workers' },
  ];

  const navItems = isAdmin ? adminNavItems : departmentNavItems;

  // Check if nav item is active
  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-slate-900 text-white transition-all duration-300 z-50
        ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-400" />
            <span className="font-bold text-lg">GovtWeb</span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* User Info */}
      <div className={`p-4 border-b border-slate-700 ${collapsed ? 'hidden' : ''}`}>
        <p className="font-medium truncate">{user?.name || 'User'}</p>
        <p className="text-sm text-slate-400 capitalize">{user?.role}</p>
        {isDepartment && user?.department_name && (
          <p className="text-xs text-blue-400 mt-1 truncate">{user.department_name}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-2 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive: navActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors
              ${navActive 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }
              ${collapsed ? 'justify-center' : ''}`
            }
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-slate-700">
        <button
          onClick={logout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full
            text-slate-300 hover:bg-red-600 hover:text-white transition-colors
            ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
