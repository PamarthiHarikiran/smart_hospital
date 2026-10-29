import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import {
  Calendar,
  Clock,
  FileText,
  Pill,
  FlaskConical,
  CreditCard,
  UserCheck,
  Stethoscope,
  ArrowRight,
} from 'lucide-react';
import DashboardCard from '../../components/common/DashboardCard';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardService.getPatientDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading patient portal..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchDashboardData} />;

  const { kpi, upcomingAppointments = [], pendingBills = [], recentMedicalRecords = [], recentPrescriptions = [] } = data || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 32px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '8px' }}>
            Welcome back, {user?.name || 'Patient'}
          </h1>
          <p style={{ fontSize: '0.95rem', opacity: 0.9, maxWidth: '600px' }}>
            {user?.bloodGroup ? `Blood Group: ${user.bloodGroup} • ` : ''}Manage appointments, review clinical records, inspect laboratory test findings, and process medical invoices online.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            variant="secondary"
            icon={Stethoscope}
            onClick={() => navigate('/patient/doctors')}
            style={{ backgroundColor: '#ffffff', color: 'var(--primary-700)', fontWeight: '600' }}
          >
            Find Doctor & Book
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid-3">
        <DashboardCard
          title="Upcoming Appointments"
          value={kpi?.upcomingAppointmentsCount ?? 0}
          subtitle="Scheduled visits"
          icon={Calendar}
          color="blue"
          onClick={() => navigate('/patient/appointments')}
        />

        <DashboardCard
          title="Medical Records"
          value={kpi?.medicalRecordsCount ?? 0}
          subtitle="Clinical consultations"
          icon={FileText}
          color="teal"
          onClick={() => navigate('/patient/medical-records')}
        />

        <DashboardCard
          title="Active Prescriptions"
          value={kpi?.prescriptionsCount ?? 0}
          subtitle="Prescribed therapies"
          icon={Pill}
          color="purple"
          onClick={() => navigate('/patient/prescriptions')}
        />

        <DashboardCard
          title="Laboratory Reports"
          value={kpi?.labReportsCount ?? 0}
          subtitle="Diagnostic tests"
          icon={FlaskConical}
          color="amber"
          onClick={() => navigate('/patient/lab-reports')}
        />

        <DashboardCard
          title="Pending Invoices"
          value={kpi?.pendingBillsCount ?? 0}
          subtitle="Bills awaiting settlement"
          icon={CreditCard}
          color={kpi?.pendingBillsCount > 0 ? 'red' : 'green'}
          onClick={() => navigate('/patient/bills')}
        />

        <DashboardCard
          title="Lifetime Visits"
          value={kpi?.totalAppointments ?? 0}
          subtitle="Total hospital visits"
          icon={UserCheck}
          color="green"
          onClick={() => navigate('/patient/appointments')}
        />
      </div>

      {/* Content Grid: Next Appointments & Recent Medical History */}
      <div className="grid-2">
        {/* Upcoming Appointments */}
        <div className="sh-card">
          <div className="sh-card-header">
            <h2 className="sh-card-title">
              <Calendar size={20} color="var(--primary-600)" />
              Next Scheduled Appointments
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/patient/appointments')} icon={ArrowRight}>
              View All
            </Button>
          </div>

          {upcomingAppointments.length === 0 ? (
            <EmptyState
              title="No upcoming visits"
              description="You have no appointments scheduled for upcoming dates."
              actionText="Book an Appointment"
              onAction={() => navigate('/patient/doctors')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt._id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                      Dr. {apt.doctor?.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      {apt.department?.name || 'Specialist'} • Reason: {apt.reason}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--gray-800)' }}>
                      {apt.date} at {apt.time}
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Invoices / Recent Prescriptions */}
        <div className="sh-card">
          <div className="sh-card-header">
            <h2 className="sh-card-title">
              <CreditCard size={20} color="var(--accent-teal)" />
              Pending Hospital Invoices
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/patient/bills')} icon={ArrowRight}>
              All Invoices
            </Button>
          </div>

          {pendingBills.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No pending invoices"
              description="All your hospital bills and consultation dues are settled."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingBills.map((bill) => (
                <div
                  key={bill._id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#fffdfb',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                      Invoice #{bill._id.slice(-6).toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      {bill.items?.length || 1} item(s) • Issued on {new Date(bill.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                      ${bill.total?.toFixed(2)}
                    </div>
                    <Button variant="primary" size="sm" onClick={() => navigate('/patient/bills')}>
                      Pay Now
                    </Button>
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

export default PatientDashboard;
