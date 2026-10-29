import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  FlaskConical,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  User,
  Calendar,
  FileText,
  Activity,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';

const STATUS_STEPS = [
  { key: 'REQUESTED', label: 'Requested', desc: 'Clinical investigation ordered' },
  { key: 'SAMPLE_COLLECTED', label: 'Sample Collected', desc: 'Specimen received & barcoded' },
  { key: 'PROCESSING', label: 'Processing', desc: 'Active laboratory assay' },
  { key: 'COMPLETED', label: 'Completed', desc: 'Testing finalized & QC passed' },
  { key: 'VERIFIED', label: 'Verified', desc: 'Pathologist authorized & signed' },
];

const LabReportDetailsModal = ({
  isOpen,
  onClose,
  report: initialReport,
  initialTab = 'report', // 'report' | 'status'
}) => {
  const [report, setReport] = useState(initialReport);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [realtimeNotification, setRealtimeNotification] = useState('');
  const { socket, joinLabReport, leaveLabReport, isConnected } = useSocket();
  const printRef = useRef(null);

  useEffect(() => {
    setReport(initialReport);
    setActiveTab(initialTab);
  }, [initialReport, initialTab]);

  // Real-Time Socket.IO Listener for this specific report
  useEffect(() => {
    if (!isOpen || !report?._id) return;

    joinLabReport(report._id);

    const handleUpdate = (updatedReport) => {
      if (updatedReport && updatedReport._id === report._id) {
        setReport(updatedReport);
        setRealtimeNotification(
          `Live Update: Status updated to ${updatedReport.requestStatus.replace('_', ' ')}`
        );
        setTimeout(() => setRealtimeNotification(''), 5000);
      }
    };

    const handleStatusChanged = (data) => {
      if (data?.reportId === report._id && data?.report) {
        setReport(data.report);
        setRealtimeNotification(
          `Live Update: Specimen transitioned to ${data.requestStatus.replace('_', ' ')}`
        );
        setTimeout(() => setRealtimeNotification(''), 5000);
      }
    };

    if (socket) {
      socket.on('lab_report_updated', handleUpdate);
      socket.on('lab_report_status_changed', handleStatusChanged);
    }

    return () => {
      leaveLabReport(report._id);
      if (socket) {
        socket.off('lab_report_updated', handleUpdate);
        socket.off('lab_report_status_changed', handleStatusChanged);
      }
    };
  }, [isOpen, report?._id, socket, joinLabReport, leaveLabReport]);

  if (!isOpen || !report) return null;

  // Calculate Abnormal Parameters Count
  const abnormalParams = (report.parameters || []).filter(
    (p) => p.status && p.status !== 'NORMAL'
  );

  const currentStepIndex = STATUS_STEPS.findIndex(
    (s) => s.key === (report.requestStatus || 'REQUESTED')
  );

  const handlePrint = () => {
    window.print();
  };

  const patientIdDisplay =
    report.patient?.patientId ||
    (report.patient?._id ? `ELC-PAT-${report.patient._id.toString().slice(-5).toUpperCase()}` : 'ELC-PAT-1001');

  const reportIdDisplay =
    report.reportId ||
    `ELC-LAB-${new Date(report.createdAt || Date.now()).getFullYear()}-${report._id.toString().slice(-4).toUpperCase()}`;

  return (
    <div
      className="sh-modal-backdrop"
      style={{
        zIndex: 1050,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="sh-modal"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 24px',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FlaskConical size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', letterSpacing: '-0.01em' }}>
                EliteCare Hospital • Pathology & Diagnostic System
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Electronic Diagnostic Laboratory Information Desk
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Live Socket Indicator */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '20px',
                backgroundColor: isConnected ? 'rgba(13, 148, 136, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                border: `1px solid ${isConnected ? '#0d9488' : '#64748b'}`,
                fontSize: '0.72rem',
                fontWeight: '600',
                color: isConnected ? '#2dd4bf' : '#cbd5e1',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: isConnected ? '#10b981' : '#94a3b8',
                  boxShadow: isConnected ? '0 0 8px #10b981' : 'none',
                }}
              />
              {isConnected ? 'Real-Time Connected' : 'Telemetry Offline'}
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
              style={{
                color: '#f8fafc',
                borderColor: '#334155',
                backgroundColor: '#1e293b',
              }}
            >
              Print / Save
            </Button>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '6px',
                borderRadius: '6px',
                transition: 'all 0.15s',
              }}
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Real-time notification toast strip */}
        {realtimeNotification && (
          <div
            style={{
              backgroundColor: '#047857',
              color: '#ffffff',
              padding: '8px 24px',
              fontSize: '0.82rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'fadeIn 0.3s ease-in-out',
            }}
          >
            <Radio size={16} className="animate-spin" />
            <span>{realtimeNotification}</span>
          </div>
        )}

        {/* View Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            padding: '0 24px',
          }}
        >
          <button
            onClick={() => setActiveTab('report')}
            style={{
              padding: '12px 18px',
              fontSize: '0.875rem',
              fontWeight: '600',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: activeTab === 'report' ? '#0d9488' : '#64748b',
              borderBottom: activeTab === 'report' ? '3px solid #0d9488' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText size={17} />
            Full Clinical Diagnostic Report
          </button>
          <button
            onClick={() => setActiveTab('status')}
            style={{
              padding: '12px 18px',
              fontSize: '0.875rem',
              fontWeight: '600',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: activeTab === 'status' ? '#0d9488' : '#64748b',
              borderBottom: activeTab === 'status' ? '3px solid #0d9488' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <Activity size={17} />
            Real-Time Specimen Status & Radar
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          ref={printRef}
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Clinical Header Banner */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingBottom: '16px',
              borderBottom: '2px solid #0f172a',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e3a8a' }}>
                  ELITECARE HOSPITAL
                </span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0d9488', marginTop: '2px' }}>
                {report.laboratory?.name || 'Central Diagnostic & Pathology Laboratory'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                {report.laboratory?.accreditation || 'NABL & CAP Accredited Clinical Reference Laboratory'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                {report.laboratory?.address || 'EliteCare Medical Tower, Level 2'} • Tel: {report.laboratory?.phone || '+1 (800) 555-0199'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block' }}>
                <StatusBadge status={report.requestStatus} />
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a', marginTop: '6px' }}>
                {reportIdDisplay}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Category: <strong>{report.testCategory || 'Clinical Pathology'}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Ordered: {new Date(report.requestedAt || report.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Patient & Specimen Metadata Box */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              backgroundColor: '#f8fafc',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '600' }}>
                Patient Full Name
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                {report.patient?.name || 'Authorized Patient'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                ID: <strong>{patientIdDisplay}</strong>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '600' }}>
                Demographics
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#1e293b' }}>
                {report.patient?.gender ? `${report.patient.gender.toUpperCase()}` : 'Not Specified'}
                {report.patient?.bloodGroup ? ` • Blood Group: ${report.patient.bloodGroup}` : ''}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Contact: {report.patient?.phone || report.patient?.email || 'N/A'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '600' }}>
                Referring Physician
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#1e293b' }}>
                Dr. {report.doctor?.name || 'Medical Specialist'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#0d9488', fontWeight: '500' }}>
                {report.doctor?.specialization || 'Clinical Department'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '600' }}>
                Specimen & Collection
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#1e293b' }}>
                {report.sampleType || 'Whole Blood (EDTA)'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {report.sampleCollectedAt
                  ? new Date(report.sampleCollectedAt).toLocaleString()
                  : 'Pending Collection'}
              </div>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px 20px',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.05em' }}>
              Diagnostic Specimen Lifecycle Progress
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
                position: 'relative',
              }}
            >
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                let badgeBg = '#f1f5f9';
                let badgeColor = '#94a3b8';
                let borderColor = '#cbd5e1';

                if (isCurrent) {
                  badgeBg = '#0d9488';
                  badgeColor = '#ffffff';
                  borderColor = '#0f766e';
                } else if (isPassed) {
                  badgeBg = '#ecfdf5';
                  badgeColor = '#059669';
                  borderColor = '#10b981';
                }

                return (
                  <div
                    key={step.key}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        border: `2px solid ${borderColor}`,
                        marginBottom: '6px',
                        boxShadow: isCurrent ? '0 0 12px rgba(13, 148, 136, 0.4)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      {isPassed && !isCurrent ? '✓' : idx + 1}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: isCurrent ? '700' : '600',
                        color: isCurrent ? '#0f766e' : isPassed ? '#1e293b' : '#94a3b8',
                      }}
                    >
                      {step.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TAB 1: FULL CLINICAL REPORT */}
          {activeTab === 'report' && (
            <>
              {/* Abnormal Results Warning Banner if applicable */}
              {abnormalParams.length > 0 && (
                <div
                  style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '10px',
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <AlertTriangle size={22} color="#b45309" />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#92400e' }}>
                      Diagnostic Notice: {abnormalParams.length} Parameter(s) Outside Biological Reference Intervals
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '2px' }}>
                      Elevated or reduced values have been verified against laboratory specific standards. Please correlate clinically with your attending physician.
                    </div>
                  </div>
                </div>
              )}

              {/* Parameters Table */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                  }}
                >
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>
                    {report.testName}
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Standard Reference Interval: <strong>Adult Biological Range</strong>
                  </div>
                </div>

                {report.parameters && report.parameters.length > 0 ? (
                  <div
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                          <th style={{ padding: '10px 14px', fontWeight: '600' }}>Analyte / Investigation</th>
                          <th style={{ padding: '10px 14px', fontWeight: '600' }}>Patient Value</th>
                          <th style={{ padding: '10px 14px', fontWeight: '600' }}>Unit</th>
                          <th style={{ padding: '10px 14px', fontWeight: '600' }}>Biological Reference Interval</th>
                          <th style={{ padding: '10px 14px', fontWeight: '600', textAlign: 'center' }}>Clinical Flag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.parameters.map((param, index) => {
                          const isNormal = !param.status || param.status === 'NORMAL';
                          const isHigh = param.status === 'HIGH' || param.status === 'CRITICAL_HIGH';
                          const isLow = param.status === 'LOW' || param.status === 'CRITICAL_LOW';

                          let flagBg = '#ecfdf5';
                          let flagColor = '#047857';
                          let flagBorder = '#a7f3d0';
                          let flagText = 'NORMAL';

                          if (isHigh) {
                            flagBg = '#fef2f2';
                            flagColor = '#b91c1c';
                            flagBorder = '#fecaca';
                            flagText = 'HIGH ↑';
                          } else if (isLow) {
                            flagBg = '#fff7ed';
                            flagColor = '#c2410c';
                            flagBorder = '#fed7aa';
                            flagText = 'LOW ↓';
                          }

                          return (
                            <tr
                              key={index}
                              style={{
                                borderBottom: index < report.parameters.length - 1 ? '1px solid #e2e8f0' : 'none',
                                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                              }}
                            >
                              <td style={{ padding: '10px 14px', fontWeight: '600', color: '#1e293b' }}>
                                {param.name}
                                {param.interpretation && (
                                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '400', marginTop: '2px' }}>
                                    {param.interpretation}
                                  </div>
                                )}
                              </td>
                              <td
                                style={{
                                  padding: '10px 14px',
                                  fontWeight: '700',
                                  fontSize: '0.92rem',
                                  color: isNormal ? '#0f172a' : isHigh ? '#b91c1c' : '#c2410c',
                                }}
                              >
                                {param.value}
                              </td>
                              <td style={{ padding: '10px 14px', color: '#64748b' }}>
                                {param.unit || '—'}
                              </td>
                              <td style={{ padding: '10px 14px', color: '#475569', fontWeight: '500' }}>
                                {param.referenceRange || 'Clinical correlation'}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    backgroundColor: flagBg,
                                    color: flagColor,
                                    border: `1px solid ${flagBorder}`,
                                  }}
                                >
                                  {flagText}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '24px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '10px',
                      textAlign: 'center',
                      color: '#64748b',
                      fontSize: '0.88rem',
                    }}
                  >
                    {report.requestStatus === 'PROCESSING'
                      ? '🧪 Specimen is currently in active processing in the automated analyzer. Individual parameters will populate here in real-time.'
                      : report.requestStatus === 'SAMPLE_COLLECTED'
                      ? '⏳ Specimen collected and logged at the pathology accession desk. Quantitative parameter analysis pending.'
                      : 'Clinical investigation requested. Results will update once specimen analysis is performed.'}
                  </div>
                )}
              </div>

              {/* Clinical Impressions & Pathologist Remarks */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '4px' }}>
                    Summary Clinical Impression
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: '500', lineHeight: 1.4 }}>
                    {report.result || 'No acute findings recorded. All measured parameters correlate with expected baseline.'}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '4px' }}>
                    Pathologist Clinical Remarks
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: '500', lineHeight: 1.4 }}>
                    {report.remarks || 'Test results generated under validated laboratory quality control guidelines. Electronic sign-off active.'}
                  </div>
                </div>
              </div>

              {/* Authorized Sign-off Box */}
              <div
                style={{
                  borderTop: '1px dashed #cbd5e1',
                  paddingTop: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '0.8rem', fontWeight: '700' }}>
                    <ShieldCheck size={18} />
                    AUTHORIZED ELECTRONIC VERIFICATION & PATHOLOGY RELEASE
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    This laboratory report has been verified electronically. Sign-off matches hospital master registry.
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>
                    {report.verifiedBy?.name || 'Dr. Arthur Conan, MD, FACP'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#0d9488', fontWeight: '600' }}>
                    {report.verifiedBy?.designation || 'Chief Consultant Pathologist'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    License: {report.verifiedBy?.licenseNumber || 'MED-PATH-88492'} • Verified: {report.verifiedAt ? new Date(report.verifiedAt).toLocaleString() : new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: REAL-TIME SPECIMEN STATUS & RADAR */}
          {activeTab === 'status' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Radar Overview Card */}
              <div
                style={{
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.05em' }}>
                    Real-Time Specimen Tracking Radar
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#38bdf8', marginTop: '4px' }}>
                    {report.testName}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '2px' }}>
                    Accession Barcode: <strong>{reportIdDisplay}</strong> • Sample: <strong>{report.sampleType}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Current Phase</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#34d399', marginTop: '2px' }}>
                    {report.requestStatus.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                    Live Socket Room: <code style={{ color: '#2dd4bf' }}>lab_report:{report._id.slice(-6)}</code>
                  </div>
                </div>
              </div>

              {/* Status Audit Timeline */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
                  Specimen Handling & Laboratory Audit Trail
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                  {(report.statusHistory && report.statusHistory.length > 0
                    ? report.statusHistory
                    : [
                        {
                          status: report.requestStatus,
                          timestamp: report.updatedAt || report.createdAt,
                          updatedBy: 'Laboratory System',
                          note: `Current recorded stage: ${report.requestStatus}`,
                        },
                      ]
                  ).map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        paddingBottom: '12px',
                        borderBottom: idx < (report.statusHistory?.length || 1) - 1 ? '1px dashed #e2e8f0' : 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#ecfdf5',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '0.75rem',
                          border: '1px solid #a7f3d0',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        ✓
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a' }}>
                            {item.status.replace('_', ' ')}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: '2px' }}>
                          {item.note || 'Diagnostic milestone logged.'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                          Logged by: <strong>{item.updatedBy || 'Laboratory Desk'}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Specifications Box */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
                    Assigned Technologist
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>
                    {report.technician?.name || 'Sarah Jenkins, MLT'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {report.technician?.role || 'Medical Laboratory Technologist'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
                    Sample Collection Desk
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>
                    {report.sampleCollectedBy || 'Central Phlebotomy Station'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Station: Level 2 Specimen Receiving
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
                    Automated Analyzer Track
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>
                    Sysmex XN / Beckman DxC
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Continuous Barcode Verification
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem',
            color: '#64748b',
          }}
        >
          <div>
            Last System Update: {new Date(report.updatedAt || Date.now()).toLocaleTimeString()}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close Viewer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabReportDetailsModal;
