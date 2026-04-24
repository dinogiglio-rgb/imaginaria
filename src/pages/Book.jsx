import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'
import StorieInsieme from '../components/StorieInsieme'

export default function Book({ user }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('singole')
  const [storieSingole, setStorieSingole] = useState([])
  const [loading, setLoading] = useState(true)
  const [espansa, setEspansa] = useState(null)

  useEffect(() => {
    supabase
      .from('stories')
      .select('*, drawings(ai_title, processed_url, original_url)')
      .neq('tipo', 'combinata')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setStorieSingole(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ backgroundColor: '#FAF9F6', minHeight: '100vh' }}>
      <Header user={user} />

      <main style={{ paddingTop: '64px', paddingBottom: '80px' }}>

        {/* Hero */}
        <div style={{ padding: '24px 20px 0' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600,
              fontSize: '0.85rem', color: '#aaa',
              padding: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            ← Galleria
          </button>
          <h1 style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 800,
            fontSize: '1.6rem', color: '#2D2D2D', margin: '0 0 4px 0'
          }}>
            Il Libro di Giulio 📚
          </h1>
          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
            color: '#aaa', margin: '0 0 24px 0'
          }}>
            Tutte le storie nate dai suoi disegni
          </p>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: '8px',
          padding: '0 20px 20px',
          borderBottom: '1px solid #f0ede8'
        }}>
          {[
            { key: 'singole', label: '📖 Storie', },
            { key: 'insieme', label: '✨ Storie Insieme' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '9px 18px',
                borderRadius: '50px',
                border: '2px solid',
                borderColor: tab === t.key ? '#A084E8' : '#e8e4df',
                background: tab === t.key ? '#A084E8' : 'white',
                color: tab === t.key ? 'white' : '#666',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: 600,
                fontSize: '0.85rem',
                transition: 'all 0.15s'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px' }}>

          {/* Tab: Storie singole */}
          {tab === 'singole' && (
            <>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    border: '3px solid #f0ede8', borderTopColor: '#FF7F6A',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                </div>
              ) : storieSingole.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📖</div>
                  <p style={{
                    fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                    fontSize: '1rem', color: '#2D2D2D', margin: '0 0 6px 0'
                  }}>
                    Nessuna storia ancora
                  </p>
                  <p style={{
                    fontFamily: 'Inter, sans-serif', fontSize: '0.88rem',
                    color: '#aaa', margin: '0 0 20px 0'
                  }}>
                    Genera le prime storie dai disegni!
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #FF7F6A, #A084E8)',
                      border: 'none', borderRadius: '50px', cursor: 'pointer',
                      fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                      fontSize: '0.9rem', color: 'white'
                    }}
                  >
                    Vai alla galleria
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {storieSingole.map((s) => {
                    const aperta = espansa === s.id
                    return (
                      <div
                        key={s.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '16px',
                          padding: '18px 20px',
                          border: `2px solid ${aperta ? '#FF7F6A' : '#f0ede8'}`,
                          cursor: 'pointer',
                          transition: 'border-color 0.15s'
                        }}
                        onClick={() => setEspansa(aperta ? null : s.id)}
                      >
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          {(s.drawings?.processed_url || s.drawings?.original_url) && (
                            <img
                              src={s.drawings.processed_url || s.drawings.original_url}
                              alt=""
                              style={{
                                width: '48px', height: '48px',
                                borderRadius: '10px', objectFit: 'cover', flexShrink: 0
                              }}
                            />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                              <p style={{
                                fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                                fontSize: '0.95rem', color: '#2D2D2D',
                                margin: 0, flex: 1, marginRight: '8px',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                              }}>
                                {s.drawings?.ai_title || 'Senza titolo'}
                              </p>
                              <span style={{
                                fontFamily: 'Inter, sans-serif', fontSize: '0.72rem',
                                color: '#bbb', flexShrink: 0
                              }}>
                                {new Date(s.created_at).toLocaleDateString('it-IT', {
                                  day: 'numeric', month: 'short'
                                })}
                              </span>
                            </div>
                            <span style={{
                              fontFamily: 'Inter, sans-serif', fontSize: '0.72rem',
                              color: s.tipo === 'breve' ? '#FF7F6A' : '#A084E8',
                              fontWeight: 600
                            }}>
                              {s.tipo === 'breve' ? '✨ Breve' : '📖 Favola'}
                            </span>
                          </div>
                        </div>

                        <p style={{
                          fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
                          color: '#666', lineHeight: 1.7,
                          margin: '12px 0 0 0',
                          display: aperta ? 'block' : '-webkit-box',
                          WebkitLineClamp: aperta ? undefined : 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: aperta ? 'visible' : 'hidden',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {s.testo}
                        </p>

                        <p style={{
                          fontFamily: 'Inter, sans-serif', fontSize: '0.78rem',
                          color: '#FF7F6A', fontWeight: 600,
                          margin: '8px 0 0 0'
                        }}>
                          {aperta ? 'Chiudi ↑' : 'Leggi tutto ↓'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Tab: Storie Insieme */}
          {tab === 'insieme' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{
                  fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                  fontSize: '1.1rem', color: '#2D2D2D', margin: '0 0 4px 0'
                }}>
                  ✨ Storie Insieme
                </h2>
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '0.83rem',
                  color: '#aaa', margin: 0
                }}>
                  Avventure nate dall'incontro di più personaggi
                </p>
              </div>
              <StorieInsieme />
            </>
          )}
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
