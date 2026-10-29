import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { User, Phone, MapPin, Calendar, Heart, Shield, CheckCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ErrorMessage from '../../components/common/ErrorMessage';
import StatusBadge from '../../components/common/StatusBadge';
import { validateEmail, validatePhone } from '../../utils/validation';

const PatientProfile = () => {
  const { user, updateUserProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'MALE',
    bloodGroup: 'O+',
    dateOfBirth: '',
    address: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        gender: user.gender || 'MALE',
        bloodGroup: user.bloodGroup || 'O+',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const emailError = validateEmail(formData.email);
    if (emailError) {
      setError(emailError);
      return;
    }

    if (formData.phone && formData.phone.trim() !== '') {
      const phoneError = validatePhone(formData.phone, false);
      if (phoneError) {
        setError(phoneError);
        return;
      }
    }

    setLoading(true);

    try {
      const res = await authService.updateProfile(formData);
      if (res.success && res.data) {
        updateUserProfile(res.data);
        setSuccess('Profile details successfully updated!');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
          My Patient Profile
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
          Manage your personal medical information, contact coordinates, and blood group.
        </p>
      </div>

      <div className="sh-card">
        {success && (
          <div style={{ padding: '12px 16px', backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: 'var(--radius-sm)', border: '1px solid #a7f3d0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <CheckCircle size={18} /> {success}
          </div>
        )}

        {error && <ErrorMessage message={error} />}

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-100)',
              color: 'var(--primary-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '1.5rem',
            }}
          >
            {user?.name ? user.name[0] : 'U'}
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--gray-900)' }}>
              {user?.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <StatusBadge status={user?.role} />
              <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{user?.email}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              icon={User}
              required
            />

            <Input
              label="Email Address"
              name="email"
              value={formData.email}
              disabled
              helperText="Email cannot be changed directly"
            />
          </div>

          <div className="grid-3">
            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1-555-0100"
              icon={Phone}
            />

            <Select
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />

            <Select
              label="Blood Group"
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
            />
          </div>

          <div className="grid-2">
            <Input
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
            />

            <Input
              label="Home / Permanent Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Hospital Lane, City"
              icon={MapPin}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button type="submit" variant="primary" loading={loading}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientProfile;
