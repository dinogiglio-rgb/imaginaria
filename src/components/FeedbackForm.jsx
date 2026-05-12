import { useState } from 'react'
import { supabase } from '../lib/supabase'

const FUNZIONALITA = [
  { campo: 'rating_upload',   label: '📸 Scatto e upload disegno' },
  { campo: 'rating_analisi',  label: '🤖 Analisi AI (titolo e descrizione)' },
  { campo: 'rating_render',   label: '✨ Render stilizzati (cartoon, toy, realistico)' },
  { campo: 'rating_video',    label: '🎬 Video animato' },
  { campo: 'rating_3d',       label: '🎲 Modello 3D' },
  { campo: 'rating_galleria', label: '📚 Galleria e album famiglia' },
]

function Stelle({ voto, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'none', border: 'none', padding: '2px',
            cursor: 'pointer', fontSize: '22px', lineHeight: 1,
            color: n <= (hover || voto) ? '#FF7F6A' : '#ddd',
            transition: 'color 0.1s',
          }}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function FeedbackForm({ userId }) {
  const [ratings, setRatings] = useState({})
  const [testo, setTesto] = useState('')
  const [note, setNote] = useState('')
  const [stato, setStato] = useState(null) // null | 'loading' | 'inviato' | 'duplicato' | 'errore'

  const haAlmenoUnaStella = Object.values(ratings).some(v => v > 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!haAlmenoUnaStella) return
    setStato('loading')

    const payload = {
      user_id: userId,
      rating_upload:   ratings.rating_upload   || null,
      rating_analisi:  ratings.rating_analisi  || null,
      rating_render:   ratings.rating_render   || null,
      rating_video:    ratings.rating_video    || null,
      rating_3d:       ratings.rating_3d       || null,
      rating_galleria: ratings.rating_galleria || null,
      testo:           testo.trim() || null,
      note:            note.trim()  || null,
    }

    try {
      const { error } = await supabase.from('feedbacks').insert(payload)
      if (error) {
        setStato(error.code === '23505' ? 'duplicato' : 'errore')
        return
      }
      setStato('inviato')
    } catch {
      setStato('errore')
    }
  }

  if (stato === 'inviato') {
    return (
      <div style={successBox}>
        ✅ Grazie per il tuo feedback! Ci aiuta tantissimo. 🙏
      </div>
    )
  }

  if (stato === 'duplicato') {
    return (
      <div style={infoBox}>
        Hai già inviato il tuo feedback, grazie! 💛
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={titoloStyle}>💬 Lascia il tuo feedback</h2>
        <p style={sottotitoloStyle}>
          Aiutaci a migliorare Imaginaria — ci vuole meno di 2 minuti.
        </p>
      </div>

      {/* Valutazioni per funzionalità */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {FUNZIONALITA.map(({ campo, label }) => (
          <div key={campo} style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
          }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#444', flex: 1, minWidth: '180px' }}>
              {label}
            </span>
            <Stelle
              voto={ratings[campo] || 0}
              onChange={v => setRatings(prev => ({ ...prev, [campo]: v }))}
            />
          </div>
        ))}
      </div>

      {/* Testo libero */}
      <div>
        <label style={labelStyle}>Cosa ti è piaciuto di più?</label>
        <textarea
          value={testo}
          onChange={e => setTesto(e.target.value)}
          placeholder="Racconta la tua esperienza..."
          maxLength={500}
          rows={3}
          style={textareaStyle}
        />
      </div>

      {/* Note aggiuntive */}
      <div>
        <label style={labelStyle}>Altre note o suggerimenti</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Bug trovati, idee, richieste..."
          maxLength={500}
          rows={3}
          style={textareaStyle}
        />
      </div>

      {stato === 'errore' && (
        <p style={{ color: '#c0392b', fontSize: '14px', fontFamily: 'Inter, sans-serif', margin: 0 }}>
          ❌ Qualcosa è andato storto, riprova.
        </p>
      )}

      <button
        type="submit"
        disabled={!haAlmenoUnaStella || stato === 'loading'}
        style={{
          backgroundColor: '#FF7F6A',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          padding: '14px 32px',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 700,
          fontSize: '1rem',
          cursor: !haAlmenoUnaStella || stato === 'loading' ? 'not-allowed' : 'pointer',
          opacity: !haAlmenoUnaStella || stato === 'loading' ? 0.6 : 1,
          alignSelf: 'flex-start',
        }}
      >
        {stato === 'loading' ? 'Invio in corso...' : 'Invia feedback'}
      </button>
    </form>
  )
}

const titoloStyle = {
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 800,
  fontSize: '1.3rem',
  color: '#A084E8',
  margin: '0 0 6px 0',
}

const sottotitoloStyle = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.9rem',
  color: '#888',
  margin: 0,
}

const labelStyle = {
  display: 'block',
  fontFamily: 'Inter, sans-serif',
  fontSize: '13px',
  color: '#555',
  marginBottom: '8px',
  fontWeight: 600,
}

const textareaStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '14px',
  border: '2px solid #e8e4df',
  backgroundColor: 'white',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.9rem',
  color: '#2D2D2D',
  outline: 'none',
  resize: 'vertical',
  lineHeight: 1.5,
  boxSizing: 'border-box',
}

const successBox = {
  backgroundColor: '#f0fdf4',
  border: '1.5px solid #86efac',
  borderRadius: '14px',
  padding: '18px 22px',
  color: '#166534',
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 600,
  fontSize: '1rem',
  textAlign: 'center',
}

const infoBox = {
  backgroundColor: '#fffbeb',
  border: '1.5px solid #fcd34d',
  borderRadius: '14px',
  padding: '18px 22px',
  color: '#92400e',
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 600,
  fontSize: '1rem',
  textAlign: 'center',
}
