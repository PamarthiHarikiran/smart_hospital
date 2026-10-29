import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { prescriptionService } from '../../services/prescriptionService';
import {
  Pill,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle,
  Package,
  ArrowRight,
} from 'lucide-react';
import DashboardCard from '../../components/common/DashboardCard';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';

const PharmacyDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardService.getPharmacyDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load pharmacy dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleDispense = async (prescriptionId) => {
    try {
      await prescriptionService.updatePrescription(prescriptionId, {
        status: 'COMPLETED',
        dispense: true,
      });
      fetchDashboard();
    } catch (err) {
      alert(err.message || 'Failed to dispense prescription');
    }
  };

  if (loading) return <LoadingSpinner text="Connecting to Central Pharmacy System..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchDashboard} />;

  const { kpi, recentPrescriptions = [], lowStockItems = [] } = data || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
          Hospital Central Pharmacy & Dispensary
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
          Monitor inventory levels, dispense medications, and review automated stock & expiry alerts.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid-4">
        <DashboardCard
          title="Active Formularies"
          value={kpi?.totalMedicines ?? 0}
          subtitle="Cataloged pharmaceuticals"
          icon={Package}
          color="blue"
          onClick={() => navigate('/pharmacy/medicines')}
        />

        <DashboardCard
          title="Low Stock Alert"
          value={kpi?.lowStockCount ?? 0}
          subtitle="Below minimum threshold"
          icon={AlertTriangle}
          color={kpi?.lowStockCount > 0 ? 'red' : 'green'}
          onClick={() => navigate('/pharmacy/alerts')}
        />

        <DashboardCard
          title="Expiring Soon"
          value={kpi?.expiringCount ?? 0}
          subtitle="Within next 30 days"
          icon={Clock}
          color={kpi?.expiringCount > 0 ? 'amber' : 'green'}
          onClick={() => navigate('/pharmacy/alerts')}
        />

        <DashboardCard
          title="Pending Rx"
          value={kpi?.pendingPrescriptionsCount ?? 0}
          subtitle="Awaiting fulfillment"
          icon={Pill}
          color="purple"
          onClick={() => navigate('/pharmacy/prescriptions')}
        />
      </div>

      {/* Grid: Pending Prescriptions & Low Stock Alerts */}
      <div className="grid-2">
        {/* Prescriptions to Dispense */}
        <div className="sh-card">
          <div className="sh-card-header">
            <h2 className="sh-card-title">
              <Pill size={20} color="var(--primary-600)" />
              Pending Prescriptions to Dispense
            </h2>
            <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('/pharmacy/prescriptions')}>
              All Rx
            </Button>
          </div>

          {recentPrescriptions.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="All prescriptions fulfilled"
              description="There are no pending medication orders."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentPrescriptions.map((rx) => (
                <div
                  key={rx._id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                      {rx.patient?.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      Dr. {rx.doctor?.name} • {rx.medicines?.length || 0} medicine(s)
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle}
                    onClick={() => handleDispense(rx._id)}
                  >
                    Dispense & Deduct Stock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Warning Box */}
        <div className="sh-card">
          <div className="sh-card-header">
            <h2 className="sh-card-title">
              <AlertTriangle size={20} color="#dc2626" />
              Low Stock Replenishment Warnings
            </h2>
            <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('/pharmacy/alerts')}>
              Full Alerts
            </Button>
          </div>

          {lowStockItems.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Healthy inventory levels"
              description="All medicines meet or exceed minimum safety stocks."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {lowStockItems.map((med) => (
                <div
                  key={med._id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #fecaca',
                    backgroundColor: '#fff5f5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: '#991b1b' }}>
                      {med.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#b91c1c' }}>
                      Batch: {med.batchNumber} • Min Threshold: {med.minimumStock}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#dc2626' }}>
                      {med.stock} units
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
