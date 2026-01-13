import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const getPageTitle = (pathname) => {
  const routes = {
    '/': 'Dashboard',
    '/pending': 'Pending Review',
    '/issues': 'All Issues',
    '/departments': 'Departments',
    '/workers': 'Workers',
    '/analytics': 'Analytics',
  };
  
  if (pathname.startsWith('/department/')) {
    return 'Department Dashboard';
  }
  if (pathname.startsWith('/issues/')) {
    return 'Issue Details';
  }
  
  return routes[pathname] || 'Dashboard';
};

const Layout = () => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <div className="ml-64 min-h-screen transition-all duration-300">
        <Header title={title} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
