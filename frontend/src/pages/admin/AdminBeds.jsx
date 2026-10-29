import React, { useState, useEffect } from 'react';
import { bedService } from '../../services/bedService';
import { Bed, Plus, Search, Edit3, Trash2, Activity, PieChart } from 'lucide-react';
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

const AdminBeds = () => {
  const [beds, setBeds] = useState([]);
  const [occupancy, setOccupancy] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add / Edit Bed Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    bedNumber: '',
    ward: '',
    bedType: 'GENERAL',
    status: 'AVAILABLE',
  });

  // Delete Bed Dialog
  const [deletingBed, setDeletingBed] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [bedRes, occRes] = await Promise.all([
        bedService.getBeds({ status: statusFilter, search, page, limit: 12 }),
        bedService.getBedOccupancy(),
      ]);
      if (bedRes.success) {
        setBeds(bedRes.data || []);
        setPagination(bedRes.pagination);
      }
      if (occRes.success) {
        setOccupancy(occRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load beds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, search, page]);

  const handleOpenAdd = () => {
    setEditingBed(null);
    setFormData({
      bedNumber: `BED-${Math.floor(100 + Math.random() * 900)}`,
      ward: 'General Ward A',
      bedType: 'GENERAL',
      status: 'AVAILABLE',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bed) => {
    setEditingBed(bed);
    setFormData({
      bedNumber: bed.bedNumber,
      ward: bed.ward,
      bedType: bed.bedType,
      status: bed.status,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.bedNumber || !formData.ward) {
      setFormError('Bed number and ward name are required');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      if (editingBed) {
        await bedService.updateBed(editingBed._id, formData);
      } else {
        await bedService.createBed(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to save bed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBed) return;
    setDeleteLoading(true);
    try {
      await bedService.deleteBed(deletingBed._id);
      setDeletingBed(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete bed');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
            Bed Management & Inpatient Occupancy
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            Telemetry monitoring of hospital beds across General, ICU, Emergency, and Private Wards.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
          Add New Bed
        </Button>
      </div>

      {/* SMART FEATURE 4: Bed Occupancy Telemetry Bar */}
      {occupancy && (
        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '20px 24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="var(--primary-600)" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                Smart Bed Occupancy Telemetry: {occupancy.occupancyRate}%
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem' }}>
              <span>Total Beds: <strong>{occupancy.totalBeds}</strong></span>
              <span style={{ color: '#059669' }}>Available: <strong>{occupancy.availableBeds}</strong></span>
              <span style={{ color: '#dc2626' }}>Occupied: <strong>{occupancy.occupiedBeds}</strong></span>
              <span style={{ color: '#d97706' }}>Maintenance: <strong>{occupancy.maintenanceBeds}</strong></span>
            </div>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              height: '10px',
              backgroundColor: 'var(--gray-200)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            <div
              style={{
                width: `${occupancy.occupancyRate}%`,
                backgroundColor: occupancy.occupancyRate > 80 ? '#dc2626' : occupancy.occupancyRate > 50 ? '#f59e0b' : '#10b981',
                transition: 'width 0.3s ease',
              }}
              title={`Occupied: ${occupancy.occupancyRate}%`}
            />
          </div>

          {/* Ward Breakdown Pills */}
          {occupancy.wardBreakdown?.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
              {occupancy.wardBreakdown.map((w) => (
                <div
                  key={w.ward}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--gray-100)',
                    fontSize: '0.775rem',
                    color: 'var(--gray-700)',
                  }}
                >
                  <strong>{w.ward}:</strong> {w.occupied}/{w.total} ({w.rate}%)
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by bed number or ward name..."
          style={{ flex: 1, minWidth: '240px' }}
        />

        <div style={{ width: '180px' }}>
          <Select
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'AVAILABLE', label: 'Available' },
              { value: 'OCCUPIED', label: 'Occupied' },
              { value: 'MAINTENANCE', label: 'Maintenance' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving bed inventory..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadData} />
      ) : beds.length === 0 ? (
        <EmptyState
          icon={Bed}
          title="No beds found"
          description="Click 'Add New Bed' to configure hospital inpatient beds."
          actionText="Add Bed"
          onAction={handleOpenAdd}
        />
      ) : (
        <>
          <div className="grid-3">
            {beds.map((b) => (
              <div key={b._id} className="sh-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Bed size={20} color="var(--primary-600)" />
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                        {b.bedNumber}
                      </h3>
                    </div>

                    <StatusBadge status={b.status} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                    <div>Ward: <strong>{b.ward}</strong></div>
                    <div>Type: <strong>{b.bedType}</strong></div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                  <Button variant="outline" size="sm" icon={Edit3} onClick={() => handleOpenEdit(b)}>
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Trash2}
                    disabled={b.status === 'OCCUPIED'}
                    onClick={() => setDeletingBed(b)}
                    style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      {/* Add / Edit Bed Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBed ? `Edit Bed: ${editingBed.bedNumber}` : 'Add New Hospital Bed'}
        maxWidth="500px"
      >
        <form onSubmit={handleSave}>
          {formError && <ErrorMessage message={formError} />}

          <Input
            label="Bed Identifier / Number"
            placeholder="e.g. GW-105"
            value={formData.bedNumber}
            onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
            required
          />

          <Input
            label="Ward Name"
            placeholder="e.g. General Ward A, ICU, Emergency"
            value={formData.ward}
            onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
            required
          />

          <div className="grid-2">
            <Select
              label="Bed Category"
              value={formData.bedType}
              onChange={(e) => setFormData({ ...formData, bedType: e.target.value })}
              options={[
                { value: 'GENERAL', label: 'General' },
                { value: 'ICU', label: 'Intensive Care Unit (ICU)' },
                { value: 'EMERGENCY', label: 'Emergency' },
                { value: 'PRIVATE', label: 'Private Suite' },
                { value: 'PEDIATRIC', label: 'Pediatric' },
              ]}
              required
            />

            <Select
              label="Initial Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'AVAILABLE', label: 'Available' },
                { value: 'OCCUPIED', label: 'Occupied' },
                { value: 'MAINTENANCE', label: 'Maintenance' },
              ]}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingBed ? 'Save Changes' : 'Create Bed'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingBed}
        onClose={() => setDeletingBed(null)}
        onConfirm={handleDelete}
        title="Delete Hospital Bed"
        message={`Are you sure you want to delete ${deletingBed?.bedNumber} in ${deletingBed?.ward}?`}
        confirmText="Yes, Delete"
        loading={deleteLoading}
      />
    </div>
  );
};

export default AdminBeds;
