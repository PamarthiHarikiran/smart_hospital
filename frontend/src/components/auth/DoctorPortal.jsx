import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Stethoscope,
  Mail,
  Lock,
  UserCheck,
  ShieldCheck,
  Award,
  Calendar,
  Building2,
  CheckCircle2,
  LogIn,
  UserPlus,
  Loader2,
  Briefcase,
  GraduationCap,
  DollarSign,
  Phone,
} from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import ErrorMessage from '../common/ErrorMessage';
import { isValidEmail, isValidPhone, validateEmail, validatePhone } from '../../utils/validation';

// Expanded 5 Verified EliteCare Hospital Physicians across diverse specializations
export const ELITECARE_DOCTORS = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Jenkins',
    email: 'doctor.sarah@gmail.com',
    specialization: 'Cardiology',
    department: 'Cardiology',
    qualification: 'MD, FACC - Harvard Medical',
    consultationFee: 120,
    experience: '12 Yrs',
    avatarBg: '#0f766e',
    initials: 'SJ',
  },
  {
    id: 'doc-2',
    name: 'Dr. Robert Chen',
    email: 'doctor.robert@gmail.com',
    specialization: 'General Medicine',
    department: 'General Medicine',
    qualification: 'MBBS, MD - Johns Hopkins',
    consultationFee: 80,
    experience: '9 Yrs',
    avatarBg: '#0284c7',
    initials: 'RC',
  },
  {
    id: 'doc-3',
    name: 'Dr. Emily Watson',
    email: 'doctor.emily@gmail.com',
    specialization: 'Neurology',
    department: 'Neurology',
    qualification: 'MD, FAAN - Stanford',
    consultationFee: 150,
    experience: '15 Yrs',
    avatarBg: '#7c3aed',
    initials: 'EW',
  },
  {
    id: 'doc-4',
    name: 'Dr. Rajesh Sharma',
    email: 'doctor.rajesh@gmail.com',
    specialization: 'Orthopedics',
    department: 'Orthopedics',
    qualification: 'MS (Ortho), M.Ch - Oxford',
    consultationFee: 130,
    experience: '14 Yrs',
    avatarBg: '#b45309',
    initials: 'RS',
  },
  {
    id: 'doc-5',
    name: 'Dr. Priya Nair',
    email: 'doctor.priya@gmail.com',
    specialization: 'Pediatrics',
    department: 'Pediatrics',
    qualification: 'MD (Pediatrics), FAAP - Columbia',
    consultationFee: 100,
    experience: '11 Yrs',
    avatarBg: '#be185d',
    initials: 'PN',
  },
];

const SPECIALIZATION_OPTIONS = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Dermatology',
  'General Medicine',
];

