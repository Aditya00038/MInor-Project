import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card, StatusBadge, PriorityBadge, Button, Modal, Select, Textarea, Spinner, EmptyState } from '../components/ui';
import { 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Clock, 
  User,
  Building2,
  Eye,
  Image,
  AlertTriangle
} from 'lucide-react';

const PendingIssues = () => {
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Approval form state
  const [approvalData, setApprovalData] = useState({
    department_id: '',
    priority: 'medium',
    admin_notes: ''
  });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reportsRes, deptsRes] = await Promise.all([
        adminAPI.getPendingReports(),
        adminAPI.getDepartments()
      ]);
      setReports(reportsRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load pending issues');
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
      await adminAPI.approveReport(selectedReport.id, {
        department_id: parseInt(approvalData.department_id),
        priority: approvalData.priority,
        admin_notes: approvalData.admin_notes
      });
      
      // Remove from list
      setReports(reports.filter(r => r.id !== selectedReport.id));
      setShowApproveModal(false);
      setSelectedReport(null);
      setApprovalData({ department_id: '', priority: 'medium', admin_notes: '' });
      toast.success('Issue approved and assigned to department');
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve issue');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning('Please provide a reason for rejection');
      return;
    }
    
    setProcessing(true);
    try {
      await adminAPI.rejectReport(selectedReport.id, rejectReason);
      setReports(reports.filter(r => r.id !== selectedReport.id));
      setShowRejectModal(false);
      setSelectedReport(null);
      setRejectReason('');
      toast.success('Issue rejected');
    } catch (error) {
      console.error('Failed to reject:', error);
      toast.error('Failed to reject issue');
    } finally {
      setProcessing(false);
    }
  };

  const openApproveModal = async (report) => {
    setSelectedReport(report);
    
    // Get department suggestion
    try {
      const suggestion = await adminAPI.suggestDepartment(report.category);
      setApprovalData(prev => ({
        ...prev,
        department_id: suggestion.data.id?.toString() || ''
      }));
    } catch (error) {
      console.error('Failed to get suggestion:', error);
    }
    
    setShowApproveModal(true);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pending Review</h2>
          <p className="text-slate-500">Review and approve citizen reports</p>
        </div>
        <div className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium">
          {reports.length} pending
        </div>
      </div>

      {/* Reports List */}
      {reports.length > 0 ? (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="p-6">
              <div className="flex gap-6">
                {/* Image */}
                <div className="w-40 h-32 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                  {report.image_url ? (
                    <img 
                      src={`http://localhost:8000${report.image_url}`}
                      alt="Issue"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-10 h-10 text-slate-300" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 capitalize">
                        {report.category}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {report.citizen_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDate(report.created_at)}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>

                  <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                    {report.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                    <MapPin size={14} />
                    <span className="truncate">{report.location_text}</span>
                    {report.city && <span className="text-slate-400">• {report.city}</span>}
                  </div>

                  {/* Suggested Department */}
                  {report.suggested_department_name && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-sm mb-4">
                      <Building2 size={14} className="text-blue-600" />
                      <span className="text-slate-600">Suggested:</span>
                      <span className="font-medium text-blue-700">{report.suggested_department_name}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="success" 
                      size="sm"
                      onClick={() => openApproveModal(report)}
                    >
                      <CheckCircle size={16} />
                      Approve & Assign
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report);
                        setShowRejectModal(true);
                      }}
                    >
                      <XCircle size={16} />
                      Reject
                    </Button>
                    <Link to={`/issues/${report.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye size={16} />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={CheckCircle}
          title="All caught up!"
          description="There are no pending issues to review at the moment."
        />
      )}

      {/* Approve Modal */}
      <Modal 
        isOpen={showApproveModal} 
        onClose={() => setShowApproveModal(false)}
        title="Approve & Assign to Department"
        size="md"
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="font-medium text-slate-800 capitalize">{selectedReport.category}</p>
              <p className="text-sm text-slate-500 mt-1">{selectedReport.location_text}</p>
            </div>

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
                <CheckCircle size={16} />
                Approve & Assign
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal 
        isOpen={showRejectModal} 
        onClose={() => setShowRejectModal(false)}
        title="Reject Issue"
        size="md"
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Are you sure?</p>
                <p className="text-sm text-red-600 mt-1">
                  This action will reject the issue and notify the citizen.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="font-medium text-slate-800 capitalize">{selectedReport.category}</p>
              <p className="text-sm text-slate-500 mt-1">{selectedReport.description}</p>
            </div>

            <Textarea
              label="Reason for Rejection *"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this issue..."
              rows={3}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleReject} loading={processing}>
                <XCircle size={16} />
                Reject Issue
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PendingIssues;
