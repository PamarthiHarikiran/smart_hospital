import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

const EmergencyAlertStatus = ({ alert, onAcknowledge, onResolve, userRole = 'PATIENT' }) => {
  if (!alert) return null;

  const isStaff = userRole === 'DOCTOR' || userRole === 'ADMIN';

  const getStatusBadge = () => {
    switch (alert.status) {
      case 'PENDING':
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#fef2f2',
              border: '1.5px solid #f87171',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)',
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#dc2626',
                display: 'inline-block',
                boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.3)',
                animation: 'pulse 1.5s infinite',
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={16} /> EMERGENCY ALERT PENDING CLINICAL ACKNOWLEDGEMENT
              </div>
              <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '2px' }}>
                {alert.description || 'Assistance requested'} &bull; Priority: <strong>{alert.priority}</strong>
              </div>
            </div>
            {isStaff && onAcknowledge && (
              <button
                type="button"
                onClick={() => onAcknowledge(alert._id)}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '0.8rem',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
                }}
              >
                Acknowledge Alert
              </button>
            )}
          </div>
        );

      case 'ACKNOWLEDGED':
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#fffbeb',
              border: '1.5px solid #fbbf24',
              color: '#92400e',
              padding: '10px 14px',
              borderRadius: '8px',
            }}
          >
            <Clock size={18} color="#d97706" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>
                ALERT ACKNOWLEDGED &bull; Response In Progress
              </div>
              <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '2px' }}>
                {alert.acknowledgementNote ||
                  `Acknowledged by clinical staff at ${new Date(alert.acknowledgedAt || alert.updatedAt).toLocaleTimeString()}`}
              </div>
            </div>
            {isStaff && onResolve && (
              <button
                type="button"
                onClick={() => onResolve(alert._id)}
                style={{
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '0.8rem',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                }}
              >
                Mark Resolved
              </button>
            )}
          </div>
        );

      case 'RESOLVED':
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ecfdf5',
              border: '1.5px solid #34d399',
              color: '#065f46',
              padding: '10px 14px',
              borderRadius: '8px',
            }}
          >
            <CheckCircle2 size={18} color="#059669" />
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>
                Emergency Alert Case Resolved
              </div>
              <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '2px' }}>
                {alert.resolutionNote ||
                  `Documented and resolved at ${new Date(alert.resolvedAt || alert.updatedAt).toLocaleTimeString()}`}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div style={{ marginBottom: '14px' }}>{getStatusBadge()}</div>;
};

export default EmergencyAlertStatus;
