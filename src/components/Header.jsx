import { useState } from 'react'
import { logout } from '../lib/auth'
import LogoMobius from './LogoMobius'

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
        <LogoMobius size={32} />
        <span style={{
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 800,
          fontSize: '1.1rem',
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
