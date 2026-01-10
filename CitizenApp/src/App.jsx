import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import TopHeader from './components/TopHeader';
import BottomNavbar from './components/BottomNavbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ReportProblem from './pages/ReportProblem';
import TrackReports from './pages/TrackReports';
import Chatbot from './pages/Chatbot';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Donation from './pages/Donation';

// Layout component for protected routes
function AppLayout({ children }) {
  const { colors } = useTheme();
  
  return (
    <div className={`min-h-screen ${colors.background} transition-colors duration-300`}>
      <TopHeader />
      <main className="pt-16 pb-20">
        {children}
      </main>
      <BottomNavbar />
    </div>
  );
}

// Wrapper component to use theme in layout
function ThemedApp() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout>
            <Home />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/report" element={
        <ProtectedRoute>
          <AppLayout>
            <ReportProblem />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/track" element={
        <ProtectedRoute>
          <AppLayout>
            <TrackReports />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/chatbot" element={
        <ProtectedRoute>
          <AppLayout>
            <Chatbot />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/leaderboard" element={
        <ProtectedRoute>
          <AppLayout>
            <Leaderboard />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/donations" element={
        <ProtectedRoute>
          <AppLayout>
            <Donation />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <AppLayout>
            <Profile />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <ThemedApp />
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

