import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { labReportService } from '../../services/labReportService';
import { FileText, ExternalLink, Search, CheckCircle, Eye } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import LabReportDetailsModal from '../../components/lab/LabReportDetailsModal';

const LabReports = () => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await labReportService.getLabReports({
        requestStatus: 'COMPLETED,VERIFIED',
        search,
        page,
        limit: 10,
      });
      if (res.success) {
        setReports(res.data || []);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load completed reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [search, page]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
            Completed Pathology Reports Archive
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            Catalog of verified laboratory test documents and attached PDF clinical certificates.
          </p>
        </div>

        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by test name, result..."
        />
      </div>

      {loading ? (
        <LoadingSpinner text="Loading completed reports archive..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchReports} />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No completed reports found"
          description="Finalized reports with uploaded documentation will be archived here."
        />
      ) : (
        <div className="sh-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="sh-table-container" style={{ border: 'none' }}>
            <table className="sh-table">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Patient</th>
                  <th>Referring Doctor</th>
                  <th>Finalized On</th>
                  <th>Result Summary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{r.testName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>ID: #{r._id.slice(-6).toUpperCase()}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '500' }}>{r.patient?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{r.patient?.phone}</div>
                    </td>

                    <td>Dr. {r.doctor?.name}</td>

                    <td>{new Date(r.completedAt || r.updatedAt).toLocaleDateString()}</td>

                    <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.result || 'Normal / Reference ranges'}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => {
                            setSelectedReport(r);
                            setModalOpen(true);
                          }}
                        >
                          View
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/lab/reports/${r._id}`)}
                        >
                          Edit
                        </Button>

                        {r.reportFile && (
                          <a href={`${backendUrl}${r.reportFile}`} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm" icon={ExternalLink}>
                              PDF
                            </Button>
                          </a>
                        )}
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

      <LabReportDetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        report={selectedReport}
        initialTab="report"
      />
    </div>
  );
};

export default LabReports;
