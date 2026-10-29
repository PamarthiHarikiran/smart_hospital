import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { chatService } from '../../services/chatService';
import EmergencyAlertList from '../../components/chat/EmergencyAlertList';
import { MEDICAL_DISCLAIMER } from '../../components/chat/EmergencyAlertButton';
import { ShieldAlert, AlertOctagon, Clock, CheckCircle2, RefreshCw } from 'lucide-react';

const AdminEmergencyAlerts = () => {
  const { user } = useAuth();
  const { socket, acknowledgeAlert, resolveAlert } = useSocket();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (selectedPriority !== 'ALL') params.priority = selectedPriority;

      const res = await chatService.getEmergencyAlerts(params);
      if (res.success) {
        setAlerts(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load emergency alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedPriority]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Real-time socket listener
  useEffect(() => {
    if (!socket) return;

    const handleNewAlert = (newAlert) => {
      setAlerts((prev) => [newAlert, ...prev]);
    };

    const handleUpdatedAlert = (updatedAlert) => {
      setAlerts((prev) =>
        prev.map((a) => (a._id === updatedAlert._id ? updatedAlert : a))
      );
    };

    socket.on('emergency_alert_received', handleNewAlert);
    socket.on('emergency_alert_updated', handleUpdatedAlert);

    return () => {
      socket.off('emergency_alert_received', handleNewAlert);
      socket.off('emergency_alert_updated', handleUpdatedAlert);
    };
  }, [socket]);

  const handleAcknowledge = async (alertId, note) => {
    await acknowledgeAlert(alertId, note);
    loadAlerts();
  };

  const handleResolve = async (alertId, note) => {
    await resolveAlert(alertId, note);
    loadAlerts();
  };

  // Metrics
  const pendingCount = alerts.filter((a) => a.status === 'PENDING').length;
  const acknowledgedCount = alerts.filter((a) => a.status === 'ACKNOWLEDGED').length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--gray-900, #0f172a)' }}>
            Hospital Emergency Alert Command Desk
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--gray-500, #64748b)', marginTop: '4px' }}>
            Real-time monitoring, triage assignment, and clinical audit tracking for hospital emergency calls.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAlerts}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-subtle, #cbd5e1)',
            color: 'var(--gray-700, #334155)',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Pending Critical */}
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1.5px solid #f87171',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#991b1b', textTransform: 'uppercase' }}>
              Pending Response
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#dc2626', marginTop: '4px' }}>
              {pendingCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '2px' }}>
              Requires immediate clinical triage
            </div>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626',
            }}
          >
            <ShieldAlert size={22} />
          </div>
        </div>

        {/* Acknowledged / In Progress */}
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#92400e', textTransform: 'uppercase' }}>
              In Response / Triage
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>
              {acknowledgedCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '2px' }}>
              Care team dispatched / in progress
            </div>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
            }}
          >
            <Clock size={22} />
          </div>
        </div>

        {/* Resolved */}
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '1.5px solid #a7f3d0',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#065f46', textTransform: 'uppercase' }}>
              Resolved Cases
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
              {resolvedCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '2px' }}>
              Successfully closed and audited
            </div>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#d1fae5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
            }}
          >
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Main Alert List Component */}
      <div
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          padding: '24px',
        }}
      >
        <EmergencyAlertList
          alerts={alerts}
          loading={loading}
          userRole="ADMIN"
          onAcknowledge={handleAcknowledge}
          onResolve={handleResolve}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />
      </div>
    </div>
  );
};

export default AdminEmergencyAlerts;
