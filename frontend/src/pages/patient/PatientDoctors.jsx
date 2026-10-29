import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { departmentService } from '../../services/departmentService';
import { appointmentService } from '../../services/appointmentService';
import {
  Search,
  Filter,
  Sparkles,
  Calendar,
  Clock,
  DollarSign,
  Award,
  AlertCircle,
  CheckCircle,
  Stethoscope,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';

const PatientDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Smart Feature 1: Symptom Recommender state
  const [symptomInput, setSymptomInput] = useState('');
  const [symptomRecommendation, setSymptomRecommendation] = useState(null);
  const [recommending, setRecommending] = useState(false);

  // Booking Modal State (Smart Feature 2)
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Tomorrow
  );
  const [reason, setReason] = useState('');
  const [slotData, setSlotData] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [docRes, deptRes] = await Promise.all([
        userService.getDoctors({ department: selectedDept, search: searchTerm }),
        departmentService.getDepartments({ status: 'ACTIVE' }),
      ]);
      if (docRes.success) setDoctors(docRes.data || []);
      if (deptRes.success) setDepartments(deptRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load doctors catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDept, searchTerm]);

  // SMART FEATURE 1: Symptom based recommendation
  const handleRecommendDepartment = async (e) => {
    e?.preventDefault();
    if (!symptomInput.trim()) return;

    setRecommending(true);
    try {
      const res = await departmentService.recommendDepartment(symptomInput);
      if (res.success && res.data) {
        setSymptomRecommendation(res.data);
        if (res.data.departmentId) {
          setSelectedDept(res.data.departmentId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecommending(false);
    }
  };

  // SMART FEATURE 2: Fetch available slots dynamically
  const fetchAvailableSlots = async (docId, date) => {
    if (!docId || !date) return;
    setLoadingSlots(true);
    setSelectedSlot('');
    setBookingError('');
    try {
      const res = await appointmentService.getAvailableSlots(docId, date);
      if (res.success) {
        setSlotData(res.data);
        // Automatically select the earliest recommended slot
        if (res.data.earliestSlot) {
          setSelectedSlot(res.data.earliestSlot);
        }
      }
    } catch (err) {
      setBookingError(err.message || 'Failed to load doctor slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleOpenBooking = (doc) => {
    setSelectedDoctor(doc);
    setReason('');
    setBookingSuccess('');
    setBookingError('');
    fetchAvailableSlots(doc._id, bookingDate);
  };

  const handleDateChange = (newDate) => {
    setBookingDate(newDate);
    if (selectedDoctor) {
      fetchAvailableSlots(selectedDoctor._id, newDate);
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setBookingError('Please choose a time slot.');
      return;
    }
    if (!reason.trim()) {
      setBookingError('Please enter the primary reason for consultation.');
      return;
    }

    setBookingSubmitting(true);
    setBookingError('');

    try {
      const payload = {
        doctor: selectedDoctor._id,
        department: selectedDoctor.department?._id || selectedDoctor.department,
        date: bookingDate,
        time: selectedSlot,
        reason,
      };

      const res = await appointmentService.createAppointment(payload);
      if (res.success) {
        setBookingSuccess(`Appointment successfully booked for ${bookingDate} at ${selectedSlot}!`);
        // Refresh slot availability
        fetchAvailableSlots(selectedDoctor._id, bookingDate);
      }
    } catch (err) {
      setBookingError(err.message || 'Failed to book appointment');
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
          Find Doctors & Schedule Consultation
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
          Explore hospital specialists, run smart symptom triage, and pick real-time available appointment slots.
        </p>
      </div>

      {/* SMART FEATURE 1: AI / Rule-based Symptom Department Triage Box */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
          border: '1px solid #99f6e4',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles size={20} color="#0d9488" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f766e' }}>
            Smart Department Recommendation (Decision Support)
          </h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#134e4a', marginBottom: '14px' }}>
          Enter what you are experiencing (e.g. <em>"chest pain and high heart rate"</em> or <em>"persistent fever, cough and body chills"</em>) to identify the appropriate department.
        </p>

        <form onSubmit={handleRecommendDepartment} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={symptomInput}
            onChange={(e) => setSymptomInput(e.target.value)}
            placeholder="Type symptoms here (e.g. fever, headache, knee pain, rash)..."
            style={{
              flex: 1,
              minWidth: '280px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #99f6e4',
              backgroundColor: '#ffffff',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <Button
            type="submit"
            variant="primary"
            loading={recommending}
            style={{ backgroundColor: '#0d9488', borderColor: '#0d9488' }}
            icon={Sparkles}
          >
            Find Department
          </Button>
          {symptomRecommendation && (
            <Button
              variant="outline"
              onClick={() => {
                setSymptomRecommendation(null);
                setSelectedDept('');
                setSymptomInput('');
              }}
            >
              Reset Filter
            </Button>
          )}
        </form>

        {symptomRecommendation && (
          <div
            style={{
              marginTop: '16px',
              backgroundColor: '#ffffff',
              padding: '14px 18px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #99f6e4',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#0f766e' }}>
              <CheckCircle size={18} />
              Recommended Department: {symptomRecommendation.recommendedDepartment}
              <span
                style={{
                  fontSize: '0.725rem',
                  padding: '2px 8px',
                  backgroundColor: '#ccfbf1',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {symptomRecommendation.confidence} MATCH
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '4px' }}>
              {symptomRecommendation.guidance}
            </p>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--gray-500)',
                fontStyle: 'italic',
                marginTop: '8px',
                borderTop: '1px dashed var(--gray-200)',
                paddingTop: '6px',
              }}
            >
              ⚠️ Disclaimer: {symptomRecommendation.disclaimer}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div
        className="sh-card"
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '16px 20px',
        }}
      >
        <div style={{ flex: 1, minWidth: '220px' }}>
          <Input
            placeholder="Search doctors by name or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
            style={{ marginBottom: 0 }}
          />
        </div>

        <div style={{ width: '240px' }}>
          <Select
            placeholder="All Departments"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            options={departments.map((d) => ({ value: d._id, label: d.name }))}
            style={{ marginBottom: 0 }}
          />
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <LoadingSpinner text="Searching available clinicians..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadData} />
      ) : doctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors found"
          description="Try broadening your department filter or search keyword."
          actionText="Clear Filters"
          onAction={() => {
            setSelectedDept('');
            setSearchTerm('');
          }}
        />
      ) : (
        <div className="grid-3">
          {doctors.map((doc) => (
            <div
              key={doc._id}
              className="sh-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--primary-100)',
                      color: 'var(--primary-700)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '1.2rem',
                    }}
                  >
                    {doc.name[0]}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                      Dr. {doc.name}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary-600)', fontWeight: '500' }}>
                      {doc.department?.name || 'Specialist'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Stethoscope size={16} color="var(--gray-400)" />
                    <span>{doc.specialization || 'Clinical Specialist'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={16} color="var(--gray-400)" />
                    <span>{doc.qualification || 'Board Certified'} ({doc.experience} yrs exp)</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={16} color="var(--gray-400)" />
                    <span style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                      ${doc.consultationFee || 50} Consultation Fee
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => handleOpenBooking(doc)}
                icon={Calendar}
                style={{ width: '100%' }}
              >
                Book Appointment
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* SMART FEATURE 2: Real-time Slot Optimization & Booking Modal */}
      {selectedDoctor && (
        <Modal
          isOpen={!!selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          title={`Book Appointment - Dr. ${selectedDoctor.name}`}
          maxWidth="640px"
        >
          {bookingSuccess ? (
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <CheckCircle size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '8px' }}>
                Booking Confirmed!
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)', marginBottom: '20px' }}>
                {bookingSuccess}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <Button variant="secondary" onClick={() => setSelectedDoctor(null)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBookSubmit}>
              {bookingError && <ErrorMessage message={bookingError} />}

              {/* Consultation Info Banner */}
              <div
                style={{
                  backgroundColor: 'var(--gray-50)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '18px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Department: <strong>{selectedDoctor.department?.name || 'General'}</strong></span>
                <span>Fee: <strong>${selectedDoctor.consultationFee}</strong></span>
              </div>

              {/* Date Selection */}
              <Input
                label="Appointment Date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={bookingDate}
                onChange={(e) => handleDateChange(e.target.value)}
                required
              />

              {/* Slot Availability Optimizer */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', display: 'block', marginBottom: '8px' }}>
                  Select Time Slot (Dynamic Double-Booking Protection)
                </label>

                {loadingSlots ? (
                  <LoadingSpinner text="Optimizing available doctor slots..." size={20} />
                ) : !slotData || slotData.allSlots?.length === 0 ? (
                  <div style={{ padding: '16px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    Dr. {selectedDoctor.name} does not have consultation hours on {slotData?.dayOfWeek || 'this date'}. Please select another date.
                  </div>
                ) : (
                  <>
                    {slotData.earliestSlot && (
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: '#0d9488',
                          marginBottom: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: '600',
                        }}
                      >
                        <Sparkles size={14} /> Earliest Available Slot Recommended: {slotData.earliestSlot}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {slotData.allSlots.map((slot) => {
                        const isBooked = slotData.bookedSlots?.includes(slot);
                        const isSelected = selectedSlot === slot;
                        const isEarliest = slotData.earliestSlot === slot;

                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBooked}
                            onClick={() => setSelectedSlot(slot)}
                            style={{
                              padding: '10px 6px',
                              borderRadius: 'var(--radius-sm)',
                              border: `1px solid ${
                                isSelected
                                  ? 'var(--primary-600)'
                                  : isBooked
                                  ? 'var(--gray-200)'
                                  : isEarliest
                                  ? '#99f6e4'
                                  : 'var(--border-subtle)'
                              }`,
                              backgroundColor: isSelected
                                ? 'var(--primary-600)'
                                : isBooked
                                ? 'var(--gray-100)'
                                : isEarliest
                                ? '#f0fdfa'
                                : '#ffffff',
                              color: isSelected
                                ? '#ffffff'
                                : isBooked
                                ? 'var(--gray-400)'
                                : isEarliest
                                ? '#0d9488'
                                : 'var(--gray-800)',
                              fontSize: '0.8rem',
                              fontWeight: isSelected || isEarliest ? '600' : '500',
                              cursor: isBooked ? 'not-allowed' : 'pointer',
                              textDecoration: isBooked ? 'line-through' : 'none',
                              position: 'relative',
                            }}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Consultation Reason */}
              <Input
                label="Reason for Visit / Chief Symptoms"
                placeholder="Briefly state symptoms or clinical concerns..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <Button variant="secondary" onClick={() => setSelectedDoctor(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={bookingSubmitting}
                  disabled={!selectedSlot}
                >
                  Confirm & Reserve Slot
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};

export default PatientDoctors;
