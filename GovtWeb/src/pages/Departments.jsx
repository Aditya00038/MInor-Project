import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Spinner, EmptyState } from '../components/ui';
import { 
  Building2, 
  Users, 
  ClipboardList,
  ArrowRight,
  Plus,
  Car,
  Droplet,
  Trash2,
  Zap,
  TreePine,
  Shield,
  HardHat,
  HeartPulse,
  HelpCircle,
  Wrench
} from 'lucide-react';

// Map icon names to lucide icons (avoid non-existent icons)
const iconMap = {
  road: Car,
  car: Car,
  droplet: Droplet,
  water: Droplet,
  trash: Trash2,
  garbage: Trash2,
  zap: Zap,
  electricity: Zap,
  trees: TreePine,
  tree: TreePine,
  shield: Shield,
  police: Shield,
  building: HardHat,
  construction: HardHat,
  'heart-pulse': HeartPulse,
  health: HeartPulse,
  'help-circle': HelpCircle,
  other: Wrench,
  default: Building2,
};

const Departments = () => {
  const { isAdmin } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const deptsRes = await adminAPI.getDepartments();
      const depts = deptsRes.data;
      setDepartments(depts);

      // Fetch stats for each department
      const statsPromises = depts.map(d => 
        adminAPI.getDepartmentStats(d.id).then(res => ({ id: d.id, ...res.data })).catch(() => ({ id: d.id }))
      );
      const statsData = await Promise.all(statsPromises);
      const statsMap = {};
      statsData.forEach(s => { statsMap[s.id] = s; });
      setStats(statsMap);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get icon component safely
  const getIcon = (iconName) => {
    return iconMap[iconName?.toLowerCase()] || iconMap.default;
  };

  if (loading) {
    return <Spinner size="lg" />;
  }

  if (departments.length === 0) {
    return (
      <EmptyState 
        icon={Building2}
        title="No departments found"
        description="No departments have been created yet."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Departments</h2>
          <p className="text-slate-500">View and manage city departments</p>
        </div>
        {isAdmin && (
          <Button>
            <Plus size={16} />
            Add Department
          </Button>
        )}
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map(dept => {
          const deptStats = stats[dept.id] || {};
          const IconComponent = getIcon(dept.icon);
          
          return (
            <Card key={dept.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${dept.color || '#3B82F6'}20` }}
                >
                  <IconComponent size={28} style={{ color: dept.color || '#3B82F6' }} />
                </div>
                <Link to={`/department/${dept.id}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>

              <h3 className="font-semibold text-slate-800 text-lg mb-1">{dept.name}</h3>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{dept.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <ClipboardList size={18} className="mx-auto text-slate-400 mb-1" />
                  <p className="text-lg font-bold text-slate-800">
                    {(deptStats.pending_count || 0) + (deptStats.assigned_count || 0) + (deptStats.in_progress_count || 0)}
                  </p>
                  <p className="text-xs text-slate-500">Active Issues</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <Users size={18} className="mx-auto text-slate-400 mb-1" />
                  <p className="text-lg font-bold text-slate-800">{deptStats.total_workers || 0}</p>
                  <p className="text-xs text-slate-500">Workers</p>
                </div>
              </div>

              {/* Progress Indicators */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Pending</span>
                  <span className="font-medium text-yellow-600">{deptStats.pending_count || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">In Progress</span>
                  <span className="font-medium text-blue-600">{deptStats.in_progress_count || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Completed</span>
                  <span className="font-medium text-green-600">{deptStats.completed_count || 0}</span>
                </div>
              </div>

              {/* Worker availability */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Available Workers</span>
                  <span className={`font-medium ${deptStats.available_workers > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {deptStats.available_workers || 0} / {deptStats.total_workers || 0}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Department Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Department</th>
                <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Pending</th>
                <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Assigned</th>
                <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">In Progress</th>
                <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Completed</th>
                <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Workers</th>
                <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.map(dept => {
                const deptStats = stats[dept.id] || {};
                return (
                  <tr key={dept.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${dept.color}20` }}
                        >
                          <Building2 size={16} style={{ color: dept.color }} />
                        </div>
                        <span className="font-medium text-slate-800">{dept.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
                        {deptStats.pending_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                        {deptStats.assigned_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                        {deptStats.in_progress_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                        {deptStats.completed_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-slate-700">
                        <span className="text-green-600 font-medium">{deptStats.available_workers || 0}</span>
                        <span className="text-slate-400"> / </span>
                        {deptStats.total_workers || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link to={`/department/${dept.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
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

export default Departments;
