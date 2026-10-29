import React, { useState, useEffect } from 'react';
import { appointmentService } from '../../services/appointmentService';
import { departmentService } from '../../services/departmentService';
import { Calendar, Search, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Delete Dialog
  const [deletingApt, setDeletingApt] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [aptRes, deptRes] = await Promise.all([
        appointmentService.getAppointments({
          status: statusFilter,
          department: deptFilter,
          search,
          page,
          limit: 10,
        }),
        departmentService.getDepartments({ status: 'ACTIVE' }),
      ]);
      if (aptRes.success) {
        setAppointments(aptRes.data || []);
        setPagination(aptRes.pagination);
      }
      if (deptRes.success) {
        setDepartments(deptRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, deptFilter, search, page]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await appointmentService.updateAppointment(id, { status });
      loadData();
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleDelete = async () => {
    if (!deletingApt) return;
    setDeleteLoading(true);
    try {
      await appointmentService.deleteAppointment(deletingApt._id);
      setDeletingApt(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete appointment');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
          Master Appointment Schedule & Telemetry
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
          Hospital-wide clinical consultation bookings across all medical departments.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by reason..."
          style={{ flex: 1, minWidth: '220px' }}
        />

        <div style={{ width: '180px' }}>
          <Select
            placeholder="All Departments"
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            options={departments.map((d) => ({ value: d._id, label: d.name }))}
          />
        </div>

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
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving appointment records..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadData} />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments found"
          description="There are no consultations matching the specified filters."
        />
      ) : (
        <div className="sh-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="sh-table-container" style={{ border: 'none' }}>
            <table className="sh-table">
              <thead>
                <tr>
                  <th>Patient</th>
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
                      <div style={{ fontWeight: '600' }}>{apt.patient?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{apt.patient?.phone}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '600' }}>Dr. {apt.doctor?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{apt.doctor?.specialization}</div>
                    </td>

                    <td>{apt.department?.name || 'General'}</td>

                    <td>
                      <div style={{ fontWeight: '500' }}>{apt.date}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{apt.time}</div>
                    </td>

                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

                        <Button
                          variant="outline"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setDeletingApt(apt)}
                          style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                        >
                          Delete
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingApt}
        onClose={() => setDeletingApt(null)}
        onConfirm={handleDelete}
        title="Delete Appointment Record"
        message={`Delete booking for ${deletingApt?.patient?.name} on ${deletingApt?.date} at ${deletingApt?.time}?`}
        confirmText="Yes, Delete Record"
        loading={deleteLoading}
      />
    </div>
  );
};

export default AdminAppointments;
