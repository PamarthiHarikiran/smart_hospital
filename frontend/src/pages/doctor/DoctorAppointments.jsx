import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  FileText,
  Pill,
  FlaskConical,
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await appointmentService.getAppointments({
        status: statusFilter,
        date: dateFilter,
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
  }, [statusFilter, dateFilter, page]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await appointmentService.updateAppointment(id, { status });
      fetchAppointments();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
            Patient Consultations Queue
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            Manage appointments, confirm visits, update patient outcomes, and launch clinical workflows.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            style={{ marginBottom: 0, width: '160px' }}
          />

          <div style={{ width: '160px' }}>
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
              style={{ marginBottom: 0 }}
            />
          </div>
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
          description="There are no consultations matching your filter criteria."
        />
      ) : (
        <div className="sh-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="sh-table-container" style={{ border: 'none' }}>
            <table className="sh-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date & Time</th>
                  <th>Clinical Reason</th>
                  <th>Status</th>
                  <th>Update Status</th>
                  <th>Clinical Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt._id}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                        {apt.patient?.name}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--gray-500)' }}>
                        {apt.patient?.gender} • Blood: {apt.patient?.bloodGroup || 'N/A'} • {apt.patient?.phone}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--gray-800)' }}>
                        {apt.date}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--gray-500)' }}>
                        {apt.time}
                      </div>
                    </td>

                    <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {apt.reason}
                    </td>

                    <td>
                      <StatusBadge status={apt.status} />
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {apt.status === 'PENDING' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleUpdateStatus(apt._id, 'CONFIRMED')}
                          >
                            Confirm
                          </Button>
                        )}

                        {apt.status === 'CONFIRMED' && (
                          <Button
                            variant="success"
                            size="sm"
                            icon={CheckCircle}
                            onClick={() => handleUpdateStatus(apt._id, 'COMPLETED')}
                          >
                            Complete
                          </Button>
                        )}

                        {['PENDING', 'CONFIRMED'].includes(apt.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={XCircle}
                            onClick={() => handleUpdateStatus(apt._id, 'CANCELLED')}
                            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={FileText}
                          title="Record Diagnosis"
                          onClick={() =>
                            navigate('/doctor/medical-records', {
                              state: {
                                patientId: apt.patient?._id,
                                appointmentId: apt._id,
                              },
                            })
                          }
                        >
                          Diagnose
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Pill}
                          title="Prescribe Medicine"
                          onClick={() =>
                            navigate('/doctor/prescriptions', {
                              state: {
                                patientId: apt.patient?._id,
                              },
                            })
                          }
                        >
                          Rx
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          icon={FlaskConical}
                          title="Order Diagnostic Lab Test"
                          onClick={() =>
                            navigate('/doctor/lab-reports', {
                              state: {
                                patientId: apt.patient?._id,
                                appointmentId: apt._id,
                              },
                            })
                          }
                        >
                          Lab
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
