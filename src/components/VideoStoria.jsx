import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function VideoStoria({ renderUrl, storyText, drawingTitle }) {
  const [generando, setGenerando] = useState(false)
  const [videoUrl, setVideoUrl] = useState(null)
  const [errore, setErrore] = useState(null)

  const generaVideo = async () => {
    if (!renderUrl) {
      alert('Questo disegno non ha ancora un render stilizzato. Generane uno prima!')
      return
    }
    setGenerando(true)
    setErrore(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/drawings/generatevideo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          render_url: renderUrl,
          story_text: storyText,
          drawing_title: drawingTitle || 'disegno'
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setVideoUrl(data.video_url)
    } catch (err) {
      setErrore('Errore nella generazione: ' + err.message)
    } finally {
      setGenerando(false)
    }
  }

  const scaricaVideo = () => {
    const link = document.createElement('a')
    link.href = videoUrl
    link.download = `${drawingTitle || 'storia'}-video.mp4`
    link.click()
  }

  return (
    <div style={{ marginTop: '12px' }}>

      {!videoUrl && (
        <button
          onClick={generaVideo}
          disabled={generando}
          style={{
            width: '100%', padding: '13px', borderRadius: '50px',
            background: generando
              ? '#e8e4df'
              : 'linear-gradient(135deg, #B2EBF2, #A084E8)',
            color: generando ? '#aaa' : 'white',
            fontFamily: 'Outfit, sans-serif', fontWeight: 700,
            fontSize: '0.9rem', border: 'none',
            cursor: generando ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '8px'
          }}
        >
          {generando
            ? <><Spinner /> Generazione video in corso (~60 sec)...</>
            : '🎬 Genera video della storia'}
        </button>
      )}

      {errore && (
        <p style={{
          color: '#FF7F6A', fontSize: '0.82rem', fontFamily: 'Inter, sans-serif',
          textAlign: 'center', marginTop: '8px', margin: '8px 0 0 0'
        }}>
          {errore}
        </p>
      )}

      {videoUrl && (
        <div style={{
          backgroundColor: '#fff', borderRadius: '16px',
          padding: '16px', marginTop: '8px',
          border: '2px solid #f0ede8'
        }}>
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            playsInline
            style={{ width: '100%', borderRadius: '12px', display: 'block' }}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              onClick={scaricaVideo}
              style={{
                flex: 1, padding: '12px', borderRadius: '50px',
                background: 'linear-gradient(135deg, #FF7F6A, #A084E8)',
                color: 'white', fontFamily: 'Outfit, sans-serif',
                fontWeight: 700, fontSize: '0.9rem', border: 'none',
                cursor: 'pointer'
              }}
            >
              📥 Scarica video
            </button>
            <button
              onClick={() => setVideoUrl(null)}
              style={{
                padding: '12px 18px', borderRadius: '50px',
                background: 'transparent', border: '2px solid #A084E8',
                color: '#A084E8', fontFamily: 'Outfit, sans-serif',
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer'
              }}
            >
              🔄
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{
      width: '16px', height: '16px', borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: 'white',
      animation: 'spin 0.8s linear infinite',
      flexShrink: 0
    }} />
  )
}
