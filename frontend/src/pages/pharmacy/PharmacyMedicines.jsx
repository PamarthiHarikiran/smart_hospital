import React, { useState, useEffect } from 'react';
import { medicineService } from '../../services/medicineService';
import { Pill, Plus, Search, Edit3, Trash2, Layers, AlertCircle, AlertTriangle } from 'lucide-react';
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

const PharmacyMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    manufacturer: '',
    batchNumber: '',
    price: 10,
    stock: 50,
    minimumStock: 10,
    expiryDate: '',
    description: '',
  });

  // Stock Adjust Modal
  const [stockModalMed, setStockModalMed] = useState(null);
  const [stockAdjustment, setStockAdjustment] = useState('');

  // Delete Confirm Dialog
  const [deletingMed, setDeletingMed] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMedicines = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await medicineService.getMedicines({
        search,
        category,
        page,
        limit: 10,
      });
      if (res.success) {
        setMedicines(res.data || []);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [search, category, page]);

  const handleOpenAdd = () => {
    setEditingMed(null);
    setFormData({
      name: '',
      category: '',
      manufacturer: '',
      batchNumber: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
      price: 10,
      stock: 50,
      minimumStock: 10,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (med) => {
    setEditingMed(med);
    setFormData({
      name: med.name,
      category: med.category,
      manufacturer: med.manufacturer || '',
      batchNumber: med.batchNumber,
      price: med.price,
      stock: med.stock,
      minimumStock: med.minimumStock,
      expiryDate: med.expiryDate ? med.expiryDate.split('T')[0] : '',
      description: med.description || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.batchNumber || !formData.expiryDate) {
      setFormError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      if (editingMed) {
        await medicineService.updateMedicine(editingMed._id, formData);
      } else {
        await medicineService.createMedicine(formData);
      }
      setIsModalOpen(false);
      fetchMedicines();
    } catch (err) {
      setFormError(err.message || 'Failed to save medicine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!stockModalMed || !stockAdjustment) return;

    try {
      await medicineService.updateStock(stockModalMed._id, {
        adjustment: Number(stockAdjustment),
      });
      setStockModalMed(null);
      setStockAdjustment('');
      fetchMedicines();
    } catch (err) {
      alert(err.message || 'Failed to update stock');
    }
  };

  const handleDelete = async () => {
    if (!deletingMed) return;
    setDeleteLoading(true);
    try {
      await medicineService.deleteMedicine(deletingMed._id);
      setDeletingMed(null);
      fetchMedicines();
    } catch (err) {
      alert(err.message || 'Failed to remove medicine');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
            Pharmaceutical Inventory & Formularies
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            Catalog medicines, adjust stock inventories, configure low-stock alerts, and manage batches.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
          Add New Medicine
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
          placeholder="Search by name, category, batch..."
          style={{ flex: 1, minWidth: '240px' }}
        />

        <div style={{ width: '200px' }}>
          <Select
            placeholder="All Categories"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Categories' },
              { value: 'Antibiotic', label: 'Antibiotic' },
              { value: 'Analgesic', label: 'Analgesic' },
              { value: 'Cardiovascular', label: 'Cardiovascular' },
              { value: 'Antidiabetic', label: 'Antidiabetic' },
              { value: 'Antihistamine', label: 'Antihistamine' },
              { value: 'NSAID', label: 'NSAID' },
              { value: 'Gastrointestinal', label: 'Gastrointestinal' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Querying pharmaceutical stock..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchMedicines} />
      ) : medicines.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No medicines found"
          description="Click 'Add New Medicine' to catalog a pharmaceutical formulary."
          actionText="Add Medicine"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="sh-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="sh-table-container" style={{ border: 'none' }}>
            <table className="sh-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Category</th>
                  <th>Batch No.</th>
                  <th>Unit Price ($)</th>
                  <th>Current Stock</th>
                  <th>Expiry Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((med) => {
                  const isLow = med.stock <= med.minimumStock;
                  const isExpired = new Date(med.expiryDate) < new Date();

                  return (
                    <tr key={med._id}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                          {med.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                          {med.manufacturer || 'General Labs'}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.775rem', padding: '2px 8px', backgroundColor: 'var(--gray-100)', borderRadius: '4px' }}>
                          {med.category}
                        </span>
                      </td>

                      <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        {med.batchNumber}
                      </td>

                      <td style={{ fontWeight: '600' }}>
                        ${med.price?.toFixed(2)}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontWeight: '700',
                              color: isLow ? '#dc2626' : 'var(--gray-900)',
                            }}
                          >
                            {med.stock} units
                          </span>
                          {isLow && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: '#dc2626',
                                backgroundColor: '#fee2e2',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: '600',
                              }}
                            >
                              LOW
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span style={{ color: isExpired ? '#dc2626' : 'var(--gray-700)', fontWeight: isExpired ? '600' : 'normal' }}>
                          {new Date(med.expiryDate).toLocaleDateString()}
                          {isExpired && ' (EXPIRED)'}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Layers}
                            title="Quick Stock Adjustment"
                            onClick={() => {
                              setStockModalMed(med);
                              setStockAdjustment('10');
                            }}
                          >
                            Stock
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            icon={Edit3}
                            onClick={() => handleOpenEdit(med)}
                          >
                            Edit
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            icon={Trash2}
                            onClick={() => setDeletingMed(med)}
                            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                          >
                            Del
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      {/* Add / Edit Medicine Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMed ? 'Edit Pharmaceutical Details' : 'Add New Medicine Formulary'}
        maxWidth="640px"
      >
        <form onSubmit={handleSaveMedicine}>
          {formError && <ErrorMessage message={formError} />}

          <div className="grid-2">
            <Input
              label="Medicine Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Amoxicillin 500mg"
              required
            />

            <Input
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g. Antibiotic"
              required
            />
          </div>

          <div className="grid-2">
            <Input
              label="Manufacturer"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              placeholder="e.g. Pfizer Labs"
            />

            <Input
              label="Batch Number"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              placeholder="e.g. AMX-2026-004"
              required
            />
          </div>

          <div className="grid-3">
            <Input
              label="Price ($)"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />

            <Input
              label="Initial Stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              required
            />

            <Input
              label="Min Alert Threshold"
              type="number"
              min="1"
              value={formData.minimumStock}
              onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
              required
            />
          </div>

          <Input
            label="Expiry Date"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            required
          />

          <Input
            label="Description / Usage"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Clinical indications and dosage instructions..."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingMed ? 'Save Changes' : 'Create Formulary'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Stock Adjustment Modal */}
      {stockModalMed && (
        <Modal
          isOpen={!!stockModalMed}
          onClose={() => setStockModalMed(null)}
          title={`Adjust Inventory Stock: ${stockModalMed.name}`}
          maxWidth="460px"
        >
          <form onSubmit={handleAdjustStock}>
            <div style={{ marginBottom: '16px', fontSize: '0.9rem', color: 'var(--gray-600)' }}>
              Current stock on hand: <strong style={{ color: 'var(--gray-900)' }}>{stockModalMed.stock} units</strong>
            </div>

            <Input
              label="Stock Adjustment (Enter + to add, - to deduct)"
              type="number"
              value={stockAdjustment}
              onChange={(e) => setStockAdjustment(e.target.value)}
              placeholder="e.g. +50 or -10"
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setStockModalMed(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Update Stock
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingMed}
        onClose={() => setDeletingMed(null)}
        onConfirm={handleDelete}
        title="Remove Medicine"
        message={`Are you sure you want to remove "${deletingMed?.name}" (Batch ${deletingMed?.batchNumber}) from inventory?`}
        confirmText="Yes, Delete"
        loading={deleteLoading}
      />
    </div>
  );
};

export default PharmacyMedicines;
