import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { labReportService } from '../../services/labReportService';
import { FlaskConical, Clock, CheckCircle, FileText, UploadCloud, ArrowRight } from 'lucide-react';
import DashboardCard from '../../components/common/DashboardCard';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';

const LabDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardService.getLabDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load laboratory statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleUpdateStatus = async (id, requestStatus) => {
    try {
      await labReportService.updateLabReport(id, { requestStatus });
      fetchDashboard();
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  if (loading) return <LoadingSpinner text="Connecting to Diagnostic Laboratory Engine..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchDashboard} />;

  const { kpi, recentRequests = [] } = data || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
          Clinical Pathology & Laboratory Workbench
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
          Real-time diagnostic requests, analyzer processing, and PDF clinical reporting.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid-4">
        <DashboardCard
          title="Pending Requests"
          value={kpi?.pendingRequests ?? 0}
          subtitle="Awaiting specimen processing"
          icon={Clock}
          color="amber"
          onClick={() => navigate('/lab/requests')}
        />

        <DashboardCard
          title="Processing Tests"
          value={kpi?.processingTests ?? 0}
          subtitle="In analyzer run"
          icon={FlaskConical}
          color="blue"
          onClick={() => navigate('/lab/requests')}
        />

        <DashboardCard
          title="Completed Reports"
          value={kpi?.completedReports ?? 0}
          subtitle="Finalized & uploaded"
          icon={CheckCircle}
          color="green"
          onClick={() => navigate('/lab/reports')}
        />

        <DashboardCard
          title="Total Pathology Workload"
          value={kpi?.total ?? 0}
          subtitle="Cumulative tests"
          icon={FileText}
          color="purple"
        />
      </div>

      {/* Incoming Requests Table */}
      <div className="sh-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--gray-900)' }}>
              Recent Diagnostic Test Queue
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
              Ordered by hospital medical specialists
            </span>
          </div>

          <Button variant="outline" size="sm" icon={ArrowRight} onClick={() => navigate('/lab/requests')}>
            View Full Queue
          </Button>
        </div>

        {recentRequests.length === 0 ? (
          <div style={{ padding: '36px' }}>
            <EmptyState
              icon={FlaskConical}
              title="No active test requests"
              description="All pathology requests have been processed."
            />
          </div>
        ) : (
          <div className="sh-table-container" style={{ border: 'none' }}>
            <table className="sh-table">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Patient</th>
                  <th>Referring Doctor</th>
                  <th>Requested On</th>
                  <th>Status</th>
                  <th>Laboratory Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((req) => (
                  <tr key={req._id}>
                    <td style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                      {req.testName}
                    </td>

                    <td>
                      <div>{req.patient?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        {req.patient?.gender} • {req.patient?.phone}
                      </div>
                    </td>

                    <td>Dr. {req.doctor?.name}</td>

                    <td>{new Date(req.requestedAt || req.createdAt).toLocaleDateString()}</td>

                    <td>
                      <StatusBadge status={req.requestStatus} />
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {req.requestStatus === 'REQUESTED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleUpdateStatus(req._id, 'PROCESSING')}
                          >
                            Start Processing
                          </Button>
                        )}

                        <Button
                          variant="secondary"
                          size="sm"
                          icon={UploadCloud}
                          onClick={() => navigate(`/lab/reports/${req._id}`)}
                        >
                          {req.requestStatus === 'COMPLETED' ? 'Review / Edit' : 'Upload Result'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabDashboard;
