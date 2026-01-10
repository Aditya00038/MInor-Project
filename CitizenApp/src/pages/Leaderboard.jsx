import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Trophy, Star, Award, TrendingUp, Medal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, []);

  async function fetchRankings() {
    try {
      const q = query(collection(db, 'users'), orderBy('points', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const usersData = querySnapshot.docs.map((doc, index) => ({
        id: doc.id,
        ...doc.data(),
        rank: index + 1,
        badge: getBadge(doc.data().points)
      }));
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      // Fallback to empty array
      setUsers([]);
    }
    setLoading(false);
  }

  function getBadge(points) {
    if (points >= 500) return { level: 'Platinum', color: 'from-gray-300 to-gray-600', icon: '🏆' };
    if (points >= 300) return { level: 'Gold', color: 'from-yellow-300 to-yellow-600', icon: '🥇' };
    if (points >= 200) return { level: 'Silver', color: 'from-gray-200 to-gray-400', icon: '🥈' };
    if (points >= 100) return { level: 'Bronze', color: 'from-orange-300 to-orange-600', icon: '🥉' };
    return { level: 'Citizen', color: 'from-blue-300 to-blue-600', icon: '⭐' };
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
      className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20 pb-12 px-4"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-4"
          >
            <Trophy size={48} className="text-yellow-500" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Leaderboard
          </h1>
          <p className="text-gray-600 text-lg">Top Contributors to Our Community</p>
        </div>

        {/* Top 3 Podium */}
        {users.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            {/* 2nd Place */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="order-first md:order-1 flex flex-col items-center"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="w-full"
              >
                <div className="bg-gradient-to-br from-gray-200 to-gray-400 rounded-2xl p-8 text-center shadow-xl">
                  <div className="text-6xl mb-2">🥈</div>
                  <p className="text-sm text-gray-600 font-semibold mb-2">2nd Place</p>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{users[1]?.email?.split('@')[0] || 'User'}</h3>
                  <p className="text-3xl font-bold text-gray-900">{users[1]?.points || 0}</p>
                  <p className="text-sm text-gray-600 mt-2">points</p>
                </div>
              </motion.div>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="order-second md:order-2"
            >
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-full"
              >
                <div className="bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-2xl p-8 text-center shadow-2xl transform md:scale-105">
                  <div className="text-8xl mb-2">🥇</div>
                  <p className="text-sm text-yellow-900 font-semibold mb-2">1st Place</p>
                  <h3 className="text-2xl font-bold text-yellow-900 mb-1">{users[0]?.email?.split('@')[0] || 'User'}</h3>
                  <p className="text-4xl font-bold text-yellow-900">{users[0]?.points || 0}</p>
                  <p className="text-sm text-yellow-800 mt-2">points</p>
                </div>
              </motion.div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="order-third md:order-3 flex flex-col items-center"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                className="w-full"
              >
                <div className="bg-gradient-to-br from-orange-200 to-orange-500 rounded-2xl p-8 text-center shadow-xl">
                  <div className="text-6xl mb-2">🥉</div>
                  <p className="text-sm text-orange-900 font-semibold mb-2">3rd Place</p>
                  <h3 className="text-xl font-bold text-orange-900 mb-1">{users[2]?.email?.split('@')[0] || 'User'}</h3>
                  <p className="text-3xl font-bold text-orange-900">{users[2]?.points || 0}</p>
                  <p className="text-sm text-orange-700 mt-2">points</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Full Rankings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Community Rankings</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Loading rankings...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No users yet. Be the first to submit a report!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-gray-700">Rank</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-700">User</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-700">Points</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-700">Badge</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-700">Rewards</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-700">Reports</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ backgroundColor: '#f5f5f5' }}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : '⭐'}
                          </span>
                          <span className="font-bold text-lg text-gray-900">#{user.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{user.email?.split('@')[0]}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={20} className="text-blue-600" />
                          <span className="font-bold text-2xl text-blue-600">{user.points}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={`inline-block px-4 py-2 rounded-full font-bold text-white bg-gradient-to-r ${user.badge.color}`}
                        >
                          {user.badge.icon} {user.badge.level}
                        </motion.div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg">{getReward(user.points)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">{user.reportsSubmitted || 0}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Points System Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <Star size={24} /> How to Earn Points
            </h3>
            <ul className="text-blue-800 space-y-2 text-sm">
              <li>✓ Submit a problem: 3 points</li>
              <li>✓ Problem solved: +2 bonus points</li>
              <li>✓ Daily activity: +1 point</li>
            </ul>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-600 rounded-lg p-6">
            <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
              <Award size={24} /> Reward Tiers
            </h3>
            <ul className="text-purple-800 space-y-2 text-sm">
              <li>🥉 100 points: Basic Badge</li>
              <li>🥈 200 points: Premium Badge</li>
              <li>🏆 500 points: Platinum Badge</li>
            </ul>
          </div>

          <div className="bg-pink-50 border-l-4 border-pink-600 rounded-lg p-6">
            <h3 className="font-bold text-pink-900 mb-3 flex items-center gap-2">
              <Medal size={24} /> Exclusive Benefits
            </h3>
            <ul className="text-pink-800 space-y-2 text-sm">
              <li>🎁 Discount vouchers</li>
              <li>🎯 Featured profile badge</li>
              <li>✨ Early access to events</li>
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
