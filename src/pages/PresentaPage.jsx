import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PresentaPage() {
  const navigate = useNavigate()
  const sezione2Ref = useRef(null)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [invioStato, setInvioStato] = useState(null) // null | 'loading' | 'inviato' | 'duplicato' | 'errore'

  const scrollDown = () => sezione2Ref.current?.scrollIntoView({ behavior: 'smooth' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setInvioStato('loading')
    try {
      const { error } = await supabase
        .from('beta_requests')
        .insert({
          name: form.name.trim(),
          email: form.email.toLowerCase().trim(),
          message: form.message.trim() || null,
          status: 'pending',
        })
      if (error) {
        setInvioStato(error.code === '23505' ? 'duplicato' : 'errore')
        return
      }
      setInvioStato('inviato')
    } catch {
      setInvioStato('errore')
    }
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section style={sezStyle('#FAF9F6')}>
        <div style={innerStyle}>
          <img src="/logo-transparent.png" alt="Imaginaria" style={{ height: '80px', marginBottom: '28px' }} />
          <h1 style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 800,
            fontSize: 'clamp(1.9rem, 5vw, 3rem)',
            color: '#FF7F6A', textAlign: 'center',
            margin: '0 0 20px 0', lineHeight: 1.2,
          }}>
            I disegni dei tuoi figli meritano<br />di vivere per sempre.
          </h1>
          <p style={{
            fontSize: '1.1rem', color: '#333',
            textAlign: 'center', maxWidth: '580px',
            lineHeight: 1.7, margin: '0 0 40px 0',
          }}>
            Imaginaria trasforma i disegni dei bambini in personaggi animati,
            video e oggetti 3D — con la magia dell'intelligenza artificiale.
          </p>
          <button onClick={scrollDown} style={btnCoral}>
            Scopri come →
          </button>
        </div>
      </section>

      {/* ─── COME FUNZIONA ────────────────────────────────────────── */}
      <section ref={sezione2Ref} style={sezStyle('white')}>
        <div style={innerStyle}>
          <h2 style={titolo('#A084E8')}>Come funziona</h2>
          <div style={gridStyle}>
            {[
              { emoji: '📸', titolo: 'Scatta', testo: "Fotografa un disegno. L'AI lo analizza e gli dà un titolo con le parole di un bambino." },
              { emoji: '✨', titolo: 'Trasforma', testo: 'Scegli uno stile: cartoon, pupazzo o illustrazione realistica. In pochi secondi prende vita.' },
              { emoji: '🎬', titolo: 'Crea', testo: 'Genera un video animato o un modello 3D da esplorare e conservare per sempre.' },
            ].map(({ emoji, titolo: t, testo }) => (
              <div key={t} style={cardStyle}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>{emoji}</span>
                <h3 style={{
                  fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                  fontSize: '1.2rem', color: '#2D2D2D', margin: '0 0 10px 0',
                }}>{t}</h3>
                <p style={{ fontSize: '0.95rem', color: '#666', margin: 0, lineHeight: 1.6 }}>{testo}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURE VIDEO ────────────────────────────────────────── */}
      <section style={sezStyle('#F0EBFF')}>
        <div style={{ ...innerStyle, ...layoutDuo }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <h2 style={{ ...titolo('#A084E8'), textAlign: 'left' }}>Dal disegno al video animato</h2>
            <p style={{ fontSize: '1.05rem', color: '#444', lineHeight: 1.7, margin: 0 }}>
              Con un clic, il disegno di tuo figlio diventa un video animato.
              Conservalo, condividilo, riguardatelo insieme ogni volta che volete.
            </p>
          </div>
          <div style={{ fontSize: '120px', lineHeight: 1, textAlign: 'center', flex: '0 0 auto' }}>🎬</div>
        </div>
      </section>

      {/* ─── FEATURE 3D ───────────────────────────────────────────── */}
      <section style={sezStyle('#E8F8FA')}>
        <div style={{ ...innerStyle, ...layoutDuo, flexDirection: 'row-reverse' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <h2 style={{ ...titolo('#FF7F6A'), textAlign: 'left' }}>Esplora il disegno in 3D</h2>
            <p style={{ fontSize: '1.05rem', color: '#444', lineHeight: 1.7, margin: 0 }}>
              Trasforma ogni disegno in un oggetto 3D interattivo.
              Ruotalo, esploralo, stupitelo.
            </p>
          </div>
          <div style={{ fontSize: '120px', lineHeight: 1, textAlign: 'center', flex: '0 0 auto' }}>🎲</div>
        </div>
      </section>

      {/* ─── ALBUM DI FAMIGLIA ────────────────────────────────────── */}
      <section style={sezStyle('white')}>
        <div style={{ ...innerStyle, textAlign: 'center' }}>
          <div style={{ fontSize: '80px', marginBottom: '24px', lineHeight: 1 }}>📚</div>
          <h2 style={titolo('#FF7F6A')}>Un album magico per tutta la famiglia</h2>
          <p style={{ fontSize: '1.05rem', color: '#444', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto' }}>
            Tutti i disegni in un posto solo. Organizzati per bambino, per data, per categoria.
            Immaginali tra 10 anni.
          </p>
        </div>
      </section>

      {/* ─── CTA FINALE ───────────────────────────────────────────── */}
      <section style={sezStyle('#FAF9F6')}>
        <div style={{ ...innerStyle, maxWidth: '560px' }}>

          <h2 style={{ ...titolo('#A084E8'), textAlign: 'center' }}>Vuoi far parte della beta?</h2>
          <p style={{ fontSize: '1.05rem', color: '#555', textAlign: 'center', lineHeight: 1.7, margin: '0 0 40px 0' }}>
            Imaginaria è in accesso beta privato. Stiamo crescendo lentamente,
            con famiglie selezionate. L'accesso è gratuito.
          </p>

          {invioStato === 'inviato' ? (
            <div style={successBox}>
              ✅ Richiesta inviata! Ti contatteremo presto.
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                required
                type="text"
                placeholder="Il tuo nome"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={inputStyle}
              />
              <input
                required
                type="email"
                placeholder="La tua email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={inputStyle}
              />
              <textarea
                placeholder="Raccontaci della tua famiglia (opzionale)"
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                maxLength={500}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              />

              {invioStato === 'duplicato' && (
                <p style={{ color: '#c0392b', fontSize: '14px', margin: 0 }}>
                  ⚠️ Hai già inviato una richiesta con questa email.
                </p>
              )}
              {invioStato === 'errore' && (
                <p style={{ color: '#c0392b', fontSize: '14px', margin: 0 }}>
                  ⚠️ Qualcosa è andato storto. Riprova tra qualche istante.
                </p>
              )}

              <button
                type="submit"
                disabled={invioStato === 'loading'}
                style={{
                  ...btnCoral,
                  opacity: invioStato === 'loading' ? 0.7 : 1,
                  cursor: invioStato === 'loading' ? 'not-allowed' : 'pointer',
                }}
              >
                {invioStato === 'loading' ? 'Invio in corso...' : 'Richiedi accesso'}
              </button>
            </form>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '40px 0' }} />

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#888', fontSize: '0.95rem', marginBottom: '16px' }}>
              Hai già l'accesso approvato?
            </p>
            <button onClick={() => navigate('/')} style={btnLavanda}>
              Entra con Google →
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{
        backgroundColor: '#333', color: 'white',
        textAlign: 'center', padding: '28px 24px',
        fontFamily: 'Inter, sans-serif', fontSize: '0.85rem',
        letterSpacing: '0.02em',
      }}>
        Imaginaria · Immagina. Scatta. Crea.
      </footer>

      <style>{`
        @media (max-width: 640px) {
          .presenta-duo { flex-direction: column !important; }
          .presenta-duo-rev { flex-direction: column !important; }
          .presenta-grid { grid-template-columns: 1fr !important; }
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  )
}

/* ─── stili helper ────────────────────────────────────────────── */

function sezStyle(bg) {
  return {
    backgroundColor: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'clamp(60px, 10vw, 100px) 24px',
  }
}

const innerStyle = {
  width: '100%',
  maxWidth: '900px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}

const layoutDuo = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: '48px',
  alignItems: 'center',
  justifyContent: 'space-between',
}

function titolo(colore) {
  return {
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 800,
    fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
    color: colore,
    margin: '0 0 20px 0',
    lineHeight: 1.2,
  }
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '20px',
  width: '100%',
  marginTop: '12px',
}

const cardStyle = {
  backgroundColor: '#FAF9F6',
  border: '1px solid #e0e0e0',
  borderRadius: '20px',
  padding: '28px 22px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
}

const btnCoral = {
  backgroundColor: '#FF7F6A',
  color: 'white',
  border: 'none',
  borderRadius: '50px',
  padding: '14px 32px',
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 700,
  fontSize: '1rem',
  cursor: 'pointer',
}

const btnLavanda = {
  backgroundColor: 'white',
  color: '#A084E8',
  border: '2px solid #A084E8',
  borderRadius: '50px',
  padding: '14px 32px',
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 700,
  fontSize: '1rem',
  cursor: 'pointer',
}

const inputStyle = {
  width: '100%',
  padding: '14px 18px',
  borderRadius: '14px',
  border: '2px solid #e8e4df',
  backgroundColor: 'white',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.95rem',
  color: '#2D2D2D',
  outline: 'none',
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
  fontSize: '1.05rem',
  textAlign: 'center',
}
