import React, { useState, useEffect } from 'react';
import { appointmentService } from '../../services/appointmentService';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  XCircle,
  FileText,
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cancel dialog state
  const [cancellingApt, setCancellingApt] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await appointmentService.getAppointments({
        status: statusFilter,
        page,
        limit: 10,
      });
      if (res.success) {
        setAppointments(res.data || []);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, page]);

  const handleConfirmCancel = async () => {
    if (!cancellingApt) return;
    setCancelLoading(true);
    try {
      const res = await appointmentService.deleteAppointment(cancellingApt._id);
      if (res.success) {
        setCancellingApt(null);
        fetchAppointments();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
            My Appointments
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            Review past and upcoming hospital clinical bookings.
          </p>
        </div>

        <div style={{ width: '200px' }}>
          <Select
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving appointment records..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchAppointments} />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments found"
          description={statusFilter ? `No ${statusFilter.toLowerCase()} appointments match.` : 'You have not booked any appointments yet.'}
        />
      ) : (
        <div className="sh-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="sh-table-container" style={{ border: 'none' }}>
            <table className="sh-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Date & Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt._id}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                        Dr. {apt.doctor?.name}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--gray-500)' }}>
                        {apt.doctor?.specialization}
                      </div>
                    </td>

                    <td>{apt.department?.name || 'General'}</td>

                    <td>
                      <div style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                        {apt.date}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--gray-500)' }}>
                        {apt.time}
                      </div>
                    </td>

                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {apt.reason}
                    </td>

                    <td>
                      <StatusBadge status={apt.status} />
                    </td>

                    <td>
                      {['PENDING', 'CONFIRMED'].includes(apt.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={XCircle}
                          onClick={() => setCancellingApt(apt)}
                          style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!cancellingApt}
        onClose={() => setCancellingApt(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel your consultation with Dr. ${cancellingApt?.doctor?.name} scheduled for ${cancellingApt?.date} at ${cancellingApt?.time}?`}
        confirmText="Yes, Cancel Booking"
        loading={cancelLoading}
      />
    </div>
  );
};

export default PatientAppointments;
