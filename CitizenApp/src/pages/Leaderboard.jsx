import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Trophy, Star, Award, TrendingUp, Medal } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const BACKEND_URL = 'http://localhost:8000';

// Helper function to get proper image URL
function getImageUrl(photoURL) {
  if (!photoURL) return null;
  if (photoURL.startsWith('/uploads/')) {
    return `${BACKEND_URL}${photoURL}`;
  }
  return photoURL;
}

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { darkMode, colors } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    fetchRankings();
  }, []);

  async function fetchRankings() {
    try {
      // Fetch all users
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      
      // Create a map to aggregate points by email (unique identifier)
      const userMap = new Map();
      
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const email = data.email;
        
        if (email) {
          if (userMap.has(email)) {
            // User exists, sum the points
            const existing = userMap.get(email);
            userMap.set(email, {
              ...existing,
              points: (existing.points || 0) + (data.points || 0),
              reportsSubmitted: (existing.reportsSubmitted || 0) + (data.reportsSubmitted || 0)
            });
          } else {
            // New user, add to map
            userMap.set(email, {
              id: doc.id,
              email: email,
              displayName: data.displayName || email.split('@')[0],
              photoURL: data.photoURL || null,
              points: data.points || 0,
              reportsSubmitted: data.reportsSubmitted || 0
            });
          }
        }
      });
      
      // Convert map to array and sort by points (descending)
      const aggregatedUsers = Array.from(userMap.values())
        .sort((a, b) => b.points - a.points)
        .map((user, index) => ({
          ...user,
          rank: index + 1,
          badge: getBadge(user.points)
        }));
      
      setUsers(aggregatedUsers);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      setUsers([]);
    }
    setLoading(false);
  }

  function getBadge(points) {
    if (points >= 500) return { level: 'Platinum', color: 'from-gray-300 to-gray-600', icon: '🏆' };
    if (points >= 300) return { level: 'Gold', color: 'from-yellow-300 to-yellow-600', icon: '🥇' };
    if (points >= 200) return { level: 'Silver', color: 'from-gray-200 to-gray-400', icon: '🥈' };
    if (points >= 100) return { level: 'Bronze', color: 'from-orange-300 to-orange-600', icon: '🥉' };
    return { level: 'Citizen', color: 'from-green-300 to-green-600', icon: '⭐' };
  }

  function getReward(points) {
    if (points >= 200) return '🎁 Premium Rewards';
    if (points >= 100) return '🎟️ Basic Rewards';
    return '🎯 Earn points';
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen ${colors.background} pt-4 pb-12 px-4`}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-3"
          >
            <Trophy size={40} className="text-yellow-500" />
          </motion.div>
          <h1 className={`text-3xl md:text-4xl font-bold ${colors.text} mb-2`}>
            {t('topContributors')}
          </h1>
          <p className={colors.textSecondary}>Community Rankings</p>
        </div>

        {/* Top 3 Podium */}
        {users.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-3 gap-3 mb-8"
          >
            {/* 2nd Place */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center pt-4"
            >
              <div className="relative mb-2">
                {users[1]?.photoURL ? (
                  <img src={getImageUrl(users[1].photoURL)} alt="" className="w-14 h-14 rounded-full object-cover border-4 border-gray-300" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center text-gray-700 text-xl font-bold border-4 border-gray-300">
                    {users[1]?.displayName?.charAt(0) || '2'}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 text-2xl">🥈</span>
              </div>
              <p className={`text-sm font-bold ${colors.text} text-center truncate w-full`}>
                {users[1]?.displayName || 'User'}
              </p>
              <p className="text-lg font-bold text-gray-500">{users[1]?.points || 0}</p>
              <p className={`text-xs ${colors.textSecondary}`}>{t('points')}</p>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-2">
                {users[0]?.photoURL ? (
                  <img src={getImageUrl(users[0].photoURL)} alt="" className="w-18 h-18 rounded-full object-cover border-4 border-yellow-400" style={{ width: '72px', height: '72px' }} />
                ) : (
                  <div className="rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center text-yellow-900 text-2xl font-bold border-4 border-yellow-400" style={{ width: '72px', height: '72px' }}>
                    {users[0]?.displayName?.charAt(0) || '1'}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 text-3xl">🥇</span>
              </div>
              <p className={`text-sm font-bold ${colors.text} text-center truncate w-full`}>
                {users[0]?.displayName || 'User'}
              </p>
              <p className="text-xl font-bold text-yellow-600">{users[0]?.points || 0}</p>
              <p className={`text-xs ${colors.textSecondary}`}>{t('points')}</p>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center pt-6"
            >
              <div className="relative mb-2">
                {users[2]?.photoURL ? (
                  <img src={getImageUrl(users[2].photoURL)} alt="" className="w-12 h-12 rounded-full object-cover border-4 border-orange-300" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-200 to-orange-500 flex items-center justify-center text-orange-900 text-lg font-bold border-4 border-orange-300">
                    {users[2]?.displayName?.charAt(0) || '3'}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 text-xl">🥉</span>
              </div>
              <p className={`text-sm font-bold ${colors.text} text-center truncate w-full`}>
                {users[2]?.displayName || 'User'}
              </p>
              <p className="text-lg font-bold text-orange-600">{users[2]?.points || 0}</p>
              <p className={`text-xs ${colors.textSecondary}`}>{t('points')}</p>
            </motion.div>
          </motion.div>
        )}

        {/* Full Rankings List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${colors.surface} rounded-2xl shadow-lg overflow-hidden ${colors.border} border`}
        >
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">{t('leaderboard')}</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className={colors.textSecondary}>{t('loading')}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className={colors.textSecondary}>No users yet. Be the first to submit a report!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user, index) => (
                <motion.div
                  key={user.id || user.email}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`flex items-center gap-4 p-4 ${colors.hover} transition-colors`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center">
                    {user.rank <= 3 ? (
                      <span className="text-2xl">
                        {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      <span className={`font-bold ${colors.textSecondary}`}>#{user.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  {user.photoURL ? (
                    <img src={getImageUrl(user.photoURL)} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${user.badge.color} flex items-center justify-center text-white font-bold`}>
                      {user.displayName?.charAt(0) || '?'}
                    </div>
                  )}

                  {/* Name & Email */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${colors.text} truncate`}>{user.displayName}</p>
                    <p className={`text-xs ${colors.textSecondary} truncate`}>{user.email}</p>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <p className="font-bold text-green-500 text-lg">{user.points}</p>
                    <p className={`text-xs ${colors.textSecondary}`}>{t('points')}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Points System Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className={`${colors.surface} border-l-4 border-green-500 rounded-lg p-4 ${colors.border} border shadow`}>
            <h3 className={`font-bold ${colors.text} mb-2 flex items-center gap-2`}>
              <Star size={20} className="text-green-500" /> {t('points')}
            </h3>
            <ul className={`${colors.textSecondary} space-y-1 text-sm`}>
              <li>✓ Submit a problem: 3 points</li>
              <li>✓ Problem solved: +2 bonus</li>
              <li>✓ Daily activity: +1 point</li>
            </ul>
          </div>

          <div className={`${colors.surface} border-l-4 border-yellow-500 rounded-lg p-4 ${colors.border} border shadow`}>
            <h3 className={`font-bold ${colors.text} mb-2 flex items-center gap-2`}>
              <Award size={20} className="text-yellow-500" /> Badges
            </h3>
            <ul className={`${colors.textSecondary} space-y-1 text-sm`}>
              <li>🥉 100 points: Bronze</li>
              <li>🥈 200 points: Silver</li>
              <li>🏆 500 points: Platinum</li>
            </ul>
          </div>

          <div className={`${colors.surface} border-l-4 border-purple-500 rounded-lg p-4 ${colors.border} border shadow`}>
            <h3 className={`font-bold ${colors.text} mb-2 flex items-center gap-2`}>
              <Medal size={20} className="text-purple-500" /> Benefits
            </h3>
            <ul className={`${colors.textSecondary} space-y-1 text-sm`}>
              <li>🎁 Discount vouchers</li>
              <li>🎯 Featured badge</li>
              <li>✨ Early access</li>
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
