import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { medicalRecordService } from '../../services/medicalRecordService';
import { prescriptionService } from '../../services/prescriptionService';
import { labReportService } from '../../services/labReportService';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';

const DoctorPatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('records'); // 'records' | 'prescriptions' | 'labs'

  const loadPatientData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, recRes, rxRes, labRes] = await Promise.all([
        userService.getUserById(id),
        medicalRecordService.getMedicalRecords({ patient: id }),
        prescriptionService.getPrescriptions({ patient: id }),
        labReportService.getLabReports({ patient: id }),
      ]);

      if (pRes.success) setPatient(pRes.data);
      if (recRes.success) setRecords(recRes.data || []);
      if (rxRes.success) setPrescriptions(rxRes.data || []);
      if (labRes.success) setLabReports(labRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load patient history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [id]);

  if (loading) return <LoadingSpinner text="Retrieving comprehensive patient history..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadPatientData} />;
  if (!patient) return <EmptyState title="Patient not found" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/doctor/patients')}>
          Back to Directory
        </Button>
      </div>

      {/* Patient Header Card */}
      <div className="sh-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
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
                fontSize: '1.6rem',
              }}
            >
              {patient.name[0]}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                  {patient.name}
                </h2>
                <StatusBadge status={patient.status} />
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
                {patient.gender || 'N/A'} • Blood Group: <strong style={{ color: '#dc2626' }}>{patient.bloodGroup || 'N/A'}</strong> • DOB: {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="sm"
              icon={FileText}
              onClick={() => navigate('/doctor/medical-records', { state: { patientId: patient._id } })}
            >
              Add Record
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Pill}
              onClick={() => navigate('/doctor/prescriptions', { state: { patientId: patient._id } })}
            >
              Write Rx
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={FlaskConical}
              onClick={() => navigate('/doctor/lab-reports', { state: { patientId: patient._id } })}
            >
              Order Lab
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
          <div>Email: <strong>{patient.email}</strong></div>
          <div>Phone: <strong>{patient.phone || 'N/A'}</strong></div>
          <div>Address: <strong>{patient.address || 'N/A'}</strong></div>
        </div>
      </div>

      {/* Tabs for Records, Prescriptions, Labs */}
      <div>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', gap: '16px', marginBottom: '20px' }}>
          {[
            { id: 'records', label: `Clinical Records (${records.length})`, icon: FileText },
            { id: 'prescriptions', label: `Prescriptions (${prescriptions.length})`, icon: Pill },
            { id: 'labs', label: `Lab Investigations (${labReports.length})`, icon: FlaskConical },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderBottom: `2px solid ${isActive ? 'var(--primary-600)' : 'transparent'}`,
                  color: isActive ? 'var(--primary-600)' : 'var(--gray-500)',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '0.9rem',
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Medical Records */}
        {activeTab === 'records' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {records.length === 0 ? (
              <EmptyState title="No clinical records found for this patient" />
            ) : (
              records.map((r) => (
                <div key={r._id} className="sh-card" style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                      {r.diagnosis}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                    <strong>Symptoms:</strong> {r.symptoms}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '4px' }}>
                    <strong>Treatment:</strong> {r.treatment || 'N/A'}
                  </p>
                  {r.notes && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '4px' }}>
                      <strong>Doctor Notes:</strong> {r.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Prescriptions */}
        {activeTab === 'prescriptions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {prescriptions.length === 0 ? (
              <EmptyState title="No prescriptions issued" />
            ) : (
              prescriptions.map((rx) => (
                <div key={rx._id} className="sh-card" style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                      Prescription #{rx._id.slice(-6).toUpperCase()} • {new Date(rx.createdAt).toLocaleDateString()}
                    </span>
                    <StatusBadge status={rx.status} />
                  </div>
                  <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--gray-700)' }}>
                    {rx.medicines?.map((m, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>
                        <strong>{m.name}</strong> — {m.dosage}, {m.frequency} for {m.duration} ({m.instructions})
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Lab Reports */}
        {activeTab === 'labs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {labReports.length === 0 ? (
              <EmptyState title="No lab tests on record" />
            ) : (
              labReports.map((lab) => (
                <div key={lab._id} className="sh-card" style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{lab.testName}</h3>
                    <StatusBadge status={lab.requestStatus} />
                  </div>
                  {lab.result && (
                    <div style={{ fontSize: '0.85rem', color: '#166534', backgroundColor: '#f0fdf4', padding: '8px 12px', borderRadius: '4px', marginTop: '6px' }}>
                      <strong>Result:</strong> {lab.result}
                    </div>
                  )}
                  {lab.reportFile && (
                    <div style={{ marginTop: '10px' }}>
                      <a href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${lab.reportFile}`} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm">Download PDF</Button>
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorPatientDetail;
