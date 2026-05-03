import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

const STILE_LABEL = { cartoon: 'Cartoon', toy: 'Toy', realistic: 'Realistic' }

export default function Share() {
  const { token } = useParams()
  const [stato, setStato] = useState('loading') // loading | ok | notfound
  const [drawing, setDrawing] = useState(null)
  const [renders, setRenders] = useState([])
  const [storia, setStoria] = useState(null)
  const [childName, setChildName] = useState(null)

  useEffect(() => {
    caricaDati()
  }, [token])

  const caricaDati = async () => {
    try {
      const res = await fetch(`/api/drawings/sharedata?token=${token}`)
      if (!res.ok) {
        setStato('notfound')
        return
      }
      const json = await res.json()
      const { drawing, renders, storia, childName } = json
      if (!drawing) {
        setStato('notfound')
        return
      }
      setDrawing(drawing)
      setRenders(renders || [])
      setStoria(storia || null)
      setChildName(childName || null)
      setStato('ok')
    } catch (err) {
      console.error('Errore caricamento share:', err)
      setStato('notfound')
    }
  }

  if (stato === 'loading') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FAF9F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '4px solid #f0ede8', borderTopColor: '#FF7F6A', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (stato === 'notfound') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FAF9F6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '20px' }}>
        <span style={{ fontSize: '3rem' }}>🔗</span>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#2D2D2D', margin: 0, textAlign: 'center' }}>
          Link non valido o scaduto
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', color: '#999', fontSize: '0.95rem', margin: 0, textAlign: 'center' }}>
          Questo link di condivisione non esiste più.
        </p>
      </div>
    )
  }

  const fotoUrl = drawing.processed_url || drawing.original_url
  const video = renders.find(r => r.video_url)
  const mesi = drawing.child_age_months
  const anni = mesi ? Math.floor(mesi / 12) : null
  const mesiRimanenti = mesi ? mesi % 12 : null
  const etaLabel = anni !== null
    ? mesiRimanenti > 0 ? anni + ' anni e ' + mesiRimanenti + ' mesi' : anni + ' anni'
    : null
  const pageUrl = window.location.href
  const testoCondivisione = 'Guarda la magia di Imaginaria! ✨ ' + (drawing.ai_title || 'Un disegno magico')

  return (
    <div style={{ backgroundColor: '#FAF9F6', minHeight: '100vh', paddingBottom: '48px' }}>

      {/* Header */}
      <header style={{
        backgroundColor: '#FAF9F6',
        borderBottom: '1px solid #f0ede8',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <img
          src="/logo-transparent.png"
          alt="Imaginaria"
          style={{ height: '40px', objectFit: 'contain' }}
        />
      </header>

      <main style={{ maxWidth: '540px', margin: '0 auto', padding: '28px 20px 0' }}>

        {/* Titolo */}
        <h1 style={{
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 800,
          fontSize: '2rem',
          color: '#FF7F6A',
          margin: '0 0 8px 0',
          lineHeight: 1.2,
          textAlign: 'center',
        }}>
          {drawing.ai_title || 'Il disegno magico'}
        </h1>

        {(childName || etaLabel) && (
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.95rem',
            color: '#A084E8',
            textAlign: 'center',
            margin: '0 0 24px 0',
            fontWeight: 600,
          }}>
            {childName ? '🎨 Disegno di ' + childName : ''}
            {childName && etaLabel ? ' · ' : ''}
            {etaLabel ? etaLabel : ''}
          </p>
        )}

        {/* Foto originale */}
        {fotoUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
            <img
              src={fotoUrl}
              alt={drawing.ai_title || 'Disegno'}
              style={{
                width: '100%',
                maxWidth: '360px',
                borderRadius: '24px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                objectFit: 'cover',
              }}
            />
          </div>
        )}

        {/* Descrizione AI */}
        {drawing.ai_description && (
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '1rem',
            color: '#555',
            lineHeight: 1.7,
            textAlign: 'center',
            margin: '0 0 32px 0',
          }}>
            {drawing.ai_description}
          </p>
        )}

        {/* Sezione render */}
        {renders.length > 0 && (
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: '1.3rem',
              color: '#2D2D2D',
              margin: '0 0 16px 0',
              textAlign: 'center',
            }}>
              Trasformazioni Magiche ✨
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: renders.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '12px',
            }}>
              {renders.map(r => (
                <div key={r.style} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <img
                    src={r.result_url}
                    alt={STILE_LABEL[r.style] || r.style}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      objectFit: 'cover',
                      borderRadius: '16px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                    }}
                  />
                  <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#888',
                    textAlign: 'center',
                    textTransform: 'capitalize',
                  }}>
                    {STILE_LABEL[r.style] || r.style}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Video */}
        {video?.video_url && (
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: '1.3rem',
              color: '#2D2D2D',
              margin: '0 0 16px 0',
              textAlign: 'center',
            }}>
              Video Magico 🎬
            </h2>
            <video
              src={video.video_url}
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: '100%',
                borderRadius: '20px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}
            />
          </section>
        )}

        {/* Storia */}
        {storia?.testo && (
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: '1.3rem',
              color: '#2D2D2D',
              margin: '0 0 16px 0',
              textAlign: 'center',
            }}>
              La Storia 📖
            </h2>
            <div style={{
              backgroundColor: '#EDE7F6',
              borderRadius: '20px',
              padding: '24px 20px',
              border: '1px solid #D1C4E9',
            }}>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.97rem',
                color: '#3D2D5E',
                lineHeight: 1.85,
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}>
                {storia.testo}
              </p>
            </div>
          </section>
        )}

        {/* Condivisione */}
        <section style={{ marginBottom: '32px', textAlign: 'center' }}>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.9rem',
            color: '#888',
            marginBottom: '12px',
          }}>
            Condividi questa magia ✨
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href={'https://wa.me/?text=' + encodeURIComponent(testoCondivisione + ' ' + pageUrl)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#25D366',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '50px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              📱 WhatsApp
            </a>
            <a
              href={'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(pageUrl)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#1877F2',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '50px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              👍 Facebook
            </a>
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={() => navigator.share({ title: drawing.ai_title, text: testoCondivisione, url: pageUrl })}
                style={{
                  backgroundColor: '#FF7F6A',
                  color: 'white',
                  padding: '12px 20px',
                  borderRadius: '50px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                🔗 Condividi
              </button>
            )}
          </div>
        </section>

        {/* Footer */}
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.82rem',
          color: '#A084E8',
          textAlign: 'center',
          margin: '8px 0 0 0',
        }}>
          Creato con{' '}
          <a
            href="https://imaginaria-beryl.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#FF7F6A', fontWeight: 600, textDecoration: 'none' }}
          >
            Imaginaria ✨
          </a>
        </p>

      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
