import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { labReportService } from '../../services/labReportService';
import {
  FlaskConical,
  Upload,
  ArrowLeft,
  CheckCircle,
  FileText,
  ExternalLink,
  Plus,
  Trash2,
  Eye,
  Radio,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import LabReportDetailsModal from '../../components/lab/LabReportDetailsModal';

const LabReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form Fields
  const [requestStatus, setRequestStatus] = useState('PROCESSING');
  const [sampleType, setSampleType] = useState('Whole Blood (EDTA)');
  const [sampleCollectedBy, setSampleCollectedBy] = useState('');
  const [result, setResult] = useState('');
  const [remarks, setRemarks] = useState('');
  const [price, setPrice] = useState(0);
  const [file, setFile] = useState(null);
  const [statusNote, setStatusNote] = useState('');

  // Parameters Table State
  const [parameters, setParameters] = useState([]);

  // Pathologist Verification
  const [verifiedByName, setVerifiedByName] = useState('Dr. Arthur Conan, MD, FACP');
  const [verifiedByLicense, setVerifiedByLicense] = useState('MED-PATH-88492');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await labReportService.getLabReportById(id);
      if (res.success && res.data) {
        const d = res.data;
        setReport(d);
        setRequestStatus(d.requestStatus || 'PROCESSING');
        setSampleType(d.sampleType || 'Whole Blood (EDTA)');
        setSampleCollectedBy(d.sampleCollectedBy || '');
        setResult(d.result || '');
        setRemarks(d.remarks || '');
        setPrice(d.price || 0);
        setParameters(
          d.parameters && d.parameters.length > 0
            ? d.parameters
            : [
                { name: 'Investigation Analyte', value: '', unit: '', referenceRange: '', status: 'NORMAL' },
              ]
        );
        if (d.verifiedBy?.name) setVerifiedByName(d.verifiedBy.name);
        if (d.verifiedBy?.licenseNumber) setVerifiedByLicense(d.verifiedBy.licenseNumber);
      }
    } catch (err) {
      setError(err.message || 'Failed to load report details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [id]);

  const handleAddParameter = () => {
    setParameters([
      ...parameters,
      { name: '', value: '', unit: '', referenceRange: '', status: 'NORMAL' },
    ]);
  };

  const handleRemoveParameter = (index) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleParameterChange = (index, field, val) => {
    const updated = [...parameters];
    updated[index][field] = val;
    setParameters(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('requestStatus', requestStatus);
      formData.append('sampleType', sampleType);
      formData.append('sampleCollectedBy', sampleCollectedBy);
      formData.append('result', result);
      formData.append('remarks', remarks);
      formData.append('price', price);
      formData.append('statusNote', statusNote || `Status updated to ${requestStatus}`);

      // Filter out blank parameters
      const validParams = parameters.filter((p) => p.name.trim() && p.value.trim());
      formData.append('parameters', JSON.stringify(validParams));

      formData.append(
        'verifiedBy',
        JSON.stringify({
          name: verifiedByName,
          designation: 'Chief Consultant Pathologist',
          licenseNumber: verifiedByLicense,
          verifiedAt: requestStatus === 'VERIFIED' ? new Date() : undefined,
        })
      );

      if (file) {
        formData.append('reportFile', file);
      }

      const res = await labReportService.updateLabReport(id, formData);
      if (res.success && res.data) {
        setReport(res.data);
        setSuccess(`Laboratory report successfully updated to "${requestStatus}" and broadcasted live!`);
        setFile(null);
        setStatusNote('');
      }
    } catch (err) {
      setFormError(err.message || 'Failed to update report');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Retrieving test specimen data..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadReport} />;
  if (!report) return null;

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  return (
    <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/lab/requests')}>
          Back to Queue
        </Button>

        <Button variant="outline" size="sm" icon={Eye} onClick={() => setPreviewOpen(true)}>
          Preview Full Clinical Report
        </Button>
      </div>

      <div className="sh-card" style={{ padding: '24px' }}>
        {/* Header Summary */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', color: '#0d9488', textTransform: 'uppercase', fontWeight: '700' }}>
              Accession: {report.reportId || `#${report._id.slice(-6).toUpperCase()}`}
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--gray-900)', marginTop: '2px' }}>
              {report.testName}
            </h2>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
              Patient: <strong>{report.patient?.name}</strong> • Referred by: <strong>Dr. {report.doctor?.name}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge status={report.requestStatus} />
          </div>
        </div>

        {success && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #a7f3d0',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <CheckCircle size={18} /> {success}
          </div>
        )}

        {formError && <ErrorMessage message={formError} />}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status Selection & Specimen Details */}
          <div className="grid-2">
            <Select
              label="Diagnostic Investigation Status (Real-Time)"
              value={requestStatus}
              onChange={(e) => setRequestStatus(e.target.value)}
              options={[
                { value: 'REQUESTED', label: '1. Requested — Clinical order logged' },
                { value: 'SAMPLE_COLLECTED', label: '2. Sample Collected — Accessioned at lab' },
                { value: 'PROCESSING', label: '3. Processing — In automated analyzer track' },
                { value: 'COMPLETED', label: '4. Completed — Testing finalized & QC passed' },
                { value: 'VERIFIED', label: '5. Verified — Pathologist authorized & released' },
                { value: 'CANCELLED', label: 'Cancelled — Order voided' },
              ]}
              required
            />

            <Input
              label="Specimen / Sample Type"
              value={sampleType}
              onChange={(e) => setSampleType(e.target.value)}
              placeholder="e.g. Whole Blood (EDTA), Serum, Urine..."
              required
            />
          </div>

          <div className="grid-2">
            <Input
              label="Phlebotomist / Specimen Collector"
              value={sampleCollectedBy}
              onChange={(e) => setSampleCollectedBy(e.target.value)}
              placeholder="e.g. Phlebotomist Marcus Bell"
            />

            <Input
              label="Standard Test Charge ($)"
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          {/* Individual Test Parameters / Analytes Table */}
          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px',
              backgroundColor: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                  Individual Test Analytes & Reference Intervals
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Populate parameters to display in the patient's interactive clinical report table.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={handleAddParameter}
              >
                Add Analyte Row
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {parameters.map((param, index) => (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.2fr 1fr 1.5fr 1.2fr 40px',
                    gap: '8px',
                    alignItems: 'center',
                    backgroundColor: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Analyte Name (e.g. Hemoglobin)"
                    value={param.name}
                    onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Result (e.g. 14.8)"
                    value={param.value}
                    onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      fontWeight: '600',
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Unit (g/dL)"
                    value={param.unit}
                    onChange={(e) => handleParameterChange(index, 'unit', e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Ref (13.5 - 17.5)"
                    value={param.referenceRange}
                    onChange={(e) => handleParameterChange(index, 'referenceRange', e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />

                  <select
                    value={param.status || 'NORMAL'}
                    onChange={(e) => handleParameterChange(index, 'status', e.target.value)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      outline: 'none',
                      backgroundColor:
                        param.status === 'HIGH'
                          ? '#fef2f2'
                          : param.status === 'LOW'
                          ? '#fff7ed'
                          : '#ecfdf5',
                      color:
                        param.status === 'HIGH'
                          ? '#b91c1c'
                          : param.status === 'LOW'
                          ? '#c2410c'
                          : '#047857',
                    }}
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH ↑</option>
                    <option value="LOW">LOW ↓</option>
                    <option value="ABNORMAL">ABNORMAL</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoveParameter(index)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                    }}
                    title="Remove parameter"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Findings & Pathologist Remarks */}
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', display: 'block', marginBottom: '6px' }}>
              Clinical Findings / Summary Impression
            </label>
            <textarea
              rows={2}
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="e.g. All hematological parameters within normal adult biological reference intervals."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', display: 'block', marginBottom: '6px' }}>
              Pathologist Remarks & Clinical Recommendations
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Normal peripheral blood smear. Electronic signature authenticated."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Verification Details */}
          <div className="grid-2">
            <Input
              label="Authorizing Pathologist Name"
              value={verifiedByName}
              onChange={(e) => setVerifiedByName(e.target.value)}
              placeholder="Dr. Arthur Conan, MD, FACP"
            />

            <Input
              label="Medical License / Registry ID"
              value={verifiedByLicense}
              onChange={(e) => setVerifiedByLicense(e.target.value)}
              placeholder="MED-PATH-88492"
            />
          </div>

          {/* Status Note */}
          <div>
            <Input
              label="Audit Note (Recorded in Specimen Timeline)"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="e.g. Specimen verified on automated analyzer track, internal QC approved."
            />
          </div>

          {/* Optional PDF File */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--gray-50)',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--gray-300)',
            }}
          >
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Upload size={18} color="var(--primary-600)" />
              Optional: Attach Signed Clinical PDF Document
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files[0] || null)}
              style={{ fontSize: '0.875rem' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <Button variant="secondary" onClick={() => navigate('/lab/requests')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Save & Broadcast Real-Time
            </Button>
          </div>
        </form>
      </div>

      <LabReportDetailsModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        report={report}
        initialTab="report"
      />
    </div>
  );
};

export default LabReportDetail;
