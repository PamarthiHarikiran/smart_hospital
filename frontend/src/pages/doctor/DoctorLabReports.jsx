import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { labReportService } from '../../services/labReportService';
import { userService } from '../../services/userService';
import { useSocket } from '../../context/SocketContext';
import { FlaskConical, Plus, ExternalLink, Calendar, User, FileText, Activity } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import LabReportDetailsModal from '../../components/lab/LabReportDetailsModal';

const COMMON_LAB_TESTS = [
  { name: 'Complete Blood Count (CBC)', price: 30 },
  { name: 'Comprehensive Metabolic Panel (CMP)', price: 45 },
  { name: 'Lipid Profile', price: 35 },
  { name: 'Liver Function Test (LFT)', price: 40 },
  { name: 'Renal Function Test (RFT)', price: 40 },
  { name: 'Thyroid Stimulating Hormone (TSH)', price: 25 },
  { name: 'Hemoglobin A1c (HbA1c)', price: 30 },
  { name: 'Urinalysis Routine & Microscopic', price: 20 },
  { name: 'COVID-19 / Influenza PCR Panel', price: 60 },
  { name: 'Electrocardiogram (ECG / EKG)', price: 50 },
];

const DoctorLabReports = () => {
  const location = useLocation();
  const initialPatientId = location.state?.patientId || '';
  const initialAptId = location.state?.appointmentId || '';

  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Clinical Detail Viewer Modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('report');

  const { socket } = useSocket();

  // Request Test Modal
  const [isModalOpen, setIsModalOpen] = useState(!!initialPatientId);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    patient: initialPatientId,
    appointment: initialAptId,
    testName: '',
    testDescription: '',
    price: 30,
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [labRes, patRes] = await Promise.all([
        labReportService.getLabReports({ page, limit: 10 }),
        userService.getUsers({ role: 'PATIENT', limit: 100 }),
      ]);
      if (labRes.success) {
        setReports(labRes.data || []);
        setPagination(labRes.pagination);
      }
      if (patRes.success) setPatients(patRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load lab reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (data) => {
      if (data?.reportId) {
        setReports((prev) => {
          const idx = prev.findIndex((r) => r._id === data.reportId);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = data.report || { ...updated[idx], requestStatus: data.requestStatus };
            return updated;
          }
          return prev;
        });
      }
    };
    socket.on('lab_report_status_changed', handleUpdate);
    return () => socket.off('lab_report_status_changed', handleUpdate);
  }, [socket]);

  const handleSelectPredefinedTest = (testName) => {
    const found = COMMON_LAB_TESTS.find((t) => t.name === testName);
    if (found) {
      setFormData({
        ...formData,
        testName: found.name,
        price: found.price,
      });
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!formData.patient || !formData.testName) {
      setFormError('Patient and test name are required');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const res = await labReportService.createLabRequest(formData);
      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          patient: '',
          appointment: '',
          testName: '',
          testDescription: '',
          price: 30,
        });
        loadData();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to request test');
    } finally {
      setSubmitting(false);
    }
  };

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
            Pathology Orders & Laboratory Results
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            Request diagnostic tests for patients and inspect finalized laboratory findings.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Order New Lab Test
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving diagnostic orders..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadData} />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No laboratory tests requested"
          description="Click 'Order New Lab Test' to order pathology investigations."
          actionText="Order First Test"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reports.map((report) => (
            <div key={report._id} className="sh-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                    {report.testName}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '3px' }}>
                    Patient: <strong>{report.patient?.name}</strong> • Phone: {report.patient?.phone}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <StatusBadge status={report.requestStatus} />
                </div>
              </div>

              {report.result && (
                <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', marginBottom: '12px', fontSize: '0.9rem', color: '#166534' }}>
                  <strong>Pathologist Finding:</strong> {report.result}
                  {report.remarks && (
                    <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '4px' }}>
                      Remarks: {report.remarks}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '0.8rem', color: 'var(--gray-400)', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <span>Requested on: {new Date(report.requestedAt || report.createdAt).toLocaleDateString()}</span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Activity}
                    onClick={() => {
                      setSelectedReport(report);
                      setModalTab('status');
                      setDetailModalOpen(true);
                    }}
                  >
                    View Real-Time Status
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={FileText}
                    onClick={() => {
                      setSelectedReport(report);
                      setModalTab('report');
                      setDetailModalOpen(true);
                    }}
                  >
                    View Full Report
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      {/* Order Lab Test Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Order Diagnostic Pathology Investigation"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateRequest}>
          {formError && <ErrorMessage message={formError} />}

          <Select
            label="Target Patient"
            value={formData.patient}
            onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
            options={patients.map((p) => ({ value: p._id, label: `${p.name} (${p.phone || p.email})` }))}
            required
          />

          <Select
            label="Common Test Template (Quick Selection)"
            placeholder="Select a standard laboratory test..."
            onChange={(e) => handleSelectPredefinedTest(e.target.value)}
            options={COMMON_LAB_TESTS.map((t) => ({ value: t.name, label: `${t.name} ($${t.price})` }))}
          />

          <Input
            label="Test Name"
            placeholder="e.g. Complete Blood Count (CBC)"
            value={formData.testName}
            onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
            required
          />

          <Input
            label="Clinical Indication / Description"
            placeholder="e.g. Rule out anemia, evaluate elevated WBC count..."
            value={formData.testDescription}
            onChange={(e) => setFormData({ ...formData, testDescription: e.target.value })}
          />

          <Input
            label="Estimated Test Price ($)"
            type="number"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Transmit Order to Lab
            </Button>
          </div>
        </form>
      </Modal>

      <LabReportDetailsModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        report={selectedReport}
        initialTab={modalTab}
      />
    </div>
  );
};

export default DoctorLabReports;
