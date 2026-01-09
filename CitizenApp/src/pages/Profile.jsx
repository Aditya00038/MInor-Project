import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { User, Mail, Lock, Save, Bell, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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

  async function handleProfileUpdate(e) {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (profileData.displayName !== currentUser.displayName) {
        await updateProfile(currentUser, {
          displayName: profileData.displayName
        });
      }

      if (profileData.email !== currentUser.email) {
        await updateEmail(currentUser, profileData.email);
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. ' + error.message });
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
      setMessage({ type: 'success', text: 'Password changed successfully!' });
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

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar-large">
          {currentUser?.displayName?.charAt(0) || 'U'}
        </div>
        <div>
          <h1>{currentUser?.displayName || 'User'}</h1>
          <p>{currentUser?.email}</p>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          <User size={20} />
          Profile
        </button>
        <button
          className={activeTab === 'security' ? 'active' : ''}
          onClick={() => setActiveTab('security')}
        >
          <Shield size={20} />
          Security
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          <Bell size={20} />
          Settings
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="profile-content">
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileUpdate} className="profile-form">
            <h2>Profile Information</h2>
            
            <div className="form-group">
              <label>
                <User size={18} />
                Display Name
              </label>
              <input
                type="text"
                value={profileData.displayName}
                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <Mail size={18} />
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="save-btn">
              <Save size={20} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handlePasswordChange} className="profile-form">
            <h2>Change Password</h2>
            
            <div className="form-group">
              <label>
                <Lock size={18} />
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <Lock size={18} />
                Confirm Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="save-btn">
              <Save size={20} />
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        )}

        {activeTab === 'settings' && (
          <div className="settings-form">
            <h2>Notification Settings</h2>
            
            <div className="setting-item">
              <div>
                <h3>Email Notifications</h3>
                <p>Receive email updates about your reports</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={() => handleSettingsChange('emailNotifications')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div>
                <h3>Push Notifications</h3>
                <p>Receive push notifications on this device</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={() => handleSettingsChange('pushNotifications')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div>
                <h3>Status Updates</h3>
                <p>Get notified when report status changes</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.statusUpdates}
                  onChange={() => handleSettingsChange('statusUpdates')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        )}

        <button onClick={handleLogout} className="logout-btn-full">
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}
