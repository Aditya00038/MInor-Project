import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Card, Spinner } from '../components/ui';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [departmentStats, setDepartmentStats] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, deptsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getDepartments()
      ]);
      
      setStats(statsRes.data);
      setDepartments(deptsRes.data);

      // Fetch stats for each department
      const statsPromises = deptsRes.data.map(d => 
        adminAPI.getDepartmentStats(d.id).then(res => ({ id: d.id, ...res.data }))
      );
      const deptStatsData = await Promise.all(statsPromises);
      const statsMap = {};
      deptStatsData.forEach(s => { statsMap[s.id] = s; });
      setDepartmentStats(statsMap);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner size="lg" />;
  }

  const totalIssues = (stats?.pending_count || 0) + (stats?.approved_count || 0) + 
    (stats?.in_progress_count || 0) + (stats?.completed_count || 0) + (stats?.rejected_count || 0);

  const completionRate = totalIssues > 0 
    ? Math.round((stats?.completed_count / totalIssues) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Analytics</h2>
        <p className="text-slate-500">Overview of system performance and metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="text-blue-600" size={24} />
            </div>
            <span className="flex items-center text-sm text-green-600">
              <ArrowUpRight size={16} />
              +12%
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{totalIssues}</p>
          <p className="text-sm text-slate-500 mt-1">Total Issues</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <span className="text-sm text-slate-500">This month</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{completionRate}%</p>
          <p className="text-sm text-slate-500 mt-1">Completion Rate</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="text-yellow-600" size={24} />
            </div>
            <span className="flex items-center text-sm text-red-600">
              <ArrowDownRight size={16} />
              -5%
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats?.pending_count || 0}</p>
          <p className="text-sm text-slate-500 mt-1">Pending Review</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <PieChart className="text-purple-600" size={24} />
            </div>
            <span className="text-sm text-slate-500">All time</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats?.completed_count || 0}</p>
          <p className="text-sm text-slate-500 mt-1">Resolved Issues</p>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-slate-800 mb-6">Issue Status Distribution</h3>
          <div className="space-y-4">
            {[
              { label: 'Pending', value: stats?.pending_count || 0, color: 'bg-gray-500' },
              { label: 'Approved', value: stats?.approved_count || 0, color: 'bg-blue-500' },
              { label: 'In Progress', value: stats?.in_progress_count || 0, color: 'bg-yellow-500' },
              { label: 'Completed', value: stats?.completed_count || 0, color: 'bg-green-500' },
              { label: 'Rejected', value: stats?.rejected_count || 0, color: 'bg-red-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-medium text-slate-800">{item.value}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: totalIssues > 0 ? `${(item.value / totalIssues) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-slate-800 mb-6">Workforce Status</h3>
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <svg className="w-40 h-40">
                <circle
                  className="text-slate-100"
                  strokeWidth="12"
                  stroke="currentColor"
                  fill="transparent"
                  r="58"
                  cx="80"
                  cy="80"
                />
                <circle
                  className="text-green-500"
                  strokeWidth="12"
                  strokeDasharray={`${((stats?.available_workers || 0) / ((stats?.available_workers || 0) + (stats?.busy_workers || 0) || 1)) * 364} 364`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="58"
                  cx="80"
                  cy="80"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800">
                    {stats?.available_workers || 0}
                  </p>
                  <p className="text-xs text-slate-500">Available</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats?.available_workers || 0}</p>
              <p className="text-sm text-slate-600">Available</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{stats?.busy_workers || 0}</p>
              <p className="text-sm text-slate-600">Busy</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Department Performance */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-800 mb-6">Department Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Department</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Active</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Completed</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Workers</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {departments.map(dept => {
                const deptStats = departmentStats[dept.id] || {};
                const active = (deptStats.pending_count || 0) + (deptStats.assigned_count || 0) + (deptStats.in_progress_count || 0);
                const total = active + (deptStats.completed_count || 0);
                const efficiency = total > 0 ? Math.round((deptStats.completed_count / total) * 100) : 0;
                
                return (
                  <tr key={dept.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: dept.color }}
                        />
                        <span className="font-medium text-slate-800">{dept.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {active}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {deptStats.completed_count || 0}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-slate-700">
                        {deptStats.available_workers || 0}/{deptStats.total_workers || 0}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              efficiency >= 70 ? 'bg-green-500' : 
                              efficiency >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${efficiency}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{efficiency}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
