import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import RenderSection from '../components/RenderSection'
import Viewer3D from '../components/Viewer3D'
import VideoStoria from '../components/VideoStoria'

export default function Drawing({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [drawing, setDrawing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [errore, setErrore] = useState(null)
  const [confermaElimina, setConfermaElimina] = useState(false)
  const [fotoIngrandita, setFotoIngrandita] = useState(false)
  const [modificaAperta, setModificaAperta] = useState(false)
  const [formModifica, setFormModifica] = useState({
    ai_title: '',
    ai_description: '',
    indicazioni: '',
  })
  const [storiaAperta, setStoriaAperta] = useState(false)
  const [storia, setStoria] = useState(null)
  const [tipoStoria, setTipoStoria] = useState(null)
  const [loadingStoria, setLoadingStoria] = useState(false)
  const [indicazioniStoria, setIndicazioniStoria] = useState('')
  const [storieSalvate, setStorieSalvate] = useState([])
  const [storiaEspansa, setStoriaEspansa] = useState(null)
  const [generando3D, setGenerando3D] = useState(false)
  const [modelUrl, setModelUrl] = useState(null)
  const [mostraViewer, setMostraViewer] = useState(false)

  useEffect(() => {
    fetchDrawing()
  }, [id])

  const fetchDrawing = async () => {
    try {
      const { data, error } = await supabase
        .from('drawings')
        .select('*, renders(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      setDrawing(data)

      // Carica storie salvate
      const { data: storie } = await supabase
        .from('stories')
        .select('*')
        .eq('drawing_id', id)
        .order('created_at', { ascending: false })
      setStorieSalvate(storie || [])

      if (!data.ai_title && !data.ai_description) {
        setTimeout(() => analyzeDrawing(data), 800)
      }
    } catch (err) {
      console.error('Errore caricamento:', err)
      setErrore('Disegno non trovato.')
    } finally {
      setLoading(false)
    }
  }

  const analyzeDrawing = async (drawingData) => {
    try {
      setAnalyzing(true)
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch(`/api/drawings/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ drawingId: drawingData?.id || id })
      })

      if (!res.ok) throw new Error('Analisi fallita')
      const result = await res.json()

      setDrawing(prev => ({
        ...prev,
        ai_title: result.ai_title,
        ai_description: result.ai_description,
        ai_prompt_render: result.ai_prompt_render
      }))
    } catch (err) {
      console.error('Errore analisi:', err)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleApriModifica = () => {
    setFormModifica({
      ai_title: drawing?.ai_title || '',
      ai_description: drawing?.ai_description || '',
      indicazioni: '',
    })
    setModificaAperta(true)
  }

  const handleSalvaModifica = async () => {
    try {
      const { error } = await supabase
        .from('drawings')
        .update({
          ai_title: formModifica.ai_title,
          ai_description: formModifica.ai_description,
        })
        .eq('id', id)
      if (error) throw error
      setDrawing(prev => ({
        ...prev,
        ai_title: formModifica.ai_title,
        ai_description: formModifica.ai_description,
      }))
      setModificaAperta(false)
    } catch (err) {
      console.error('Errore salvataggio:', err)
    }
  }

  const handleRigenera = async () => {
    try {
      setModificaAperta(false)
      setAnalyzing(true)
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch('/api/drawings/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          drawingId: id,
          indicazioni: formModifica.indicazioni,
        })
      })

      if (!res.ok) throw new Error('Rigenerazione fallita')
      const result = await res.json()
      setDrawing(prev => ({
        ...prev,
        ai_title: result.ai_title,
        ai_description: result.ai_description,
        ai_prompt_render: result.ai_prompt_render,
      }))
    } catch (err) {
      console.error('Errore rigenerazione:', err)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleGeneraStoria = async (tipo) => {
    try {
      setLoadingStoria(true)
      setStoria(null)
      setTipoStoria(tipo)
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch('/api/drawings/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          drawingId: id,
          tipo,
          indicazioni: indicazioniStoria || drawing?.ai_description || ''
        })
      })

      if (!res.ok) throw new Error('Generazione storia fallita')
      const result = await res.json()
      setStoria(result.storia)

      // Aggiorna lista storie salvate
      const { data: storie } = await supabase
        .from('stories')
        .select('*')
        .eq('drawing_id', id)
        .order('created_at', { ascending: false })
      setStorieSalvate(storie || [])

    } catch (err) {
      console.error('Errore storia:', err)
    } finally {
      setLoadingStoria(false)
    }
  }

  const genera3D = async () => {
    // Cerca il render completato più recente direttamente da Supabase
    const { data: renderRows } = await supabase
      .from('renders')
      .select('result_url')
      .eq('drawing_id', drawing.id)
      .not('result_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)

    const renderUrl = renderRows?.[0]?.result_url
    if (!renderUrl) {
      alert('Genera prima un render stilizzato!')
      return
    }

    setGenerando3D(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/drawings/generate3d', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ render_url: renderUrl, drawing_id: drawing.id })
      })
      const data = await res.json()
      if (data.model_url) {
        setModelUrl(data.model_url)
        setMostraViewer(true)
      } else {
        alert('Errore nella generazione 3D: ' + data.error)
      }
    } catch (err) {
      alert('Errore: ' + err.message)
    } finally {
      setGenerando3D(false)
    }
  }

  const handleElimina = async () => {
    try {
      const estensioni = ['jpg', 'jpeg', 'png', 'webp']
      for (const ext of estensioni) {
        await supabase.storage.from('originals').remove([`${id}.${ext}`])
        await supabase.storage.from('processed').remove([`${id}.${ext}`])
      }
      if (drawing?.renders?.length > 0) {
        for (const render of drawing.renders) {
          await supabase.storage.from('renders').remove([`${id}/${render.style}.jpg`])
        }
      }
      const { error } = await supabase.from('drawings').delete().eq('id', id)
      if (error) throw error
      navigate('/')
    } catch (err) {
      console.error('Errore eliminazione:', err)
      setErrore("Errore durante l'eliminazione. Riprova.")
      setConfermaElimina(false)
    }
  }


  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF9F6' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid #f0ede8', borderTopColor: '#FF7F6A', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (errore && !drawing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF9F6', gap: '16px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', color: '#FF7F6A' }}>{errore}</p>
        <button onClick={() => navigate('/')} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #FF7F6A, #A084E8)', border: 'none', borderRadius: '50px', color: 'white', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
          Torna alla galleria
        </button>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#FAF9F6', minHeight: '100vh', paddingBottom: '40px' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: '#FAF9F6',
        borderBottom: '1px solid #f0ede8',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', padding: '4px' }}>
          ←
        </button>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#2D2D2D', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {drawing?.ai_title || drawing?.title || 'Disegno'}
        </h1>
        <button
          onClick={() => setConfermaElimina(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', padding: '4px', opacity: 0.6 }}
        >
          🗑️
        </button>
      </header>

      <div style={{ padding: '20px' }}>

        {/* Foto originale */}
        {drawing?.original_url && (
          <div style={{ marginBottom: '20px' }}>
            {/* Miniatura cliccabile */}
            <div
              onClick={() => setFotoIngrandita(true)}
              style={{
                position: 'relative',
                width: '120px',
                height: '120px',
                cursor: 'zoom-in',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                border: '3px solid white',
              }}
            >
              <img
                src={drawing.original_url}
                alt="Disegno originale"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute', bottom: '6px', right: '6px',
                backgroundColor: 'rgba(0,0,0,0.45)',
                borderRadius: '50%', width: '26px', height: '26px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem'
              }}>
                🔍
              </div>
            </div>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '0.78rem',
              color: '#999', margin: '6px 0 0 0'
            }}>
              Tocca per ingrandire
            </p>
          </div>
        )}

        {/* Popup foto ingrandita */}
        {fotoIngrandita && (
          <div
            onClick={() => setFotoIngrandita(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              backgroundColor: 'rgba(0,0,0,0.92)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '20px',
              cursor: 'zoom-out',
            }}
          >
            <button
              onClick={() => setFotoIngrandita(false)}
              style={{
                position: 'absolute', top: '20px', right: '20px',
                background: 'rgba(255,255,255,0.15)',
                border: 'none', borderRadius: '50%',
                width: '40px', height: '40px',
                color: 'white', fontSize: '1.2rem',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}
            >
              ✕
            </button>
            <img
              src={drawing.original_url}
              alt="Disegno originale"
              onClick={e => e.stopPropagation()}
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '16px',
                boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
              }}
            />
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.8rem', marginTop: '16px'
            }}>
              Tocca fuori per chiudere
            </p>
          </div>
        )}

        {/* Info disegno */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '16px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {drawing?.category && <InfoChip label="Categoria" value={drawing.category} />}
            {drawing?.notes && <InfoChip label="Note" value={drawing.notes} cols={2} />}
          </div>
        </div>

        {/* Analisi AI */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.3rem' }}>🤖</span>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#2D2D2D', margin: 0 }}>
                Analisi Magica
              </h2>
            </div>
            {drawing?.ai_title && !analyzing && (
              <button
                onClick={handleApriModifica}
                style={{
                  background: 'none', border: '2px solid #e8e4df',
                  borderRadius: '50px', padding: '6px 14px',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  fontWeight: 600, fontSize: '0.8rem', color: '#666',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                ✏️ Modifica
              </button>
            )}
          </div>

          {analyzing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '3px solid #f0ede8', borderTopColor: '#A084E8', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              <p style={{ fontFamily: 'Inter, sans-serif', color: '#A084E8', margin: 0, fontSize: '0.95rem' }}>
                Claude sta analizzando il disegno...
              </p>
            </div>
          ) : drawing?.ai_title ? (
            <>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#FF7F6A', margin: '0 0 8px 0' }}>
                "{drawing.ai_title}"
              </h3>
              <p style={{ fontFamily: 'Inter, sans-serif', color: '#666', fontSize: '0.95rem', margin: 0, lineHeight: 1.6 }}>
                {drawing.ai_description}
              </p>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', color: '#999', margin: 0, fontSize: '0.9rem' }}>
                Analisi non ancora disponibile
              </p>
              <button
                onClick={() => analyzeDrawing(drawing)}
                style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #FF7F6A, #A084E8)', border: 'none', borderRadius: '50px', color: 'white', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.85rem' }}
              >
                Analizza ora
              </button>
            </div>
          )}
        </div>

        {/* Bottone storia */}
        {drawing?.ai_title && !analyzing && (
          <button
            onClick={() => { setStoriaAperta(true); setStoria(null); setTipoStoria(null) }}
            style={{
              width: '100%', padding: '16px',
              background: 'linear-gradient(135deg, #A084E8, #6C63FF)',
              border: 'none', borderRadius: '20px', cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif', fontWeight: 700,
              fontSize: '1rem', color: 'white', marginBottom: '24px',
              boxShadow: '0 6px 20px rgba(160,132,232,0.35)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '10px'
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>📖</span>
            Genera la storia magica
          </button>
        )}

        {/* Storie salvate */}
        {storieSalvate.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800,
              fontSize: '1.2rem', color: '#2D2D2D', margin: '0 0 12px 0'
            }}>
              📚 Storie salvate ({storieSalvate.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {storieSalvate.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => setStoriaEspansa(storiaEspansa === s.id ? null : s.id)}
                  style={{
                    backgroundColor: 'white', borderRadius: '16px',
                    padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem' }}>
                        {s.tipo === 'breve' ? '✨' : '📖'}
                      </span>
                      <div>
                        <p style={{
                          fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                          fontSize: '0.9rem', color: '#2D2D2D', margin: 0
                        }}>
                          {s.tipo === 'breve' ? 'Storia breve' : 'Favola completa'} #{storieSalvate.length - i}
                        </p>
                        <p style={{
                          fontFamily: 'Inter, sans-serif', fontSize: '0.75rem',
                          color: '#999', margin: 0
                        }}>
                          {new Date(s.created_at).toLocaleDateString('it-IT', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <span style={{ color: '#A084E8', fontSize: '1.1rem' }}>
                      {storiaEspansa === s.id ? '▲' : '▼'}
                    </span>
                  </div>

                  {storiaEspansa === s.id && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0ede8' }}>
                      <p style={{
                        fontFamily: 'Inter, sans-serif', fontSize: '0.9rem',
                        color: '#444', lineHeight: 1.8, margin: '0 0 12px 0',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {s.testo}
                      </p>
                      <button
                        onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(s.testo) }}
                        style={{
                          padding: '8px 16px', background: 'none',
                          border: '2px solid #A084E8', borderRadius: '50px',
                          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                          fontWeight: 600, fontSize: '0.8rem', color: '#A084E8'
                        }}
                      >
                        📋 Copia
                      </button>
                      <div onClick={e => e.stopPropagation()}>
                        <VideoStoria
                          renderUrl={drawing?.renders?.find(r => r.result_url)?.result_url || drawing?.processed_url}
                          storyText={s.testo}
                          drawingTitle={drawing?.ai_title || drawing?.title}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Render stilizzati */}
        <RenderSection
          drawingId={drawing?.id}
          hasAiPrompt={!!drawing?.ai_prompt_render}
        />

        {/* Pulsante 3D */}
        {drawing?.ai_title && (
          <button
            onClick={genera3D}
            disabled={generando3D}
            style={{
              width: '100%', padding: '16px', borderRadius: '50px',
              background: generando3D
                ? '#ccc'
                : 'linear-gradient(135deg, #A084E8, #FF7F6A)',
              color: 'white', fontFamily: 'Outfit, sans-serif',
              fontWeight: 700, fontSize: '1rem', border: 'none',
              cursor: generando3D ? 'not-allowed' : 'pointer',
              marginTop: '12px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '8px'
            }}
          >
            {generando3D
              ? <><div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} /> Generazione 3D in corso (~60 sec)...</>
              : '🖨️ Trasforma in 3D'}
          </button>
        )}

        {errore && (
          <p style={{ color: '#FF7F6A', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', marginTop: '16px', textAlign: 'center' }}>
            ⚠️ {errore}
          </p>
        )}
      </div>

      {confermaElimina && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '24px',
            padding: '28px 24px', width: '100%', maxWidth: '420px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#2D2D2D', margin: '0 0 8px 0' }}>
              Elimina disegno?
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', color: '#999', fontSize: '0.9rem', margin: '0 0 24px 0' }}>
              Il disegno e tutte le trasformazioni magiche verranno eliminati per sempre.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setConfermaElimina(false)}
                style={{
                  flex: 1, padding: '14px', background: '#f5f3f0',
                  border: 'none', borderRadius: '50px', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontWeight: 600,
                  fontSize: '0.95rem', color: '#666'
                }}
              >
                Annulla
              </button>
              <button
                onClick={handleElimina}
                style={{
                  flex: 1, padding: '14px',
                  background: 'linear-gradient(135deg, #FF7F6A, #ff4444)',
                  border: 'none', borderRadius: '50px', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontWeight: 700,
                  fontSize: '0.95rem', color: 'white'
                }}
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pannello modifica analisi */}
      {modificaAperta && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'center', padding: '20px'
        }}>
          <div
            style={{
              backgroundColor: 'white', borderRadius: '24px',
              padding: '24px', width: '100%', maxWidth: '480px',
              maxHeight: '90vh', overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: '40px', height: '4px', backgroundColor: '#e0ddd8',
              borderRadius: '2px', margin: '0 auto 20px'
            }} />

            <h3 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800,
              fontSize: '1.2rem', color: '#2D2D2D', margin: '0 0 20px 0'
            }}>
              ✏️ Modifica analisi
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelModificaStyle}>Titolo</label>
              <input
                type="text"
                value={formModifica.ai_title}
                onChange={e => setFormModifica(f => ({ ...f, ai_title: e.target.value }))}
                style={inputModificaStyle}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelModificaStyle}>Descrizione</label>
              <textarea
                value={formModifica.ai_description}
                onChange={e => setFormModifica(f => ({ ...f, ai_description: e.target.value }))}
                rows={3}
                style={{ ...inputModificaStyle, resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>

            <div style={{
              backgroundColor: '#FAF9F6', borderRadius: '16px',
              padding: '16px', marginBottom: '20px'
            }}>
              <label style={{ ...labelModificaStyle, color: '#A084E8' }}>
                🪄 Indica cosa ha voluto disegnare
              </label>
              <p style={{
                fontFamily: 'Inter, sans-serif', fontSize: '0.8rem',
                color: '#999', margin: '0 0 10px 0'
              }}>
                Scrivi qui le indicazioni e Claude rigenererà l'analisi tenendone conto
              </p>
              <textarea
                placeholder='"Ha voluto disegnare un supereroe che vola su Marte con il suo cane"'
                value={formModifica.indicazioni}
                onChange={e => setFormModifica(f => ({ ...f, indicazioni: e.target.value }))}
                rows={3}
                style={{ ...inputModificaStyle, resize: 'vertical', lineHeight: 1.5, backgroundColor: 'white' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {formModifica.indicazioni && (
                <button
                  onClick={handleRigenera}
                  style={{
                    padding: '14px',
                    background: 'linear-gradient(135deg, #FF7F6A, #A084E8)',
                    border: 'none', borderRadius: '50px', cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                    fontSize: '1rem', color: 'white',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px'
                  }}
                >
                  🪄 Rigenera con le indicazioni
                </button>
              )}
              <button
                onClick={handleSalvaModifica}
                style={{
                  padding: '14px', background: 'white',
                  border: '2px solid #A084E8', borderRadius: '50px',
                  cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                  fontWeight: 700, fontSize: '1rem', color: '#A084E8'
                }}
              >
                ✓ Salva modifiche manuali
              </button>
              <button
                onClick={() => setModificaAperta(false)}
                style={{
                  padding: '14px', background: '#f5f3f0',
                  border: 'none', borderRadius: '50px', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontWeight: 600,
                  fontSize: '0.95rem', color: '#999'
                }}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup storia */}
      {storiaAperta && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setStoriaAperta(false)}
        >
          <div
            style={{
              backgroundColor: 'white', borderRadius: '24px 24px 0 0',
              padding: '24px 20px 40px',
              width: '100%', maxWidth: '540px',
              maxHeight: '90vh', overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: '40px', height: '4px', backgroundColor: '#e0ddd8',
              borderRadius: '2px', margin: '0 auto 20px'
            }} />

            <h3 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800,
              fontSize: '1.3rem', color: '#2D2D2D', margin: '0 0 6px 0'
            }}>
              📖 La storia magica
            </h3>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
              color: '#999', margin: '0 0 20px 0'
            }}>
              Claude inventerà una storia basata sul disegno
            </p>

            {/* Indicazioni opzionali */}
            {!storia && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block', fontFamily: 'Inter, sans-serif',
                  fontWeight: 600, fontSize: '0.85rem', color: '#2D2D2D',
                  marginBottom: '8px'
                }}>
                  Indicazioni <span style={{ color: '#ccc', fontWeight: 400 }}>(opzionale)</span>
                </label>
                <textarea
                  placeholder={"\"C'è un drago buono che aiuta i bambini del villaggio...\""}
                  value={indicazioniStoria}
                  onChange={e => setIndicazioniStoria(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%', padding: '12px 16px',
                    borderRadius: '14px', border: '2px solid #e8e4df',
                    backgroundColor: 'white', fontFamily: 'Inter, sans-serif',
                    fontSize: '0.9rem', color: '#2D2D2D', outline: 'none',
                    boxSizing: 'border-box', resize: 'none', lineHeight: 1.5
                  }}
                />
              </div>
            )}

            {/* Selezione tipo / loading / storia */}
            {loadingStoria ? (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '16px', padding: '32px 0'
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  border: '4px solid #f0ede8', borderTopColor: '#A084E8',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <p style={{
                  fontFamily: 'Inter, sans-serif', color: '#A084E8',
                  fontSize: '0.95rem', margin: 0, textAlign: 'center'
                }}>
                  Claude sta scrivendo la storia...
                </p>
              </div>
            ) : storia ? (
              <div>
                <div style={{
                  backgroundColor: '#FAF9F6', borderRadius: '16px',
                  padding: '20px', marginBottom: '20px'
                }}>
                  <p style={{
                    fontFamily: 'Inter, sans-serif', fontSize: '0.95rem',
                    color: '#2D2D2D', margin: 0, lineHeight: 1.8,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {storia}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      if (navigator.clipboard) navigator.clipboard.writeText(storia)
                    }}
                    style={{
                      flex: 1, padding: '12px',
                      background: 'white', border: '2px solid #A084E8',
                      borderRadius: '50px', cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif', fontWeight: 600,
                      fontSize: '0.9rem', color: '#A084E8'
                    }}
                  >
                    📋 Copia
                  </button>
                  <button
                    onClick={() => handleGeneraStoria(tipoStoria)}
                    style={{
                      flex: 1, padding: '12px',
                      background: 'linear-gradient(135deg, #A084E8, #6C63FF)',
                      border: 'none', borderRadius: '50px', cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif', fontWeight: 600,
                      fontSize: '0.9rem', color: 'white'
                    }}
                  >
                    🔄 Rigenera
                  </button>
                </div>
                <VideoStoria
                  renderUrl={drawing?.renders?.find(r => r.result_url)?.result_url || drawing?.processed_url}
                  storyText={storia}
                  drawingTitle={drawing?.ai_title || drawing?.title}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => handleGeneraStoria('breve')}
                  style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, #FF7F6A, #A084E8)',
                    border: 'none', borderRadius: '16px', cursor: 'pointer',
                    textAlign: 'left', color: 'white'
                  }}
                >
                  <p style={{
                    fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                    fontSize: '1.05rem', margin: '0 0 4px 0'
                  }}>
                    ⚡ Storia breve
                  </p>
                  <p style={{
                    fontFamily: 'Inter, sans-serif', fontSize: '0.82rem',
                    margin: 0, opacity: 0.85
                  }}>
                    3-4 paragrafi · circa 150 parole
                  </p>
                </button>
                <button
                  onClick={() => handleGeneraStoria('favola')}
                  style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, #A084E8, #6C63FF)',
                    border: 'none', borderRadius: '16px', cursor: 'pointer',
                    textAlign: 'left', color: 'white'
                  }}
                >
                  <p style={{
                    fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                    fontSize: '1.05rem', margin: '0 0 4px 0'
                  }}>
                    📚 Favola completa
                  </p>
                  <p style={{
                    fontFamily: 'Inter, sans-serif', fontSize: '0.82rem',
                    margin: 0, opacity: 0.85
                  }}>
                    circa 2000 parole · piena di avventure · con morale
                  </p>
                </button>
                <button
                  onClick={() => setStoriaAperta(false)}
                  style={{
                    padding: '14px', background: '#f5f3f0',
                    border: 'none', borderRadius: '50px', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', fontWeight: 600,
                    fontSize: '0.95rem', color: '#999', marginTop: '4px'
                  }}
                >
                  Annulla
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {mostraViewer && modelUrl && (
        <Viewer3D
          modelUrl={modelUrl}
          onClose={() => setMostraViewer(false)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const labelModificaStyle = {
  display: 'block',
  fontFamily: 'Inter, sans-serif', fontWeight: 600,
  fontSize: '0.85rem', color: '#2D2D2D', marginBottom: '8px'
}

const inputModificaStyle = {
  width: '100%', padding: '12px 16px',
  borderRadius: '14px', border: '2px solid #e8e4df',
  backgroundColor: 'white', fontFamily: 'Inter, sans-serif',
  fontSize: '0.95rem', color: '#2D2D2D', outline: 'none',
  boxSizing: 'border-box'
}

function InfoChip({ label, value, cols }) {
  return (
    <div style={{ gridColumn: cols === 2 ? 'span 2' : 'span 1' }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#999', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', color: '#2D2D2D', margin: 0, fontWeight: 500 }}>
        {value}
      </p>
    </div>
  )
}
