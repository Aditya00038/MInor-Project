import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, availableLanguages } from '../context/LanguageContext';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  User, Mail, Lock, Save, Bell, Shield, LogOut, Camera, Sun, Moon, Globe, 
  CheckCircle, XCircle, Award, MapPin, Calendar, Edit3, Eye, EyeOff,
  ChevronRight, Sparkles, Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = 'http://localhost:8000';

export default function Profile() {
  const { currentUser, logout, userProfile, refreshUserProfile } = useAuth();
  const { darkMode, toggleDarkMode, colors } = useTheme();
  const { t, language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState({ new: false, confirm: false });
  const [imagePreview, setImagePreview] = useState(null);

  const [profileData, setProfileData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || ''
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    statusUpdates: true
  });

  const getProfileImage = () => {
    if (imagePreview) return imagePreview;
    const photoURL = userProfile?.photoURL || currentUser?.photoURL;
    if (photoURL) {
      // If it's a relative path, prepend backend URL
      if (photoURL.startsWith('/uploads/')) {
        return `${BACKEND_URL}${photoURL}`;
      }
      return photoURL;
    }
    return null;
  };

  const getInitial = () => {
    if (userProfile?.displayName) return userProfile.displayName.charAt(0).toUpperCase();
    if (currentUser?.displayName) return currentUser.displayName.charAt(0).toUpperCase();
    if (currentUser?.email) return currentUser.email.charAt(0).toUpperCase();
    return 'U';
  };

  const getBadgeInfo = () => {
    const points = userProfile?.points || 0;
    if (points >= 500) return { level: 'Platinum', color: 'from-gray-400 to-gray-600', icon: '🏆', textColor: 'text-gray-600' };
    if (points >= 300) return { level: 'Gold', color: 'from-yellow-400 to-yellow-600', icon: '🥇', textColor: 'text-yellow-600' };
    if (points >= 200) return { level: 'Silver', color: 'from-gray-300 to-gray-500', icon: '🥈', textColor: 'text-gray-500' };
    if (points >= 100) return { level: 'Bronze', color: 'from-orange-400 to-orange-600', icon: '🥉', textColor: 'text-orange-600' };
    return { level: 'Citizen', color: 'from-green-400 to-green-600', icon: '⭐', textColor: 'text-green-600' };
  };

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file (JPG, PNG, GIF)' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' });
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    setUploadingImage(true);
    setMessage({ type: '', text: '' });

    try {
      // Upload to backend
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BACKEND_URL}/api/uploads/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const photoURL = data.url; // This is like /uploads/filename

        // Update Firebase Auth profile with full URL for external access
        await updateProfile(currentUser, { photoURL: photoURL });

        // Update Firestore user document
        if (currentUser?.uid) {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, { photoURL: photoURL });
        }

        // Refresh user profile
        if (refreshUserProfile) {
          await refreshUserProfile();
        }

        setImagePreview(null); // Clear preview, use actual image
        setMessage({ type: 'success', text: '✓ Profile photo updated successfully!' });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setImagePreview(null);
      setMessage({ type: 'error', text: 'Failed to upload image: ' + error.message });
    }
    setUploadingImage(false);
  }

  async function handleProfileUpdate(e) {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (profileData.displayName !== currentUser.displayName) {
        await updateProfile(currentUser, {
          displayName: profileData.displayName
        });
        
        // Also update Firestore
        if (currentUser?.uid) {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, { displayName: profileData.displayName });
        }
      }

      if (profileData.email !== currentUser.email) {
        await updateEmail(currentUser, profileData.email);
      }

      setMessage({ type: 'success', text: t('success') + ' Profile updated!' });
    } catch (error) {
      setMessage({ type: 'error', text: t('error') + ' ' + error.message });
    }
    setLoading(false);
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters!' });
      setLoading(false);
      return;
    }

    try {
      await updatePassword(currentUser, passwordData.newPassword);
      setMessage({ type: 'success', text: t('success') + ' Password changed!' });
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to change password. You may need to re-login.' });
    }
    setLoading(false);
  }

  function handleSettingsChange(key) {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setMessage({ type: 'success', text: 'Settings updated!' });
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }

  const badge = getBadgeInfo();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen ${colors.background} px-4 py-4`}
    >
      <div className="max-w-lg mx-auto">
        {/* Professional Profile Header Card */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`relative overflow-hidden rounded-3xl mb-6 shadow-xl`}
        >
          {/* Gradient Background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${badge.color} opacity-90`}></div>
          <div className="absolute inset-0 bg-black/10"></div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative p-6 pt-8">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative mb-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative"
                >
                  {getProfileImage() ? (
                    <img
                      src={getProfileImage()}
                      alt="Profile"
                      className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-xl ${getProfileImage() ? 'hidden' : ''}`}
                  >
                    {getInitial()}
                  </div>
                  
                  {/* Upload overlay on hover */}
                  <motion.div
                    whileHover={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                    className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingImage ? (
                      <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera size={28} className="text-white" />
                    )}
                  </motion.div>
                </motion.div>
                
                {/* Camera button */}
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute -bottom-1 -right-1 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-green-500"
                >
                  {uploadingImage ? (
                    <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera size={18} className="text-green-600" />
                  )}
                </motion.button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              {/* Name and Badge */}
              <h1 className="text-2xl font-bold text-white mb-1">
                {userProfile?.displayName || currentUser?.displayName || 'User'}
              </h1>
              <p className="text-white/80 text-sm mb-3">{currentUser?.email}</p>
              
              {/* Badge */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full"
              >
                <span className="text-xl">{badge.icon}</span>
                <span className="text-white font-semibold">{badge.level}</span>
              </motion.div>
            </div>
            
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center"
              >
                <p className="text-2xl font-bold text-white">{userProfile?.points || 0}</p>
                <p className="text-white/80 text-xs">{t('points')}</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center"
              >
                <p className="text-2xl font-bold text-white">{userProfile?.reportsSubmitted || 0}</p>
                <p className="text-white/80 text-xs">Reports</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center"
              >
                <p className="text-2xl font-bold text-white">#{userProfile?.rank || '--'}</p>
                <p className="text-white/80 text-xs">{t('rank')}</p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Tabs - Professional Style */}
        <div className={`flex gap-1 mb-5 ${colors.surface} rounded-2xl p-1.5 shadow-lg ${colors.border} border`}>
          {[
            { id: 'profile', icon: User, label: t('profile') },
            { id: 'security', icon: Shield, label: 'Security' },
            { id: 'settings', icon: Bell, label: 'Settings' }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl transition-all font-medium ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md' 
                  : `${colors.textSecondary} hover:bg-gray-100 dark:hover:bg-gray-700`
              }`}
            >
              <tab.icon size={18} />
              <span className="text-sm hidden sm:inline">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Message Alert */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`mb-5 p-4 rounded-2xl flex items-center gap-3 shadow-lg ${
                message.type === 'success' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                  : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
              }`}
            >
              {message.type === 'success' ? <CheckCircle size={22} /> : <XCircle size={22} />}
              <span className="font-medium">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Cards */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className={`${colors.surface} rounded-3xl p-6 shadow-xl ${colors.border} border`}
          >
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-green-600">
                    <Edit3 size={22} className="text-white" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${colors.text}`}>{t('editProfile')}</h2>
                    <p className={`text-sm ${colors.textSecondary}`}>Update your personal information</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className={`flex items-center gap-2 text-sm font-semibold ${colors.text} mb-2`}>
                      <User size={16} className="text-green-500" /> {t('displayName')}
                    </label>
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      className={`w-full px-4 py-3.5 rounded-xl ${colors.input} ${colors.text} ${colors.border} border-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-medium`}
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  <div>
                    <label className={`flex items-center gap-2 text-sm font-semibold ${colors.text} mb-2`}>
                      <Mail size={16} className="text-green-500" /> {t('email')}
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className={`w-full px-4 py-3.5 rounded-xl ${colors.input} ${colors.text} ${colors.border} border-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-medium`}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(34, 197, 94, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg mt-6"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={20} />
                      {t('save')} Changes
                    </>
                  )}
                </motion.button>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600">
                    <Shield size={22} className="text-white" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${colors.text}`}>Security Settings</h2>
                    <p className={`text-sm ${colors.textSecondary}`}>Change your password</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className={`flex items-center gap-2 text-sm font-semibold ${colors.text} mb-2`}>
                      <Lock size={16} className="text-blue-500" /> New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Enter new password"
                        className={`w-full px-4 py-3.5 pr-12 rounded-xl ${colors.input} ${colors.text} ${colors.border} border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 ${colors.textSecondary}`}
                      >
                        {showPassword.new ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`flex items-center gap-2 text-sm font-semibold ${colors.text} mb-2`}>
                      <Lock size={16} className="text-blue-500" /> Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        className={`w-full px-4 py-3.5 pr-12 rounded-xl ${colors.input} ${colors.text} ${colors.border} border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 ${colors.textSecondary}`}
                      >
                        {showPassword.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg mt-6"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Shield size={20} />
                      Update Password
                    </>
                  )}
                </motion.button>
              </form>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600">
                    <Bell size={22} className="text-white" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${colors.text}`}>App Settings</h2>
                    <p className={`text-sm ${colors.textSecondary}`}>Customize your experience</p>
                  </div>
                </div>
                
                {/* Dark Mode Toggle - Premium Style */}
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className={`flex items-center justify-between p-4 rounded-2xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'} transition-colors`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500' : 'bg-yellow-400'}`}>
                      {darkMode ? <Moon size={22} className="text-white" /> : <Sun size={22} className="text-white" />}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${colors.text}`}>
                        {darkMode ? 'Dark Mode' : 'Light Mode'}
                      </h3>
                      <p className={`text-sm ${colors.textSecondary}`}>
                        {darkMode ? 'Easier on the eyes' : 'Bright and clear'}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleDarkMode}
                    className={`w-16 h-9 rounded-full p-1 transition-colors shadow-inner ${darkMode ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <motion.div
                      layout
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center ${darkMode ? 'ml-auto' : ''}`}
                    >
                      {darkMode ? <Moon size={14} className="text-indigo-500" /> : <Sun size={14} className="text-yellow-500" />}
                    </motion.div>
                  </motion.button>
                </motion.div>

                {/* Language Selection - Premium Style */}
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                      <Globe size={22} className="text-white" />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${colors.text}`}>{t('language')}</h3>
                      <p className={`text-sm ${colors.textSecondary}`}>Choose your language</p>
                    </div>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => changeLanguage(e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-xl ${colors.input} ${colors.text} ${colors.border} border-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-medium cursor-pointer`}
                  >
                    {availableLanguages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.nativeName} ({lang.name})
                      </option>
                    ))}
                  </select>
                </motion.div>

                {/* Notifications Section */}
                <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                      <Bell size={22} className="text-white" />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${colors.text}`}>Notifications</h3>
                      <p className={`text-sm ${colors.textSecondary}`}>Manage your alerts</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'emailNotifications', title: 'Email Notifications', icon: Mail },
                      { key: 'pushNotifications', title: 'Push Notifications', icon: Bell },
                      { key: 'statusUpdates', title: 'Status Updates', icon: CheckCircle }
                    ].map((item) => (
                      <motion.div 
                        key={item.key} 
                        whileHover={{ scale: 1.01 }}
                        className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-gray-600/50' : 'bg-white'} shadow-sm`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={18} className={settings[item.key] ? 'text-green-500' : colors.textSecondary} />
                          <span className={`font-medium text-sm ${colors.text}`}>{item.title}</span>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleSettingsChange(item.key)}
                          className={`w-12 h-7 rounded-full p-0.5 transition-colors ${settings[item.key] ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                          <motion.div
                            layout
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className={`w-6 h-6 rounded-full bg-white shadow-md ${settings[item.key] ? 'ml-auto' : ''}`}
                          />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Logout Button - Premium Style */}
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full mt-6 bg-gradient-to-r from-red-500 to-rose-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all"
        >
          <LogOut size={22} />
          {t('logout')}
        </motion.button>

        {/* App Version */}
        <p className={`text-center mt-6 text-sm ${colors.textSecondary}`}>
          CitizenApp v1.0.0 • Made with 💚
        </p>
      </div>
    </motion.div>
  );
}
