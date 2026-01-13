import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, StatusBadge, PriorityBadge, Button, Select, Spinner, EmptyState } from '../components/ui';
import { 
  MapPin, 
  Clock, 
  User,
  Building2,
  Eye,
  Search,
  Download,
  ClipboardList
} from 'lucide-react';

const AllIssues = () => {
  const { isAdmin, isDepartment, user } = useAuth();
  const [reports, setReports] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    department_id: '',
    search: ''
  });

  useEffect(() => {
    if (isAdmin) {
      fetchDepartments();
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchReports();
  }, [filters.status, filters.department_id]);

  const fetchDepartments = async () => {
    try {
      const res = await adminAPI.getDepartments();
      setDepartments(res.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      let data = [];
      
      if (isDepartment && user?.department_id) {
        // Department manager: only see their department's issues
        const res = await adminAPI.getDepartmentReports(
          user.department_id, 
          filters.status || undefined
        );
        data = res.data;
      } else {
        // Admin: see all issues
        const res = await adminAPI.getAllReports(
          filters.status || undefined,
          filters.department_id ? parseInt(filters.department_id) : undefined
        );
        data = res.data;
      }
      
      setReports(data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredReports = reports.filter(report => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        report.category?.toLowerCase().includes(searchLower) ||
        report.description?.toLowerCase().includes(searchLower) ||
        report.location_text?.toLowerCase().includes(searchLower) ||
        report.citizen_name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const statusCounts = {
    all: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    approved: reports.filter(r => r.status === 'approved').length,
    assigned: reports.filter(r => r.status === 'assigned').length,
    'in-progress': reports.filter(r => r.status === 'in-progress').length,
    completed: reports.filter(r => r.status === 'completed').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
  };

  // For department managers, only show relevant statuses
  const getStatusTabs = () => {
    if (isDepartment) {
      return [
        { key: '', label: 'All', count: statusCounts.all },
        { key: 'approved', label: 'To Assign', count: statusCounts.approved },
        { key: 'assigned', label: 'Assigned', count: statusCounts.assigned },
        { key: 'in-progress', label: 'In Progress', count: statusCounts['in-progress'] },
        { key: 'completed', label: 'Completed', count: statusCounts.completed },
      ];
    }
    return [
      { key: '', label: 'All', count: statusCounts.all },
      { key: 'pending', label: 'Pending', count: statusCounts.pending },
      { key: 'approved', label: 'Approved', count: statusCounts.approved },
      { key: 'assigned', label: 'Assigned', count: statusCounts.assigned },
      { key: 'in-progress', label: 'In Progress', count: statusCounts['in-progress'] },
      { key: 'completed', label: 'Completed', count: statusCounts.completed },
      { key: 'rejected', label: 'Rejected', count: statusCounts.rejected },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isDepartment ? 'My Issues' : 'All Issues'}
          </h2>
          <p className="text-slate-500">
            {isDepartment 
              ? 'View and manage your department\'s issues' 
              : 'View and manage all reported issues'}
          </p>
        </div>
        {isAdmin && (
          <Button variant="secondary">
            <Download size={16} />
            Export
          </Button>
        )}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {getStatusTabs().map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilters(prev => ({ ...prev, status: tab.key }))}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors
              ${filters.status === tab.key 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
          >
            {tab.label}
            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs
              ${filters.status === tab.key ? 'bg-blue-500' : 'bg-slate-100'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by category, location, citizen..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 
                focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {isAdmin && departments.length > 0 && (
            <Select
              value={filters.department_id}
              onChange={(e) => setFilters(prev => ({ ...prev, department_id: e.target.value }))}
              options={departments.map(d => ({ value: d.id.toString(), label: d.name }))}
              placeholder="All Departments"
              className="min-w-48"
            />
          )}
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <Spinner size="lg" />
      ) : filteredReports.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Issue</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Location</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Department</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Priority</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Date</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-800 capitalize">{report.category}</p>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                          <User size={12} />
                          {report.citizen_name || 'Unknown'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 max-w-xs truncate">{report.location_text}</p>
                      {report.city && (
                        <p className="text-xs text-slate-400 mt-0.5">{report.city}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {report.department_name ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                          <Building2 size={14} className="text-slate-400" />
                          {report.department_name}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={report.priority || 'medium'} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{formatDate(report.created_at)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/issues/${report.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye size={16} />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState 
          icon={ClipboardList}
          title="No issues found"
          description="Try adjusting your filters or search query."
        />
      )}
    </div>
  );
};

export default AllIssues;
