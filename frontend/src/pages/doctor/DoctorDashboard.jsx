import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { appointmentService } from '../../services/appointmentService';
import {
  Calendar,
  Clock,
  Users,
  FileText,
  FlaskConical,
  CheckCircle,
  XCircle,
  PlusCircle,
  Pill,
  Stethoscope,
  Award,
} from 'lucide-react';
import DashboardCard from '../../components/common/DashboardCard';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardService.getDoctorDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load doctor dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      await appointmentService.updateAppointment(appointmentId, { status });
      fetchDashboard();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  if (loading) return <LoadingSpinner text="Loading clinical workspace..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchDashboard} />;

  const { kpi, todayAppointments = [], recentRecords = [], pendingLabs = [] } = data || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Dynamic Authenticated Doctor Profile Banner */}
      <div className="doctor-profile-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: '800',
              color: '#ffffff',
              backdropFilter: 'blur(8px)',
            }}
          >
            {user?.name ? user.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('') : 'DR'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>
                {user?.name || 'Dr. Attending Physician'}
              </h1>
              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  letterSpacing: '0.03em',
                }}
              >
                {user?.specialization || user?.department?.name || 'Clinical Specialist'}
              </span>
            </div>

            <p style={{ fontSize: '0.875rem', opacity: 0.95, marginTop: '4px', margin: 0 }}>
              {user?.qualification ? `${user.qualification} • ` : ''}
              Department: <strong>{user?.department?.name || 'Cardiology'}</strong> • Fee: <strong>${user?.consultationFee || 100}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/doctor/prescriptions')}
            style={{ backgroundColor: '#ffffff', color: '#0f766e', fontWeight: '600', borderColor: 'transparent' }}
          >
            <Pill size={15} style={{ marginRight: '6px' }} />
            Write Prescription
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/doctor/appointments')}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.4)', fontWeight: '600' }}
          >
            <Calendar size={15} style={{ marginRight: '6px' }} />
            Consultation Queue
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4">
        <DashboardCard
          title="Today's Appointments"
          value={kpi?.todayAppointmentsCount ?? 0}
          subtitle="Scheduled today"
          icon={Calendar}
          color="blue"
        />

        <DashboardCard
          title="Upcoming Queue"
          value={kpi?.upcomingAppointmentsCount ?? 0}
          subtitle="Future consultations"
          icon={Clock}
          color="teal"
        />

        <DashboardCard
          title="Total Patients"
          value={kpi?.totalPatients ?? 0}
          subtitle="Unique individuals attended"
          icon={Users}
          color="green"
        />

        <DashboardCard
          title="Pending Labs"
          value={kpi?.pendingLabReportsCount ?? 0}
          subtitle="Diagnostic tests pending"
          icon={FlaskConical}
          color={kpi?.pendingLabReportsCount > 0 ? 'amber' : 'green'}
          onClick={() => navigate('/doctor/lab-reports')}
        />
      </div>

      {/* Today's Schedule Table */}
      <div className="sh-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--gray-900)' }}>
              Today's Consultation Schedule
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
              Active patient appointments for today
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/doctor/appointments')}>
            View All Schedule
          </Button>
        </div>

        {todayAppointments.length === 0 ? (
          <div style={{ padding: '36px' }}>
            <EmptyState
              icon={Calendar}
              title="No consultations scheduled for today"
              description="Your consultation calendar is clear for today."
            />
          </div>
        ) : (
          <div className="sh-table-container" style={{ border: 'none' }}>
            <table className="sh-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient Name</th>
                  <th>Gender / Blood</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Clinical Actions</th>
                </tr>
              </thead>
              <tbody>
                {todayAppointments.map((apt) => (
                  <tr key={apt._id}>
                    <td style={{ fontWeight: '600', color: 'var(--primary-700)' }}>
                      {apt.time}
                    </td>

                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                        {apt.patient?.name}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--gray-500)' }}>
                        {apt.patient?.phone}
                      </div>
                    </td>

                    <td>
                      {apt.patient?.gender || 'N/A'} • {apt.patient?.bloodGroup || 'N/A'}
                    </td>

                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {apt.reason}
                    </td>

                    <td>
                      <StatusBadge status={apt.status} />
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {apt.status === 'CONFIRMED' && (
                          <Button
                            variant="success"
                            size="sm"
                            icon={CheckCircle}
                            onClick={() => handleUpdateStatus(apt._id, 'COMPLETED')}
                          >
                            Mark Completed
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          icon={FileText}
                          onClick={() => navigate('/doctor/medical-records', { state: { patientId: apt.patient?._id, appointmentId: apt._id } })}
                        >
                          Diagnose
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grid: Recent Records & Pending Labs */}
      <div className="grid-2">
        <div className="sh-card">
          <div className="sh-card-header">
            <h2 className="sh-card-title">
              <FileText size={18} color="var(--primary-600)" /> Recent Diagnoses Recorded
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/doctor/medical-records')}>
              All Records
            </Button>
          </div>

          {recentRecords.length === 0 ? (
            <EmptyState title="No records created yet" description="Records you create during visits will appear here." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentRecords.map((rec) => (
                <div
                  key={rec._id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                    {rec.diagnosis}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '2px' }}>
                    Patient: {rec.patient?.name} • {new Date(rec.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sh-card">
          <div className="sh-card-header">
            <h2 className="sh-card-title">
              <FlaskConical size={18} color="var(--accent-teal)" /> Pending Diagnostic Orders
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/doctor/lab-reports')}>
              All Labs
            </Button>
          </div>

          {pendingLabs.length === 0 ? (
            <EmptyState title="No pending lab tests" description="All requested diagnostic tests are finalized." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingLabs.map((lab) => (
                <div
                  key={lab._id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                      {lab.testName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      Patient: {lab.patient?.name}
                    </div>
                  </div>
                  <StatusBadge status={lab.requestStatus} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
