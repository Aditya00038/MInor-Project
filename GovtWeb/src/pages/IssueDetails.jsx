import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminAPI, reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, StatusBadge, PriorityBadge, Button, Modal, Select, Textarea, Spinner } from '../components/ui';
import { 
  MapPin, 
  Clock, 
  User,
  Building2,
  ArrowLeft,
  Image,
  Video,
  CheckCircle,
  XCircle,
  UserPlus,
  History,
  MessageSquare,
  Phone,
  Mail
} from 'lucide-react';

const IssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isDepartment, user } = useAuth();
  const toast = useToast();
  
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [approvalData, setApprovalData] = useState({
    department_id: '',
    priority: 'medium',
    admin_notes: ''
  });

  const [rejectReason, setRejectReason] = useState('');

  const [assignData, setAssignData] = useState({
    worker_id: '',
    department_notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [reportRes, historyRes] = await Promise.all([
        reportsAPI.getById(id),
        adminAPI.getReportHistory(id).catch(() => ({ data: [] }))
      ]);
      
      setReport(reportRes.data);
      setHistory(historyRes.data || []);

      // Admin needs department list for approval
      if (isAdmin) {
        const deptsRes = await adminAPI.getDepartments();
        setDepartments(deptsRes.data);
      }

      // Fetch workers if department is assigned (for admin or dept manager)
      const deptId = reportRes.data.department_id || (isDepartment ? user?.department_id : null);
      if (deptId) {
        const workersRes = await adminAPI.getDepartmentWorkers(deptId);
        setWorkers(workersRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approvalData.department_id) {
      toast.warning('Please select a department');
      return;
    }
    
    setProcessing(true);
    try {
      await adminAPI.approveReport(id, {
        department_id: parseInt(approvalData.department_id),
        priority: approvalData.priority,
        admin_notes: approvalData.admin_notes
      });
      
      setShowApproveModal(false);
      setApprovalData({ department_id: '', priority: 'medium', admin_notes: '' });
      toast.success('Issue approved and assigned to department');
      fetchData();
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve issue');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning('Please provide a reason');
      return;
    }
    
    setProcessing(true);
    try {
      await adminAPI.rejectReport(id, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
      toast.success('Issue rejected');
      fetchData();
    } catch (error) {
      console.error('Failed to reject:', error);
      toast.error('Failed to reject issue');
    } finally {
      setProcessing(false);
    }
  };

  const handleAssignWorker = async () => {
    if (!assignData.worker_id) {
      toast.warning('Please select a worker');
      return;
    }
    
    setProcessing(true);
    try {
      await adminAPI.assignWorker(id, {
        worker_id: parseInt(assignData.worker_id),
        department_notes: assignData.department_notes
      });
      
      setShowAssignModal(false);
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

  // Check if current user can assign workers to this issue
  const canAssignWorker = () => {
    if (report?.status !== 'approved' && report?.status !== 'assigned') return false;
    if (isAdmin) return true;
    if (isDepartment && report?.department_id === user?.department_id) return true;
    return false;
  };
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <Spinner size="lg" />;
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Issue not found</p>
        <Button variant="secondary" onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to list</span>
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-800 capitalize">{report.category}</h1>
            <StatusBadge status={report.status} />
            <PriorityBadge priority={report.priority || 'medium'} />
          </div>
          <p className="text-slate-500">Issue #{report.id}</p>
        </div>

        {/* Actions based on status and role */}
        <div className="flex gap-3">
          {report.status === 'pending' && isAdmin && (
            <>
              <Button variant="success" onClick={() => setShowApproveModal(true)}>
                <CheckCircle size={16} />
                Approve
              </Button>
              <Button variant="danger" onClick={() => setShowRejectModal(true)}>
                <XCircle size={16} />
                Reject
              </Button>
            </>
          )}
          
          {canAssignWorker() && (
            <Button variant="primary" onClick={() => setShowAssignModal(true)}>
              <UserPlus size={16} />
              {report.assigned_worker_id ? 'Reassign Worker' : 'Assign Worker'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Media */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Media</h3>
            <div className="grid grid-cols-2 gap-4">
              {report.image_url ? (
                <div className="aspect-video rounded-lg overflow-hidden bg-slate-100">
                  <img 
                    src={`http://localhost:8000${report.image_url}`}
                    alt="Issue"
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-lg bg-slate-100 flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <Image size={32} className="mx-auto mb-2" />
                    <p className="text-sm">No image</p>
                  </div>
                </div>
              )}
              
              {report.video_url ? (
                <div className="aspect-video rounded-lg overflow-hidden bg-slate-100">
                  <video 
                    src={`http://localhost:8000${report.video_url}`}
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-lg bg-slate-100 flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <Video size={32} className="mx-auto mb-2" />
                    <p className="text-sm">No video</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Description */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Description</h3>
            <p className="text-slate-600 whitespace-pre-wrap">{report.description}</p>
          </Card>

          {/* Location */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Location</h3>
            <div className="flex items-start gap-3 mb-4">
              <MapPin className="text-slate-400 mt-1" size={20} />
              <div>
                <p className="text-slate-700">{report.location_text}</p>
                {report.city && (
                  <p className="text-sm text-slate-500 mt-1">
                    {report.city}{report.state ? `, ${report.state}` : ''}
                  </p>
                )}
              </div>
            </div>
            
            {/* Map placeholder */}
            {report.latitude && report.longitude && (
              <div className="aspect-video rounded-lg bg-slate-100 flex items-center justify-center">
                <p className="text-slate-400">Map View (Lat: {report.latitude}, Lng: {report.longitude})</p>
              </div>
            )}
          </Card>

          {/* Notes Section */}
          {(report.admin_notes || report.department_notes || report.worker_notes) && (
            <Card className="p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MessageSquare size={18} />
                Notes
              </h3>
              <div className="space-y-4">
                {report.admin_notes && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-700 mb-1">Admin Notes</p>
                    <p className="text-slate-700">{report.admin_notes}</p>
                  </div>
                )}
                {report.department_notes && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-700 mb-1">Department Notes</p>
                    <p className="text-slate-700">{report.department_notes}</p>
                  </div>
                )}
                {report.worker_notes && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-700 mb-1">Worker Notes</p>
                    <p className="text-slate-700">{report.worker_notes}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* History */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <History size={18} />
              Activity History
            </h3>
            {history.length > 0 ? (
              <div className="space-y-4">
                {history.map((item, index) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      {index < history.length - 1 && (
                        <div className="w-0.5 flex-1 bg-slate-200 mt-2"></div>
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-slate-800">{item.action}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        by {item.changed_by_name} • {formatDate(item.created_at)}
                      </p>
                      {item.notes && (
                        <p className="text-sm text-slate-600 mt-2 p-2 bg-slate-50 rounded">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No activity history yet</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Status Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={report.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Priority</span>
                <PriorityBadge priority={report.priority || 'medium'} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Points</span>
                <span className="font-medium text-slate-700">{report.points}</span>
              </div>
              {report.bonus_points > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Bonus Points</span>
                  <span className="font-medium text-green-600">+{report.bonus_points}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Citizen Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User size={18} />
              Reported By
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{report.citizen_name || 'Unknown'}</p>
                  <p className="text-sm text-slate-500">{report.citizen_email || 'No email'}</p>
                </div>
              </div>
              {report.citizen_phone && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={14} />
                  {report.citizen_phone}
                </div>
              )}
              <div className="text-sm text-slate-500">
                Submitted on {formatDate(report.created_at)}
              </div>
            </div>
          </Card>

          {/* Department Info */}
          {report.department_id && (
            <Card className="p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Building2 size={18} />
                Assigned Department
              </h3>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-700">{report.department_name}</p>
                {report.approved_at && (
                  <p className="text-sm text-blue-600 mt-1">
                    Assigned on {formatDate(report.approved_at)}
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Worker Info */}
          {report.assigned_worker_id && (
            <Card className="p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <UserPlus size={18} />
                Assigned Worker
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <User size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{report.worker_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full
                    ${report.worker_status === 'available' ? 'bg-green-100 text-green-700' : 
                      report.worker_status === 'busy' ? 'bg-orange-100 text-orange-700' : 
                      'bg-gray-100 text-gray-600'}`}>
                    {report.worker_status}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Timestamps */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={18} />
              Timeline
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-700">{formatDate(report.created_at)}</span>
              </div>
              {report.approved_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Approved</span>
                  <span className="text-slate-700">{formatDate(report.approved_at)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Last Updated</span>
                <span className="text-slate-700">{formatDate(report.updated_at)}</span>
              </div>
              {report.completed_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Completed</span>
                  <span className="text-green-600">{formatDate(report.completed_at)}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Approve Modal */}
      <Modal 
        isOpen={showApproveModal} 
        onClose={() => setShowApproveModal(false)}
        title="Approve & Assign to Department"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Assign to Department *"
            value={approvalData.department_id}
            onChange={(e) => setApprovalData(prev => ({ ...prev, department_id: e.target.value }))}
            options={departments.map(d => ({ value: d.id.toString(), label: d.name }))}
            placeholder="Select department..."
          />

          <Select
            label="Priority Level"
            value={approvalData.priority}
            onChange={(e) => setApprovalData(prev => ({ ...prev, priority: e.target.value }))}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
          />

          <Textarea
            label="Admin Notes (optional)"
            value={approvalData.admin_notes}
            onChange={(e) => setApprovalData(prev => ({ ...prev, admin_notes: e.target.value }))}
            placeholder="Add any notes for the department..."
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleApprove} loading={processing}>
              Approve & Assign
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Worker Modal */}
      <Modal 
        isOpen={showAssignModal} 
        onClose={() => setShowAssignModal(false)}
        title="Assign Worker"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              Assigning worker from <span className="font-medium">{report.department_name}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Worker *</label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {workers.map(worker => (
                <label
                  key={worker.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors
                    ${assignData.worker_id === worker.id.toString() 
                      ? 'border-blue-500 bg-blue-50' 
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
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                      <User size={16} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{worker.name}</p>
                      <p className="text-xs text-slate-500">{worker.active_tasks} active tasks</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full
                    ${worker.worker_status === 'available' ? 'bg-green-100 text-green-700' : 
                      worker.worker_status === 'busy' ? 'bg-orange-100 text-orange-700' : 
                      'bg-gray-100 text-gray-600'}`}>
                    {worker.worker_status}
                  </span>
                </label>
              ))}
              {workers.length === 0 && (
                <p className="text-center py-4 text-slate-500">No workers available in this department</p>
              )}
            </div>
          </div>

          <Textarea
            label="Department Notes (optional)"
            value={assignData.department_notes}
            onChange={(e) => setAssignData(prev => ({ ...prev, department_notes: e.target.value }))}
            placeholder="Add instructions for the worker..."
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAssignWorker} loading={processing}>
              Assign Worker
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal 
        isOpen={showRejectModal} 
        onClose={() => setShowRejectModal(false)}
        title="Reject Issue"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700">
              Are you sure you want to reject this issue? The citizen will be notified of the rejection.
            </p>
          </div>

          <Textarea
            label="Reason for Rejection *"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain why this issue is being rejected..."
            rows={4}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleReject} 
              loading={processing}
              disabled={!rejectReason.trim()}
            >
              Reject Issue
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IssueDetails;
