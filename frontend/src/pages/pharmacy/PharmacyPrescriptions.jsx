import React, { useState, useEffect } from 'react';
import { prescriptionService } from '../../services/prescriptionService';
import { Pill, CheckCircle, Search, User, Clock } from 'lucide-react';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const PharmacyPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dispensingId, setDispensingId] = useState(null);

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await prescriptionService.getPrescriptions({
        status: statusFilter,
        search,
        page,
        limit: 10,
      });
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
  }, [statusFilter, search, page]);

  const handleDispense = async (id) => {
    setDispensingId(id);
    try {
      const res = await prescriptionService.updatePrescription(id, {
        status: 'COMPLETED',
        dispense: true,
      });
      if (res.success) {
        fetchPrescriptions();
      }
    } catch (err) {
      alert(err.message || 'Failed to dispense medication');
    } finally {
      setDispensingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
            Prescription Dispensation & Fulfillment Queue
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            Review doctor orders, dispense medications to patients, and deduct stock levels automatically.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search by medication name..."
          />

          <div style={{ width: '180px' }}>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active (Pending Dispense)' },
                { value: 'COMPLETED', label: 'Completed (Dispensed)' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving prescription queue..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchPrescriptions} />
      ) : prescriptions.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No prescriptions in queue"
          description="There are no prescriptions matching the current status filter."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {prescriptions.map((rx) => (
            <div key={rx._id} className="sh-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                      Prescription #{rx._id.slice(-6).toUpperCase()}
                    </h3>
                    <StatusBadge status={rx.status} />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '4px' }}>
                    Patient: <strong>{rx.patient?.name}</strong> ({rx.patient?.phone}) • Prescribing Doctor: <strong>Dr. {rx.doctor?.name}</strong>
                  </div>
                </div>

                {rx.status === 'ACTIVE' && (
                  <Button
                    variant="success"
                    size="md"
                    icon={CheckCircle}
                    loading={dispensingId === rx._id}
                    onClick={() => handleDispense(rx._id)}
                  >
                    Dispense & Deduct Stock
                  </Button>
                )}
              </div>

              {/* Medicines List */}
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
                        <td style={{ fontWeight: '600' }}>{med.name}</td>
                        <td>{med.dosage}</td>
                        <td>{med.frequency}</td>
                        <td>{med.duration}</td>
                        <td>{med.instructions || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rx.instructions && (
                <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                  <strong>Physician Regimen Notes:</strong> {rx.instructions}
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

export default PharmacyPrescriptions;
