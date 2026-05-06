import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function VideoStoria({ renderUrl, storyText, drawingTitle, drawingId, style, userRole, videoTotali = 0, onVideoCompleted }) {
  const [fase, setFase] = useState('idle') // idle | avvio | attesa | completato | errore
  const [videoUrl, setVideoUrl] = useState(null)
  const [errore, setErrore] = useState(null)
  const [secondi, setSecondi] = useState(0)
  const intervalRef = useRef(null)
  const contatoreRef = useRef(null)

  useEffect(() => {
    if (drawingId && style) {
      supabase
        .from('renders')
        .select('video_url')
        .eq('drawing_id', drawingId)
        .eq('style', style)
        .single()
        .then(({ data }) => {
          if (data?.video_url) {
            setVideoUrl(data.video_url)
            setFase('completato')
          }
        })
    }
  }, [drawingId, style])

  const avviaVideo = async () => {
    if (!renderUrl) {
      alert('Genera prima un render stilizzato!')
      return
    }
    setFase('avvio')
    setErrore(null)
    setSecondi(0)
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
      if (res.status === 403) throw new Error(data.error || 'Hai raggiunto il limite beta, ci vediamo al lancio! 🚀')
      if (data.error) throw new Error(data.error)

      setFase('attesa')

      contatoreRef.current = setInterval(() => {
        setSecondi(s => s + 1)
      }, 1000)

      intervalRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch('/api/drawings/videostatus', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ request_id: data.request_id, drawing_id: drawingId, style })
          })
          const statusData = await statusRes.json()

          if (statusData.status === 'completed') {
            clearInterval(intervalRef.current)
            clearInterval(contatoreRef.current)
            setVideoUrl(statusData.video_url)
            setFase('completato')
            onVideoCompleted?.()
          } else if (statusData.status === 'failed') {
            clearInterval(intervalRef.current)
            clearInterval(contatoreRef.current)
            setErrore('Generazione fallita su fal.ai')
            setFase('errore')
          }
          // 'processing' → continua polling
        } catch (pollErr) {
          clearInterval(intervalRef.current)
          clearInterval(contatoreRef.current)
          setErrore(pollErr.message)
          setFase('errore')
        }
      }, 8000)

    } catch (err) {
      clearInterval(intervalRef.current)
      clearInterval(contatoreRef.current)
      setErrore(err.message)
      setFase('errore')
    }
  }

  const scaricaVideo = () => {
    const proxyUrl = `/api/drawings/download?url=${encodeURIComponent(videoUrl)}&filename=${encodeURIComponent((drawingTitle || 'storia') + '.mp4')}`
    const link = document.createElement('a')
    link.href = proxyUrl
    link.download = (drawingTitle || 'storia') + '.mp4'
    link.click()
  }

  const reset = () => {
    clearInterval(intervalRef.current)
    clearInterval(contatoreRef.current)
    setFase('idle')
    setVideoUrl(null)
    setErrore(null)
    setSecondi(0)
  }

  return (
    <div style={{ marginTop: '12px' }}>

      {fase === 'idle' && (
        <div>
          {userRole !== 'admin' && (
            <div style={{ marginBottom: '6px' }}>
              {videoTotali >= 4 ? (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#FF7F6A' }}>
                  Limite raggiunto 🚀
                </span>
              ) : (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#aaa' }}>
                  {videoTotali}/4 video totali
                </span>
              )}
            </div>
          )}
          <button
            onClick={avviaVideo}
            disabled={userRole !== 'admin' && videoTotali >= 4}
            style={{
              width: '100%', padding: '13px', borderRadius: '50px',
              background: (userRole !== 'admin' && videoTotali >= 4)
                ? '#ccc'
                : 'linear-gradient(135deg, #B2EBF2, #A084E8)',
              color: 'white', fontFamily: 'Outfit, sans-serif',
              fontWeight: 700, fontSize: '0.95rem',
              border: 'none',
              cursor: (userRole !== 'admin' && videoTotali >= 4) ? 'not-allowed' : 'pointer'
            }}
          >
            🎬 Genera video della storia
          </button>
        </div>
      )}

      {fase === 'avvio' && (
        <div style={{
          padding: '13px', borderRadius: '50px', textAlign: 'center',
          background: '#f0ede8', fontFamily: 'Outfit, sans-serif',
          color: '#A084E8', fontWeight: 700, fontSize: '0.95rem'
        }}>
          ⏳ Avvio generazione...
        </div>
      )}

      {fase === 'attesa' && (
        <div style={{
          backgroundColor: '#fff', borderRadius: '16px',
          padding: '20px', textAlign: 'center',
          border: '2px solid #f0ede8'
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: '3px solid #f0ede8', borderTopColor: '#A084E8',
            animation: 'spin 1s linear infinite', margin: '0 auto 12px'
          }} />
          <p style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 700,
            color: '#2D2D2D', margin: '0 0 4px 0', fontSize: '0.95rem'
          }}>
            🎬 Kling sta creando il video...
          </p>
          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: '0.82rem',
            color: '#aaa', margin: 0
          }}>
            {secondi}s — può richiedere 2-4 minuti
          </p>
        </div>
      )}

      {fase === 'errore' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{
            color: '#FF7F6A', fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem', margin: '0 0 10px 0'
          }}>
            ⚠️ {errore}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '10px 20px', borderRadius: '50px',
              border: '2px solid #FF7F6A', background: 'transparent',
              color: '#FF7F6A', cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', fontWeight: 700,
              fontSize: '0.9rem'
            }}
          >
            Riprova
          </button>
        </div>
      )}

      {fase === 'completato' && videoUrl && (
        <div style={{
          backgroundColor: '#fff', borderRadius: '16px',
          padding: '16px', border: '2px solid #f0ede8'
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
              onClick={reset}
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
