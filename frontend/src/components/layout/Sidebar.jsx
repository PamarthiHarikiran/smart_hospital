import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Pill,
  FlaskConical,
  Bed,
  CreditCard,
  Building2,
  Bell,
  UserCheck,
  Stethoscope,
  Sparkles,
  AlertTriangle,
  User,
  Shield,
  X,
  MessageSquare,
  AlertOctagon,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { role } = useAuth();
  const { unreadChatCount, activeAlertsCount } = useSocket();

  // Navigation schema per role
  const getNavLinks = () => {
    switch (role) {
      case 'PATIENT':
        return [
          { label: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
          { label: 'Chat with Doctor', path: '/patient/chat', icon: MessageSquare, badge: unreadChatCount },
          { label: 'Find Doctors & Book', path: '/patient/doctors', icon: Stethoscope },
          { label: 'MyAppointments', path: '/patient/appointments', icon: Calendar },
          { label: 'Medical Records', path: '/patient/medical-records', icon: FileText },
          { label: 'Prescriptions', path: '/patient/prescriptions', icon: Pill },
          { label: 'Lab Reports', path: '/patient/lab-reports', icon: FlaskConical },
          { label: 'Bills & Invoices', path: '/patient/bills', icon: CreditCard },
          { label: 'Notifications', path: '/patient/notifications', icon: Bell },
          { label: 'My Profile', path: '/patient/profile', icon: User },
        ];

      case 'DOCTOR':
        return [
          { label: 'Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard },
          { label: 'Messages', path: '/doctor/messages', icon: MessageSquare, badge: unreadChatCount, alertBadge: activeAlertsCount },
          { label: 'Appointments', path: '/doctor/appointments', icon: Calendar },
          { label: 'Patients', path: '/doctor/patients', icon: Users },
          { label: 'Medical Records', path: '/doctor/medical-records', icon: FileText },
          { label: 'Prescriptions', path: '/doctor/prescriptions', icon: Pill },
          { label: 'Lab Reports & Requests', path: '/doctor/lab-reports', icon: FlaskConical },
        ];

      case 'LAB':
        return [
          { label: 'Lab Dashboard', path: '/lab/dashboard', icon: LayoutDashboard },
          { label: 'Test Requests', path: '/lab/requests', icon: FlaskConical },
          { label: 'Reports Archive', path: '/lab/reports', icon: FileText },
        ];

      case 'PHARMACY':
        return [
          { label: 'Pharmacy Dashboard', path: '/pharmacy/dashboard', icon: LayoutDashboard },
          { label: 'Medicines Inventory', path: '/pharmacy/medicines', icon: Pill },
          { label: 'Prescriptions Dispense', path: '/pharmacy/prescriptions', icon: FileText },
          { label: 'Medicine Alerts', path: '/pharmacy/alerts', icon: AlertTriangle },
        ];

      case 'ADMIN':
        return [
          { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Emergency Alerts', path: '/admin/emergency-alerts', icon: AlertOctagon, alertBadge: activeAlertsCount },
          { label: 'Users Management', path: '/admin/users', icon: Users },
          { label: 'Departments', path: '/admin/departments', icon: Building2 },
          { label: 'Appointments', path: '/admin/appointments', icon: Calendar },
          { label: 'Beds & Occupancy', path: '/admin/beds', icon: Bed },
          { label: 'Inpatient Admissions', path: '/admin/admissions', icon: UserCheck },
          { label: 'Billing & Invoices', path: '/admin/bills', icon: CreditCard },
          { label: 'Pharmacy Stock', path: '/admin/medicines', icon: Pill },
        ];

      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 40,
            display: 'block',
          }}
        />
      )}

      <aside
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--bg-sidebar, #ffffff)',
          borderRight: '1px solid var(--border-subtle)',
          height: 'calc(100vh - var(--header-height))',
          position: 'sticky',
          top: 'var(--header-height)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 45,
          transition: 'transform 0.2s ease, background-color 0.25s ease, border-color 0.25s ease',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {role} PORTAL
          </div>
        </div>

        <nav style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 768) onClose();
                    }}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? '600' : '500',
                      color: isActive ? 'var(--primary-600)' : 'var(--gray-600)',
                      backgroundColor: isActive ? 'var(--primary-50)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    })}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </div>
                    {item.alertBadge > 0 && (
                      <span
                        style={{
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          boxShadow: '0 2px 6px rgba(220, 38, 38, 0.4)',
                        }}
                      >
                        🚨 {item.alertBadge}
                      </span>
                    )}
                    {item.badge > 0 && !item.alertBadge && (
                      <span
                        style={{
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          padding: '1px 7px',
                          borderRadius: '999px',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer info badge */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--gray-50)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.75rem',
            color: 'var(--gray-500)',
          }}
        >
          <Shield size={16} color="var(--primary-600)" />
          <span>Role-Based Access Protected</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
