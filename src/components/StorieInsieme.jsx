import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function StorieInsieme() {
  const [storie, setStorie] = useState([])
  const [loading, setLoading] = useState(true)
  const [espansa, setEspansa] = useState(null)

  useEffect(() => {
    supabase
      .from('stories')
      .select('*')
      .eq('tipo', 'combinata')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setStorie(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '3px solid #f0ede8', borderTopColor: '#A084E8',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    )
  }

  if (storie.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✨</div>
        <p style={{
          fontFamily: 'Outfit, sans-serif', fontWeight: 700,
          fontSize: '1rem', color: '#2D2D2D', margin: '0 0 6px 0'
        }}>
          Nessuna storia insieme ancora...
        </p>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: '0.88rem',
          color: '#aaa', margin: 0
        }}>
          crea la prima dal Libro delle Storie!
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {storie.map((s, i) => {
        const aperta = espansa === s.id
        return (
          <div key={s.id}>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '18px 20px',
                border: `2px solid ${aperta ? '#A084E8' : '#f0ede8'}`,
                cursor: 'pointer',
                transition: 'border-color 0.15s'
              }}
              onClick={() => setEspansa(aperta ? null : s.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <p style={{
                  fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                  fontSize: '0.95rem', color: '#2D2D2D',
                  margin: 0, flex: 1, marginRight: '12px'
                }}>
                  {s.indicazioni || 'Storia insieme'}
                </p>
                <span style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '0.72rem',
                  color: '#bbb', flexShrink: 0
                }}>
                  {new Date(s.created_at).toLocaleDateString('it-IT', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </span>
              </div>

              <p style={{
                fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
                color: '#888', lineHeight: 1.6, margin: 0,
                display: aperta ? 'block' : '-webkit-box',
                WebkitLineClamp: aperta ? undefined : 3,
                WebkitBoxOrient: 'vertical',
                overflow: aperta ? 'visible' : 'hidden',
                whiteSpace: 'pre-wrap'
              }}>
                {s.testo}
              </p>

              {!aperta && (
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '0.78rem',
                  color: '#A084E8', fontWeight: 600,
                  margin: '8px 0 0 0'
                }}>
                  Leggi tutto ↓
                </p>
              )}
              {aperta && (
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '0.78rem',
                  color: '#A084E8', fontWeight: 600,
                  margin: '10px 0 0 0'
                }}>
                  Chiudi ↑
                </p>
              )}
            </div>

            {i < storie.length - 1 && (
              <div style={{
                height: '1px', backgroundColor: '#f0ede8',
                margin: '0 8px'
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
