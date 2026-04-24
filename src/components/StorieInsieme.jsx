import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import VideoStoria from './VideoStoria'

const TEMI = [
  '🌟 Avventura', '🤝 Amicizia', '🔮 Magia', '🦁 Animali',
  '🚀 Spazio', '🏰 Castello', '🌊 Mare', '🦸 Supereroi'
]

export default function StorieInsieme() {
  const [storie, setStorie] = useState([])
  const [loading, setLoading] = useState(true)
  const [espansa, setEspansa] = useState(null)
  const [mostraForm, setMostraForm] = useState(false)
  const [personaggiDisponibili, setPersonaggiDisponibili] = useState([])
  const [personaggiSelezionati, setPersonaggiSelezionati] = useState([])
  const [tema, setTema] = useState('')
  const [temaCustom, setTemaCustom] = useState('')
  const [titolo, setTitolo] = useState('')
  const [generando, setGenerando] = useState(false)
  const [renderDefault, setRenderDefault] = useState(null)

  useEffect(() => {
    caricaStorie()
    caricaPersonaggi()
    caricaRenderDefault()
  }, [])

  const caricaRenderDefault = async () => {
    const { data } = await supabase
      .from('renders')
      .select('result_url')
      .not('result_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (data?.result_url) setRenderDefault(data.result_url)
  }

  const caricaStorie = async () => {
    const { data } = await supabase
      .from('stories')
      .select('*')
      .eq('tipo', 'combinata')
      .order('created_at', { ascending: false })
    setStorie(data || [])
    setLoading(false)
  }

  const caricaPersonaggi = async () => {
    const { data } = await supabase
      .from('drawings')
      .select('id, ai_title, title')
      .order('created_at', { ascending: false })
    const nomi = (data || []).map(d => d.ai_title || d.title).filter(Boolean)
    setPersonaggiDisponibili([...new Set(nomi)])
  }

  const togglePersonaggio = (nome) => {
    setPersonaggiSelezionati(prev =>
      prev.includes(nome) ? prev.filter(n => n !== nome) : [...prev, nome]
    )
  }

  const generaStoriaInsieme = async () => {
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
      await caricaStorie()
      setMostraForm(false)
      setPersonaggiSelezionati([])
      setTema('')
      setTemaCustom('')
      setTitolo('')
    } catch (err) {
      alert('Errore: ' + err.message)
    } finally {
      setGenerando(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '3px solid #f0ede8', borderTopColor: '#A084E8',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div>
      {/* Pulsante crea storia */}
      <button
        onClick={() => setMostraForm(f => !f)}
        style={{
          width: '100%', padding: '14px', borderRadius: '50px',
          background: mostraForm
            ? '#f5f3f0'
            : 'linear-gradient(135deg, #FF7F6A, #A084E8)',
          color: mostraForm ? '#999' : 'white',
          fontFamily: 'Outfit, sans-serif', fontWeight: 700,
          fontSize: '1rem', border: 'none', cursor: 'pointer',
          marginBottom: '20px', transition: 'all 0.2s'
        }}
      >
        {mostraForm ? '✕ Annulla' : '✨ Crea una nuova storia'}
      </button>

      {/* Form creazione */}
      {mostraForm && (
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '20px',
          padding: '20px', marginBottom: '24px',
          border: '2px solid #f0ede8'
        }}>

          {/* Personaggi */}
          <p style={sezioneTitleStyle}>Scegli i personaggi</p>
          {personaggiDisponibili.length === 0 ? (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#aaa', marginBottom: '16px' }}>
              Carica prima dei disegni per avere personaggi disponibili.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {personaggiDisponibili.map(nome => {
                const sel = personaggiSelezionati.includes(nome)
                return (
                  <button
                    key={nome}
                    onClick={() => togglePersonaggio(nome)}
                    style={chipStyle(sel)}
                  >
                    {nome}
                  </button>
                )
              })}
            </div>
          )}

          {/* Tema */}
          <p style={sezioneTitleStyle}>Scegli un tema</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            {TEMI.map(t => (
              <button
                key={t}
                onClick={() => { setTema(t); setTemaCustom('') }}
                style={chipStyle(tema === t && !temaCustom)}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="...oppure scrivi il tuo tema"
            value={temaCustom}
            onChange={e => { setTemaCustom(e.target.value); setTema('') }}
            style={inputStyle}
          />

          {/* Titolo */}
          <p style={{ ...sezioneTitleStyle, marginTop: '20px' }}>Dai un titolo alla storia</p>
          <input
            type="text"
            placeholder="Es. La grande avventura di..."
            value={titolo}
            onChange={e => setTitolo(e.target.value)}
            style={inputStyle}
          />

          {/* Riepilogo selezione */}
          {personaggiSelezionati.length > 0 && (
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '0.8rem',
              color: '#A084E8', margin: '12px 0 0 0'
            }}>
              {personaggiSelezionati.length} personagg{personaggiSelezionati.length === 1 ? 'io' : 'i'} selezionat{personaggiSelezionati.length === 1 ? 'o' : 'i'}
            </p>
          )}

          {/* Pulsante genera */}
          <button
            onClick={generaStoriaInsieme}
            disabled={generando}
            style={{
              width: '100%', padding: '15px', borderRadius: '50px',
              background: generando
                ? '#ccc'
                : 'linear-gradient(135deg, #FF7F6A, #A084E8)',
              color: 'white', fontFamily: 'Outfit, sans-serif',
              fontWeight: 700, fontSize: '1rem', border: 'none',
              cursor: generando ? 'not-allowed' : 'pointer',
              marginTop: '16px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '8px'
            }}
          >
            {generando
              ? <><Spinner /> Sto scrivendo la storia...</>
              : '📖 Genera la storia'}
          </button>
        </div>
      )}

      {/* Lista storie salvate */}
      {storie.length === 0 && !mostraForm ? (
        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
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
            Premi il pulsante qui sopra per creare la prima!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {storie.map((s, i) => {
            const aperta = espansa === s.id
            return (
              <div key={s.id}>
                <div
                  style={{
                    backgroundColor: '#FFFFFF', borderRadius: '16px',
                    padding: '18px 20px',
                    border: `2px solid ${aperta ? '#A084E8' : '#f0ede8'}`,
                    cursor: 'pointer', transition: 'border-color 0.15s'
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

                  <p style={{
                    fontFamily: 'Inter, sans-serif', fontSize: '0.78rem',
                    color: '#A084E8', fontWeight: 600, margin: '8px 0 0 0'
                  }}>
                    {aperta ? 'Chiudi ↑' : 'Leggi tutto ↓'}
                  </p>

                  {aperta && (
                    <div onClick={e => e.stopPropagation()}>
                      <VideoStoria
                        renderUrl={renderDefault}
                        storyText={s.testo}
                        drawingTitle={s.indicazioni || 'storia insieme'}
                      />
                    </div>
                  )}
                </div>

                {i < storie.length - 1 && (
                  <div style={{ height: '1px', backgroundColor: '#f0ede8', margin: '0 8px' }} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{
      width: '18px', height: '18px', borderRadius: '50%',
      border: '3px solid rgba(255,255,255,0.3)',
      borderTopColor: 'white',
      animation: 'spin 0.8s linear infinite',
      flexShrink: 0
    }} />
  )
}

const sezioneTitleStyle = {
  fontFamily: 'Outfit, sans-serif', fontWeight: 700,
  fontSize: '0.9rem', color: '#A084E8',
  margin: '0 0 10px 0', textTransform: 'uppercase',
  letterSpacing: '0.05em'
}

const chipStyle = (attivo) => ({
  padding: '7px 14px', borderRadius: '50px',
  border: '2px solid #A084E8',
  background: attivo ? '#A084E8' : 'white',
  color: attivo ? 'white' : '#A084E8',
  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  fontWeight: 600, fontSize: '0.82rem',
  transition: 'all 0.15s'
})

const inputStyle = {
  width: '100%', padding: '12px 16px',
  borderRadius: '12px', border: '2px solid #e8e4df',
  fontFamily: 'Inter, sans-serif', fontSize: '0.9rem',
  color: '#2D2D2D', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.15s'
}
