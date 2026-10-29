import React, { useState, useEffect } from 'react';
import { departmentService } from '../../services/departmentService';
import { Building2, Plus, Edit3, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
  });

  // Delete Confirm Dialog
  const [deletingDept, setDeletingDept] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await departmentService.getDepartments({ status: 'ALL' });
      if (res.success) {
        setDepartments(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormData({ name: '', description: '', status: 'ACTIVE' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description || '',
      status: dept.status || 'ACTIVE',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setFormError('Department name is required');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      if (editingDept) {
        await departmentService.updateDepartment(editingDept._id, formData);
      } else {
        await departmentService.createDepartment(formData);
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      setFormError(err.message || 'Failed to save department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDept) return;
    setDeleteLoading(true);
    try {
      await departmentService.deleteDepartment(deletingDept._id);
      setDeletingDept(null);
      fetchDepartments();
    } catch (err) {
      alert(err.message || 'Failed to remove department');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
            Hospital Medical Specialties & Departments
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            Configure clinical units, outpatient specialties, and triage assignments.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
          Add Department
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving hospital departments..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchDepartments} />
      ) : departments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No departments found"
          description="Create your first hospital department to start assigning clinicians."
          actionText="Add Department"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid-3">
          {departments.map((d) => (
            <div key={d._id} className="sh-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--primary-50)',
                        color: 'var(--primary-600)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Building2 size={20} />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                      {d.name}
                    </h3>
                  </div>

                  <StatusBadge status={d.status} />
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', minHeight: '44px', lineHeight: '1.4' }}>
                  {d.description || 'Specialized clinical hospital unit.'}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <Button variant="outline" size="sm" icon={Edit3} onClick={() => handleOpenEdit(d)}>
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Trash2}
                  onClick={() => setDeletingDept(d)}
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? 'Edit Hospital Department' : 'Create New Department'}
        maxWidth="500px"
      >
        <form onSubmit={handleSave}>
          {formError && <ErrorMessage message={formError} />}

          <Input
            label="Department Name"
            placeholder="e.g. Cardiology"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', display: 'block', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Clinical specialty scope and services provided..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingDept ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingDept}
        onClose={() => setDeletingDept(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Are you sure you want to delete the "${deletingDept?.name}" department?`}
        confirmText="Yes, Delete"
        loading={deleteLoading}
      />
    </div>
  );
};

export default AdminDepartments;
