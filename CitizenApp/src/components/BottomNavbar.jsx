import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import { 
  FaHome, 
  FaTrophy, 
  FaPlusCircle, 
  FaMapMarkerAlt, 
  FaHandHoldingHeart 
} from 'react-icons/fa';

function BottomNavbar() {
  const { darkMode, colors } = useTheme();
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: FaHome, label: t('home') },
    { path: '/leaderboard', icon: FaTrophy, label: t('leaderboard') },
    { path: '/report', icon: FaPlusCircle, label: t('report'), isCenter: true },
    { path: '/track', icon: FaMapMarkerAlt, label: t('track') },
    { path: '/donations', icon: FaHandHoldingHeart, label: t('donation') },
  ];

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 z-50 ${colors.surface} ${colors.border} border-t shadow-lg`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isCenter) {
            // Center Report Button - Elevated
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative -mt-6"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-14 h-14 rounded-full ${colors.primary} flex items-center justify-center shadow-lg`}
                  style={{
                    boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)'
                  }}
                >
                  <Icon className="text-white text-2xl" />
                </motion.div>
                <span className={`text-xs mt-1 block text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {item.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center py-2 px-3"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative"
              >
                <Icon 
                  className={`text-xl mb-1 ${
                    isActive 
                      ? 'text-green-500' 
                      : darkMode 
                        ? 'text-gray-400' 
                        : 'text-gray-500'
                  }`} 
                />
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.div>
              <span 
                className={`text-xs ${
                  isActive 
                    ? 'text-green-500 font-medium' 
                    : darkMode 
                      ? 'text-gray-400' 
                      : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNavbar;
