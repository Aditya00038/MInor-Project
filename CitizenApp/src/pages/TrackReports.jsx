import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { MapPin, Calendar, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TrackReports() {
  const { currentUser } = useAuth();
  const { darkMode, colors } = useTheme();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      }));
      setReports(reportsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const statusFlow = ['submitted', 'in-progress', 'done'];

  function getStatusInfo(status) {
    const statusMap = {
      'submitted': {
        label: 'Submitted',
        icon: AlertCircle,
        color: 'from-blue-400 to-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-300',
        textColor: 'text-blue-700'
      },
      'in-progress': {
        label: 'In Progress',
        icon: Zap,
        color: 'from-purple-400 to-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-300',
        textColor: 'text-purple-700'
      },
      'done': {
        label: 'Completed',
        icon: CheckCircle,
        color: 'from-green-400 to-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-300',
        textColor: 'text-green-700'
      }
    };
    return statusMap[status] || statusMap['submitted'];
  }

  function getProgressPercentage(status) {
    const statusIndex = statusFlow.indexOf(status || 'submitted');
    return ((statusIndex + 1) / statusFlow.length) * 100;
  }

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  const getRewardStatus = (status) => {
    if (status === 'done') return '✅ +2 Bonus Points Earned!';
    if (status === 'in-progress') return '⏳ Awaiting Completion...';
    return '🚀 Report Submitted - 3 Points Earned!';
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'} pt-20 pb-12 px-4`}>
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`${colors.textSecondary} text-lg`}>Loading your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'} pt-20 pb-12 px-4`}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Track Your Reports
          </h1>
          <p className={`${colors.textSecondary} text-lg`}>Monitor the status of your reported civic issues</p>
        </div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 mb-8 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : `${colors.surface} ${colors.text} border-2 ${darkMode ? 'border-gray-700 hover:border-blue-500' : 'border-gray-200 hover:border-blue-600'}`
            }`}
          >
            All ({reports.length})
          </motion.button>
          
          {['submitted', 'in-progress', 'done'].map(status => {
            const count = reports.filter(r => r.status === status).length;
            const info = getStatusInfo(status);
            return (
              <motion.button
                key={status}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(status)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  filter === status
                    ? `bg-gradient-to-r ${info.color} text-white shadow-lg`
                    : `${darkMode ? 'bg-gray-800' : info.bgColor} ${colors.text} border-2 ${darkMode ? 'border-gray-700' : info.borderColor}`
                }`}
              >
                <info.icon size={18} />
                {info.label} ({count})
              </motion.button>
            );
          })}
        </motion.div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${colors.surface} rounded-2xl shadow-xl p-12 text-center ${colors.border} border`}
          >
            <AlertCircle size={48} className={`mx-auto ${colors.textSecondary} mb-4`} />
            <p className={`${colors.text} text-lg mb-4`}>No reports found with this filter</p>
            <p className={colors.textSecondary}>Start by reporting an issue to track its progress!</p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="space-y-6"
          >
            {filteredReports.map((report, index) => {
              const statusInfo = getStatusInfo(report.status);
              const StatusIcon = statusInfo.icon;
              const progress = getProgressPercentage(report.status);

              return (
                <motion.div
                  key={report.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className={`${colors.surface} rounded-2xl shadow-lg overflow-hidden border-l-4 ${statusInfo.borderColor} ${colors.border} border-r border-t border-b`}
                >
                  {/* Card Content */}
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <h3 className={`text-2xl font-bold ${colors.text} mb-2`}>{report.category}</h3>
                        <p className={colors.textSecondary}>{report.description}</p>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={`px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r ${statusInfo.color} flex items-center gap-2 whitespace-nowrap`}
                      >
                        <StatusIcon size={20} />
                        {statusInfo.label}
                      </motion.div>
                    </div>

                    {/* Status Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-semibold ${colors.text}`}>Progress</span>
                        <span className={`text-sm font-bold ${colors.text}`}>{Math.round(progress)}%</span>
                      </div>
                      <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-3 overflow-hidden`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full bg-gradient-to-r ${statusInfo.color}`}
                        />
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div>
                        <p className={`text-xs ${colors.textSecondary} uppercase tracking-wider`}>Location</p>
                        <p className={`font-semibold ${colors.text} flex items-center gap-1 mt-1`}>
                          <MapPin size={16} /> {report.location}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.textSecondary} uppercase tracking-wider`}>Reported</p>
                        <p className={`font-semibold ${colors.text} flex items-center gap-1 mt-1`}>
                          <Calendar size={16} />
                          {report.createdAt?.toLocaleDateString?.() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.textSecondary} uppercase tracking-wider`}>Last Updated</p>
                        <p className={`font-semibold ${colors.text} mt-1`}>
                          {report.updatedAt?.toLocaleDateString?.() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.textSecondary} uppercase tracking-wider`}>Points</p>
                        <p className="font-bold text-lg text-blue-600 mt-1">+{report.points || 3} pts</p>
                      </div>
                    </div>

                    {/* Reward Status */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className={`${darkMode ? 'bg-gray-800' : statusInfo.bgColor} border-2 ${darkMode ? 'border-gray-700' : statusInfo.borderColor} rounded-xl p-4`}
                    >
                      <p className={`font-semibold ${darkMode ? colors.text : statusInfo.textColor}`}>
                        {getRewardStatus(report.status)}
                      </p>
                    </motion.div>

                    {/* Image if available */}
                    {report.mediaUrl && (
                      <div className="mt-4">
                        {report.mediaType === 'photo' ? (
                          <img 
                            src={report.mediaUrl} 
                            alt="Report" 
                            className="max-h-64 rounded-xl object-cover w-full"
                          />
                        ) : (
                          <video 
                            src={report.mediaUrl}
                            controls
                            className="max-h-64 rounded-xl w-full"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Status Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className={`${darkMode ? 'bg-blue-900/30 border-blue-500' : 'bg-blue-50 border-blue-300'} border-l-4 rounded-lg p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle size={24} className="text-blue-600" />
              <h3 className={`font-bold ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>Submitted</h3>
            </div>
            <p className={`${darkMode ? 'text-blue-200' : 'text-blue-800'} text-sm`}>Report received. Workers will be notified.</p>
          </div>

          <div className={`${darkMode ? 'bg-purple-900/30 border-purple-500' : 'bg-purple-50 border-purple-300'} border-l-4 rounded-lg p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <Zap size={24} className="text-purple-600" />
              <h3 className={`font-bold ${darkMode ? 'text-purple-300' : 'text-purple-900'}`}>In Progress</h3>
            </div>
            <p className={`${darkMode ? 'text-purple-200' : 'text-purple-800'} text-sm`}>A worker is actively working on this issue.</p>
          </div>

          <div className={`${darkMode ? 'bg-green-900/30 border-green-500' : 'bg-green-50 border-green-300'} border-l-4 rounded-lg p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle size={24} className="text-green-600" />
              <h3 className={`font-bold ${darkMode ? 'text-green-300' : 'text-green-900'}`}>Completed</h3>
            </div>
            <p className={`${darkMode ? 'text-green-200' : 'text-green-800'} text-sm`}>Issue resolved! You earned bonus points.</p>
          </div>
        </motion.div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl"
        >
          <h3 className="text-2xl font-bold mb-4">📊 Your Progress</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-blue-100 text-sm uppercase tracking-wider mb-1">Total Reports</p>
              <p className="text-4xl font-bold">{reports.length}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm uppercase tracking-wider mb-1">Completed</p>
              <p className="text-4xl font-bold">{reports.filter(r => r.status === 'done').length}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm uppercase tracking-wider mb-1">Total Points</p>
              <p className="text-4xl font-bold">{reports.length * 3 + reports.filter(r => r.status === 'done').length * 2}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
