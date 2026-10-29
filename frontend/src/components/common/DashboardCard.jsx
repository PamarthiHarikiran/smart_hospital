import React from 'react';

const DashboardCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  onClick,
}) => {
  const colorMap = {
    blue: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    green: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    red: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    purple: { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
    teal: { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  };

  const currentTheme = colorMap[color] || colorMap.blue;

  return (
    <div
      className="sh-card"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </span>
          <h2 style={{ fontSize: '1.85rem', fontWeight: '700', color: 'var(--gray-900)', marginTop: '4px' }}>
            {value}
          </h2>
        </div>

        {Icon && (
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: currentTheme.bg,
              color: currentTheme.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            <Icon size={22} />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
          {trend && (
            <span style={{ color: trend.startsWith('+') ? '#059669' : '#dc2626', fontWeight: '600' }}>
              {trend}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
