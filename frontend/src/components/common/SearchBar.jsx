import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({
  value = '',
  onChange,
  placeholder = 'Search by keyword...',
  debounceMs = 350,
  style = {},
}) => {
  const [searchTerm, setSearchTerm] = useState(value);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== value) {
        onChange(searchTerm);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [searchTerm, debounceMs, onChange, value]);

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        minWidth: '240px',
        ...style,
      }}
    >
      <Search
        size={18}
        style={{
          position: 'absolute',
          left: '12px',
          color: 'var(--gray-400)',
          pointerEvents: 'none',
        }}
      />

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px 36px 8px 36px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          backgroundColor: '#ffffff',
          fontSize: '0.875rem',
          color: 'var(--gray-800)',
          outline: 'none',
        }}
      />

      {searchTerm && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '10px',
            color: 'var(--gray-400)',
            display: 'flex',
            alignItems: 'center',
            padding: '2px',
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
