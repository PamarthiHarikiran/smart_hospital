import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  Stethoscope,
  HeartHandshake,
  ShieldAlert,
  UserCheck,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  FlaskConical,
  Pill,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ErrorMessage from '../../components/common/ErrorMessage';
import Modal from '../../components/common/Modal';
import DoctorPortal from '../../components/auth/DoctorPortal';
import UnifiedDoctorAuth from '../../components/auth/UnifiedDoctorAuth';
import PatientAuthModal from '../../components/auth/PatientAuthModal';
import { validateEmail } from '../../utils/validation';

const STAFF_DEMO_ACCOUNTS = [
  {
    role: 'ADMIN',
    label: 'Chief Medical Administrator',
    email: 'admin.elitecare@gmail.com',
    desc: 'Executive governance, admissions & analytics',
    badgeBg: '#1e3a8a',
    icon: Building2,
  },
  {
    role: 'LAB',
    label: 'Clinical Laboratory Analyst',
    email: 'lab.elitecare@gmail.com',
    desc: 'Pathology testing & diagnostic reports',
    badgeBg: '#7c3aed',
    icon: FlaskConical,
  },
  {
    role: 'PHARMACY',
    label: 'Dispensary Pharmacist',
    email: 'pharmacy.elitecare@gmail.com',
    desc: 'Formulary & prescription fulfillment',
    badgeBg: '#d97706',
    icon: Pill,
  },
];

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Active portal tab: 'doctor' | 'patient' | 'staff'
  const [activeTab, setActiveTab] = useState('doctor');

  // Staff Login State
  const [staffEmail, setStaffEmail] = useState('admin.elitecare@gmail.com');
  const [staffPassword, setStaffPassword] = useState('Password123!');
  const [staffError, setStaffError] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);

  // Standalone Modal States
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  // Parse URL query parameter for tab selection (e.g. ?portal=patient or ?portal=doctor)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const portal = params.get('portal');
    if (portal === 'patient') setActiveTab('patient');
    else if (portal === 'doctor') setActiveTab('doctor');
    else if (portal === 'staff') setActiveTab('staff');
  }, [location.search]);

  // Handle Staff Login Submit
  const handleStaffLogin = async (e) => {
    e?.preventDefault();
    if (!staffEmail || !staffPassword) {
      setStaffError('Please enter both email and password');
      return;
    }

    const emailError = validateEmail(staffEmail);
    if (emailError) {
      setStaffError(emailError);
      return;
    }

    setStaffError('');
    setStaffLoading(true);

    try {
      const res = await login(staffEmail, staffPassword);
      setStaffLoading(false);

      if (res.success && res.user) {
        const role = res.user.role;
        const dashboards = {
          ADMIN: '/admin/dashboard',
          LAB: '/lab/dashboard',
          PHARMACY: '/pharmacy/dashboard',
          DOCTOR: '/doctor/dashboard',
          PATIENT: '/patient/dashboard',
        };
        navigate(dashboards[role] || '/admin/dashboard');
      } else {
        setStaffError(res.message || 'Invalid credentials. Please verify your staff email.');
      }
    } catch (err) {
      setStaffLoading(false);
      setStaffError(err.message || 'Network error during staff authentication');
    }
  };

  const handleSelectStaffDemo = (email) => {
    setStaffEmail(email);
    setStaffPassword('Password123!');
    setStaffError('');
  };

  return (
    <div className="medical-tech-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      <div style={{ width: '100%', maxWidth: '640px', position: 'relative' }}>
        {/* Hospital Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          {/* Status Indicator Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              color: '#bfdbfe',
              fontSize: '0.785rem',
              fontWeight: '600',
              marginBottom: '16px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'inline-block',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            <span>24/7 Digital Healthcare & Clinical Information System</span>
          </div>

          {/* Prominent EliteCare Hospital Medical Emblem and Name */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            {/* Real Medical Emblem: Modern Medical Cross inside Stylized Rounded Badge */}
            <div
              style={{
                position: 'relative',
                width: '68px',
                height: '68px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 45%, #0D9488 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 30px -4px rgba(13, 148, 136, 0.45), 0 4px 12px rgba(30, 58, 138, 0.35)',
                border: '2px solid rgba(255, 255, 255, 0.25)',
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 44 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Modern stylized medical cross with rounded bevels */}
                <rect x="17" y="5" width="10" height="34" rx="4" fill="#ffffff" />
                <rect x="5" y="17" width="34" height="10" rx="4" fill="#ffffff" />
                {/* Inner Teal Cross Accent */}
                <rect x="19" y="8" width="6" height="28" rx="2" fill="#0D9488" fillOpacity="0.3" />
                <rect x="8" y="19" width="28" height="6" rx="2" fill="#0D9488" fillOpacity="0.3" />
                {/* Center Vital Pulse Wave in Vibrant Teal */}
                <path
                  d="M9 22h7l2.5-6 4 12 3.5-9 2.5 5h6.5"
                  stroke="#0D9488"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <h1
                style={{
                  fontSize: '2.25rem',
                  fontWeight: '800',
                  color: '#ffffff',
                  letterSpacing: '-0.025em',
                  lineHeight: '1.2',
                  margin: 0,
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
                }}
              >
                EliteCare Hospital
              </h1>
              <p
                style={{
                  fontSize: '0.925rem',
                  color: '#93c5fd',
                  marginTop: '6px',
                  fontWeight: '500',
                  letterSpacing: '0.01em',
                }}
              >
                Unified Multi-Portal Clinical & Patient Information System
              </p>
            </div>
          </div>

          {/* Hospital Features Highlights Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              marginTop: '12px',
              flexWrap: 'wrap',
              fontSize: '0.785rem',
              color: '#e2e8f0',
              fontWeight: '600',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#67e8f9' }}>
              ✓ Multi-Specialty Hospital
            </span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fde047' }}>
              ⚡ Real-time Inpatient & ICU
            </span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#a7f3d0' }}>
              ✨ Paperless EMR & Digital Rx
            </span>
          </div>
        </div>

        {/* Main Glassmorphic Auth Card */}
        <div className="auth-glass-container" style={{ padding: '32px 28px' }}>
          {/* Top Portal Navigation Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              backgroundColor: '#f1f5f9',
              padding: '4px',
              borderRadius: '14px',
              marginBottom: '24px',
              border: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('doctor')}
              style={{
                padding: '10px 8px',
                borderRadius: '10px',
                fontSize: '0.825rem',
                fontWeight: activeTab === 'doctor' ? '700' : '500',
                color: activeTab === 'doctor' ? '#0f766e' : '#64748b',
                backgroundColor: activeTab === 'doctor' ? '#ffffff' : 'transparent',
                boxShadow: activeTab === 'doctor' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <Stethoscope size={16} color={activeTab === 'doctor' ? '#0d9488' : '#94a3b8'} />
              <span>Doctor Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('patient')}
              style={{
                padding: '10px 8px',
                borderRadius: '10px',
                fontSize: '0.825rem',
                fontWeight: activeTab === 'patient' ? '700' : '500',
                color: activeTab === 'patient' ? '#1e40af' : '#64748b',
                backgroundColor: activeTab === 'patient' ? '#ffffff' : 'transparent',
                boxShadow: activeTab === 'patient' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <HeartHandshake size={16} color={activeTab === 'patient' ? '#2563eb' : '#94a3b8'} />
              <span>Patient Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              style={{
                padding: '10px 8px',
                borderRadius: '10px',
                fontSize: '0.825rem',
                fontWeight: activeTab === 'staff' ? '700' : '500',
                color: activeTab === 'staff' ? '#334155' : '#64748b',
                backgroundColor: activeTab === 'staff' ? '#ffffff' : 'transparent',
                boxShadow: activeTab === 'staff' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <Building2 size={16} color={activeTab === 'staff' ? '#1e3a8a' : '#94a3b8'} />
              <span>Staff & Admin</span>
            </button>
          </div>

          {/* TAB 1: ELITECARE DOCTOR CLINICAL PORTAL */}
          {activeTab === 'doctor' && (
            <DoctorPortal onLoginSuccess={(user) => navigate('/doctor/dashboard')} />
          )}

          {/* TAB 2: DEDICATED PATIENT AUTH & REGISTRATION MODULE */}
          {activeTab === 'patient' && (
            <PatientAuthModal
              initialMode="signin"
              onSuccess={(user) => navigate('/patient/dashboard')}
            />
          )}

          {/* TAB 3: HOSPITAL STAFF & ADMINISTRATION PORTAL */}
          {activeTab === 'staff' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#1e3a8a',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px',
                    boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)',
                  }}
                >
                  <Building2 size={26} />
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                  Hospital Administration & Staff
                </h2>
                <p style={{ fontSize: '0.825rem', color: 'var(--gray-500)', marginTop: '4px' }}>
                  Secure terminal for executive administration, pathology lab, and central dispensary
                </p>
              </div>

              {staffError && <ErrorMessage message={staffError} />}

              {/* Quick Staff Credential Selectors */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--gray-700)', display: 'block', marginBottom: '8px' }}>
                  Select Staff Persona:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {STAFF_DEMO_ACCOUNTS.map((staff) => {
                    const isSelected = staffEmail === staff.email;
                    const IconComponent = staff.icon;
                    return (
                      <button
                        key={staff.email}
                        type="button"
                        onClick={() => handleSelectStaffDemo(staff.email)}
                        className={`doctor-select-card ${isSelected ? 'active' : ''}`}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #1e3a8a' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          boxShadow: isSelected ? '0 2px 6px rgba(30, 58, 138, 0.15)' : 'none',
                        }}
                      >
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            backgroundColor: staff.badgeBg,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <IconComponent size={20} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: isSelected ? '#1e3a8a' : 'var(--gray-900)' }}>
                              {staff.label}
                            </span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: '700',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: isSelected ? '#1e3a8a' : '#f1f5f9',
                                color: isSelected ? '#ffffff' : '#475569',
                              }}
                            >
                              {staff.role}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '2px' }}>{staff.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Staff Form */}
              <form onSubmit={handleStaffLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Input
                  label="Staff Corporate Email"
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="admin.elitecare@gmail.com"
                  icon={Mail}
                  required
                />

                <Input
                  label="Authorization Password"
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={Lock}
                  required
                />

                {/* Strong Staff & Admin Sign-In Button */}
                <button
                  type="submit"
                  disabled={staffLoading}
                  className="strong-btn strong-btn-staff"
                  style={{ marginTop: '4px' }}
                >
                  {staffLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Authenticating Staff Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Building2 size={18} />
                      <span>Authenticate Staff & Admin Session</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Launcher Utility Pills for Quick Access */}
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => setShowPatientModal(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: '500',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <HeartHandshake size={15} color="#60a5fa" />
            <span>Open Dedicated Patient Modal</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDoctorModal(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: '500',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Stethoscope size={15} color="#2dd4bf" />
            <span>Open Unified Doctor Modal</span>
          </button>
        </div>

        {/* Dedicated Standalone Patient Modal */}
        {showPatientModal && (
          <Modal
            isOpen={showPatientModal}
            onClose={() => setShowPatientModal(false)}
            title="Patient Portal Access"
            size="md"
          >
            <PatientAuthModal
              isModal={true}
              onClose={() => setShowPatientModal(false)}
              onSuccess={(user) => {
                setShowPatientModal(false);
                navigate('/patient/dashboard');
              }}
            />
          </Modal>
        )}

        {/* Standalone Doctor Clinical Portal Modal */}
        {showDoctorModal && (
          <Modal
            isOpen={showDoctorModal}
            onClose={() => setShowDoctorModal(false)}
            title="EliteCare Doctor Clinical Portal"
            size="md"
          >
            <DoctorPortal
              isModal={true}
              onLoginSuccess={(user) => {
                setShowDoctorModal(false);
                navigate('/doctor/dashboard');
              }}
            />
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Login;
