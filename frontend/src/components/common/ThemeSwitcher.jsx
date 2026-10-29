import React, { useState, useRef, useEffect } from 'react';
import { useTheme, THEMES } from '../../context/ThemeContext';
import { Sun, Moon, Sparkles, Check, ChevronDown } from 'lucide-react';

const ThemeSwitcher = ({ variant = 'dropdown' }) => {
  const { theme, setTheme, themeOptions, currentThemeMeta } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getThemeIcon = (themeId, size = 18) => {
    switch (themeId) {
      case THEMES.DARK:
        return <Moon size={size} className="theme-icon-dark" />;
      case THEMES.CLINICAL_TEAL:
        return <Sparkles size={size} className="theme-icon-teal" />;
      case THEMES.LIGHT:
      default:
        return <Sun size={size} className="theme-icon-sun" />;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={`Active Theme: ${currentThemeMeta.name} (Click to switch)`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full, 9999px)',
          backgroundColor: isOpen ? 'var(--gray-200, #e2e8f0)' : 'var(--gray-100, #f1f5f9)',
          border: '1px solid var(--border-subtle, #cbd5e1)',
          color: 'var(--gray-800, #1e293b)',
          fontSize: '0.825rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: currentThemeMeta.badgeColor,
            transition: 'transform 0.2s ease',
          }}
        >
          {getThemeIcon(theme, 17)}
        </span>
        <span className="theme-toggle-label" style={{ display: 'none', sm: 'inline' }}>
          {currentThemeMeta.shortName}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--gray-500, #64748b)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '260px',
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: 'var(--radius-md, 10px)',
            boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0, 0, 0, 0.2))',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            padding: '8px',
            zIndex: 1000,
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div
            style={{
              padding: '6px 10px 8px',
              borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
              marginBottom: '6px',
            }}
          >
            <div style={{ fontSize: '0.725rem', fontWeight: '700', color: 'var(--gray-400, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Interface Theme
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--gray-500, #64748b)', marginTop: '2px' }}>
              Select your clinical dashboard ambiance
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {themeOptions.map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm, 6px)',
                    backgroundColor: isSelected ? 'var(--gray-100, #f1f5f9)' : 'transparent',
                    border: isSelected ? `1px solid ${opt.badgeColor}` : '1px solid transparent',
                    color: isSelected ? 'var(--gray-900, #0f172a)' : 'var(--gray-700, #334155)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        backgroundColor: opt.previewBg,
                        border: `1px solid ${opt.previewBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: opt.badgeColor,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                      }}
                    >
                      {getThemeIcon(opt.id, 16)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: isSelected ? '700' : '500' }}>
                        {opt.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gray-400, #94a3b8)' }}>
                        {opt.description.split(' ').slice(0, 4).join(' ')}...
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: opt.badgeColor,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={13} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
