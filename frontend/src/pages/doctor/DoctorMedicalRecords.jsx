import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { medicalRecordService } from '../../services/medicalRecordService';
import { userService } from '../../services/userService';
import { FileText, Plus, User, Calendar, Edit3, CheckCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const DoctorMedicalRecords = () => {
  const location = useLocation();
  const initialPatientId = location.state?.patientId || '';
  const initialAptId = location.state?.appointmentId || '';

  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(!!initialPatientId);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    patient: initialPatientId,
    appointment: initialAptId,
    symptoms: '',
    diagnosis: '',
    treatment: '',
    notes: '',
    followUpDate: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [recRes, patRes] = await Promise.all([
        medicalRecordService.getMedicalRecords({ page, limit: 10 }),
        userService.getUsers({ role: 'PATIENT', limit: 100 }),
      ]);
      if (recRes.success) {
        setRecords(recRes.data || []);
        setPagination(recRes.pagination);
      }
      if (patRes.success) {
        setPatients(patRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.patient || !formData.symptoms || !formData.diagnosis) {
      setFormError('Patient, symptoms, and diagnosis are required');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const res = await medicalRecordService.createMedicalRecord(formData);
      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          patient: '',
          appointment: '',
          symptoms: '',
          diagnosis: '',
          treatment: '',
          notes: '',
          followUpDate: '',
        });
        fetchData();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save medical record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
            Clinical Diagnoses & Medical Records
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            Record clinical findings, diagnostic assessments, and medical treatments.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Clinical Record
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving medical records..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchData} />
      ) : records.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No records found"
          description="Click 'New Clinical Record' to document a patient encounter."
          actionText="Create First Record"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {records.map((rec) => (
            <div key={rec._id} className="sh-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                    {rec.diagnosis}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '4px' }}>
                    Patient: <strong>{rec.patient?.name}</strong> ({rec.patient?.gender}, {rec.patient?.bloodGroup}) • {rec.patient?.phone}
                  </div>
                </div>

                <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                  Recorded on {new Date(rec.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="grid-2" style={{ backgroundColor: 'var(--gray-50)', padding: '14px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Symptoms</span>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-800)', marginTop: '2px' }}>{rec.symptoms}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Treatment Plan</span>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-800)', marginTop: '2px' }}>{rec.treatment || 'N/A'}</p>
                </div>
              </div>

              {rec.notes && (
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', padding: '8px 12px', borderLeft: '3px solid var(--primary-500)' }}>
                  <strong>Physician Clinical Notes:</strong> {rec.notes}
                </div>
              )}
            </div>
          ))}

          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      {/* New Medical Record Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Clinical Medical Record"
        maxWidth="620px"
      >
        <form onSubmit={handleCreate}>
          {formError && <ErrorMessage message={formError} />}

          <Select
            label="Select Patient"
            value={formData.patient}
            onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
            options={patients.map((p) => ({ value: p._id, label: `${p.name} (${p.phone || p.email})` }))}
            required
          />

          <Input
            label="Reported Symptoms"
            placeholder="e.g. Sharp chest pain radiating to left arm, shortness of breath..."
            value={formData.symptoms}
            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
            required
          />

          <Input
            label="Clinical Diagnosis"
            placeholder="e.g. Acute Angina Pectoris, Essential Hypertension Grade 1"
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            required
          />

          <Input
            label="Prescribed Treatment / Therapy"
            placeholder="e.g. Bed rest, sublingual nitroglycerin as needed, low sodium diet"
            value={formData.treatment}
            onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
          />

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', display: 'block', marginBottom: '6px' }}>
              Doctor's Clinical Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Private observations, differential diagnoses..."
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

          <Input
            label="Follow-up Date (Optional)"
            type="date"
            value={formData.followUpDate}
            onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Save Medical Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DoctorMedicalRecords;
