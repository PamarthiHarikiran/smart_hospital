import React, { useState, useEffect } from 'react';
import { billService } from '../../services/billService';
import { userService } from '../../services/userService';
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  Printer,
  DollarSign,
  Receipt,
} from 'lucide-react';
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

const AdminBills = () => {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Bill Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [targetPatient, setTargetPatient] = useState('');
  const [tax, setTax] = useState(5);
  const [discount, setDiscount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [items, setItems] = useState([
    { description: 'Specialist Clinical Consultation', category: 'CONSULTATION', quantity: 1, price: 80 },
  ]);

  // View / Print Invoice Modal
  const [selectedBill, setSelectedBill] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [bRes, pRes] = await Promise.all([
        billService.getBills({ paymentStatus: statusFilter, search, page, limit: 10 }),
        userService.getUsers({ role: 'PATIENT', limit: 100 }),
      ]);
      if (bRes.success) {
        setBills(bRes.data || []);
        setPagination(bRes.pagination);
      }
      if (pRes.success) setPatients(pRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, search, page]);

  const handleAddItem = () => {
    setItems([...items, { description: '', category: 'OTHER', quantity: 1, price: 20 }]);
  };

  const handleRemoveItem = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...items];
    updated[idx][field] = value;
    setItems(updated);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.price) || 0), 0);
  };

  const calculateTotal = () => {
    const sub = calculateSubtotal();
    return Math.max(0, sub + Number(tax) - Number(discount));
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (!targetPatient) {
      setFormError('Please select a patient');
      return;
    }

    const invalid = items.some((i) => !i.description.trim() || Number(i.price) < 0);
    if (invalid) {
      setFormError('All items require a description and valid price');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const payload = {
        patient: targetPatient,
        items,
        tax: Number(tax),
        discount: Number(discount),
        paymentStatus,
      };

      const res = await billService.createBill(payload);
      if (res.success) {
        setIsModalOpen(false);
        setTargetPatient('');
        setItems([{ description: 'Specialist Clinical Consultation', category: 'CONSULTATION', quantity: 1, price: 80 }]);
        loadData();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePayment = async (id, newStatus) => {
    try {
      await billService.updateBill(id, { paymentStatus: newStatus });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update payment');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
            Hospital Billing & Invoice Center
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            Generate patient itemized bills, process settlements, and print invoices.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setTargetPatient(patients[0]?._id || '');
            setFormError('');
            setIsModalOpen(true);
          }}
        >
          Create New Bill
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
          placeholder="Search by line items..."
          style={{ flex: 1, minWidth: '240px' }}
        />

        <div style={{ width: '180px' }}>
          <Select
            placeholder="All Payment Statuses"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'PAID', label: 'Paid' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving hospital invoices..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadData} />
      ) : bills.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No bills found"
          description="Click 'Create New Bill' to generate an itemized patient invoice."
          actionText="Create Bill"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="sh-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="sh-table-container" style={{ border: 'none' }}>
            <table className="sh-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Patient</th>
                  <th>Items Summary</th>
                  <th>Total Amount</th>
                  <th>Payment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--gray-900)' }}>
                        #{b._id.slice(-6).toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        {new Date(b.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '600' }}>{b.patient?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{b.patient?.phone}</div>
                    </td>

                    <td>
                      {b.items?.length || 0} item(s) (
                      {b.items?.map((i) => i.category).slice(0, 2).join(', ')}
                      {b.items?.length > 2 ? '...' : ''})
                    </td>

                    <td style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--gray-900)' }}>
                      ${b.total?.toFixed(2)}
                    </td>

                    <td>
                      <StatusBadge status={b.paymentStatus} />
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBill(b)}
                        >
                          Invoice View
                        </Button>

                        {b.paymentStatus === 'PENDING' && (
                          <Button
                            variant="success"
                            size="sm"
                            icon={CheckCircle}
                            onClick={() => handleUpdatePayment(b._id, 'PAID')}
                          >
                            Mark Paid
                          </Button>
                        )}
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

      {/* Create Bill Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Patient Invoice"
        maxWidth="700px"
      >
        <form onSubmit={handleCreateBill}>
          {formError && <ErrorMessage message={formError} />}

          <Select
            label="Bill Recipient (Patient)"
            value={targetPatient}
            onChange={(e) => setTargetPatient(e.target.value)}
            options={patients.map((p) => ({ value: p._id, label: `${p.name} (${p.phone || p.email})` }))}
            required
          />

          {/* Line Items */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--gray-800)' }}>
                Itemized Bill Line Items
              </label>
              <Button type="button" variant="outline" size="sm" icon={Plus} onClick={handleAddItem}>
                Add Item
              </Button>
            </div>

            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--gray-50)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '10px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 2 }}>
                  <Input
                    placeholder="Item description (e.g. Consultation, ECG)"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    style={{ marginBottom: 0 }}
                    required
                  />
                </div>

                <div style={{ width: '140px' }}>
                  <Select
                    value={item.category}
                    onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                    options={[
                      { value: 'CONSULTATION', label: 'Consultation' },
                      { value: 'LAB', label: 'Lab Test' },
                      { value: 'MEDICINE', label: 'Medicine' },
                      { value: 'ADMISSION', label: 'Admission' },
                      { value: 'OTHER', label: 'Other' },
                    ]}
                    style={{ marginBottom: 0 }}
                  />
                </div>

                <div style={{ width: '70px' }}>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    style={{ marginBottom: 0 }}
                    required
                  />
                </div>

                <div style={{ width: '90px' }}>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                    style={{ marginBottom: 0 }}
                    required
                  />
                </div>

                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleRemoveItem(idx)}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="grid-3">
            <Input
              label="Tax Amount ($)"
              type="number"
              min="0"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
            />

            <Input
              label="Discount ($)"
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />

            <Select
              label="Payment Status"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              options={[
                { value: 'PENDING', label: 'Pending' },
                { value: 'PAID', label: 'Paid' },
              ]}
            />
          </div>

          <div style={{ textAlign: 'right', fontSize: '1.2rem', fontWeight: '700', marginTop: '12px' }}>
            Calculated Total: ${calculateTotal().toFixed(2)}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Issue Hospital Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Invoice View Modal */}
      {selectedBill && (
        <Modal
          isOpen={!!selectedBill}
          onClose={() => setSelectedBill(null)}
          title={`Hospital Bill #${selectedBill._id.slice(-6).toUpperCase()}`}
          maxWidth="680px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
                Print Official Invoice
              </Button>
              <Button variant="secondary" onClick={() => setSelectedBill(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--gray-200)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e3a8a', letterSpacing: '-0.01em' }}>
                  ELITECARE HOSPITAL
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#0d9488', fontWeight: '600' }}>
                  Inpatient & Outpatient Clinical Accounts
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <StatusBadge status={selectedBill.paymentStatus} />
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '4px' }}>
                  {new Date(selectedBill.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="sh-table-container">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.description}</td>
                      <td>{item.category}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>${item.amount?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.9rem' }}>
              <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span>${selectedBill.subtotal?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tax:</span>
                  <span>${selectedBill.tax?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                  <span>Total:</span>
                  <span>${selectedBill.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminBills;
