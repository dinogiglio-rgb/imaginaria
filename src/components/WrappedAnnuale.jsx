import { useState, useEffect, useMemo, useRef } from 'react'

const EMOJI_CAT = { animali: '🐾', persone: '👤', natura: '🌿', mostri: '👾', veicoli: '🚀' }
const STYLE_LABEL = { cartoon: 'Cartoon 🎨', toy: 'Toy 🪀', realistic: 'Realistico 🖼️' }

const getCatEmoji = (cat) => {
  if (!cat) return '🎨'
  const l = cat.toLowerCase()
  for (const [k, e] of Object.entries(EMOJI_CAT)) if (l.includes(k)) return e
  return '🎨'
}

export default function WrappedAnnuale({ child, drawings, onClose }) {
  const [phase, setPhase] = useState('selector')
  const [selectedYear, setSelectedYear] = useState(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [fading, setFading] = useState(false)
  const [showRestart, setShowRestart] = useState(false)
  const [galleryImgIndex, setGalleryImgIndex] = useState(0)
  const [countValue, setCountValue] = useState(0)
  const advancing = useRef(false)

  const years = useMemo(() => {
    const ys = new Set(drawings.map(d => new Date(d.created_at).getFullYear()))
    return [...ys].sort((a, b) => b - a)
  }, [drawings])

  const yearData = useMemo(() => {
    if (!selectedYear) return null
    const yd = drawings.filter(d => new Date(d.created_at).getFullYear() === selectedYear)

    const allRenders = []
    for (const d of yd) {
      for (const r of (d.renders || [])) {
        if (r.status === 'completed' && r.result_url) allRenders.push({ ...r, drawing: d })
      }
    }
    allRenders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

    const catCount = {}
    for (const d of yd) if (d.category) catCount[d.category] = (catCount[d.category] || 0) + 1
    const categoriaPreferita = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    const styleCount = {}
    for (const r of allRenders) if (r.style) styleCount[r.style] = (styleCount[r.style] || 0) + 1
    const stilePreferito = Object.entries(styleCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    let disegnoPiuAmato = null, maxR = 0
    for (const d of yd) {
      const n = (d.renders || []).filter(r => r.status === 'completed').length
      if (n > maxR) { maxR = n; disegnoPiuAmato = d }
    }

    return {
      totaleDisegni: yd.length,
      totaleRender: allRenders.length,
      categoriaPreferita,
      stilePreferito,
      disegnoPiuAmato: maxR > 0 ? disegnoPiuAmato : null,
      renderGallery: allRenders.slice(0, 20),
    }
  }, [drawings, selectedYear])

  const slides = useMemo(() => {
    if (!yearData) return []
    const s = ['intro', 'disegni', 'render']
    if (yearData.categoriaPreferita) s.push('categoria')
    if (yearData.stilePreferito) s.push('stile')
    if (yearData.renderGallery.length > 0) s.push('galleria')
    if (yearData.disegnoPiuAmato) s.push('amato')
    s.push('outro')
    return s
  }, [yearData])

  // Preload images
  useEffect(() => {
    if (!yearData) return
    const urls = yearData.renderGallery.map(r => r.result_url)
    if (yearData.disegnoPiuAmato) {
      const rs = (yearData.disegnoPiuAmato.renders || []).filter(r => r.status === 'completed')
      const best = rs.find(r => r.style === 'cartoon') || rs[0]
      if (best?.result_url) urls.push(best.result_url)
    }
    urls.forEach(url => { const img = new Image(); img.src = url })
  }, [yearData])

  // Slide auto-advance
  useEffect(() => {
    if (phase !== 'slideshow' || !slides.length) return
    if (slides[slideIndex] === 'outro') {
      const t = setTimeout(() => setShowRestart(true), 3000)
      return () => clearTimeout(t)
    }
    if (slideIndex >= slides.length - 1) return
    const t = setTimeout(() => doAdvance(), 4000)
    return () => clearTimeout(t)
  }, [phase, slideIndex, slides])

  // Count animation (slides disegni / render)
  useEffect(() => {
    const type = slides[slideIndex]
    if (!yearData || (type !== 'disegni' && type !== 'render')) return
    const target = type === 'disegni' ? yearData.totaleDisegni : yearData.totaleRender
    setCountValue(0)
    if (!target) return
    const steps = Math.min(target, 60)
    const interval = 1500 / steps
    const inc = target / steps
    let cur = 0
    const t = setInterval(() => {
      cur += inc
      if (cur >= target) { setCountValue(target); clearInterval(t) }
      else setCountValue(Math.floor(cur))
    }, interval)
    return () => clearInterval(t)
  }, [slideIndex, slides, yearData])

  // Gallery image cycling
  useEffect(() => {
    if (!yearData || slides[slideIndex] !== 'galleria' || !yearData.renderGallery.length) return
    setGalleryImgIndex(0)
    const t = setInterval(
      () => setGalleryImgIndex(i => (i + 1) % yearData.renderGallery.length),
      800
    )
    return () => clearInterval(t)
  }, [slideIndex, slides, yearData])

  const doAdvance = () => {
    if (advancing.current) return
    advancing.current = true
    setFading(true)
    setTimeout(() => {
      setSlideIndex(i => i + 1)
      setFading(false)
      advancing.current = false
    }, 500)
  }

  const startSlideshow = (year) => {
    setSelectedYear(year)
    setSlideIndex(0)
    setShowRestart(false)
    setFading(false)
    setGalleryImgIndex(0)
    setCountValue(0)
    advancing.current = false
    setPhase('slideshow')
  }

  const restartFromBeginning = () => {
    setShowRestart(false)
    advancing.current = true
    setFading(true)
    setTimeout(() => {
      setSlideIndex(0)
      setGalleryImgIndex(0)
      setCountValue(0)
      setFading(false)
      advancing.current = false
    }, 500)
  }

  const handleScreenTap = () => {
    if (slides[slideIndex] === 'outro') return
    if (slideIndex < slides.length - 1) doAdvance()
  }

  // ── SELECTOR ────────────────────────────────────────────────────────────
  if (phase === 'selector') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: '#FAF9F6',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '20px', right: '20px',
            background: 'none', border: 'none', fontSize: '24px',
            cursor: 'pointer', color: '#888', lineHeight: 1,
          }}
        >✕</button>

        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎬</div>
        <h1 style={{
          fontFamily: 'Outfit, sans-serif', fontWeight: 800,
          fontSize: '1.8rem', color: '#A084E8', margin: '0 0 8px 0',
          textAlign: 'center',
        }}>Il Wrapped di {child.name}</h1>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: '1rem',
          color: '#888', margin: '0 0 32px 0', textAlign: 'center',
        }}>Scegli l'anno da rivivere</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px' }}>
          {years.map(year => (
            <div
              key={year}
              onClick={() => startSlideshow(year)}
              style={{
                border: '2px solid #A084E8', borderRadius: '16px',
                padding: '24px', textAlign: 'center', cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                fontSize: '2rem', color: '#A084E8', backgroundColor: 'white',
                boxShadow: '0 2px 12px rgba(160,132,232,0.15)',
              }}
            >{year}</div>
          ))}
        </div>
      </div>
    )
  }

  if (!yearData || !slides.length) return null

  const currentType = slides[slideIndex]
  const progress = ((slideIndex + 1) / slides.length) * 100

  const renderSlide = () => {
    switch (currentType) {

      case 'intro':
        return (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #FF7F6A 0%, #A084E8 100%)',
            backgroundSize: '400% 400%',
            animation: 'wrappedGradient 6s ease infinite',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '24px',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>✨</div>
            <h1 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800,
              fontSize: '2.25rem', color: 'white', margin: '0 0 12px 0', lineHeight: 1.2,
            }}>
              Il {selectedYear} di {child.name}
            </h1>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '1rem',
              color: 'rgba(255,255,255,0.8)', margin: 0,
            }}>
              Un anno di magia e creatività
            </p>
          </div>
        )

      case 'disegni':
        return (
          <div style={{
            width: '100%', height: '100%', backgroundColor: 'white',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '24px',
          }}>
            <div style={{ fontSize: '3.75rem', marginBottom: '24px' }}>✏️</div>
            <div style={{
              width: '160px', height: '160px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF7F6A, #A084E8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '24px',
              boxShadow: '0 8px 32px rgba(255,127,106,0.3)',
            }}>
              <span style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                fontSize: '3rem', color: 'white',
              }}>{countValue}</span>
            </div>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '1.125rem',
              color: '#666', margin: 0,
            }}>disegni realizzati</p>
          </div>
        )

      case 'render':
        return (
          <div style={{
            width: '100%', height: '100%', backgroundColor: '#A084E8',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '24px',
          }}>
            <div style={{ fontSize: '3.75rem', marginBottom: '24px' }}>✨</div>
            <div style={{
              width: '160px', height: '160px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              border: '3px solid rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '24px',
            }}>
              <span style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                fontSize: '3rem', color: 'white',
              }}>{countValue}</span>
            </div>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '1.125rem',
              color: 'white', margin: 0,
            }}>trasformazioni magiche create</p>
          </div>
        )

      case 'categoria': {
        const cat = yearData.categoriaPreferita
        return (
          <div style={{
            width: '100%', height: '100%', backgroundColor: '#FF7F6A',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '24px',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>{getCatEmoji(cat)}</div>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800,
              fontSize: '1.5rem', color: 'white', margin: '0 0 16px 0',
            }}>La tua categoria del cuore</h2>
            <div style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800,
              fontSize: '2.5rem', color: 'white',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>{cat}</div>
          </div>
        )
      }

      case 'stile': {
        const stile = yearData.stilePreferito
        return (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #A084E8, #B2EBF2)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '24px',
          }}>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800,
              fontSize: '1.5rem', color: 'white', margin: '0 0 24px 0',
            }}>Il tuo stile preferito</h2>
            <div style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800,
              fontSize: '2.5rem', color: 'white',
            }}>{STYLE_LABEL[stile] || stile}</div>
          </div>
        )
      }

      case 'galleria': {
        const img = yearData.renderGallery[galleryImgIndex]
        return (
          <div style={{
            width: '100%', height: '100%', backgroundColor: 'black',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: '60px', left: 0, right: 0,
              textAlign: 'center', zIndex: 1,
            }}>
              <h2 style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                fontSize: '1.25rem', color: 'white', margin: 0,
                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              }}>I tuoi render più belli</h2>
            </div>
            {img && (
              <img
                key={galleryImgIndex}
                src={img.result_url}
                alt={img.drawing?.ai_title || ''}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'contain',
                  animation: 'wrappedFadeIn 0.3s ease',
                }}
              />
            )}
            {img?.drawing?.ai_title && (
              <div style={{
                position: 'absolute', bottom: '40px', left: 0, right: 0,
                textAlign: 'center', zIndex: 1, padding: '0 20px',
              }}>
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '0.875rem',
                  color: 'white', margin: 0,
                  textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                }}>{img.drawing.ai_title}</p>
              </div>
            )}
          </div>
        )
      }

      case 'amato': {
        const d = yearData.disegnoPiuAmato
        const rs = (d.renders || []).filter(r => r.status === 'completed')
        const best = rs.find(r => r.style === 'cartoon') || rs[0]
        return (
          <div style={{
            width: '100%', height: '100%', backgroundColor: '#FAF9F6',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '24px',
          }}>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800,
              fontSize: '1.375rem', color: '#FF7F6A', margin: '0 0 20px 0',
            }}>Il tuo disegno più amato ❤️</h2>
            {best && (
              <img
                src={best.result_url}
                alt={d.ai_title || ''}
                style={{
                  maxWidth: '80%', maxHeight: '55vh',
                  objectFit: 'contain', borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  marginBottom: '16px',
                }}
              />
            )}
            {d.ai_title && (
              <p style={{
                fontFamily: 'Inter, sans-serif', fontSize: '1rem',
                color: '#333', margin: 0, fontStyle: 'italic',
              }}>{d.ai_title}</p>
            )}
          </div>
        )
      }

      case 'outro':
        return (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #FF7F6A 0%, #A084E8 100%)',
            backgroundSize: '400% 400%',
            animation: 'wrappedGradient 6s ease infinite',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '32px 24px',
          }}>
            <h1 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800,
              fontSize: '2rem', color: 'white', margin: '0 0 16px 0', lineHeight: 1.2,
            }}>
              Che anno fantastico {child.name}! 🌟
            </h1>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '1rem',
              color: 'rgba(255,255,255,0.8)', margin: '0 0 40px 0',
            }}>
              Continua a disegnare, il mondo ha bisogno della tua fantasia!
            </p>
            {showRestart && (
              <button
                onClick={e => { e.stopPropagation(); restartFromBeginning() }}
                style={{
                  backgroundColor: 'white', color: '#FF7F6A',
                  border: 'none', borderRadius: '50px',
                  padding: '16px 32px',
                  fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                  fontSize: '1rem', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  animation: 'wrappedFadeIn 0.5s ease',
                }}
              >
                Ricomincia dall'inizio 🔄
              </button>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'black',
        display: 'flex', flexDirection: 'column',
        cursor: 'pointer',
      }}
      onClick={handleScreenTap}
    >
      {/* Progress bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '3px', backgroundColor: 'rgba(255,255,255,0.2)', zIndex: 1001,
      }}>
        <div style={{
          height: '100%', backgroundColor: '#FF7F6A',
          width: `${progress}%`, transition: 'width 0.4s linear',
        }} />
      </div>

      {/* Close button */}
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        style={{
          position: 'absolute', top: '16px', left: '16px', zIndex: 1002,
          background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%',
          width: '36px', height: '36px', color: 'white', fontSize: '16px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >✕</button>

      {/* Slide content with fade */}
      <div
        style={{
          flex: 1, position: 'relative',
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.5s ease',
        }}
      >
        {renderSlide()}
      </div>

      <style>{`
        @keyframes wrappedGradient {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes wrappedFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
