import React, { useState, useEffect } from 'react';
import { prescriptionService } from '../../services/prescriptionService';
import { Pill, User, Calendar, FileText } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const PatientPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await prescriptionService.getPrescriptions({ page, limit: 10 });
      if (res.success) {
        setPrescriptions(res.data || []);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [page]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
          My Prescriptions
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
          Doctor prescribed medications, dosages, and pharmacy dispensation history.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving medication orders..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchPrescriptions} />
      ) : prescriptions.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No prescriptions on record"
          description="Any medications prescribed by hospital physicians will be cataloged here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {prescriptions.map((rx) => (
            <div key={rx._id} className="sh-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--gray-400)', textTransform: 'uppercase' }}>
                    Prescription #{rx._id.slice(-6).toUpperCase()}
                  </span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--gray-900)', marginTop: '2px' }}>
                    Prescribed by Dr. {rx.doctor?.name} ({rx.doctor?.specialization})
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                    Issued on {new Date(rx.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <StatusBadge status={rx.status} />
              </div>

              {/* Medicines Table */}
              <div className="sh-table-container">
                <table className="sh-table">
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rx.medicines?.map((med, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                          {med.name}
                        </td>
                        <td>{med.dosage}</td>
                        <td>{med.frequency}</td>
                        <td>{med.duration}</td>
                        <td style={{ color: 'var(--gray-600)' }}>{med.instructions || 'As advised'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rx.instructions && (
                <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  <strong>General Instructions:</strong> {rx.instructions}
                </div>
              )}
            </div>
          ))}

          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default PatientPrescriptions;
