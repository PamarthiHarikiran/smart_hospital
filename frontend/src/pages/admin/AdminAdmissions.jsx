import React, { useState, useEffect } from 'react';
import { admissionService } from '../../services/admissionService';
import { bedService } from '../../services/bedService';
import { userService } from '../../services/userService';
import { UserCheck, Plus, Search, CheckCircle, LogOut, Bed } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const AdminAdmissions = () => {
  const [admissions, setAdmissions] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    patient: '',
    doctor: '',
    bed: '',
    admissionDate: new Date().toISOString().split('T')[0],
    expectedDischargeDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reason: '',
  });

  // Discharge Dialog
  const [dischargingAdmission, setDischargingAdmission] = useState(null);
  const [dischargeLoading, setDischargeLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [admRes, bedRes, patRes, docRes] = await Promise.all([
        admissionService.getAdmissions({ status: statusFilter, search, page, limit: 10 }),
        bedService.getBeds({ status: 'AVAILABLE', limit: 100 }),
        userService.getUsers({ role: 'PATIENT', limit: 100 }),
        userService.getDoctors(),
      ]);

      if (admRes.success) {
        setAdmissions(admRes.data || []);
        setPagination(admRes.pagination);
      }
      if (bedRes.success) setAvailableBeds(bedRes.data || []);
      if (patRes.success) setPatients(patRes.data || []);
      if (docRes.success) setDoctors(docRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load admissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, search, page]);

  const handleOpenAdmit = () => {
    setFormData({
      patient: patients[0]?._id || '',
      doctor: doctors[0]?._id || '',
      bed: availableBeds[0]?._id || '',
      admissionDate: new Date().toISOString().split('T')[0],
      expectedDischargeDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reason: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleAdmitSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient || !formData.doctor || !formData.bed || !formData.reason) {
      setFormError('Patient, doctor, bed, and reason are required');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const res = await admissionService.createAdmission(formData);
      if (res.success) {
        setIsModalOpen(false);
        loadData();
      }
    } catch (err) {
      setFormError(err.message || 'Admission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischargeConfirm = async () => {
    if (!dischargingAdmission) return;
    setDischargeLoading(true);
    try {
      const res = await admissionService.dischargePatient(dischargingAdmission._id);
      if (res.success) {
        setDischargingAdmission(null);
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Discharge failed');
    } finally {
      setDischargeLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
            Inpatient Admissions & Ward Discharges
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            Admit patients to available beds, automate bed state transitions, and process patient discharges.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={handleOpenAdmit}>
          Admit Patient to Bed
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search admissions by reason..."
          style={{ flex: 1, minWidth: '240px' }}
        />

        <div style={{ width: '180px' }}>
          <Select
            placeholder="All Admissions"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Admissions' },
              { value: 'ADMITTED', label: 'Admitted (Inpatient)' },
              { value: 'DISCHARGED', label: 'Discharged' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving admission logs..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadData} />
      ) : admissions.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No admissions found"
          description="Click 'Admit Patient to Bed' to initiate an inpatient hospital stay."
          actionText="Admit Patient"
          onAction={handleOpenAdmit}
        />
      ) : (
        <div className="sh-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="sh-table-container" style={{ border: 'none' }}>
            <table className="sh-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Attending Doctor</th>
                  <th>Assigned Bed</th>
                  <th>Admission Date</th>
                  <th>Clinical Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map((adm) => (
                  <tr key={adm._id}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                        {adm.patient?.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        {adm.patient?.gender} • Blood: {adm.patient?.bloodGroup}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '600' }}>Dr. {adm.doctor?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{adm.doctor?.specialization}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--primary-700)' }}>
                        {adm.bed?.bedNumber || 'Assigned Bed'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        {adm.bed?.ward}
                      </div>
                    </td>

                    <td>{new Date(adm.admissionDate).toLocaleDateString()}</td>

                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {adm.reason}
                    </td>

                    <td>
                      <StatusBadge status={adm.status} />
                    </td>

                    <td>
                      {adm.status === 'ADMITTED' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={LogOut}
                          onClick={() => setDischargingAdmission(adm)}
                          style={{ color: '#059669', borderColor: '#a7f3d0' }}
                        >
                          Discharge
                        </Button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                          Discharged on {new Date(adm.dischargeDate).toLocaleDateString()}
                        </span>
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

      {/* Admit Patient Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Admit Patient to Hospital Ward"
        maxWidth="640px"
      >
        <form onSubmit={handleAdmitSubmit}>
          {formError && <ErrorMessage message={formError} />}

          <Select
            label="Patient to Admit"
            value={formData.patient}
            onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
            options={patients.map((p) => ({ value: p._id, label: `${p.name} (${p.phone || p.email})` }))}
            required
          />

          <div className="grid-2">
            <Select
              label="Attending Doctor"
              value={formData.doctor}
              onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
              options={doctors.map((d) => ({ value: d._id, label: `Dr. ${d.name} (${d.department?.name || 'Specialist'})` }))}
              required
            />

            <Select
              label="Assign Available Bed"
              value={formData.bed}
              onChange={(e) => setFormData({ ...formData, bed: e.target.value })}
              options={availableBeds.map((b) => ({ value: b._id, label: `${b.bedNumber} - ${b.ward} (${b.bedType})` }))}
              placeholder={availableBeds.length === 0 ? 'No beds currently AVAILABLE' : 'Select an available bed'}
              required
            />
          </div>

          <div className="grid-2">
            <Input
              label="Admission Date"
              type="date"
              value={formData.admissionDate}
              onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
              required
            />

            <Input
              label="Expected Discharge Date"
              type="date"
              value={formData.expectedDischargeDate}
              onChange={(e) => setFormData({ ...formData, expectedDischargeDate: e.target.value })}
            />
          </div>

          <Input
            label="Clinical Reason for Inpatient Admission"
            placeholder="e.g. Post-cardiac observation, IV hydration therapy, fracture immobilization"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting} disabled={availableBeds.length === 0}>
              Confirm Admission (Assign Bed)
            </Button>
          </div>
        </form>
      </Modal>

      {/* Discharge Dialog */}
      <ConfirmDialog
        isOpen={!!dischargingAdmission}
        onClose={() => setDischargingAdmission(null)}
        onConfirm={handleDischargeConfirm}
        title="Discharge Patient"
        message={`Discharge ${dischargingAdmission?.patient?.name}? Bed ${dischargingAdmission?.bed?.bedNumber} will automatically transition back to AVAILABLE status.`}
        confirmText="Confirm Discharge"
        variant="success"
        loading={dischargeLoading}
      />
    </div>
  );
};

export default AdminAdmissions;
