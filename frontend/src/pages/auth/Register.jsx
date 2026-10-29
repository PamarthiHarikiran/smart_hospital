import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Stethoscope } from 'lucide-react';
import PatientAuthModal from '../../components/auth/PatientAuthModal';

const Register = () => {
  const navigate = useNavigate();

  return (
    <div
      className="medical-tech-bg"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '640px', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #1E3A8A 0%, #0D9488 100%)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(13, 148, 136, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 3h4v18h-4zM3 10h18v4H3z" fill="#ffffff" />
                <path d="M4 12h4l1.5-3 2.5 6 2-4 1.5 2.5H20" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: '1.9rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em' }}>
              EliteCare Hospital
            </span>
          </Link>
          <p style={{ fontSize: '0.9rem', color: '#93c5fd' }}>
            New Patient Onboarding & Clinical Registration Portal
          </p>
        </div>

        {/* Card */}
        <div className="auth-glass-container" style={{ padding: '32px 28px' }}>
          <PatientAuthModal
            initialMode="register"
            onSuccess={(user) => navigate('/patient/dashboard')}
          />
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link
            to="/login?portal=doctor"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#93c5fd',
              fontSize: '0.85rem',
              fontWeight: '500',
              textDecoration: 'none',
            }}
          >
            <Stethoscope size={15} />
            <span>Are you a hospital doctor? Switch to Unified Doctor Portal →</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
