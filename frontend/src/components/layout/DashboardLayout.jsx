import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useTheme, THEMES } from '../../context/ThemeContext';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Determine dynamic background container classes according to the active theme
  const getDynamicThemeClasses = () => {
    switch (theme) {
      case THEMES.DARK:
        return 'bg-slate-950 text-slate-100 theme-dark';
      case THEMES.CLINICAL_TEAL:
        return 'bg-teal-950 text-teal-50 theme-clinical-teal';
      case THEMES.LIGHT:
      default:
        return 'bg-slate-50 text-slate-900 theme-light';
    }
  };

  return (
    <div
      className={`dynamic-layout-wrapper ${getDynamicThemeClasses()}`}
      data-theme={theme}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'background-color 0.25s ease, color 0.25s ease',
      }}
    >
      <Navbar onToggleSidebar={toggleSidebar} />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main
          style={{
            flex: 1,
            padding: '24px 32px',
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto',
            overflowX: 'hidden',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
