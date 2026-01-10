import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaRobot, FaLeaf } from 'react-icons/fa';

const BACKEND_URL = 'http://localhost:8000';

function TopHeader() {
  const { currentUser, userProfile } = useAuth();
  const { darkMode, colors } = useTheme();

  const getInitial = () => {
    if (userProfile?.displayName) {
      return userProfile.displayName.charAt(0).toUpperCase();
    }
    if (currentUser?.displayName) {
      return currentUser.displayName.charAt(0).toUpperCase();
    }
    if (currentUser?.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getProfileImage = () => {
    const photoURL = userProfile?.photoURL || currentUser?.photoURL;
    if (photoURL) {
      // If it's a relative path from backend, prepend backend URL
      if (photoURL.startsWith('/uploads/')) {
        return `${BACKEND_URL}${photoURL}`;
      }
      return photoURL;
    }
    return null;
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 ${colors.surface} ${colors.border} border-b shadow-sm`}
      style={{ height: '60px' }}
    >
      <div className="flex items-center justify-between h-full px-4 max-w-lg mx-auto">
        {/* Left - Profile Image */}
        <Link to="/profile">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            {getProfileImage() ? (
              <img
                src={getProfileImage()}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-green-500"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`w-10 h-10 rounded-full ${colors.primary} items-center justify-center text-white font-bold text-lg ${getProfileImage() ? 'hidden' : 'flex'}`}
            >
              {getInitial()}
            </div>
            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
          </motion.div>
        </Link>

        {/* Center - App Logo/Name */}
        <Link to="/" className="flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <FaLeaf className="text-green-500 text-2xl" />
          </motion.div>
          <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Citizen<span className="text-green-500">App</span>
          </span>
        </Link>

        {/* Right - Chatbot Icon */}
        <Link to="/chatbot">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`w-10 h-10 rounded-full ${colors.primary} flex items-center justify-center shadow-lg`}
          >
            <FaRobot className="text-white text-xl" />
          </motion.div>
        </Link>
      </div>
    </header>
  );
}

export default TopHeader;
