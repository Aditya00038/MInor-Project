import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, MapPin, MessageCircle, Trophy, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const { currentUser } = useAuth();

  const quickActions = [
    { title: 'Report Problem', description: 'Report a civic issue', icon: FileText, link: '/report' },
    { title: 'Track Reports', description: 'View status of issues', icon: MapPin, link: '/track' },
    { title: 'Chatbot Help', description: 'Get instant answers', icon: MessageCircle, link: '/chatbot' },
    { title: 'Leaderboard', description: 'See top workers', icon: Trophy, link: '/leaderboard' }
  ];

  const stats = [
    { label: 'Total Reports', value: '0', icon: FileText },
    { label: 'Resolved', value: '0', icon: TrendingUp },
    { label: 'Pending', value: '0', icon: AlertCircle }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full min-h-screen pt-20 pb-24 px-4 md:px-8"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="gradient-text text-4xl md:text-5xl font-bold mb-3">
          Welcome, {currentUser?.displayName || 'Citizen'}!
        </h1>
        <p className="text-gray-600 text-lg">Report and track civic issues in your community</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto"
      >
        {stats.map((stat, index) => (
          <motion.div key={index} variants={itemVariants} whileHover={{ y: -5 }} className="card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg text-white">
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 max-w-6xl mx-auto"
      >
        {quickActions.map((action, index) => (
          <motion.div key={index} variants={itemVariants} whileHover={{ scale: 1.05 }}>
            <Link to={action.link} className="card h-full flex flex-col gap-3">
              <div className="p-4 w-fit bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-lg">
                <action.icon className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{action.title}</h3>
              <p className="text-gray-600 text-sm">{action.description}</p>
              <div className="mt-auto text-blue-600 font-semibold text-sm hover:text-purple-600 transition">
                Learn more →
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* How It Works */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card max-w-6xl mx-auto"
      >
        <h2 className="gradient-text text-3xl font-bold mb-8 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { num: '1', title: 'Report Issue', desc: 'Spot a problem? Report it with photos and location' },
            { num: '2', title: 'Track Progress', desc: 'Monitor your report status in real-time' },
            { num: '3', title: 'See Solutions', desc: 'Get updates when issues are resolved' }
          ].map((step, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ scale: 1.05 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {step.num}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
