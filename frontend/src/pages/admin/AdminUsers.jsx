import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { departmentService } from '../../services/departmentService';
import { authService } from '../../services/authService';
import { Users, Plus, Search, Edit3, Trash2, Shield, Stethoscope, Phone, Mail } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { validateEmail, validatePhone } from '../../utils/validation';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add / Edit User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DOCTOR',
    phone: '',
    gender: 'MALE',
    bloodGroup: 'O+',
    address: '',
    department: '',
    specialization: '',
    qualification: '',
    consultationFee: 80,
    status: 'ACTIVE',
  });

  // Delete Confirm Dialog
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [uRes, dRes] = await Promise.all([
        userService.getUsers({ role: roleFilter, search, page, limit: 10 }),
        departmentService.getDepartments({ status: 'ACTIVE' }),
      ]);
      if (uRes.success) {
        setUsers(uRes.data || []);
        setPagination(uRes.pagination);
      }
      if (dRes.success) {
        setDepartments(dRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter, search, page]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: 'Password123!',
      role: 'DOCTOR',
      phone: '',
      gender: 'MALE',
      bloodGroup: 'O+',
      address: '',
      department: departments[0]?._id || '',
      specialization: '',
      qualification: '',
      consultationFee: 80,
      status: 'ACTIVE',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
      gender: user.gender || 'MALE',
      bloodGroup: user.bloodGroup || 'O+',
      address: user.address || '',
      department: user.department?._id || user.department || '',
      specialization: user.specialization || '',
      qualification: user.qualification || '',
      consultationFee: user.consultationFee || 50,
      status: user.status || 'ACTIVE',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setFormError('Name and email are required');
      return;
    }

    const emailErr = validateEmail(formData.email);
    if (emailErr) {
      setFormError(emailErr);
      return;
    }

    if (formData.phone && formData.phone.trim() !== '') {
      const phoneErr = validatePhone(formData.phone);
      if (phoneErr) {
        setFormError(phoneErr);
        return;
      }
    }

    setSubmitting(true);
    setFormError('');

    try {
      if (editingUser) {
        await userService.updateUser(editingUser._id, formData);
      } else {
        await authService.register(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to save user account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      await userService.deleteUser(deletingUser._id);
      setDeletingUser(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
            Hospital Users & Access Authorization
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            Manage staff clinicians, laboratory technicians, pharmacists, and patient credentials.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
          Create New User
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by name, email, specialization..."
          style={{ flex: 1, minWidth: '240px' }}
        />

        <div style={{ width: '200px' }}>
          <Select
            placeholder="All Roles"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'PATIENT', label: 'Patient' },
              { value: 'DOCTOR', label: 'Doctor' },
              { value: 'LAB', label: 'Lab Technician' },
              { value: 'PHARMACY', label: 'Pharmacist' },
              { value: 'ADMIN', label: 'Administrator' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving registered users..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadData} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="No users match the current search or role filter."
          actionText="Create User"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="sh-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="sh-table-container" style={{ border: 'none' }}>
            <table className="sh-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Role</th>
                  <th>Department / Info</th>
                  <th>Contact Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--gray-500)' }}>
                        {u.email}
                      </div>
                    </td>

                    <td>
                      <StatusBadge status={u.role} />
                    </td>

                    <td>
                      {u.role === 'DOCTOR' ? (
                        <div>
                          <strong>{u.department?.name || 'General'}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                            {u.specialization || 'Clinical Specialist'}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                          {u.qualification || 'Staff User'}
                        </span>
                      )}
                    </td>

                    <td>{u.phone || 'N/A'}</td>

                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: u.status === 'ACTIVE' ? '#ecfdf5' : '#f1f5f9',
                          color: u.status === 'ACTIVE' ? '#065f46' : '#64748b',
                          fontWeight: '600',
                        }}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Edit3}
                          onClick={() => handleOpenEdit(u)}
                        >
                          Edit
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setDeletingUser(u)}
                          style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Edit Account: ${editingUser.name}` : 'Create New Hospital Account'}
        maxWidth="640px"
      >
        <form onSubmit={handleSaveUser}>
          {formError && <ErrorMessage message={formError} />}

          <div className="grid-2">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Dr. Jennifer Davis"
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user.name@gmail.com"
              required
            />
          </div>

          {!editingUser && (
            <Input
              label="Initial Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          )}

          <div className="grid-2">
            <Select
              label="System Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: 'PATIENT', label: 'Patient' },
                { value: 'DOCTOR', label: 'Doctor' },
                { value: 'LAB', label: 'Lab Technician' },
                { value: 'PHARMACY', label: 'Pharmacist' },
                { value: 'ADMIN', label: 'Administrator' },
              ]}
              required
            />

            <Select
              label="Account Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
              required
            />
          </div>

          {/* Doctor-Specific Fields */}
          {formData.role === 'DOCTOR' && (
            <div style={{ backgroundColor: 'var(--gray-50)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary-700)', marginBottom: '10px' }}>
                DOCTOR CLINICAL CREDENTIALS
              </h4>

              <div className="grid-2">
                <Select
                  label="Department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  options={departments.map((d) => ({ value: d._id, label: d.name }))}
                  required
                />

                <Input
                  label="Specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g. Interventional Cardiology"
                />
              </div>

              <div className="grid-2">
                <Input
                  label="Medical Qualification"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="e.g. MD, FACC - Harvard"
                />

                <Input
                  label="Consultation Fee ($)"
                  type="number"
                  min="0"
                  value={formData.consultationFee}
                  onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="grid-2">
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1-555-0100"
            />

            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="City, State"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingUser ? 'Save Updates' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Dialog */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        title="Delete User Account"
        message={`Are you sure you want to permanently remove ${deletingUser?.name} (${deletingUser?.email})? This action cannot be reversed.`}
        confirmText="Yes, Delete User"
        loading={deleteLoading}
      />
    </div>
  );
};

export default AdminUsers;
