import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '64px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: 'var(--accent)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
        }}>⚡</div>
        <div>
          <div style={{
            fontWeight: 700,
            fontSize: '1rem',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}>XenoMind</div>
          <div style={{
            fontSize: '0.65rem',
            color: 'var(--accent)',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>DRIP CRM</div>
        </div>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {[
          { path: '/dashboard', label: '📊 Dashboard', },
          { path: '/chat', label: '💬 AI Campaign', },
          { path: '/warroom', label: '🔴 War Room', },
        ].map(({ path, label }) => (
          <Link
            key={path}
            to={path}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              background: isActive(path)
                ? 'var(--accent-glow)'
                : 'transparent',
              color: isActive(path)
                ? 'var(--accent)'
                : 'var(--text-secondary)',
              border: isActive(path)
                ? '1px solid var(--accent)'
                : '1px solid transparent',
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Brand badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '0.4rem 1rem',
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          background: 'var(--green)',
          borderRadius: '50%',
          boxShadow: '0 0 8px var(--green)',
          animation: 'pulse 2s infinite',
        }} />
        <span style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}>DRIP</span>
        <span style={{
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
        }}>Fashion Brand</span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;