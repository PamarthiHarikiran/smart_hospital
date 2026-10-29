import React, { useState, useEffect } from 'react';
import { medicineService } from '../../services/medicineService';
import {
  AlertTriangle,
  Clock,
  XCircle,
  Package,
  Layers,
  CheckCircle,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';

const PharmacyAlerts = () => {
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quick Restock Modal
  const [restockMed, setRestockMed] = useState(null);
  const [unitsToAdd, setUnitsToAdd] = useState('50');
  const [restocking, setRestocking] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await medicineService.getAlerts();
      if (res.success) {
        setAlerts(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load medicine alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!restockMed || !unitsToAdd) return;

    setRestocking(true);
    try {
      await medicineService.updateStock(restockMed._id, {
        adjustment: Number(unitsToAdd),
      });
      setRestockMed(null);
      fetchAlerts();
    } catch (err) {
      alert(err.message || 'Restock failed');
    } finally {
      setRestocking(false);
    }
  };

  if (loading) return <LoadingSpinner text="Scanning pharmaceutical inventory for anomalies..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchAlerts} />;

  const { lowStock, expiringSoon, expired, totalAlerts = 0 } = alerts || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
          Automated Pharmaceutical Inventory Alerts (Decision Support)
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
          Rule-based monitoring of safety thresholds, impending expiration milestones, and expired stock.
        </p>
      </div>

      {totalAlerts === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="All Formularies In Good Standing"
          description="Zero critical inventory alerts. Stock levels exceed minimum thresholds and no medicines are expiring within 30 days."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* SECTION 1: Low Stock Alerts */}
          <div className="sh-card" style={{ borderLeft: '4px solid #dc2626' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <AlertTriangle size={22} color="#dc2626" />
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#991b1b' }}>
                  Critical Low Stock Alerts ({lowStock?.count || 0})
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                  Current inventory is at or below the safety threshold
                </span>
              </div>
            </div>

            {lowStock?.items?.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>No low stock alerts active.</p>
            ) : (
              <div className="sh-table-container">
                <table className="sh-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Category</th>
                      <th>Batch Number</th>
                      <th>Current Stock</th>
                      <th>Safety Threshold</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.items.map((m) => (
                      <tr key={m._id}>
                        <td style={{ fontWeight: '600', color: '#991b1b' }}>{m.name}</td>
                        <td>{m.category}</td>
                        <td style={{ fontFamily: 'monospace' }}>{m.batchNumber}</td>
                        <td style={{ fontWeight: '700', color: '#dc2626' }}>{m.stock} units</td>
                        <td>{m.minimumStock} units</td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Layers}
                            onClick={() => {
                              setRestockMed(m);
                              setUnitsToAdd('50');
                            }}
                          >
                            Restock Units
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 2: Expiring Soon Alerts (30 Days) */}
          <div className="sh-card" style={{ borderLeft: '4px solid #d97706' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Clock size={22} color="#d97706" />
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#92400e' }}>
                  Expiring Within 30 Days ({expiringSoon?.count || 0})
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                  Batches reaching their manufacturer shelf-life limit
                </span>
              </div>
            </div>

            {expiringSoon?.items?.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>No medicines expiring in the next 30 days.</p>
            ) : (
              <div className="sh-table-container">
                <table className="sh-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Batch Number</th>
                      <th>Stock on Hand</th>
                      <th>Expiry Date</th>
                      <th>Days Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringSoon.items.map((m) => {
                      const daysLeft = Math.ceil((new Date(m.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={m._id}>
                          <td style={{ fontWeight: '600' }}>{m.name}</td>
                          <td style={{ fontFamily: 'monospace' }}>{m.batchNumber}</td>
                          <td>{m.stock} units</td>
                          <td style={{ fontWeight: '600', color: '#d97706' }}>
                            {new Date(m.expiryDate).toLocaleDateString()}
                          </td>
                          <td>
                            <span style={{ padding: '2px 8px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '4px', fontWeight: '600', fontSize: '0.8rem' }}>
                              {daysLeft} days left
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 3: Expired Medicines */}
          <div className="sh-card" style={{ borderLeft: '4px solid #64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <XCircle size={22} color="#64748b" />
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#334155' }}>
                  Expired Pharmaceuticals ({expired?.count || 0})
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                  Must be quarantined and decommissioned from clinical dispensing
                </span>
              </div>
            </div>

            {expired?.items?.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>No expired medications present in inventory.</p>
            ) : (
              <div className="sh-table-container">
                <table className="sh-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Batch Number</th>
                      <th>Remaining Units</th>
                      <th>Expired On</th>
                      <th>Protocol Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expired.items.map((m) => (
                      <tr key={m._id}>
                        <td style={{ fontWeight: '600' }}>{m.name}</td>
                        <td style={{ fontFamily: 'monospace' }}>{m.batchNumber}</td>
                        <td>{m.stock} units</td>
                        <td style={{ color: '#dc2626', fontWeight: '600' }}>
                          {new Date(m.expiryDate).toLocaleDateString()}
                        </td>
                        <td>
                          <span style={{ padding: '3px 8px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                            QUARANTINE REQUIRED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockMed && (
        <Modal
          isOpen={!!restockMed}
          onClose={() => setRestockMed(null)}
          title={`Restock: ${restockMed.name}`}
          maxWidth="460px"
        >
          <form onSubmit={handleRestock}>
            <div style={{ marginBottom: '16px', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              Current stock: <strong>{restockMed.stock}</strong> units | Safety threshold: <strong>{restockMed.minimumStock}</strong> units
            </div>

            <Input
              label="Units to Add to Inventory"
              type="number"
              min="1"
              value={unitsToAdd}
              onChange={(e) => setUnitsToAdd(e.target.value)}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setRestockMed(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={restocking}>
                Confirm Restock
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PharmacyAlerts;
