import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatsCard, Card, StatusBadge, PriorityBadge, Spinner } from '../components/ui';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Building2,
  ArrowRight,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const { isAdmin, isDepartment, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingReports, setPendingReports] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // If department manager, redirect to their department dashboard
  if (isDepartment && user?.department_id) {
    return <Navigate to={`/department/${user.department_id}`} replace />;
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (isAdmin) {
        // Admin: get overall stats and pending reports
        const [statsRes, pendingRes, allReportsRes] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getPendingReports(),
          adminAPI.getAllReports()
        ]);
        setStats(statsRes.data);
        setPendingReports(pendingRes.data?.slice(0, 5) || []);
        setRecentReports(allReportsRes.data?.slice(0, 5) || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <Spinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name || 'Admin'}!</h2>
        <p className="text-blue-100">
          Here's an overview of all civic issues across the city.
        </p>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Pending Review"
          value={stats?.pending_count || 0}
          icon={Clock}
          color="yellow"
        />
        <StatsCard 
          title="In Progress"
          value={(stats?.approved_count || 0) + (stats?.in_progress_count || 0)}
          icon={ClipboardList}
          color="blue"
        />
        <StatsCard 
          title="Completed"
          value={stats?.completed_count || 0}
          icon={CheckCircle2}
          color="green"
        />
        <StatsCard 
          title="Available Workers"
          value={stats?.available_workers || 0}
          icon={Users}
          color="purple"
          subtitle={`${stats?.busy_workers || 0} currently busy`}
        />
      </div>

      {/* Quick Actions + Recent Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Pending Issues */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Pending Issues</h3>
            <Link 
              to="/pending"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all <ArrowRight size={16} />
            </Link>
          </div>

          {pendingReports.length > 0 ? (
            <div className="space-y-3">
              {pendingReports.map((report) => (
                <div 
                  key={report.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <AlertTriangle size={20} className="text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 capitalize">{report.category}</p>
                      <p className="text-sm text-slate-500 truncate max-w-xs">
                        {report.location_text || 'No location'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{formatDate(report.created_at)}</span>
                    <Link 
                      to={`/issues/${report.id}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500" />
              <p>No pending issues to review!</p>
            </div>
          )}
        </Card>

        {/* Quick Summary */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Summary</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="text-yellow-600" size={20} />
                <span className="text-sm text-slate-700">Pending</span>
              </div>
              <span className="font-semibold text-yellow-600">
                {stats?.pending_count || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-blue-600" size={20} />
                <span className="text-sm text-slate-700">Approved</span>
              </div>
              <span className="font-semibold text-blue-600">
                {stats?.approved_count || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-600" size={20} />
                <span className="text-sm text-slate-700">Completed</span>
              </div>
              <span className="font-semibold text-green-600">
                {stats?.completed_count || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle className="text-red-600" size={20} />
                <span className="text-sm text-slate-700">Rejected</span>
              </div>
              <span className="font-semibold text-red-600">
                {stats?.rejected_count || 0}
              </span>
            </div>
          </div>

          <Link 
            to="/pending"
            className="mt-6 w-full block text-center py-3 bg-blue-600 text-white rounded-lg 
              hover:bg-blue-700 transition-colors font-medium"
          >
            Review Pending Issues
          </Link>
        </Card>
      </div>

      {/* Recent Activity */}
      {recentReports.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
            <Link 
              to="/issues"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 text-sm font-semibold text-slate-600">Issue</th>
                  <th className="text-left py-3 text-sm font-semibold text-slate-600">Department</th>
                  <th className="text-left py-3 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left py-3 text-sm font-semibold text-slate-600">Priority</th>
                  <th className="text-left py-3 text-sm font-semibold text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentReports.map(report => (
                  <tr key={report.id} className="hover:bg-slate-50">
                    <td className="py-3">
                      <Link to={`/issues/${report.id}`} className="font-medium text-slate-800 capitalize hover:text-blue-600">
                        {report.category}
                      </Link>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-slate-600">
                        {report.department_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="py-3">
                      <PriorityBadge priority={report.priority || 'medium'} />
                    </td>
                    <td className="py-3 text-sm text-slate-500">
                      {formatDate(report.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
