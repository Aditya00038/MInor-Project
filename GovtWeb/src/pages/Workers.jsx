import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Select, Spinner, EmptyState, WorkerStatusBadge } from '../components/ui';
import { 
  Users, 
  User,
  Building2,
  Phone,
  Mail,
  Search,
  ClipboardList
} from 'lucide-react';

const Workers = () => {
  const { isAdmin, isDepartment, user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    department_id: '',
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      let workersData = [];
      
      if (isDepartment && user?.department_id) {
        // Department manager: only get their workers
        const workersRes = await adminAPI.getDepartmentWorkers(user.department_id);
        workersData = workersRes.data;
      } else {
        // Admin: get all workers
        const [workersRes, deptsRes] = await Promise.all([
          adminAPI.getAllWorkers(),
          adminAPI.getDepartments()
        ]);
        workersData = workersRes.data;
        setDepartments(deptsRes.data);
      }
      
      setWorkers(workersData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (workerId, newStatus) => {
    try {
      await adminAPI.updateWorkerStatus(workerId, newStatus);
      setWorkers(workers.map(w => 
        w.id === workerId ? { ...w, worker_status: newStatus } : w
      ));
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update worker status');
    }
  };

  const filteredWorkers = workers.filter(worker => {
    if (filters.department_id && worker.department_id?.toString() !== filters.department_id) {
      return false;
    }
    if (filters.status && worker.worker_status !== filters.status) {
      return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        worker.name?.toLowerCase().includes(searchLower) ||
        worker.email?.toLowerCase().includes(searchLower) ||
        worker.department_name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const statusCounts = {
    all: workers.length,
    available: workers.filter(w => w.worker_status === 'available').length,
    busy: workers.filter(w => w.worker_status === 'busy').length,
    offline: workers.filter(w => w.worker_status === 'offline').length,
  };

  if (loading) {
    return <Spinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isDepartment ? 'My Workers' : 'All Workers'}
          </h2>
          <p className="text-slate-500">
            {isDepartment 
              ? 'Manage your department\'s field workers' 
              : 'Manage field workers and their assignments'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
            <Users className="text-slate-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-slate-800">{statusCounts.all}</p>
          <p className="text-sm text-slate-500">Total Workers</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
            <User className="text-green-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-green-600">{statusCounts.available}</p>
          <p className="text-sm text-slate-500">Available</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
            <ClipboardList className="text-orange-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-orange-600">{statusCounts.busy}</p>
          <p className="text-sm text-slate-500">Busy</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
            <User className="text-gray-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-500">{statusCounts.offline}</p>
          <p className="text-sm text-slate-500">Offline</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={isDepartment ? "Search by name or email..." : "Search by name, email, or department..."}
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
          <Select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            options={[
              { value: 'available', label: 'Available' },
              { value: 'busy', label: 'Busy' },
              { value: 'offline', label: 'Offline' },
            ]}
            placeholder="All Status"
            className="min-w-36"
          />
        </div>
      </Card>

      {/* Workers Grid */}
      {filteredWorkers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkers.map(worker => (
            <Card key={worker.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center
                    ${worker.worker_status === 'available' ? 'bg-green-100' : 
                      worker.worker_status === 'busy' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                    <User size={24} className={
                      worker.worker_status === 'available' ? 'text-green-600' : 
                      worker.worker_status === 'busy' ? 'text-orange-600' : 'text-gray-500'
                    } />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{worker.name}</h3>
                    <WorkerStatusBadge status={worker.worker_status} />
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={14} className="text-slate-400" />
                  <span className="truncate">{worker.email}</span>
                </div>
                {worker.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={14} className="text-slate-400" />
                    {worker.phone}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Building2 size={14} className="text-slate-400" />
                  {worker.department_name || 'No department'}
                </div>
              </div>

              {/* Active Tasks */}
              <div className="p-3 bg-slate-50 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Active Tasks</span>
                  <span className={`text-lg font-bold ${worker.active_tasks > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {worker.active_tasks}
                  </span>
                </div>
              </div>

              {/* Status Toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Update Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(worker.id, 'available')}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors
                      ${worker.worker_status === 'available' 
                        ? 'bg-green-100 border-green-300 text-green-700' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Available
                  </button>
                  <button
                    onClick={() => handleStatusChange(worker.id, 'busy')}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors
                      ${worker.worker_status === 'busy' 
                        ? 'bg-orange-100 border-orange-300 text-orange-700' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Busy
                  </button>
                  <button
                    onClick={() => handleStatusChange(worker.id, 'offline')}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors
                      ${worker.worker_status === 'offline' 
                        ? 'bg-gray-200 border-gray-300 text-gray-700' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Offline
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={Users}
          title="No workers found"
          description="Try adjusting your filters or add new workers to the system."
        />
      )}
    </div>
  );
};

export default Workers;
