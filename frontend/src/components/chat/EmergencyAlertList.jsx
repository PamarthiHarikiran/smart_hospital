import React, { useState } from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  Clock,
  CheckCircle2,
  User,
  Phone,
  FileText,
  Loader2,
  Filter,
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';

const EmergencyAlertList = ({
  alerts = [],
  loading = false,
  userRole = 'DOCTOR',
  onAcknowledge,
  onResolve,
  selectedStatus = 'ALL',
  onStatusChange,
}) => {
  const isStaff = userRole === 'DOCTOR' || userRole === 'ADMIN';

  // Action Modal State
  const [activeAlert, setActiveAlert] = useState(null);
  const [actionType, setActionType] = useState(''); // 'ACKNOWLEDGE' | 'RESOLVE'
  const [actionNote, setActionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '999px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              fontWeight: '700',
              fontSize: '0.72rem',
              border: '1px solid #f87171',
            }}
          >
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '999px',
              backgroundColor: '#ffedd5',
              color: '#9a3412',
              fontWeight: '700',
              fontSize: '0.72rem',
              border: '1px solid #fb923c',
            }}
          >
            HIGH
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '999px',
              backgroundColor: '#fef9c3',
              color: '#854d0e',
              fontWeight: '600',
              fontSize: '0.72rem',
              border: '1px solid #facc15',
            }}
          >
            MEDIUM
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              fontWeight: '700',
              fontSize: '0.75rem',
              border: '1.5px solid #ef4444',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#dc2626',
                animation: 'pulse 1.2s infinite',
              }}
            />
            PENDING TRIAGE
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '999px',
              backgroundColor: '#fffbeb',
              color: '#b45309',
              fontWeight: '600',
              fontSize: '0.75rem',
              border: '1px solid #f59e0b',
            }}
          >
            <Clock size={13} />
            ACKNOWLEDGED
          </span>
        );
      case 'RESOLVED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '999px',
              backgroundColor: '#ecfdf5',
              color: '#047857',
              fontWeight: '600',
              fontSize: '0.75rem',
              border: '1px solid #10b981',
            }}
          >
            <CheckCircle2 size={13} />
            RESOLVED
          </span>
        );
      default:
        return null;
    }
  };

  const calculateElapsedTime = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m waiting`;
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m waiting`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const handleOpenActionModal = (alert, type) => {
    setActiveAlert(alert);
    setActionType(type);
    setActionNote('');
  };

  const handleExecuteAction = async () => {
    if (!activeAlert || !actionType) return;
    setActionLoading(true);

    try {
      if (actionType === 'ACKNOWLEDGE' && onAcknowledge) {
        await onAcknowledge(activeAlert._id, actionNote);
      } else if (actionType === 'RESOLVE' && onResolve) {
        await onResolve(activeAlert._id, actionNote);
      }
      setActiveAlert(null);
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const filterTabs = [
    { id: 'ALL', label: 'All Alerts' },
    { id: 'PENDING', label: 'Pending Response' },
    { id: 'ACKNOWLEDGED', label: 'In Progress' },
    { id: 'RESOLVED', label: 'Resolved' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Status Filter Segmented Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          paddingBottom: '8px',
          overflowX: 'auto',
        }}
      >
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onStatusChange && onStatusChange(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: selectedStatus === tab.id ? '700' : '500',
              backgroundColor: selectedStatus === tab.id ? 'var(--primary-600, #2563eb)' : 'transparent',
              color: selectedStatus === tab.id ? '#ffffff' : 'var(--gray-600)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts Grid / Cards */}
      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-500)' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          <span>Refreshing clinical emergency alert queue...</span>
        </div>
      ) : alerts.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            color: 'var(--gray-500)',
          }}
        >
          <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 10px' }} />
          <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--gray-800)' }}>
            No Emergency Alerts Matching Filter
          </h4>
          <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            All patient emergencies have been addressed or no active alerts are in this status.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.map((alt) => (
            <div
              key={alt._id}
              style={{
                backgroundColor: 'var(--bg-card, #ffffff)',
                borderRadius: '10px',
                border: alt.status === 'PENDING' ? '1.5px solid #ef4444' : '1px solid var(--border-subtle, #e2e8f0)',
                padding: '16px 20px',
                boxShadow: alt.status === 'PENDING' ? '0 4px 14px rgba(239, 68, 68, 0.15)' : 'var(--shadow-sm)',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {getStatusBadge(alt.status)}
                  {getPriorityBadge(alt.priority)}
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: alt.status === 'PENDING' ? '#dc2626' : 'var(--gray-500)' }}>
                    ⏱ {calculateElapsedTime(alt.createdAt)}
                  </span>
                </div>

                {/* Staff Actions */}
                {isStaff && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {alt.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleOpenActionModal(alt, 'ACKNOWLEDGE')}
                        style={{
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          fontWeight: '700',
                          fontSize: '0.8rem',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
                        }}
                      >
                        Acknowledge & Triage
                      </button>
                    )}

                    {alt.status === 'ACKNOWLEDGED' && (
                      <button
                        type="button"
                        onClick={() => handleOpenActionModal(alt, 'RESOLVE')}
                        style={{
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          fontWeight: '700',
                          fontSize: '0.8rem',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                        }}
                      >
                        Mark Case Resolved
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Patient and Description Content */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--gray-400)', textTransform: 'uppercase' }}>
                    Patient Identity
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--gray-900)', marginTop: '2px' }}>
                    {alt.patient?.name || 'Unknown Patient'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '2px' }}>
                    {alt.patient?.phone && <span>📞 {alt.patient.phone} &bull; </span>}
                    {alt.patient?.bloodGroup && <span>Blood: <strong>{alt.patient.bloodGroup}</strong> &bull; </span>}
                    <span>{alt.patient?.gender || 'Patient'}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--gray-400)', textTransform: 'uppercase' }}>
                    Emergency Description
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--gray-800)', marginTop: '2px' }}>
                    {alt.description}
                  </div>
                  {alt.symptoms && (
                    <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '2px', fontWeight: '500' }}>
                      Reported Symptoms: {alt.symptoms}
                    </div>
                  )}
                </div>
              </div>

              {/* Responder Audit Footer */}
              {(alt.acknowledgedBy || alt.resolvedBy) && (
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-subtle, #f1f5f9)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    fontSize: '0.78rem',
                    color: 'var(--gray-500)',
                  }}
                >
                  {alt.acknowledgedBy && (
                    <div>
                      <strong>Acknowledged by:</strong> {alt.acknowledgedBy.name} at{' '}
                      {new Date(alt.acknowledgedAt).toLocaleTimeString()}
                      {alt.acknowledgementNote && ` ("${alt.acknowledgementNote}")`}
                    </div>
                  )}

                  {alt.resolvedBy && (
                    <div>
                      <strong>Resolved by:</strong> {alt.resolvedBy.name} at{' '}
                      {new Date(alt.resolvedAt).toLocaleTimeString()}
                      {alt.resolutionNote && ` ("${alt.resolutionNote}")`}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Dialog Modal */}
      {activeAlert && (
        <Modal
          isOpen={!!activeAlert}
          onClose={() => !actionLoading && setActiveAlert(null)}
          title={actionType === 'ACKNOWLEDGE' ? 'Acknowledge Emergency Alert' : 'Mark Emergency Case as Resolved'}
          maxWidth="500px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--gray-700)' }}>
              {actionType === 'ACKNOWLEDGE'
                ? `You are confirming official clinical receipt of the emergency alert from patient ${activeAlert.patient?.name}. The patient and hospital duty team will be updated in real time.`
                : `You are documenting resolution of the emergency incident for patient ${activeAlert.patient?.name}.`}
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '6px' }}>
                Clinical Note / Action Taken (Optional)
              </label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder={
                  actionType === 'ACKNOWLEDGE'
                    ? 'e.g. Dr. Sarah Jenkins acknowledged; dispatched ER team; contacting patient.'
                    : 'e.g. Patient stabilized in triage; medications administered; vital signs normal.'
                }
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1.5px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-input, #ffffff)',
                  color: 'var(--gray-900)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setActiveAlert(null)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={actionLoading}
                style={{
                  backgroundColor: actionType === 'ACKNOWLEDGE' ? '#dc2626' : '#059669',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {actionLoading && <Loader2 size={16} className="animate-spin" />}
                <span>{actionType === 'ACKNOWLEDGE' ? 'Confirm Acknowledge' : 'Confirm Resolved'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EmergencyAlertList;
