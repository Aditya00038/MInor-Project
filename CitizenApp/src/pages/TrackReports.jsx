import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { MapPin, Calendar, Eye } from 'lucide-react';

export default function TrackReports() {
  const { currentUser } = useAuth();
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
        ...doc.data()
      }));
      setReports(reportsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getStatusColor = (status) => {
    const colors = {
      'Reported': '#fbbf24',
      'Assigned': '#3b82f6',
      'In Progress': '#8b5cf6',
      'Completed': '#10b981'
    };
    return colors[status] || '#6b7280';
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  if (loading) {
    return <div className="track-container"><div className="loading">Loading reports...</div></div>;
  }

  return (
    <div className="track-container">
      <div className="track-header">
        <h1>Track Reports</h1>
        <p>Monitor the status of your reported issues</p>
      </div>

      <div className="filter-buttons">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({reports.length})
        </button>
        <button
          className={filter === 'Reported' ? 'active' : ''}
          onClick={() => setFilter('Reported')}
        >
          Reported ({reports.filter(r => r.status === 'Reported').length})
        </button>
        <button
          className={filter === 'Assigned' ? 'active' : ''}
          onClick={() => setFilter('Assigned')}
        >
          Assigned ({reports.filter(r => r.status === 'Assigned').length})
        </button>
        <button
          className={filter === 'In Progress' ? 'active' : ''}
          onClick={() => setFilter('In Progress')}
        >
          In Progress ({reports.filter(r => r.status === 'In Progress').length})
        </button>
        <button
          className={filter === 'Completed' ? 'active' : ''}
          onClick={() => setFilter('Completed')}
        >
          Completed ({reports.filter(r => r.status === 'Completed').length})
        </button>
      </div>

      {filteredReports.length === 0 ? (
        <div className="no-reports">
          <p>No reports found. Start by reporting an issue!</p>
        </div>
      ) : (
        <div className="reports-grid">
          {filteredReports.map(report => (
            <div key={report.id} className="report-card">
              {report.imageUrl && (
                <div className="report-image">
                  <img src={report.imageUrl} alt="Report" />
                </div>
              )}
              <div className="report-content">
                <div className="report-status" style={{ background: getStatusColor(report.status) }}>
                  {report.status}
                </div>
                <h3>{report.category}</h3>
                <p className="report-description">{report.description}</p>
                <div className="report-meta">
                  <div className="meta-item">
                    <MapPin size={16} />
                    <span>{report.location}</span>
                  </div>
                  <div className="meta-item">
                    <Calendar size={16} />
                    <span>
                      {report.createdAt?.toDate().toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  className="view-btn"
                  onClick={() => setSelectedReport(report)}
                >
                  <Eye size={16} />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedReport(null)}>×</button>
            <h2>Report Details</h2>
            <div className="modal-content">
              <div className="detail-row">
                <strong>Category:</strong>
                <span>{selectedReport.category}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span className="status-badge" style={{ background: getStatusColor(selectedReport.status) }}>
                  {selectedReport.status}
                </span>
              </div>
              <div className="detail-row">
                <strong>Description:</strong>
                <p>{selectedReport.description}</p>
              </div>
              <div className="detail-row">
                <strong>Location:</strong>
                <span>{selectedReport.location}</span>
              </div>
              <div className="detail-row">
                <strong>Reported On:</strong>
                <span>{selectedReport.createdAt?.toDate().toLocaleString()}</span>
              </div>
              {selectedReport.imageUrl && (
                <div className="detail-row">
                  <strong>Before Image:</strong>
                  <img src={selectedReport.imageUrl} alt="Report" className="detail-image" />
                </div>
              )}
              {selectedReport.afterImageUrl && (
                <div className="detail-row">
                  <strong>After Image:</strong>
                  <img src={selectedReport.afterImageUrl} alt="Resolved" className="detail-image" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
