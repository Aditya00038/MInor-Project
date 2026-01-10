import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, FileText, MapPin, MessageCircle, Trophy, User, LogOut, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const navLinks = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/report', icon: FileText, label: 'Report' },
    { path: '/track', icon: MapPin, label: 'Track' },
    { path: '/donations', icon: Heart, label: 'Donate' },
    { path: '/chatbot', icon: MessageCircle, label: 'Chat' },
    { path: '/leaderboard', icon: Trophy, label: 'Board' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 w-full z-50 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg"
    >
      <div className="flex justify-between items-center px-4 md:px-8 py-4">
        <motion.div whileHover={{ scale: 1.05 }} className="text-2xl font-bold">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-purple-600 font-bold">C</div>
            CitizenApp
          </Link>
        </motion.div>
        
        <div className="hidden md:flex gap-1 justify-center flex-1">
          {navLinks.map((link, idx) => (
            <motion.div key={link.path} whileHover={{ y: -2 }}>
              <Link 
                to={link.path} 
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:bg-white/20"
              >
                <link.icon size={18} />
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <span className="text-sm font-medium truncate">{currentUser?.displayName || currentUser?.email}</span>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout} 
            className="p-2 hover:bg-white/20 rounded-lg transition-all"
          >
            <LogOut size={20} />
          </motion.button>
        </div>

        {/* Mobile bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 border-t border-white/10 flex justify-around">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium hover:bg-white/10 transition-all">
              <link.icon size={18} />
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </motion.nav>
  );
}
