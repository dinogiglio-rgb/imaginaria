import { useState, useRef } from 'react'

export default function DrawingCard({ drawing, onClick, onElimina }) {
  const [mostraMenu, setMostraMenu] = useState(false)
  const timerRef = useRef(null)

  const handlePressStart = () => {
    timerRef.current = setTimeout(() => {
      setMostraMenu(true)
      if (navigator.vibrate) navigator.vibrate(50)
    }, 600)
  }

  const handlePressEnd = () => clearTimeout(timerRef.current)

  const data = drawing.created_at
    ? new Date(drawing.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
    : ''

  return (
    <>
      <div
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onClick={() => !mostraMenu && onClick()}
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          cursor: 'pointer',
          transition: 'transform 0.15s, box-shadow 0.15s',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.03)'
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'
          handlePressEnd()
        }}
      >
        <div style={{
          width: '100%', aspectRatio: '1',
          backgroundColor: '#f5f3f0', overflow: 'hidden'
        }}>
          <img
            src={drawing.processed_url || drawing.original_url}
            alt={drawing.title || 'Disegno'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            draggable={false}
          />
        </div>

        <div style={{ padding: '8px 10px 10px' }}>
          <p style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 700,
            fontSize: '0.82rem', color: '#2D2D2D',
            margin: '0 0 3px 0', whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {drawing.ai_title || drawing.title || 'Senza titolo'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '0.72rem',
              color: '#A084E8', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: '65%'
            }}>
              {drawing.category || '—'}
            </p>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '0.68rem',
              color: '#bbb', margin: 0, flexShrink: 0
            }}>
              {data}
            </p>
          </div>
        </div>
      </div>

      {mostraMenu && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'flex-end',
            justifyContent: 'center', padding: '20px'
          }}
          onClick={() => setMostraMenu(false)}
        >
          <div
            style={{
              backgroundColor: 'white', borderRadius: '24px',
              padding: '20px', width: '100%', maxWidth: '420px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: '16px', paddingBottom: '16px',
              borderBottom: '1px solid #f0ede8'
            }}>
              <img
                src={drawing.processed_url || drawing.original_url}
                alt=""
                style={{ width: '52px', height: '52px', borderRadius: '12px', objectFit: 'cover' }}
              />
              <p style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                fontSize: '1rem', color: '#2D2D2D', margin: 0
              }}>
                {drawing.ai_title || drawing.title || 'Senza titolo'}
              </p>
            </div>
            <button
              onClick={() => { setMostraMenu(false); onClick() }}
              style={{
                width: '100%', padding: '14px', background: 'none',
                border: 'none', borderRadius: '14px', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: 600,
                fontSize: '1rem', color: '#2D2D2D', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '12px',
                marginBottom: '4px'
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>👁️</span> Apri disegno
            </button>
            <button
              onClick={() => { setMostraMenu(false); onElimina(drawing.id) }}
              style={{
                width: '100%', padding: '14px', background: 'none',
                border: 'none', borderRadius: '14px', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: 600,
                fontSize: '1rem', color: '#FF7F6A', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>🗑️</span> Elimina disegno
            </button>
            <button
              onClick={() => setMostraMenu(false)}
              style={{
                width: '100%', padding: '14px', background: '#f5f3f0',
                border: 'none', borderRadius: '14px', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: 600,
                fontSize: '0.95rem', color: '#999', marginTop: '8px'
              }}
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </>
  )
}
