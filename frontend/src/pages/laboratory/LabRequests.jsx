import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { labReportService } from '../../services/labReportService';
import { FlaskConical, Search, UploadCloud, Clock, CheckCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const LabRequests = () => {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await labReportService.getLabReports({
        requestStatus: statusFilter,
        search,
        page,
        limit: 10,
      });
      if (res.success) {
        setReports(res.data || []);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load test requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, search, page]);

  const handleUpdateStatus = async (id, requestStatus) => {
    try {
      await labReportService.updateLabReport(id, { requestStatus });
      fetchReports();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
            Diagnostic Test Requests Queue
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            Process pathology orders, log analyzer runs, and submit clinical report documents.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search test, description..."
          />

          <div style={{ width: '180px' }}>
            <Select
              placeholder="All Requests"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'REQUESTED', label: 'Requested' },
                { value: 'SAMPLE_COLLECTED', label: 'Sample Collected' },
                { value: 'PROCESSING', label: 'Processing' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'VERIFIED', label: 'Verified' },
              ]}
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving test queue..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchReports} />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No requests found"
          description="There are no laboratory requests matching the filter."
        />
      ) : (
        <div className="sh-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="sh-table-container" style={{ border: 'none' }}>
            <table className="sh-table">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Patient</th>
                  <th>Attending Physician</th>
                  <th>Price ($)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                        {r.testName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        {r.testDescription || 'Standard panel assay'}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '500' }}>{r.patient?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        {r.patient?.gender} • {r.patient?.phone}
                      </div>
                    </td>

                    <td>Dr. {r.doctor?.name}</td>

                    <td>${r.price}</td>

                    <td>
                      <StatusBadge status={r.requestStatus} />
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {r.requestStatus === 'REQUESTED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleUpdateStatus(r._id, 'PROCESSING')}
                          >
                            Mark Processing
                          </Button>
                        )}

                        <Button
                          variant="secondary"
                          size="sm"
                          icon={UploadCloud}
                          onClick={() => navigate(`/lab/reports/${r._id}`)}
                        >
                          {r.requestStatus === 'COMPLETED' ? 'Edit Report' : 'Complete & Upload PDF'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default LabRequests;
