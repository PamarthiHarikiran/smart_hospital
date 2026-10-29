import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { Users, Search, Eye, Phone, MapPin, Calendar } from 'lucide-react';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const DoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userService.getUsers({
        role: 'PATIENT',
        search,
        page,
        limit: 12,
      });
      if (res.success) {
        setPatients(res.data || []);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load patients list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search, page]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
            Patient Directory & Electronic Medical Records
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            Inspect authorized patient profiles, previous clinical history, and laboratory outcomes.
          </p>
        </div>

        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by name, email, phone..."
          style={{ width: '320px' }}
        />
      </div>

      {loading ? (
        <LoadingSpinner text="Searching clinical records..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchPatients} />
      ) : patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No patients found"
          description="No patients match your current search criteria."
        />
      ) : (
        <>
          <div className="grid-3">
            {patients.map((p) => (
              <div key={p._id} className="sh-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--primary-100)',
                        color: 'var(--primary-700)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '1.1rem',
                      }}
                    >
                      {p.name[0]}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                        {p.name}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                        {p.gender || 'N/A'} • Blood: <strong>{p.bloodGroup || 'N/A'}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.825rem', color: 'var(--gray-600)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={14} color="var(--gray-400)" />
                      <span>{p.phone || 'No phone recorded'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={14} color="var(--gray-400)" />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.address || 'Address not listed'}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  icon={Eye}
                  onClick={() => navigate(`/doctor/patients/${p._id}`)}
                  style={{ width: '100%' }}
                >
                  View Clinical History
                </Button>
              </div>
            ))}
          </div>

          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default DoctorPatients;
