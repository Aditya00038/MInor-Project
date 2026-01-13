import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatsCard, Card, StatusBadge, PriorityBadge, Button, Modal, Textarea, Spinner, EmptyState, WorkerStatusBadge } from '../components/ui';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  Users, 
  UserPlus,
  Eye,
  MapPin,
  AlertCircle,
  User
} from 'lucide-react';

const DepartmentDashboard = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedReport, setSelectedReport] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignData, setAssignData] = useState({ worker_id: '', department_notes: '' });
  const [processing, setProcessing] = useState(false);
  
  const [activeTab, setActiveTab] = useState('approved');

  // Use department ID from route or user's department
  const departmentId = id || user?.department_id;

  useEffect(() => {
    if (departmentId) {
      fetchData();
    }
  }, [departmentId, activeTab]);

  const fetchData = async () => {
    try {
      const [statsRes, reportsRes, workersRes] = await Promise.all([
        adminAPI.getDepartmentStats(departmentId),
        adminAPI.getDepartmentReports(departmentId, activeTab === 'all' ? undefined : activeTab),
        adminAPI.getDepartmentWorkers(departmentId)
      ]);
      
      setStats(statsRes.data);
      setReports(reportsRes.data || []);
      setWorkers(workersRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load department data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignWorker = async () => {
    if (!assignData.worker_id) {
      toast.warning('Please select a worker');
      return;
    }
    
    setProcessing(true);
    try {
      await adminAPI.assignWorker(selectedReport.id, {
        worker_id: parseInt(assignData.worker_id),
        department_notes: assignData.department_notes
      });
      
      setShowAssignModal(false);
      setSelectedReport(null);
      setAssignData({ worker_id: '', department_notes: '' });
      toast.success('Worker assigned successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to assign:', error);
      toast.error('Failed to assign worker');
    } finally {
      setProcessing(false);
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
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{stats?.department_name || 'Department'} Dashboard</h2>
        <p className="text-purple-100">Manage issues and assign tasks to workers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Pending Assignment"
          value={stats?.pending_count || 0}
          icon={Clock}
          color="yellow"
        />
        <StatsCard 
          title="Assigned"
          value={stats?.assigned_count || 0}
          icon={ClipboardList}
          color="purple"
        />
        <StatsCard 
          title="In Progress"
          value={stats?.in_progress_count || 0}
          icon={AlertCircle}
          color="blue"
        />
        <StatsCard 
          title="Available Workers"
          value={stats?.available_workers || 0}
          icon={Users}
          color="green"
          subtitle={`${stats?.total_workers || 0} total workers`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Issues List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { key: 'approved', label: 'Pending Assignment' },
              { key: 'assigned', label: 'Assigned' },
              { key: 'in-progress', label: 'In Progress' },
              { key: 'all', label: 'All' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors
                  ${activeTab === tab.key 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Reports */}
          {reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800 capitalize">{report.category}</h3>
                        <StatusBadge status={report.status} />
                        <PriorityBadge priority={report.priority || 'medium'} />
                      </div>
                      <p className="text-sm text-slate-500">
                        Reported by {report.citizen_name} • {formatDate(report.created_at)}
                      </p>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm mb-3 line-clamp-2">{report.description}</p>

                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                    <MapPin size={14} />
                    <span className="truncate">{report.location_text}</span>
                  </div>

                  {/* Admin Notes */}
                  {report.admin_notes && (
                    <div className="p-3 bg-blue-50 rounded-lg text-sm mb-4">
                      <p className="font-medium text-blue-700 mb-1">Admin Notes:</p>
                      <p className="text-slate-700">{report.admin_notes}</p>
                    </div>
                  )}

                  {/* Assigned Worker */}
                  {report.worker_name && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg mb-4">
                      <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center">
                        <User size={16} className="text-green-700" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">Assigned to: {report.worker_name}</p>
                        <WorkerStatusBadge status={report.worker_status} />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    {(report.status === 'approved' || report.status === 'assigned') && (
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setShowAssignModal(true);
                        }}
                      >
                        <UserPlus size={16} />
                        {report.assigned_worker_id ? 'Reassign' : 'Assign Worker'}
                      </Button>
                    )}
                    <Link to={`/issues/${report.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye size={16} />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={ClipboardList}
              title="No issues found"
              description={`No ${activeTab === 'all' ? '' : activeTab} issues in this department.`}
            />
          )}
        </div>

        {/* Workers Panel */}
        <div>
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Users size={18} />
              Department Workers
            </h3>
            
            {workers.length > 0 ? (
              <div className="space-y-3">
                {workers.map(worker => (
                  <div 
                    key={worker.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center
                        ${worker.worker_status === 'available' ? 'bg-green-100' : 
                          worker.worker_status === 'busy' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                        <User size={18} className={
                          worker.worker_status === 'available' ? 'text-green-600' : 
                          worker.worker_status === 'busy' ? 'text-orange-600' : 'text-gray-500'
                        } />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{worker.name}</p>
                        <p className="text-xs text-slate-500">{worker.active_tasks} active tasks</p>
                      </div>
                    </div>
                    <WorkerStatusBadge status={worker.worker_status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-slate-500">No workers in this department</p>
            )}

            {/* Quick Stats */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{stats?.available_workers || 0}</p>
                  <p className="text-xs text-slate-600">Available</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {(stats?.total_workers || 0) - (stats?.available_workers || 0)}
                  </p>
                  <p className="text-xs text-slate-600">Busy</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Completed Stats */}
          <Card className="p-6 mt-4">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-500" />
              Completed
            </h3>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">{stats?.completed_count || 0}</p>
              <p className="text-sm text-slate-500 mt-1">Issues resolved</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Assign Worker Modal */}
      <Modal 
        isOpen={showAssignModal} 
        onClose={() => setShowAssignModal(false)}
        title="Assign Worker"
        size="md"
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="font-medium text-slate-800 capitalize">{selectedReport.category}</p>
              <p className="text-sm text-slate-500 mt-1">{selectedReport.location_text}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Worker *</label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {workers.filter(w => w.worker_status !== 'offline').map(worker => (
                  <label
                    key={worker.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors
                      ${assignData.worker_id === worker.id.toString() 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="worker"
                        value={worker.id}
                        checked={assignData.worker_id === worker.id.toString()}
                        onChange={(e) => setAssignData(prev => ({ ...prev, worker_id: e.target.value }))}
                        className="sr-only"
                      />
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center
                        ${worker.worker_status === 'available' ? 'bg-green-100' : 'bg-orange-100'}`}>
                        <User size={16} className={
                          worker.worker_status === 'available' ? 'text-green-600' : 'text-orange-600'
                        } />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{worker.name}</p>
                        <p className="text-xs text-slate-500">{worker.active_tasks} active tasks</p>
                      </div>
                    </div>
                    <WorkerStatusBadge status={worker.worker_status} />
                  </label>
                ))}
              </div>
            </div>

            <Textarea
              label="Notes for Worker (optional)"
              value={assignData.department_notes}
              onChange={(e) => setAssignData(prev => ({ ...prev, department_notes: e.target.value }))}
              placeholder="Add instructions or details for the worker..."
              rows={3}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignWorker} loading={processing}>
                Assign Worker
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DepartmentDashboard;
