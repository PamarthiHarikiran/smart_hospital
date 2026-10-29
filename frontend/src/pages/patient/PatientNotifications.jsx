import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';

const PatientNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await notificationService.getNotifications({ limit: 50 });
      if (res.success) {
        setNotifications(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // silent
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
            My Notifications
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            Alerts, scheduling confirmations, laboratory results, and medical reminders.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <Button variant="outline" size="sm" icon={CheckCheck} onClick={handleMarkAllRead}>
            Mark All as Read
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving notifications..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchNotifications} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You are completely up to date. Important hospital events will be logged here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className="sh-card"
              onClick={() => !notif.isRead && handleMarkOneRead(notif._id)}
              style={{
                padding: '16px 20px',
                backgroundColor: notif.isRead ? '#ffffff' : '#f0fdfa',
                borderColor: notif.isRead ? 'var(--border-subtle)' : '#99f6e4',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: notif.isRead ? 'default' : 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: notif.isRead ? 'var(--gray-100)' : '#ccfbf1',
                    color: notif.isRead ? 'var(--gray-500)' : '#0d9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bell size={18} />
                </div>

                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: notif.isRead ? '600' : '700', color: 'var(--gray-900)' }}>
                    {notif.title}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '2px' }}>
                    {notif.message}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '6px', display: 'block' }}>
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {!notif.isRead && (
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: '#0d9488',
                  }}
                  title="Unread"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientNotifications;
