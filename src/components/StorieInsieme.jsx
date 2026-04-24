import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import VideoStoria from './VideoStoria'

const TEMI_PREDEFINITI = [
  '🌟 Avventura', '🤝 Amicizia', '🔮 Magia', '🦁 Animali',
  '🚀 Spazio', '🏰 Castello', '🌊 Mare', '🦸 Supereroi'
]

export default function StorieInsieme() {
  const [storie, setStorie] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostraForm, setMostraForm] = useState(false)
  const [personaggiDisponibili, setPersonaggiDisponibili] = useState([])
  const [personaggiSelezionati, setPersonaggiSelezionati] = useState([])
  const [tema, setTema] = useState('')
  const [temaCustom, setTemaCustom] = useState('')
  const [titolo, setTitolo] = useState('')
  const [generando, setGenerando] = useState(false)
  const [renderDefault, setRenderDefault] = useState(null)

  useEffect(() => {
    caricaTutto()
  }, [])

  const caricaTutto = async () => {
    const { data: storieData } = await supabase
      .from('stories')
      .select('*')
      .eq('tipo', 'combinata')
      .order('created_at', { ascending: false })
    setStorie(storieData || [])

    const { data: disegni } = await supabase
      .from('drawings')
      .select('id, ai_title, title')
      .order('created_at', { ascending: false })
    if (disegni) {
      const nomi = disegni
        .map(d => d.ai_title || d.title)
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i)
      setPersonaggiDisponibili(nomi)
    }

    const { data: renderRow } = await supabase
      .from('renders')
      .select('result_url')
      .not('result_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (renderRow?.result_url) setRenderDefault(renderRow.result_url)

    setLoading(false)
  }

  const togglePersonaggio = (nome) => {
    setPersonaggiSelezionati(prev =>
      prev.includes(nome) ? prev.filter(p => p !== nome) : [...prev, nome]
    )
  }

  const generaStoria = async () => {
    if (personaggiSelezionati.length < 2) {
      alert('Seleziona almeno 2 personaggi!')
      return
    }
    if (!titolo.trim()) {
      alert('Inserisci un titolo!')
      return
    }
    const temaFinale = temaCustom.trim() || tema
    if (!temaFinale) {
      alert('Scegli o scrivi un tema!')
      return
    }
    setGenerando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/stories/combine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          personaggi: personaggiSelezionati,
          tema: temaFinale,
          titolo: titolo.trim()
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      await caricaTutto()
      setMostraForm(false)
      setPersonaggiSelezionati([])
      setTema('')
      setTemaCustom('')
      setTitolo('')
    } catch (err) {
      console.error('Errore:', err)
      alert('Errore nella generazione: ' + err.message + '\nRiprova o accorcia la selezione di personaggi.')
    } finally {
      setGenerando(false)
    }
  }

  if (loading) {
    return <p style={{ textAlign: 'center', color: '#999', fontFamily: 'Inter, sans-serif' }}>Caricamento...</p>
  }

  return (
    <div>
      {/* Pulsante apri form */}
      <button
        onClick={() => setMostraForm(!mostraForm)}
        style={{
          width: '100%', padding: '14px', borderRadius: '50px',
          background: 'linear-gradient(135deg, #FF7F6A, #A084E8)',
          color: 'white', fontFamily: 'Outfit, sans-serif',
          fontWeight: 700, fontSize: '1rem', border: 'none',
          cursor: 'pointer', marginBottom: '20px'
        }}
      >
        {mostraForm ? '✕ Chiudi' : '✨ Crea una nuova storia'}
      </button>

      {/* Form creazione storia */}
      {mostraForm && (
        <div style={{
          backgroundColor: '#fff', borderRadius: '20px',
          padding: '20px', marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(160,132,232,0.15)'
        }}>

          {/* Personaggi */}
          <p style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 800,
            color: '#A084E8', marginBottom: '10px', margin: '0 0 10px 0'
          }}>
            👥 Scegli i personaggi (min. 2)
          </p>
          {personaggiDisponibili.length === 0 ? (
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
              color: '#aaa', marginBottom: '20px'
            }}>
              Carica prima dei disegni per avere personaggi disponibili.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {personaggiDisponibili.map(nome => (
                <button
                  key={nome}
                  onClick={() => togglePersonaggio(nome)}
                  style={{
                    padding: '8px 16px', borderRadius: '50px', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
                    fontWeight: personaggiSelezionati.includes(nome) ? 600 : 400,
                    background: personaggiSelezionati.includes(nome) ? '#A084E8' : 'white',
                    color: personaggiSelezionati.includes(nome) ? 'white' : '#A084E8',
                    border: '2px solid #A084E8', transition: 'all 0.2s'
                  }}
                >
                  {nome}
                </button>
              ))}
            </div>
          )}

          {/* Tema */}
          <p style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 800,
            color: '#A084E8', margin: '0 0 10px 0'
          }}>
            🎨 Scegli un tema
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            {TEMI_PREDEFINITI.map(t => (
              <button
                key={t}
                onClick={() => { setTema(t); setTemaCustom('') }}
                style={{
                  padding: '8px 16px', borderRadius: '50px', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
                  fontWeight: tema === t && !temaCustom ? 600 : 400,
                  background: tema === t && !temaCustom ? '#FF7F6A' : 'white',
                  color: tema === t && !temaCustom ? 'white' : '#FF7F6A',
                  border: '2px solid #FF7F6A', transition: 'all 0.2s'
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={temaCustom}
            onChange={e => { setTemaCustom(e.target.value); setTema('') }}
            placeholder="...oppure scrivi il tuo tema"
            style={{
              width: '100%', padding: '12px', borderRadius: '12px',
              border: '2px solid #A084E8', fontFamily: 'Inter, sans-serif',
              fontSize: '0.9rem', outline: 'none', marginBottom: '20px',
              boxSizing: 'border-box', color: '#2D2D2D'
            }}
          />

          {/* Titolo */}
          <p style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 800,
            color: '#A084E8', margin: '0 0 10px 0'
          }}>
            📖 Dai un titolo alla storia
          </p>
          <input
            type="text"
            value={titolo}
            onChange={e => setTitolo(e.target.value)}
            placeholder="Es. La grande avventura di..."
            style={{
              width: '100%', padding: '12px', borderRadius: '12px',
              border: '2px solid #A084E8', fontFamily: 'Inter, sans-serif',
              fontSize: '0.9rem', outline: 'none', marginBottom: '20px',
              boxSizing: 'border-box', color: '#2D2D2D'
            }}
          />

          {/* Pulsante genera */}
          <button
            onClick={generaStoria}
            disabled={generando}
            style={{
              width: '100%', padding: '14px', borderRadius: '50px',
              background: generando
                ? '#ccc'
                : 'linear-gradient(135deg, #A084E8, #FF7F6A)',
              color: generando ? '#888' : 'white',
              fontFamily: 'Outfit, sans-serif', fontWeight: 700,
              fontSize: '1rem', border: 'none',
              cursor: generando ? 'not-allowed' : 'pointer'
            }}
          >
            {generando ? '⏳ Sto scrivendo la storia...' : '📖 Genera la storia'}
          </button>
        </div>
      )}

      {/* Lista storie */}
      {storie.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: '3rem', margin: '0 0 8px 0' }}>✨</p>
          <p style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 700,
            color: '#2D2D2D', fontSize: '1.1rem', margin: '0 0 6px 0'
          }}>
            Nessuna storia insieme ancora...
          </p>
          <p style={{ color: '#999', fontFamily: 'Inter, sans-serif', margin: 0 }}>
            Crea la prima premendo il pulsante qui sopra!
          </p>
        </div>
      ) : (
        storie.map(storia => (
          <div key={storia.id} style={{
            backgroundColor: '#fff', borderRadius: '20px',
            padding: '20px', marginBottom: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800,
              color: '#2D2D2D', margin: '0 0 6px 0'
            }}>
              {storia.indicazioni || 'Storia senza titolo'}
            </h3>
            <p style={{
              fontSize: '0.8rem', color: '#999',
              fontFamily: 'Inter, sans-serif', margin: '0 0 12px 0'
            }}>
              {new Date(storia.created_at).toLocaleDateString('it-IT', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
            <p style={{
              fontFamily: 'Inter, sans-serif', lineHeight: 1.7,
              color: '#444', whiteSpace: 'pre-wrap', margin: 0
            }}>
              {storia.testo}
            </p>
            <VideoStoria
              renderUrl={renderDefault}
              storyText={storia.testo}
              drawingTitle={storia.indicazioni || 'storia insieme'}
            />
          </div>
        ))
      )}
    </div>
  )
}
