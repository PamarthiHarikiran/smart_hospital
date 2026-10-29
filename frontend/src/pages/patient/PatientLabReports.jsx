import React, { useState, useEffect, useCallback } from 'react';
import { labReportService } from '../../services/labReportService';
import {
  FlaskConical,
  FileText,
  Activity,
  Download,
  ExternalLink,
  Clock,
  Radio,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import LabReportDetailsModal from '../../components/lab/LabReportDetailsModal';

const PatientLabReports = () => {
  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('report'); // 'report' | 'status'
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState(null);

  const { socket, isConnected } = useSocket();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await labReportService.getLabReports({ page, limit: 10 });
      if (res.success) {
        setReports(res.data || []);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load laboratory reports');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Real-Time Socket.IO Synchronization
  useEffect(() => {
    if (!socket) return;

    const handleReportStatusChanged = (data) => {
      if (!data?.reportId) return;

      setReports((prevReports) => {
        const index = prevReports.findIndex((r) => r._id === data.reportId);
        if (index !== -1) {
          const updatedList = [...prevReports];
          updatedList[index] = data.report || {
            ...updatedList[index],
            requestStatus: data.requestStatus,
          };
          return updatedList;
        } else if (data.report) {
          return [data.report, ...prevReports];
        }
        return prevReports;
      });

      setRecentlyUpdatedId(data.reportId);
      setTimeout(() => setRecentlyUpdatedId(null), 6000);
    };

    const handleReportUpdated = (updatedReport) => {
      if (!updatedReport?._id) return;

      setReports((prevReports) =>
        prevReports.map((r) => (r._id === updatedReport._id ? updatedReport : r))
      );

      setRecentlyUpdatedId(updatedReport._id);
      setTimeout(() => setRecentlyUpdatedId(null), 6000);
    };

    socket.on('lab_report_status_changed', handleReportStatusChanged);
    socket.on('lab_report_updated', handleReportUpdated);

    return () => {
      socket.off('lab_report_status_changed', handleReportStatusChanged);
      socket.off('lab_report_updated', handleReportUpdated);
    };
  }, [socket]);

  const handleOpenFullReport = (report) => {
    setSelectedReport(report);
    setModalTab('report');
    setModalOpen(true);
  };

  const handleOpenRealtimeStatus = (report) => {
    setSelectedReport(report);
    setModalTab('status');
    setModalOpen(true);
  };

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header with Live Telemetry Badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
            My Diagnostic Laboratory Reports
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            Real-time status of pathology tests, specimen analyses, clinical parameters, and official reports.
          </p>
        </div>

        {/* Live Indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: isConnected ? '#ecfdf5' : '#f1f5f9',
            border: `1px solid ${isConnected ? '#a7f3d0' : '#cbd5e1'}`,
            fontSize: '0.8rem',
            fontWeight: '600',
            color: isConnected ? '#065f46' : '#64748b',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#10b981' : '#94a3b8',
              boxShadow: isConnected ? '0 0 8px #10b981' : 'none',
            }}
          />
          {isConnected ? 'Real-Time Telemetry Active' : 'Connecting Real-Time Telemetry...'}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving real-time laboratory records..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchReports} />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No laboratory reports"
          description="You do not have any requested or completed diagnostic investigations."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reports.map((report) => {
            const isRecentUpdate = recentlyUpdatedId === report._id;
            const reportIdFormatted =
              report.reportId ||
              `ELC-LAB-${new Date(report.createdAt || Date.now()).getFullYear()}-${report._id.slice(-4).toUpperCase()}`;

            const abnormalCount = (report.parameters || []).filter(
              (p) => p.status && p.status !== 'NORMAL'
            ).length;

            return (
              <div
                key={report._id}
                className="sh-card"
                style={{
                  padding: '22px',
                  border: isRecentUpdate
                    ? '2px solid #0d9488'
                    : '1px solid var(--gray-200)',
                  boxShadow: isRecentUpdate
                    ? '0 0 15px rgba(13, 148, 136, 0.25)'
                    : 'var(--shadow-sm)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  backgroundColor: '#ffffff',
                }}
              >
                {/* Live Flash Indicator when updated via socket */}
                {isRecentUpdate && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '16px',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      color: '#0d9488',
                      backgroundColor: '#f0fdfa',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: '1px solid #99f6e4',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Radio size={12} className="animate-spin" />
                    Updated Just Now
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '14px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: '#0d9488',
                          backgroundColor: '#f0fdfa',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid #ccfbf1',
                        }}
                      >
                        {reportIdFormatted}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                        {report.testCategory || 'Clinical Pathology'}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: '700',
                        color: 'var(--gray-900)',
                        marginTop: '4px',
                      }}
                    >
                      {report.testName}
                    </h3>

                    <div
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--gray-500)',
                        marginTop: '4px',
                      }}
                    >
                      Referred by <strong>Dr. {report.doctor?.name || 'Attending Physician'}</strong> (
                      {report.doctor?.specialization || 'General'}) • Ordered on{' '}
                      {new Date(report.requestedAt || report.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StatusBadge status={report.requestStatus} />
                  </div>
                </div>

                {report.testDescription && (
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--gray-600)',
                      marginBottom: '14px',
                      lineHeight: '1.4',
                    }}
                  >
                    {report.testDescription}
                  </p>
                )}

                {/* Status-specific Visual Highlights */}
                {report.requestStatus === 'VERIFIED' ? (
                  <div
                    style={{
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px 18px',
                      marginBottom: '16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          color: '#166534',
                          textTransform: 'uppercase',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <CheckCircle2 size={16} />
                        Verified Clinical Findings & Authorization
                      </div>
                      {abnormalCount > 0 && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            color: '#991b1b',
                            backgroundColor: '#fef2f2',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            border: '1px solid #fecaca',
                          }}
                        >
                          {abnormalCount} Parameter(s) Flagged
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        color: '#14532d',
                        marginTop: '6px',
                        fontWeight: '500',
                      }}
                    >
                      {report.result ||
                        'All cellular and biochemical values verified within biological reference ranges.'}
                    </div>
                    {report.verifiedBy?.name && (
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: '#15803d',
                          marginTop: '6px',
                        }}
                      >
                        Authorized by <strong>{report.verifiedBy.name}</strong> (
                        {report.verifiedBy.designation || 'Pathologist'}) on{' '}
                        {report.verifiedAt
                          ? new Date(report.verifiedAt).toLocaleDateString()
                          : new Date().toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ) : report.requestStatus === 'COMPLETED' ? (
                  <div
                    style={{
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px 18px',
                      marginBottom: '16px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        color: '#1e40af',
                        textTransform: 'uppercase',
                      }}
                    >
                      Testing Completed • Awaiting Final Pathologist Sign-off
                    </div>
                    <div
                      style={{
                        fontSize: '0.88rem',
                        color: '#1e3a8a',
                        marginTop: '4px',
                        fontWeight: '500',
                      }}
                    >
                      {report.result ||
                        'Laboratory parameter assays have finished. Quality review in progress.'}
                    </div>
                  </div>
                ) : report.requestStatus === 'PROCESSING' ? (
                  <div
                    style={{
                      backgroundColor: '#faf5ff',
                      border: '1px solid #e9d5ff',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 16px',
                      fontSize: '0.85rem',
                      color: '#6b21a8',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Activity size={18} className="animate-pulse" />
                    <span>
                      🧪 Specimen is currently in active analysis on automated diagnostic track.
                    </span>
                  </div>
                ) : report.requestStatus === 'SAMPLE_COLLECTED' ? (
                  <div
                    style={{
                      backgroundColor: '#fefce8',
                      border: '1px solid #fef08a',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 16px',
                      fontSize: '0.85rem',
                      color: '#854d0e',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Clock size={18} />
                    <span>
                      🩸 Specimen successfully collected and accessioned. Transferred to diagnostic lab.
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      backgroundColor: 'var(--gray-50)',
                      border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 16px',
                      fontSize: '0.85rem',
                      color: 'var(--gray-600)',
                      marginBottom: '16px',
                    }}
                  >
                    ⏳ Test request logged. Please report to the hospital central phlebotomy collection desk.
                  </div>
                )}

                {/* Enhanced Action Buttons Bar: View Full Report & View Real-Time Status */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    borderTop: '1px solid var(--gray-100)',
                    paddingTop: '14px',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                    Sample: <strong>{report.sampleType || 'Whole Blood (EDTA)'}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {/* View Real-Time Status Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenRealtimeStatus(report)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: '#0f766e',
                        backgroundColor: '#f0fdfa',
                        border: '1px solid #99f6e4',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ccfbf1')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0fdfa')}
                    >
                      <Activity size={16} />
                      View Real-Time Status
                    </button>

                    {/* View Full Report Button (Strong Primary Styling) */}
                    <button
                      type="button"
                      onClick={() => handleOpenFullReport(report)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 18px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        color: '#ffffff',
                        backgroundColor: '#0d9488',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(13, 148, 136, 0.25)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0f766e')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0d9488')}
                    >
                      <FileText size={16} />
                      View Full Report
                    </button>

                    {/* Optional legacy PDF download link if present */}
                    {report.reportFile && (
                      <a
                        href={`${backendUrl}${report.reportFile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                        title="Download sample PDF copy"
                      >
                        <Button variant="ghost" size="sm" icon={Download}>
                          PDF
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      {/* Render the Full Responsive Real-Time Clinical Report Modal */}
      <LabReportDetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        report={selectedReport}
        initialTab={modalTab}
      />
    </div>
  );
};

export default PatientLabReports;
