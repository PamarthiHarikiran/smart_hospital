import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  MapPin,
  HeartHandshake,
  LogIn,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import ErrorMessage from '../common/ErrorMessage';
import { isValidEmail, isValidPhone, validateEmail, validatePhone } from '../../utils/validation';

const DEMO_PATIENTS = [
  {
    name: 'John Doe',
    email: 'patient.john@gmail.com',
    details: 'Male, O+, 34 yrs',
    initials: 'JD',
  },
  {
    name: 'Mary Smith',
    email: 'patient.mary@gmail.com',
    details: 'Female, A+, 29 yrs',
    initials: 'MS',
  },
];

const PatientAuthModal = ({
  initialMode = 'signin', // 'signin' | 'register'
  onSuccess,
  isModal = false,
  onClose,
}) => {
  const [mode, setMode] = useState(initialMode); // 'signin' or 'register'

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('patient.john@gmail.com');
  const [signInPassword, setSignInPassword] = useState('Password123!');

  // Register State
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: 'MALE',
    bloodGroup: 'O+',
    dateOfBirth: '',
    address: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Handle Sign In Submit
  const handleSignInSubmit = async (e) => {
    e?.preventDefault();
    if (!signInEmail || !signInPassword) {
      setError('Please provide your patient email and password');
      return;
    }

    const emailError = validateEmail(signInEmail);
    if (emailError) {
      setError(emailError);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await login(signInEmail, signInPassword);
      setLoading(false);

      if (res.success && res.user) {
        if (onSuccess) {
          onSuccess(res.user);
        } else {
          navigate('/patient/dashboard');
        }
      } else {
        setError(res.message || 'Invalid patient email or password.');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e?.preventDefault();
    if (!regData.name || !regData.email || !regData.password) {
      setError('Full Name, Email, and Password are required to create a patient profile.');
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
        name: regData.name,
        email: regData.email,
        password: regData.password,
        phone: regData.phone,
        gender: regData.gender,
        bloodGroup: regData.bloodGroup,
        dateOfBirth: regData.dateOfBirth || undefined,
        address: regData.address,
        role: 'PATIENT',
      };

      const res = await register(payload);
      setLoading(false);

      if (res.success && res.user) {
        if (onSuccess) {
          onSuccess(res.user);
        } else {
          navigate('/patient/dashboard');
        }
      } else {
        setError(res.message || 'Registration failed. Email might already be registered.');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Error occurred during patient registration.');
    }
  };

  const handleSelectDemoPatient = (demoEmail) => {
    setSignInEmail(demoEmail);
    setSignInPassword('Password123!');
    setError('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Info */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
          }}
        >
          <HeartHandshake size={26} />
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--gray-900)' }}>
          Patient Care & Health Portal
        </h2>
        <p style={{ fontSize: '0.825rem', color: 'var(--gray-500)', marginTop: '4px' }}>
          Schedule doctor visits, access electronic prescriptions, and manage medical invoices
        </p>
      </div>

      {/* Styled Segmented Control Switch Buttons */}
      <div className="segmented-control">
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            setError('');
          }}
          className={`segmented-btn ${mode === 'signin' ? 'active' : ''}`}
        >
          <LogIn size={16} />
          Sign In (Registered Patient)
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
          Create Account (New Patient)
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* ==================================================
          MODE 1: PATIENT SIGN IN
         ================================================== */}
      {mode === 'signin' && (
        <form onSubmit={handleSignInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Patient Registered Email"
            type="email"
            value={signInEmail}
            onChange={(e) => setSignInEmail(e.target.value)}
            placeholder="patient.name@gmail.com"
            icon={Mail}
            required
          />

          <Input
            label="Account Password"
            type="password"
            value={signInPassword}
            onChange={(e) => setSignInPassword(e.target.value)}
            placeholder="••••••••"
            icon={Lock}
            required
          />

          {/* Strong Patient Sign-In Button */}
          <button
            type="submit"
            disabled={loading}
            className="strong-btn strong-btn-patient"
            style={{ marginTop: '4px' }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Signing in to Health Portal...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In to Patient Dashboard</span>
              </>
            )}
          </button>

          {/* Quick Demo Patient Selector - Consistent Cards */}
          <div
            style={{
              marginTop: '10px',
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
                <CheckCircle size={15} color="#2563eb" />
                Quick-Select Registered Patients (Password: Password123!)
              </span>
              <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: '600' }}>
                1-Click Fill
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {DEMO_PATIENTS.map((p) => {
                const isSelected = signInEmail === p.email;
                return (
                  <button
                    key={p.email}
                    type="button"
                    onClick={() => handleSelectDemoPatient(p.email)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                      fontSize: '0.75rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      boxShadow: isSelected ? '0 2px 6px rgba(37, 99, 235, 0.15)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontWeight: '700',
                          fontSize: '0.8rem',
                          color: isSelected ? '#1e40af' : 'var(--gray-900)',
                        }}
                      >
                        {p.name}
                      </span>
                      {isSelected && <CheckCircle2 size={13} color="#2563eb" />}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: isSelected ? '#1d4ed8' : 'var(--gray-500)', marginTop: '2px' }}>
                      {p.details}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clean Prominent Action Switch to Register */}
          <div style={{ marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className="strong-switch-action-btn"
            >
              <UserPlus size={16} />
              <span>New Patient? Register / Sign Up for Care</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      )}

      {/* ==================================================
          MODE 2: INLINE PATIENT REGISTRATION
         ================================================== */}
      {mode === 'register' && (
        <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="grid-2">
            <Input
              label="Full Legal Name"
              type="text"
              value={regData.name}
              onChange={(e) => setRegData({ ...regData, name: e.target.value })}
              placeholder="e.g. John Doe"
              icon={User}
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={regData.email}
              onChange={(e) => setRegData({ ...regData, email: e.target.value })}
              placeholder="patient.name@gmail.com"
              icon={Mail}
              required
            />
          </div>

          <div className="grid-2">
            <Input
              label="Password"
              type="password"
              value={regData.password}
              onChange={(e) => setRegData({ ...regData, password: e.target.value })}
              placeholder="Min 6 chars"
              icon={Lock}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={regData.confirmPassword}
              onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
              placeholder="Re-enter password"
              icon={Lock}
              required
            />
          </div>

          <div className="grid-3">
            <Input
              label="Phone Number"
              type="text"
              value={regData.phone}
              onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
              placeholder="+1-555-0199"
              icon={Phone}
            />

            <Select
              label="Gender"
              value={regData.gender}
              onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />

            <Select
              label="Blood Group"
              value={regData.bloodGroup}
              onChange={(e) => setRegData({ ...regData, bloodGroup: e.target.value })}
              options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
            />
          </div>

          <div className="grid-2">
            <Input
              label="Date of Birth"
              type="date"
              value={regData.dateOfBirth}
              onChange={(e) => setRegData({ ...regData, dateOfBirth: e.target.value })}
              icon={Calendar}
            />

            <Input
              label="Home / Street Address"
              type="text"
              value={regData.address}
              onChange={(e) => setRegData({ ...regData, address: e.target.value })}
              placeholder="123 Health Ave, City"
              icon={MapPin}
            />
          </div>

          {/* Strong Patient Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="strong-btn strong-btn-patient"
            style={{ marginTop: '4px' }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Creating Patient Profile...</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Complete Registration & Access Health Portal</span>
              </>
            )}
          </button>

          {/* Clean Prominent Action Switch to Sign In */}
          <div style={{ marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
              }}
              className="strong-switch-action-btn"
            >
              <LogIn size={16} />
              <span>Already registered? Click here to Sign In</span>
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
        <ShieldCheck size={14} color="#10b981" />
        <span>256-bit SSL Secure Health Records Portal</span>
      </div>
    </div>
  );
};

export default PatientAuthModal;
