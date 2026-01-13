import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PendingIssues from './pages/PendingIssues';
import AllIssues from './pages/AllIssues';
import IssueDetails from './pages/IssueDetails';
import DepartmentDashboard from './pages/DepartmentDashboard';
import Workers from './pages/Workers';
import Departments from './pages/Departments';
import Analytics from './pages/Analytics';

// Admin-only route wrapper
const AdminRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Department manager default redirect
const DepartmentRedirect = () => {
  const { user, isDepartment } = useAuth();
  if (isDepartment && user?.department_id) {
    return <Navigate to={`/department/${user.department_id}`} replace />;
  }
  return <Dashboard />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        {/* Dashboard - redirects dept managers to their dept */}
        <Route index element={<DepartmentRedirect />} />
        
        {/* Admin-only routes */}
        <Route path="pending" element={
          <AdminRoute><PendingIssues /></AdminRoute>
        } />
        <Route path="departments" element={
          <AdminRoute><Departments /></AdminRoute>
        } />
        <Route path="analytics" element={
          <AdminRoute><Analytics /></AdminRoute>
        } />
        
        {/* Shared routes (admin + department) */}
        <Route path="issues" element={<AllIssues />} />
        <Route path="issues/:id" element={<IssueDetails />} />
        <Route path="department/:id" element={<DepartmentDashboard />} />
        <Route path="workers" element={<Workers />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
