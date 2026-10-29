import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { useSocket } from '../../context/SocketContext';
import {
  Users,
  Stethoscope,
  Calendar,
  Bed,
  FlaskConical,
  AlertTriangle,
  CreditCard,
  DollarSign,
  TrendingUp,
  Activity,
  Layers,
  BarChart3,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import DashboardCard from '../../components/common/DashboardCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { activeAlertsCount } = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardService.getAdminDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load executive admin analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner text="Aggregating MongoDB operational hospital metrics..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchDashboard} />;

  const { kpi, charts, recentAppointments = [] } = data || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--gray-900)' }}>
          Hospital Administration & Executive Analytics
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
          Live cross-departmental KPIs, bed occupancy telemetry, and clinical resource aggregation.
        </p>
      </div>

      {/* Live Emergency Alert Banner if Active */}
      {activeAlertsCount > 0 && (
        <div
          onClick={() => navigate('/admin/emergency-alerts')}
          style={{
            backgroundColor: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: '10px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.2)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: '#dc2626',
                animation: 'pulse 1.2s infinite',
                boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.3)',
              }}
            />
            <div>
              <div style={{ fontWeight: '800', color: '#991b1b', fontSize: '0.95rem' }}>
                🚨 {activeAlertsCount} ACTIVE EMERGENCY ALERT{activeAlertsCount > 1 ? 'S' : ''} REQUIRING IMMEDIATE ATTENTION
              </div>
              <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '2px' }}>
                Real-time patient emergency signals awaiting clinical triage. Click to open Command Desk.
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.825rem',
              padding: '8px 16px',
              borderRadius: '6px',
            }}
          >
            <span>Open Command Desk</span>
            <ArrowRight size={15} />
          </div>
        </div>
      )}

      {/* Top Level Operational KPI Cards */}
      <div className="grid-4">
        <DashboardCard
          title="Total Registered Patients"
          value={kpi?.totalPatients ?? 0}
          subtitle="Hospital client base"
          icon={Users}
          color="blue"
        />

        <DashboardCard
          title="Medical Staff / Doctors"
          value={kpi?.totalDoctors ?? 0}
          subtitle="Active clinicians"
          icon={Stethoscope}
          color="teal"
        />

        <DashboardCard
          title="Today's Appointments"
          value={kpi?.todayAppointments ?? 0}
          subtitle={`Total: ${kpi?.totalAppointments || 0} visits`}
          icon={Calendar}
          color="purple"
        />

        <DashboardCard
          title="Bed Occupancy Rate"
          value={`${kpi?.bedOccupancyRate ?? 0}%`}
          subtitle={`${kpi?.occupiedBeds || 0} / ${kpi?.totalBeds || 0} occupied`}
          icon={Bed}
          color={kpi?.bedOccupancyRate > 75 ? 'amber' : 'green'}
        />

        <DashboardCard
          title="Pending Lab Tests"
          value={kpi?.pendingLabRequests ?? 0}
          subtitle="Analyzer backlog"
          icon={FlaskConical}
          color={kpi?.pendingLabRequests > 0 ? 'amber' : 'green'}
        />

        <DashboardCard
          title="Low Stock Medicines"
          value={kpi?.lowStockMedicines ?? 0}
          subtitle="Replenishment needed"
          icon={AlertTriangle}
          color={kpi?.lowStockMedicines > 0 ? 'red' : 'green'}
        />

        <DashboardCard
          title="Pending Invoices"
          value={kpi?.pendingBills ?? 0}
          subtitle="Awaiting payment"
          icon={CreditCard}
          color={kpi?.pendingBills > 0 ? 'amber' : 'green'}
        />

        <DashboardCard
          title="Cumulative Revenue"
          value={`$${(kpi?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Settled invoices"
          icon={DollarSign}
          color="green"
        />
      </div>

      {/* 6 Recharts Charts from Real MongoDB Aggregations */}
      <div className="grid-2">
        {/* CHART 1: Monthly Appointments */}
        <div className="sh-card">
          <div className="sh-card-header">
            <h2 className="sh-card-title">
              <Calendar size={18} color="var(--primary-600)" />
              1. Monthly Appointments Trend
            </h2>
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.monthlyAppointments || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="appointments" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Patient Growth */}
        <div className="sh-card">
          <div className="sh-card-header">
            <h2 className="sh-card-title">
              <TrendingUp size={18} color="#059669" />
              2. Patient Registration Growth
            </h2>
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.patientGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="patients" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="New Patients" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Department-wise Appointments */}
        <div className="sh-card">
          <div className="sh-card-header">
            <h2 className="sh-card-title">
              <BarChart3 size={18} color="#7c3aed" />
              3. Department-wise Appointment Distribution
            </h2>
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.departmentWiseAppointments || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Visits" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Bed Occupancy Distribution */}
        <div className="sh-card">
          <div className="sh-card-header">
            <h2 className="sh-card-title">
              <Bed size={18} color="#0d9488" />
              4. Inpatient Bed Occupancy Breakdown
            </h2>
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.bedDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {(charts?.bedDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 5: Revenue Overview */}
        <div className="sh-card">
          <div className="sh-card-header">
            <h2 className="sh-card-title">
              <DollarSign size={18} color="#059669" />
              5. Monthly Hospital Revenue ($)
            </h2>
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.revenueOverview || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 6: Medicine Stock Status */}
        <div className="sh-card">
          <div className="sh-card-header">
            <h2 className="sh-card-title">
              <Layers size={18} color="#f59e0b" />
              6. Pharmaceutical Stock vs Safety Threshold
            </h2>
          </div>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.medicineStockChart || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="stock" fill="#3b82f6" name="Current Stock" />
                <Bar dataKey="minStock" fill="#ef4444" name="Min Threshold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="sh-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--gray-900)' }}>
            Recent Hospital Appointments Across Departments
          </h2>
        </div>

        <div className="sh-table-container" style={{ border: 'none' }}>
          <table className="sh-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Scheduled Date & Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.map((apt) => (
                <tr key={apt._id}>
                  <td style={{ fontWeight: '600' }}>{apt.patient?.name}</td>
                  <td>Dr. {apt.doctor?.name} ({apt.doctor?.specialization})</td>
                  <td>{apt.department?.name || 'General'}</td>
                  <td>{apt.date} at {apt.time}</td>
                  <td><StatusBadge status={apt.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