const DoctorPortal = ({ onLoginSuccess, isModal = false, initialMode = 'signin' }) => {
  // Mode state: 'signin' | 'register'
  const [mode, setMode] = useState(initialMode);

  // Sign In State
  const [selectedDoctorId, setSelectedDoctorId] = useState('doc-1');
  const [email, setEmail] = useState(ELITECARE_DOCTORS[0].email);
  const [password, setPassword] = useState('Password123!');

  // Registration State
  const [regData, setRegData] = useState({
    name: '',
    specialization: 'Cardiology',
    qualification: '',
    email: '',
    password: '',
    confirmPassword: '',
    experience: 5,
    consultationFee: 100,
    phone: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginDoctor, login, registerDoctor } = useAuth();
  const navigate = useNavigate();

  // 1-Click Quick-Select Physician fill handler
  const handleSelectDoctor = (doctor) => {
    setSelectedDoctorId(doctor.id);
    setEmail(doctor.email);
    setPassword('Password123!');
    setError('');
  };

  const handleCustomEmailChange = (newEmail) => {
    setEmail(newEmail);
    const matched = ELITECARE_DOCTORS.find((d) => d.email.toLowerCase() === newEmail.toLowerCase());
    if (matched) {
      setSelectedDoctorId(matched.id);
    } else {
      setSelectedDoctorId(null);
    }
  };

  // Sign In Submit Handler
  const handleSignInSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Please provide physician email and clinical password');
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Try loginDoctor first, fallback to login
      let res = await loginDoctor(email, password);
      if (!res.success) {
        res = await login(email, password);
      }
      setLoading(false);

      if (res.success && res.user) {
        if (res.user.role && res.user.role !== 'DOCTOR') {
          setError(
            `Authenticated as ${res.user.role}. This portal is restricted to clinical physicians only.`
          );
          return;
        }

        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        } else {
          navigate('/doctor/dashboard');
        }
      } else {
        setError(res.message || 'Invalid physician credentials. Please check your email and password.');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Network error occurred during physician authentication');
    }
  };

  // Registration Submit Handler
  const handleRegisterSubmit = async (e) => {
    e?.preventDefault();
    if (!regData.name || !regData.email || !regData.password || !regData.specialization || !regData.qualification) {
      setError('Please fill in Full Name, Specialization, Qualification, Email, and Password.');
      return;
    }

    const emailError = validateEmail(regData.email);
    if (emailError) {
      setError(emailError);
      return;
    }

    if (regData.phone && regData.phone.trim() !== '') {
      const phoneError = validatePhone(regData.phone, false);
      if (phoneError) {
        setError(phoneError);
        return;
      }
    }

    if (regData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        name: regData.name.startsWith('Dr.') ? regData.name : `Dr. ${regData.name}`,
        email: regData.email,
        password: regData.password,
        specialization: regData.specialization,
        qualification: regData.qualification,
        experience: Number(regData.experience) || 0,
        consultationFee: Number(regData.consultationFee) || 50,
        phone: regData.phone,
        role: 'DOCTOR',
      };

      const res = await registerDoctor(payload);
      setLoading(false);

      if (res.success && res.user) {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        } else {
          navigate('/doctor/dashboard');
        }
      } else {
        setError(res.message || 'Physician registration failed. Email might already be registered.');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Error occurred during physician registration');
    }
  };

  const currentSelectedDoctor = ELITECARE_DOCTORS.find((d) => d.id === selectedDoctorId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Info - Professional Navy & Teal Emblem */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%)',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px',
            boxShadow: '0 6px 16px rgba(13, 148, 136, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <Stethoscope size={28} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--gray-900)' }}>
          Doctor Clinical Portal
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: '4px' }}>
          Secure workstation terminal for attending physicians, surgeons & clinical consultants
        </p>
      </div>

      {/* Segmented Tab / Toggle: Sign In vs Register New Physician */}
      <div className="segmented-control" style={{ marginBottom: '4px' }}>
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            setError('');
          }}
          className={`segmented-btn ${mode === 'signin' ? 'active' : ''}`}
        >
          <LogIn size={16} />
          Sign In (Attending Physician)
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('register');
            setError('');
          }}
          className={`segmented-btn ${mode === 'register' ? 'active' : ''}`}
        >
          <UserPlus size={16} />
          Register New Physician
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* ==================================================
          MODE 1: PHYSICIAN SIGN IN
         ================================================== */}
      {mode === 'signin' && (
        <form onSubmit={handleSignInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Physician Registered Email"
            type="email"
            value={email}
            onChange={(e) => handleCustomEmailChange(e.target.value)}
            placeholder="doctor.name@gmail.com"
            icon={Mail}
            required
          />

          <Input
            label="Clinical Access Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={Lock}
            required
          />

          {/* Strong Doctor Sign-In Button */}
          <button
            type="submit"
            disabled={loading}
            className="strong-btn strong-btn-doctor"
            style={{ marginTop: '4px' }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Verifying Physician Credentials...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In to Doctor Clinical Workspace</span>
              </>
            )}
          </button>

          {/* Expanded 1-Click Quick-Select Physicians Bar (5 Specialists) */}
          <div
            style={{
              marginTop: '8px',
              padding: '14px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: 'var(--gray-700)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <UserCheck size={16} color="#0d9488" />
                Quick-Select Physicians (Password: Password123!)
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: '#0d9488',
                  fontWeight: '700',
                  backgroundColor: '#ccfbf1',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                5 Specialists Available
              </span>
            </div>

            {/* 5 Doctor Quick-Select Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))',
                gap: '8px',
              }}
            >
              {ELITECARE_DOCTORS.map((doc) => {
                const isSelected = selectedDoctorId === doc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleSelectDoctor(doc)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #0d9488' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#f0fdfa' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.18s ease',
                      boxShadow: isSelected ? '0 3px 8px rgba(13, 148, 136, 0.2)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? '#0d9488' : '#e2e8f0',
                          color: isSelected ? '#ffffff' : '#0f766e',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          flexShrink: 0,
                        }}
                      >
                        {doc.initials}
                      </div>
                      {isSelected && <CheckCircle2 size={14} color="#0d9488" />}
                    </div>

                    <div
                      style={{
                        fontWeight: '700',
                        fontSize: '0.76rem',
                        color: isSelected ? '#0f766e' : 'var(--gray-900)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {doc.name}
                    </div>

                    <div
                      style={{
                        fontSize: '0.675rem',
                        color: isSelected ? '#115e59' : '#64748b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: '500',
                      }}
                    >
                      {doc.specialization}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Doctor Profile Preview Card */}
          {currentSelectedDoctor && (
            <div
              style={{
                backgroundColor: '#f0fdfa',
                border: '1px solid #99f6e4',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: '#0f766e', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Award size={15} /> Active Doctor Profile
                </span>
                <span
                  style={{
                    backgroundColor: '#ccfbf1',
                    color: '#0f766e',
                    fontSize: '0.725rem',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  Fee: ${currentSelectedDoctor.consultationFee} • {currentSelectedDoctor.experience}
                </span>
              </div>
              <div style={{ color: '#134e4a', fontSize: '0.75rem' }}>
                {currentSelectedDoctor.name} — {currentSelectedDoctor.specialization} ({currentSelectedDoctor.qualification})
              </div>
            </div>
          )}
        </form>
      )}

      {/* ==================================================
          MODE 2: REGISTER NEW PHYSICIAN
         ================================================== */}
      {mode === 'register' && (
        <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#eff6ff',
              borderRadius: '10px',
              border: '1px solid #bfdbfe',
              fontSize: '0.8rem',
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ShieldCheck size={18} color="#2563eb" />
            <span>Join EliteCare Medical Staff — credentials will be activated immediately.</span>
          </div>

          {/* Full Name Field */}
          <Input
            label="Physician Full Name"
            type="text"
            value={regData.name}
            onChange={(e) => setRegData({ ...regData, name: e.target.value })}
            placeholder="Dr. Alexander Fleming"
            icon={Stethoscope}
            required
          />

          {/* Specialization & Qualification Row */}
          <div className="grid-2">
            <Select
              label="Clinical Specialization"
              value={regData.specialization}
              onChange={(e) => setRegData({ ...regData, specialization: e.target.value })}
              options={SPECIALIZATION_OPTIONS}
              required
            />

            <Input
              label="Medical Qualification"
              type="text"
              value={regData.qualification}
              onChange={(e) => setRegData({ ...regData, qualification: e.target.value })}
              placeholder="MBBS, MD, FACC"
              icon={GraduationCap}
              required
            />
          </div>

          {/* Email & Phone Row */}
          <div className="grid-2">
            <Input
              label="Professional Medical Email"
              type="email"
              value={regData.email}
              onChange={(e) => setRegData({ ...regData, email: e.target.value })}
              placeholder="dr.name@gmail.com"
              icon={Mail}
              required
            />

            <Input
              label="Contact Phone"
              type="text"
              value={regData.phone}
              onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
              placeholder="+1-555-0188"
              icon={Phone}
            />
          </div>

          {/* Experience & Consultation Fee Row */}
          <div className="grid-2">
            <Input
              label="Years of Experience"
              type="number"
              value={regData.experience}
              onChange={(e) => setRegData({ ...regData, experience: e.target.value })}
              placeholder="8"
              min="0"
              icon={Briefcase}
              required
            />

            <Input
              label="Consultation Fee ($)"
              type="number"
              value={regData.consultationFee}
              onChange={(e) => setRegData({ ...regData, consultationFee: e.target.value })}
              placeholder="100"
              min="0"
              icon={DollarSign}
              required
            />
          </div>

          {/* Password & Confirm Password Row */}
          <div className="grid-2">
            <Input
              label="Clinical Password"
              type="password"
              value={regData.password}
              onChange={(e) => setRegData({ ...regData, password: e.target.value })}
              placeholder="••••••••"
              icon={Lock}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={regData.confirmPassword}
              onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              icon={Lock}
              required
            />
          </div>

          {/* Strong Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="strong-btn strong-btn-doctor"
            style={{ marginTop: '4px' }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Registering Physician Credentials...</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Complete Physician Registration & Access Workspace</span>
              </>
            )}
          </button>

          {/* Switch Action Back to Sign In */}
          <div style={{ marginTop: '2px' }}>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
              }}
              className="strong-switch-action-btn"
            >
              <LogIn size={16} />
              <span>Already registered physician? Click here to Sign In</span>
            </button>
          </div>
        </form>
      )}

      {/* Security Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '0.75rem',
          color: 'var(--gray-500)',
          marginTop: '2px',
        }}
      >
        <ShieldCheck size={14} color="#0d9488" />
        <span>EliteCare Hospital 256-bit Encrypted Physician Clinical Gateway</span>
      </div>
    </div>
  );
};

export default DoctorPortal;
