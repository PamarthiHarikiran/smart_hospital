import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import {
  Activity,
  Bell,
  LogOut,
  User as UserIcon,
  Menu,
  CheckCheck,
  MessageSquare,
  AlertOctagon,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import ThemeSwitcher from '../common/ThemeSwitcher';
import { useSocket } from '../../context/SocketContext';

const Navbar = ({ onToggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadChatCount, activeAlertsCount } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications({ limit: 5 });
      if (res.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // silent catch
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // Poll every 20s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await notificationService.markAsRead(notif._id);
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setShowDropdown(false);
      if (notif.link) {
        navigate(notif.link);
      }
    } catch {
      // silent
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--bg-header, #ffffff)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            display: 'flex',
            alignItems: 'center',
            color: 'var(--gray-600)',
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
          }}
          aria-label="Toggle Navigation"
        >
          <Menu size={22} />
        </button>

        <div
          onClick={() => navigate(`/${role?.toLowerCase()}/dashboard`)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #0D9488 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(13, 148, 136, 0.3)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 3h4v18h-4zM3 10h18v4H3z" fill="#ffffff" />
              <path d="M4 12h4l1.5-3 2.5 6 2-4 1.5 2.5H20" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--gray-900)', lineHeight: '1.1', letterSpacing: '-0.01em' }}>
              ELITECARE HOSPITAL
            </h1>
            <span style={{ fontSize: '0.725rem', color: '#0d9488', fontWeight: '600', letterSpacing: '0.04em' }}>
              CLINICAL HEALTHCARE PLATFORM
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Notifications Popover */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              position: 'relative',
              padding: '8px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--gray-600)',
              backgroundColor: showDropdown ? 'var(--gray-100)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  height: '18px',
                  minWidth: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '340px',
                backgroundColor: 'var(--bg-card, #ffffff)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--gray-50)',
                }}
              >
                <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--gray-800)' }}>
                  Notifications ({unreadCount} new)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--primary-600)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: n.isRead ? 'transparent' : '#f0fdfa',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: n.isRead ? '500' : '600', fontSize: '0.85rem', color: 'var(--gray-900)' }}>
                          {n.title}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', marginTop: '4px' }}>
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Emergency Alert Quick Pill for Clinical Staff / Admin */}
        {(role === 'DOCTOR' || role === 'ADMIN') && activeAlertsCount > 0 && (
          <button
            type="button"
            onClick={() => navigate(role === 'ADMIN' ? '/admin/emergency-alerts' : '/doctor/messages?tab=alerts')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              border: '1.5px solid #ef4444',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
              animation: 'pulse 1.2s infinite',
            }}
            title="Active Patient Emergency Alerts Pending Triage"
          >
            <AlertOctagon size={16} />
            <span>{activeAlertsCount} Emergency Alert{activeAlertsCount > 1 ? 's' : ''}</span>
          </button>
        )}

        {/* Real-Time Chat Quick Action */}
        {(role === 'PATIENT' || role === 'DOCTOR') && (
          <button
            type="button"
            onClick={() => navigate(role === 'PATIENT' ? '/patient/chat' : '/doctor/messages')}
            style={{
              position: 'relative',
              padding: '8px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--gray-600)',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
            }}
            title={role === 'PATIENT' ? 'Chat with Doctor' : 'Patient Messages'}
            aria-label="Messages"
          >
            <MessageSquare size={20} />
            {unreadChatCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  height: '18px',
                  minWidth: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}
              >
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            )}
          </button>
        )}

        {/* Theme Switcher Toggle (1-click dropdown) */}
        <ThemeSwitcher />

        {/* User Info & Role Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--gray-900)' }}>
              {user?.name || 'Healthcare User'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
              <StatusBadge status={role} />
            </div>
          </div>

          <button
            onClick={() => navigate(role === 'PATIENT' ? '/patient/profile' : `/${role?.toLowerCase()}/dashboard`)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-100)',
              color: 'var(--primary-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
              fontSize: '0.9rem',
            }}
            title="Profile"
          >
            {user?.name ? user.name[0].toUpperCase() : <UserIcon size={18} />}
          </button>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--gray-600)',
              backgroundColor: 'var(--gray-100)',
              fontSize: '0.85rem',
              fontWeight: '500',
            }}
            title="Logout"
          >
            <LogOut size={16} />
            <span style={{ display: 'none', sm: 'inline' }}>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
