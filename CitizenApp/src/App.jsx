import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ReportProblem from './pages/ReportProblem';
import TrackReports from './pages/TrackReports';
import Chatbot from './pages/Chatbot';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Donation from './pages/Donation';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Navbar />
              <Home />
            </ProtectedRoute>
          } />
          
          <Route path="/report" element={
            <ProtectedRoute>
              <Navbar />
              <ReportProblem />
            </ProtectedRoute>
          } />
          
          <Route path="/track" element={
            <ProtectedRoute>
              <Navbar />
              <TrackReports />
            </ProtectedRoute>
          } />
          
          <Route path="/chatbot" element={
            <ProtectedRoute>
              <Navbar />
              <Chatbot />
            </ProtectedRoute>
          } />
          
          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <Navbar />
              <Leaderboard />
            </ProtectedRoute>
          } />

          <Route path="/donations" element={
            <ProtectedRoute>
              <Navbar />
              <Donation />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Navbar />
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

