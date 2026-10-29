import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { prescriptionService } from '../../services/prescriptionService';
import { userService } from '../../services/userService';
import { medicineService } from '../../services/medicineService';
import { Pill, Plus, Trash2, User, Calendar } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const DoctorPrescriptions = () => {
  const location = useLocation();
  const initialPatientId = location.state?.patientId || '';

  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(!!initialPatientId);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [patientId, setPatientId] = useState(initialPatientId);
  const [generalInstructions, setGeneralInstructions] = useState('');
  const [medicines, setMedicines] = useState([
    { medicine: '', name: '', dosage: '500mg', frequency: 'Twice daily (1-0-1)', duration: '5 days', instructions: 'Take after meals' },
  ]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [rxRes, patRes, medRes] = await Promise.all([
        prescriptionService.getPrescriptions({ page, limit: 10 }),
        userService.getUsers({ role: 'PATIENT', limit: 100 }),
        medicineService.getMedicines({ limit: 100 }),
      ]);
      if (rxRes.success) {
        setPrescriptions(rxRes.data || []);
        setPagination(rxRes.pagination);
      }
      if (patRes.success) setPatients(patRes.data || []);
      if (medRes.success) setMedicinesList(medRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page]);

  const handleAddMedicineRow = () => {
    setMedicines([
      ...medicines,
      { medicine: '', name: '', dosage: '', frequency: 'Once daily', duration: '5 days', instructions: '' },
    ]);
  };

  const handleRemoveMedicineRow = (index) => {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;

    // If selecting from catalog, auto-fill name
    if (field === 'medicine') {
      const selected = medicinesList.find((m) => m._id === value);
      if (selected) {
        updated[index].name = selected.name;
      }
    }

    setMedicines(updated);
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (!patientId) {
      setFormError('Please select a patient');
      return;
    }

    const invalid = medicines.some((m) => !m.name.trim() || !m.dosage.trim());
    if (invalid) {
      setFormError('Each prescribed medicine item requires a name and dosage');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const payload = {
        patient: patientId,
        medicines,
        instructions: generalInstructions,
      };

      const res = await prescriptionService.createPrescription(payload);
      if (res.success) {
        setIsModalOpen(false);
        setPatientId('');
        setGeneralInstructions('');
        setMedicines([
          { medicine: '', name: '', dosage: '500mg', frequency: 'Twice daily (1-0-1)', duration: '5 days', instructions: 'Take after meals' },
        ]);
        loadData();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to issue prescription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
            Prescriptions & Medication Orders
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            Issue pharmaceutical orders, specify dosages, and track dispensation status.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Write New Prescription
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading prescriptions..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadData} />
      ) : prescriptions.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No prescriptions written"
          description="Click 'Write New Prescription' to issue medications to a patient."
          actionText="Write First Prescription"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {prescriptions.map((rx) => (
            <div key={rx._id} className="sh-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                    Rx #{rx._id.slice(-6).toUpperCase()} — {rx.patient?.name}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                    Phone: {rx.patient?.phone} • Issued: {new Date(rx.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <StatusBadge status={rx.status} />
              </div>

              <div className="sh-table-container">
                <table className="sh-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rx.medicines?.map((m, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '600' }}>{m.name}</td>
                        <td>{m.dosage}</td>
                        <td>{m.frequency}</td>
                        <td>{m.duration}</td>
                        <td>{m.instructions || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rx.instructions && (
                <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                  <strong>Notes:</strong> {rx.instructions}
                </div>
              )}
            </div>
          ))}

          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      {/* Write Prescription Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Write New Electronic Prescription"
        maxWidth="740px"
      >
        <form onSubmit={handleCreatePrescription}>
          {formError && <ErrorMessage message={formError} />}

          <Select
            label="Target Patient"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            options={patients.map((p) => ({ value: p._id, label: `${p.name} (${p.phone || p.email})` }))}
            required
          />

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--gray-800)' }}>
                Medication List
              </label>
              <Button type="button" variant="outline" size="sm" icon={Plus} onClick={handleAddMedicineRow}>
                Add Another Medicine
              </Button>
            </div>

            {medicines.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--gray-50)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '10px',
                }}
              >
                <div className="grid-2">
                  <Select
                    label="Choose from Pharmacy Inventory (Optional)"
                    value={item.medicine}
                    onChange={(e) => handleMedicineChange(index, 'medicine', e.target.value)}
                    options={medicinesList.map((m) => ({ value: m._id, label: `${m.name} (Stock: ${m.stock})` }))}
                    placeholder="Select medicine or type custom below"
                  />

                  <Input
                    label="Medicine Name"
                    value={item.name}
                    onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                    placeholder="e.g. Paracetamol 500mg"
                    required
                  />
                </div>

                <div className="grid-3">
                  <Input
                    label="Dosage"
                    value={item.dosage}
                    onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                    placeholder="e.g. 500mg"
                    required
                  />

                  <Input
                    label="Frequency"
                    value={item.frequency}
                    onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                    placeholder="e.g. Twice daily"
                  />

                  <Input
                    label="Duration"
                    value={item.duration}
                    onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                    placeholder="e.g. 5 days"
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Item Instructions"
                      value={item.instructions}
                      onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                      placeholder="e.g. Take after food"
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  {medicines.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleRemoveMedicineRow(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Input
            label="General Prescription Advice / Regimen"
            placeholder="e.g. Drink 2 liters of water daily, report any allergic reaction..."
            value={generalInstructions}
            onChange={(e) => setGeneralInstructions(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Issue Prescription
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DoctorPrescriptions;
