import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { MapPin, Calendar, CheckCircle, AlertCircle, Clock, Zap, FileText, ChevronRight, X, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const statusSteps = [
    {
      key: 'submitted',
      label: 'Report Submitted',
      description: 'Your report has been received',
      icon: FileText,
      color: 'bg-blue-500',
      lightBg: 'bg-blue-100',
      estimatedTime: 'Instant'
    },
    {
      key: 'in-progress',
      label: 'Work In Progress',
      description: 'A worker is resolving the issue',
      icon: Zap,
      color: 'bg-orange-500',
      lightBg: 'bg-orange-100',
      estimatedTime: '1-3 days'
    },
    {
      key: 'done',
      label: 'Issue Resolved',
      description: 'Problem has been fixed',
      icon: CheckCircle,
      color: 'bg-green-500',
      lightBg: 'bg-green-100',
      estimatedTime: 'Completed'
    }
  ];

  const getStepIndex = (status) => {
    const index = statusSteps.findIndex(s => s.key === status);
    return index >= 0 ? index : 0;
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  const getRewardStatus = (status) => {
    if (status === 'done') return { text: '+5 Points Earned!', color: 'text-green-500', icon: '🎉' };
    if (status === 'in-progress') return { text: '+3 Points (Awaiting Bonus)', color: 'text-orange-500', icon: '⏳' };
    return { text: '+3 Points Earned!', color: 'text-blue-500', icon: '🚀' };
  };

  // Vertical Timeline Stepper Component
  const TimelineStepper = ({ currentStatus }) => {
    const currentIndex = getStepIndex(currentStatus);
    
    return (
      <div className="py-4">
        {statusSteps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const StepIcon = step.icon;
          
          return (
            <div key={step.key} className="flex items-start">
              {/* Icon and Line */}
              <div className="flex flex-col items-center mr-4">
                {/* Icon Circle */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                    isCompleted 
                      ? step.color 
                      : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                >
                  <StepIcon 
                    size={24} 
                    className={isCompleted ? 'text-white' : darkMode ? 'text-gray-500' : 'text-gray-400'} 
                  />
                </motion.div>
                
                {/* Connecting Line */}
                {index < statusSteps.length - 1 && (
                  <div className="flex flex-col items-center my-1">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.2 + i * 0.1 }}
                        className={`w-1 h-2 my-0.5 rounded-full ${
                          index < currentIndex 
                            ? step.color 
                            : darkMode ? 'bg-gray-700' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className={`flex-1 pb-6 ${index === statusSteps.length - 1 ? 'pb-0' : ''}`}>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <h3 className={`font-bold text-lg ${
                    isCompleted 
                      ? colors.text 
                      : darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </h3>
                  <p className={`text-sm ${
                    isCompleted 
                      ? colors.textSecondary 
                      : darkMode ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {isCurrent ? step.description : `Estimated: ${step.estimatedTime}`}
                  </p>
                  {isCurrent && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        step.color
                      } text-white`}
                    >
                      <Clock size={12} />
                      Current Status
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Report Detail Modal
  const ReportDetailModal = ({ report, onClose }) => {
    if (!report) return null;
    const reward = getRewardStatus(report.status);
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className={`w-full max-w-md ${colors.surface} rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">{report.category}</h2>
                <p className="text-white/80 text-sm">Report #{report.id.slice(-6).toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 bg-white/20 rounded-xl p-3">
              <Award size={20} />
              <span className="font-semibold">{reward.icon} {reward.text}</span>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="p-6">
            <h3 className={`font-bold ${colors.text} mb-4 flex items-center gap-2`}>
              <Clock size={18} />
              Tracking Status
            </h3>
            <TimelineStepper currentStatus={report.status} />
          </div>
          
          {/* Details */}
          <div className={`px-6 pb-6 space-y-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-4`}>
            <div>
              <p className={`text-xs uppercase tracking-wider ${colors.textSecondary} mb-1`}>Description</p>
              <p className={`${colors.text} text-sm`}>{report.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={`text-xs uppercase tracking-wider ${colors.textSecondary} mb-1`}>Location</p>
                <p className={`${colors.text} text-sm flex items-center gap-1`}>
                  <MapPin size={14} className="text-green-500" />
                  {report.location_text || report.location || 'Not specified'}
                </p>
              </div>
              <div>
                <p className={`text-xs uppercase tracking-wider ${colors.textSecondary} mb-1`}>Submitted</p>
                <p className={`${colors.text} text-sm flex items-center gap-1`}>
                  <Calendar size={14} className="text-blue-500" />
                  {report.createdAt?.toLocaleDateString?.() || 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Image if available */}
            {report.mediaUrl && (
              <div>
                <p className={`text-xs uppercase tracking-wider ${colors.textSecondary} mb-2`}>Attached Media</p>
                <img 
                  src={report.mediaUrl} 
                  alt="Report" 
                  className="w-full h-40 object-cover rounded-xl"
                />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-green-50 via-blue-50 to-purple-50'} pt-20 pb-24 px-4`}>
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`${colors.textSecondary} text-lg`}>Loading your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-green-50 via-blue-50 to-purple-50'} pt-20 pb-24 px-4`}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <MapPin size={32} className="text-white" />
          </motion.div>
          <h1 className={`text-2xl font-bold ${colors.text} mb-1`}>Track Reports</h1>
          <p className={colors.textSecondary}>Monitor your submitted issues</p>
        </div>

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {[
            { label: 'Total', value: reports.length, color: 'from-blue-500 to-blue-600' },
            { label: 'Active', value: reports.filter(r => r.status !== 'done').length, color: 'from-orange-500 to-orange-600' },
            { label: 'Resolved', value: reports.filter(r => r.status === 'done').length, color: 'from-green-500 to-green-600' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className={`${colors.surface} rounded-2xl p-4 text-center shadow-lg ${colors.border} border`}
            >
              <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </p>
              <p className={`text-xs ${colors.textSecondary}`}>{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${colors.surface} rounded-2xl p-1.5 mb-6 flex gap-1 shadow-lg ${colors.border} border`}
        >
          {[
            { key: 'all', label: 'All' },
            { key: 'submitted', label: 'New' },
            { key: 'in-progress', label: 'Active' },
            { key: 'done', label: 'Done' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-sm transition-all ${
                filter === tab.key
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                  : `${colors.text} hover:bg-gray-100 dark:hover:bg-gray-800`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${colors.surface} rounded-3xl p-8 text-center shadow-lg ${colors.border} border`}
          >
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className={colors.textSecondary} />
            </div>
            <p className={`${colors.text} font-semibold mb-2`}>No Reports Found</p>
            <p className={`${colors.textSecondary} text-sm`}>
              {filter === 'all' 
                ? 'Start by reporting a civic issue!' 
                : `No ${filter === 'done' ? 'resolved' : filter} reports`}
            </p>
          </motion.div>
        ) : (
          <motion.div layout className="space-y-4">
            {filteredReports.map((report, index) => {
              const currentStep = statusSteps[getStepIndex(report.status)];
              const StepIcon = currentStep.icon;
              const reward = getRewardStatus(report.status);
              
              return (
                <motion.div
                  key={report.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedReport(report)}
                  className={`${colors.surface} rounded-2xl p-4 shadow-lg cursor-pointer ${colors.border} border overflow-hidden relative`}
                >
                  {/* Status Indicator Line */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${currentStep.color}`} />
                  
                  <div className="flex items-start gap-4 pl-2">
                    {/* Icon */}
                    <div className={`w-12 h-12 ${currentStep.color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <StepIcon size={24} className="text-white" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className={`font-bold ${colors.text} truncate`}>{report.category}</h3>
                          <p className={`text-sm ${colors.textSecondary} truncate`}>{report.description}</p>
                        </div>
                        <ChevronRight size={20} className={colors.textSecondary} />
                      </div>
                      
                      {/* Meta Info */}
                      <div className="flex items-center gap-4 mt-3">
                        <span className={`text-xs ${colors.textSecondary} flex items-center gap-1`}>
                          <MapPin size={12} />
                          {(report.location_text || report.location || 'Location').slice(0, 15)}...
                        </span>
                        <span className={`text-xs ${colors.textSecondary} flex items-center gap-1`}>
                          <Calendar size={12} />
                          {report.createdAt?.toLocaleDateString?.() || 'N/A'}
                        </span>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="flex items-center justify-between mt-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${currentStep.color} text-white`}>
                          {currentStep.label}
                        </span>
                        <span className={`text-xs font-semibold ${reward.color}`}>
                          {reward.icon} {reward.text}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`mt-8 ${colors.surface} rounded-3xl p-6 shadow-lg ${colors.border} border`}
        >
          <h3 className={`font-bold ${colors.text} mb-4 text-center`}>📍 How Tracking Works</h3>
          <TimelineStepper currentStatus="done" />
        </motion.div>
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <ReportDetailModal 
            report={selectedReport} 
            onClose={() => setSelectedReport(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
