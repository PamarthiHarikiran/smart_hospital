import React, { useState, useEffect } from 'react';
import { medicalRecordService } from '../../services/medicalRecordService';
import { FileText, Calendar, User, Stethoscope, Eye } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const PatientMedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await medicalRecordService.getMedicalRecords({ page, limit: 10 });
      if (res.success) {
        setRecords(res.data || []);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
          My Medical Records & Clinical Summaries
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
          Historical diagnoses, physician consultations, and clinical treatment notes.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading your clinical records..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchRecords} />
      ) : records.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No medical records yet"
          description="Your medical records will appear here after consultations with hospital doctors."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {records.map((rec) => (
            <div key={rec._id} className="sh-card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                      {rec.diagnosis}
                    </h3>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: '4px' }}>
                    Attending Doctor: <strong>Dr. {rec.doctor?.name}</strong> ({rec.doctor?.specialization})
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                    Recorded on {new Date(rec.createdAt).toLocaleDateString()}
                  </div>
                  <Button variant="outline" size="sm" icon={Eye} onClick={() => setSelectedRecord(rec)}>
                    View Full Details
                  </Button>
                </div>
              </div>

              <div className="grid-2" style={{ backgroundColor: 'var(--gray-50)', padding: '14px 16px', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                    Reported Symptoms
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-800)', marginTop: '2px' }}>
                    {rec.symptoms}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                    Prescribed Treatment / Plan
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-800)', marginTop: '2px' }}>
                    {rec.treatment || 'Standard clinical rest and fluids'}
                  </div>
                </div>
              </div>

              {rec.followUpDate && (
                <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} /> Follow-up scheduled for: <strong>{new Date(rec.followUpDate).toLocaleDateString()}</strong>
                </div>
              )}
            </div>
          ))}

          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      {/* Record Details Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Clinical Record: ${selectedRecord.diagnosis}`}
          maxWidth="600px"
          footer={
            <Button variant="secondary" onClick={() => setSelectedRecord(null)}>
              Close
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem' }}>
            <div>
              <span style={{ fontWeight: '600', color: 'var(--gray-600)' }}>Physician:</span>{' '}
              Dr. {selectedRecord.doctor?.name} ({selectedRecord.doctor?.specialization})
            </div>
            <div>
              <span style={{ fontWeight: '600', color: 'var(--gray-600)' }}>Visit Date:</span>{' '}
              {new Date(selectedRecord.createdAt).toLocaleString()}
            </div>
            <div>
              <span style={{ fontWeight: '600', color: 'var(--gray-600)' }}>Symptoms:</span>
              <p style={{ marginTop: '4px', color: 'var(--gray-800)' }}>{selectedRecord.symptoms}</p>
            </div>
            <div>
              <span style={{ fontWeight: '600', color: 'var(--gray-600)' }}>Clinical Diagnosis:</span>
              <p style={{ marginTop: '4px', color: 'var(--gray-800)', fontWeight: '500' }}>{selectedRecord.diagnosis}</p>
            </div>
            <div>
              <span style={{ fontWeight: '600', color: 'var(--gray-600)' }}>Treatment / Regimen:</span>
              <p style={{ marginTop: '4px', color: 'var(--gray-800)' }}>{selectedRecord.treatment || 'N/A'}</p>
            </div>
            {selectedRecord.notes && (
              <div>
                <span style={{ fontWeight: '600', color: 'var(--gray-600)' }}>Doctor's Clinical Notes:</span>
                <p style={{ marginTop: '4px', color: 'var(--gray-800)', whiteSpace: 'pre-wrap' }}>{selectedRecord.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PatientMedicalRecords;
