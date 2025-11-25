// biome-ignore lint/correctness/noUnusedImports: react is required for jsx
import * as React from 'react';
import { useNavigate } from '@/adapters/react/hooks';

export const DefaultLoading = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100%',
    }}
  >
    <style>
      {`
        @keyframes city-gas-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
    <div
      style={{
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'city-gas-spin 1s linear infinite',
      }}
    />
  </div>
);

export const DefaultNotFound = () => {
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '80vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#333',
      }}
    >
      <h1 style={{ fontSize: '3rem', margin: '0 0 1rem' }}>404</h1>
      <p style={{ fontSize: '1.2rem', margin: '0 0 2rem', color: '#666' }}>
        Page Not Found
      </p>
      <button
        type="button"
        onClick={() => navigate('/', {})}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#2980b9';
        }}
        onFocus={(e) => {
          e.currentTarget.style.backgroundColor = '#2980b9';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#3498db';
        }}
        onBlur={(e) => {
          e.currentTarget.style.backgroundColor = '#3498db';
        }}
      >
        Go to Home
      </button>
    </div>
  );
};
