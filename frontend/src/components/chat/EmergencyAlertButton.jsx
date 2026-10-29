import React, { useState } from 'react';
import { AlertOctagon, AlertTriangle, ShieldAlert, PhoneCall, Loader2, X } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import Modal from '../common/Modal';
import Button from '../common/Button';

export const MEDICAL_DISCLAIMER =
  'For life-threatening emergencies, do not wait for a chat response. Contact local emergency services or seek immediate medical attention.';

const EmergencyAlertButton = ({
  doctorId = null,
  conversationId = null,
  onAlertTriggered,
  size = 'md',
  className = '',
}) => {
  const { sendEmergencyAlert, isConnected } = useSocket();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [priority, setPriority] = useState('CRITICAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a brief description of the medical emergency.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const alert = await sendEmergencyAlert({
        doctorId,
        conversationId,
        description: description.trim(),
        symptoms: symptoms.trim(),
        priority,
      });

      setSuccessMsg('Emergency alert transmitted to hospital duty team.');
      if (onAlertTriggered) {
        onAlertTriggered(alert);
      }
      setTimeout(() => {
        setIsModalOpen(false);
        setDescription('');
        setSymptoms('');
        setSuccessMsg('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to transmit emergency alert. Please call emergency services.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`emergency-alert-trigger-btn ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: size === 'sm' ? '6px 12px' : '10px 18px',
          borderRadius: '8px',
          backgroundColor: '#dc2626',
          color: '#ffffff',
          fontWeight: '700',
          fontSize: size === 'sm' ? '0.8rem' : '0.9rem',
          border: '1.5px solid #b91c1c',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
          transition: 'all 0.2s ease',
          letterSpacing: '0.02em',
        }}
        title="Trigger Immediate Hospital Emergency Alert"
      >
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            display: 'inline-block',
            boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.5)',
            animation: 'pulse 1.2s infinite',
          }}
        />
        <AlertOctagon size={18} strokeWidth={2.5} />
        <span>EMERGENCY ALERT</span>
      </button>

      {/* Confirmation & Dispatch Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => !loading && setIsModalOpen(false)}
          title="Trigger Clinical Emergency Alert"
          maxWidth="560px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Critical Medical Disclaimer Banner */}
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1.5px solid #ef4444',
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <AlertTriangle size={24} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: '800', color: '#991b1b', fontSize: '0.9rem' }}>
                  LIFE-THREATENING EMERGENCY NOTICE
                </div>
                <p style={{ fontSize: '0.825rem', color: '#b91c1c', marginTop: '4px', lineHeight: 1.45 }}>
                  {MEDICAL_DISCLAIMER}
                </p>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '700', color: '#dc2626' }}>
                  <PhoneCall size={14} /> National Emergency Dispatch: 911 / 112 / 108
                </div>
              </div>
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #f87171',
                  color: '#991b1b',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #34d399',
                  color: '#065f46',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                }}
              >
                ✓ {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--gray-700)' }}>
                  Emergency Description / Reason <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Sudden severe chest pain, shortness of breath, heavy dizziness..."
                  rows={3}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1.5px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-input, #ffffff)',
                    color: 'var(--gray-900)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--gray-700)' }}>
                  Specific Symptoms (Optional)
                </label>
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Diaphoresis, numbness in left arm, rapid heart rate"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1.5px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-input, #ffffff)',
                    color: 'var(--gray-900)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--gray-700)' }}>
                  Triage Priority Level
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { value: 'CRITICAL', label: 'Critical / Red', color: '#dc2626' },
                    { value: 'HIGH', label: 'High / Orange', color: '#ea580c' },
                    { value: 'MEDIUM', label: 'Medium / Yellow', color: '#ca8a04' },
                  ].map((lvl) => (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => setPriority(lvl.value)}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: priority === lvl.value ? `2px solid ${lvl.color}` : '1px solid var(--border-subtle)',
                        backgroundColor: priority === lvl.value ? `${lvl.color}15` : 'var(--bg-card, #ffffff)',
                        color: priority === lvl.value ? lvl.color : 'var(--gray-700)',
                        fontWeight: priority === lvl.value ? '700' : '500',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Transmitting Alert...</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={18} />
                      <span>Confirm & Send Alert</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </>
  );
};

export default EmergencyAlertButton;
