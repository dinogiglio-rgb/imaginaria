import { useState } from 'react'
import { logout } from '../lib/auth'

export default function Header({ user }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const iniziali = user?.email?.substring(0, 2).toUpperCase() || 'U'

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      backgroundColor: '#FAF9F6',
      borderBottom: '1px solid #f0ede8',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="36" height="22" viewBox="0 0 120 72" fill="none">
          <defs>
            <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF7F6A" />
              <stop offset="100%" stopColor="#A084E8" />
            </linearGradient>
          </defs>
          <ellipse cx="38" cy="36" rx="32" ry="20" stroke="url(#hg)" strokeWidth="10" fill="none" strokeLinecap="round"/>
          <ellipse cx="82" cy="36" rx="32" ry="20" stroke="url(#hg)" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.7"/>
        </svg>
        <span style={{
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 800,
          fontSize: '1.3rem',
          color: '#2D2D2D'
        }}>
          Imaginaria
        </span>
      </div>

      {/* Avatar con menu */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF7F6A, #A084E8)',
            border: 'none',
            cursor: 'pointer',
            color: 'white',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 700,
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {iniziali}
        </button>

        {menuOpen && (
          <div style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: '8px',
            minWidth: '180px',
            zIndex: 200,
          }}>
            <p style={{
              padding: '8px 12px',
              fontSize: '0.8rem',
              color: '#999',
              fontFamily: 'Inter, sans-serif',
              margin: 0,
              borderBottom: '1px solid #f0ede8',
              marginBottom: '4px'
            }}>
              {user?.email}
            </p>
            <button
              onClick={logout}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#FF7F6A',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '0.95rem',
                textAlign: 'left',
                borderRadius: '8px',
              }}
            >
              Esci dall'app
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
