import { useState, useEffect } from 'react'

const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
               'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const MESI_BREVI = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']

function fmtLong(iso) {
  const d = new Date(iso)
  return `${MESI[d.getMonth()]} ${d.getFullYear()}`
}

function fmtShort(iso) {
  const d = new Date(iso)
  return `${MESI_BREVI[d.getMonth()]} ${d.getFullYear()}`
}

export default function BirthdaySlideshow({ child, selectedRenders, allRenders }) {
  const [view, setView] = useState('banner')
  const [chosen, setChosen] = useState(selectedRenders)
  const [slideIndex, setSlideIndex] = useState(-1) // -1=intro, 0..n-1=render, n=outro
  const [paused, setPaused] = useState(false)

  useEffect(() => { setChosen(selectedRenders) }, [selectedRenders])

  // Avanzamento automatico slide
  useEffect(() => {
    if (view !== 'slideshow' || paused) return
    const duration = (slideIndex === -1 || slideIndex === chosen.length) ? 2000 : 3000
    const timer = setTimeout(() => setSlideIndex(i => i + 1), duration)
    return () => clearTimeout(timer)
  }, [view, slideIndex, paused, chosen.length])

  // Fine slideshow → torna al banner
  useEffect(() => {
    if (view === 'slideshow' && slideIndex > chosen.length) {
      setView('banner')
      setSlideIndex(-1)
      setPaused(false)
    }
  }, [slideIndex, chosen.length, view])

  const startSlideshow = () => {
    setSlideIndex(-1)
    setPaused(false)
    setView('slideshow')
  }

  const toggleChosen = (render) => {
    setChosen(prev => {
      if (prev.find(r => r.id === render.id)) return prev.filter(r => r.id !== render.id)
      if (prev.length >= 30) return prev
      return [...prev, render]
    })
  }

  const closeSlideshow = (e) => {
    e?.stopPropagation()
    setView('banner')
    setSlideIndex(-1)
    setPaused(false)
  }

  const progress = Math.min(100, ((slideIndex + 1) / (chosen.length + 2)) * 100)

  // ── BANNER ──────────────────────────────────────────────────────────
  if (view === 'banner') {
    return (
      <div style={{
        margin: '0 12px 24px',
        background: 'linear-gradient(135deg, #FF7F6A, #A084E8)',
        borderRadius: '20px',
        padding: '28px 20px',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(255,127,106,0.3)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎂</div>
        <h2 style={{
          fontFamily: 'Outfit, sans-serif', fontWeight: 800,
          fontSize: '1.5rem', color: 'white', margin: '0 0 8px 0',
        }}>
          Buon Compleanno {child.name}!
        </h2>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: '0.9rem',
          color: 'rgba(255,255,255,0.85)', margin: '0 0 20px 0',
        }}>
          Guarda quanto sei cresciuto quest'anno!
        </p>
        <button
          onClick={() => setView('selection')}
          style={{
            backgroundColor: 'white', color: '#FF7F6A', border: 'none',
            borderRadius: '50px', padding: '12px 28px',
            fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1rem',
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          ▶ Guarda il tuo anno magico
        </button>
      </div>
    )
  }

  // ── SELECTION ────────────────────────────────────────────────────────
  if (view === 'selection') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 500,
        backgroundColor: '#FAF9F6', overflowY: 'auto',
      }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 501,
          backgroundColor: '#FAF9F6', padding: '16px 16px 12px',
          borderBottom: '1px solid #f0ede8',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2px' }}>
            <button
              onClick={() => setView('banner')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '20px', color: '#888', padding: '4px',
              }}
            >
              ←
            </button>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800,
              fontSize: '1.1rem', color: '#A084E8', margin: 0,
            }}>
              Scegli i tuoi render preferiti
            </h2>
          </div>
          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: '0.8rem',
            color: '#aaa', margin: '0 0 0 44px',
          }}>
            Selezionati {chosen.length} di 30 massimo
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px', padding: '10px', paddingBottom: '100px',
        }}>
          {allRenders.map(r => {
            const isSelected = !!chosen.find(c => c.id === r.id)
            return (
              <div
                key={r.id}
                onClick={() => toggleChosen(r)}
                style={{
                  position: 'relative', cursor: 'pointer',
                  borderRadius: '10px', overflow: 'hidden',
                  border: isSelected ? '3px solid #FF7F6A' : '3px solid transparent',
                  boxSizing: 'border-box',
                }}
              >
                <img
                  src={r.result_url}
                  alt={r.ai_title || r.style}
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                />
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: '6px', right: '6px',
                    backgroundColor: '#FF7F6A', color: 'white', borderRadius: '50%',
                    width: '22px', height: '22px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700,
                  }}>
                    ✓
                  </div>
                )}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
                  padding: '14px 6px 5px',
                }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6rem', color: 'white', fontWeight: 600 }}>
                    {fmtShort(r.drawing_created_at)}
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.55rem', color: 'rgba(255,255,255,0.7)' }}>
                    {r.style}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '14px 16px', backgroundColor: 'white',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
        }}>
          <button
            onClick={startSlideshow}
            disabled={chosen.length === 0}
            style={{
              width: '100%', padding: '15px',
              background: chosen.length === 0 ? '#ccc' : '#FF7F6A',
              border: 'none', borderRadius: '50px',
              cursor: chosen.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'Outfit, sans-serif', fontWeight: 700,
              fontSize: '1rem', color: 'white',
            }}
          >
            ▶ Avvia slideshow ({chosen.length} render)
          </button>
        </div>
      </div>
    )
  }

  // ── SLIDESHOW ─────────────────────────────────────────────────────────
  const isIntro = slideIndex === -1
  const isOutro = slideIndex === chosen.length
  const currentRender = !isIntro && !isOutro ? chosen[slideIndex] : null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        backgroundColor: 'black',
        display: 'flex', flexDirection: 'column',
        cursor: 'pointer',
      }}
      onClick={() => setPaused(p => !p)}
    >
      {/* Barra progresso */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '3px', backgroundColor: 'rgba(255,255,255,0.2)', zIndex: 1001,
      }}>
        <div style={{
          height: '100%', backgroundColor: '#FF7F6A',
          width: `${progress}%`, transition: 'width 0.3s linear',
        }} />
      </div>

      {/* Chiudi */}
      <button
        onClick={closeSlideshow}
        style={{
          position: 'absolute', top: '16px', left: '16px', zIndex: 1001,
          background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
          width: '36px', height: '36px', color: 'white', fontSize: '16px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        ✕
      </button>

      {/* Contatore */}
      {!isIntro && !isOutro && (
        <div style={{
          position: 'absolute', top: '20px', right: '16px', zIndex: 1001,
          fontFamily: 'Inter, sans-serif', fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.7)',
        }}>
          {slideIndex + 1} / {chosen.length}
        </div>
      )}

      {/* Pausa */}
      {paused && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', zIndex: 1001,
          transform: 'translate(-50%, -50%)',
          fontSize: '3rem', color: 'rgba(255,255,255,0.6)', pointerEvents: 'none',
        }}>
          ⏸
        </div>
      )}

      {/* Slide con fade-in */}
      <div
        key={slideIndex}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          animation: 'slideFadeIn 0.5s ease',
          position: 'relative',
        }}
      >
        {isIntro && (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #FF7F6A, #A084E8)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '24px',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✨</div>
            <h1 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800,
              fontSize: '2rem', color: 'white', margin: '0 0 12px 0',
            }}>
              {child.name}
            </h1>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '1rem',
              color: 'rgba(255,255,255,0.85)', margin: 0,
            }}>
              il tuo anno magico ✨
            </p>
          </div>
        )}

        {isOutro && (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #A084E8, #FF7F6A)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '24px',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🌟</div>
            <h1 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800,
              fontSize: '1.5rem', color: 'white', margin: 0,
            }}>
              Quanti sogni hai disegnato quest'anno!
            </h1>
          </div>
        )}

        {currentRender && (
          <>
            <img
              src={currentRender.result_url}
              alt={currentRender.ai_title || ''}
              style={{
                maxHeight: '80vh', maxWidth: '100%',
                objectFit: 'contain', borderRadius: '12px',
              }}
            />
            <div style={{
              position: 'absolute', bottom: '32px', left: 0, right: 0,
              textAlign: 'center', padding: '0 20px',
            }}>
              <p style={{
                fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.7)', margin: '0 0 4px 0',
                textShadow: '0 1px 4px rgba(0,0,0,0.9)',
              }}>
                {fmtLong(currentRender.drawing_created_at)}
              </p>
              {currentRender.ai_title && (
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '0.95rem',
                  color: 'white', margin: 0, fontWeight: 600,
                  textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                }}>
                  {currentRender.ai_title}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes slideFadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  )
}
