import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { loginWithGoogle } from '../lib/auth'

const FEATURES = [
  {
    icon: '🎨',
    title: 'Trasforma in arte',
    desc: '3 stili AI: Cartoon, Toy, Realistico',
  },
  {
    icon: '📖',
    title: 'Storie magiche',
    desc: 'Favole personalizzate per età e fantasia',
  },
  {
    icon: '▶️',
    title: 'Video animati',
    desc: 'Il personaggio del disegno prende vita',
  },
  {
    icon: '🧊',
    title: 'Modelli 3D',
    desc: 'Scaricabili per la stampa 3D',
  },
]

export default function LandingPage({ accessError }) {
  const [loginLoading, setLoginLoading] = useState(false)

  const [form, setForm] = useState({ nome: '', email: '', messaggio: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [formStatus, setFormStatus] = useState(null) // null | 'success' | 'duplicate' | 'error'

  const handleLogin = async () => {
    try {
      setLoginLoading(true)
      await loginWithGoogle()
    } catch {
      setLoginLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nome.trim() || !form.email.trim()) return
    setFormLoading(true)
    try {
      const { error } = await supabase
        .from('beta_requests')
        .insert({
          name: form.nome.trim(),
          email: form.email.trim().toLowerCase(),
          message: form.messaggio.trim() || null,
        })

      if (error) {
        if (error.code === '23505') {
          setFormStatus('duplicate')
        } else {
          setFormStatus('error')
        }
      } else {
        setFormStatus('success')
      }
    } catch {
      setFormStatus('error')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>

      {/* Errore accesso non autorizzato */}
      {accessError && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          background: '#FF7F6A', color: 'white',
          padding: '14px 20px', textAlign: 'center',
          fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px',
        }}>
          {accessError}
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #FF7F6A 0%, #A084E8 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px 60px',
        textAlign: 'center',
        paddingTop: accessError ? '100px' : '80px',
      }}>
        <img
          src="/logo-transparent.png"
          alt="Imaginaria"
          style={{ width: '80px', height: 'auto', marginBottom: '24px' }}
        />

        <h1 style={{
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(40px, 10vw, 52px)',
          color: 'white',
          margin: '0 0 12px 0',
          lineHeight: 1.1,
        }}>
          Imaginaria
        </h1>

        <p style={{
          fontSize: '20px', color: 'rgba(255,255,255,0.85)',
          margin: '0 0 10px 0', fontWeight: 500,
          letterSpacing: '0.03em',
        }}>
          Immagina. Scatta. Crea.
        </p>

        <p style={{
          fontSize: '16px', color: 'rgba(255,255,255,0.75)',
          margin: '0 0 40px 0', maxWidth: '360px', lineHeight: 1.6,
        }}>
          Trasforma i disegni di tuo figlio in magia con l'intelligenza artificiale.
        </p>

        <button
          onClick={handleLogin}
          disabled={loginLoading}
          style={{
            background: 'white',
            color: '#FF7F6A',
            border: 'none',
            borderRadius: '50px',
            padding: '14px 28px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: loginLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            opacity: loginLoading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)' }}
        >
          {loginLoading ? 'Accesso...' : 'Accedi con Google →'}
        </button>

        <p style={{
          marginTop: '20px', fontSize: '13px',
          color: 'rgba(255,255,255,0.6)',
        }}>
          Accesso riservato agli utenti autorizzati
        </p>

        {/* Scroll cue */}
        <div style={{ marginTop: '60px', color: 'rgba(255,255,255,0.5)', fontSize: '22px', animation: 'bounce 2s infinite' }}>
          ↓
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{
        background: '#FAF9F6',
        padding: '72px 24px',
      }}>
        <h2 style={{
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 800,
          fontSize: '28px',
          color: '#1C1C1E',
          textAlign: 'center',
          margin: '0 0 40px 0',
        }}>
          Cosa puoi fare
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '16px',
          maxWidth: '800px',
          margin: '0 auto',
        }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px 20px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)' }}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{f.icon}</div>
              <h3 style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 700,
                fontSize: '17px',
                color: '#FF7F6A',
                margin: '0 0 6px 0',
              }}>
                {f.title}
              </h3>
              <p style={{
                fontSize: '14px', color: '#666',
                margin: 0, lineHeight: 1.5,
              }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FORM RICHIESTA ACCESSO ── */}
      <section style={{
        background: 'white',
        padding: '72px 24px',
      }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 800,
            fontSize: '28px',
            color: '#A084E8',
            textAlign: 'center',
            margin: '0 0 10px 0',
          }}>
            Richiedi il tuo accesso beta
          </h2>
          <p style={{
            fontSize: '15px', color: '#888',
            textAlign: 'center', margin: '0 0 36px 0',
          }}>
            Solo 5 posti disponibili. Gratis per 2 settimane.
          </p>

          {formStatus === 'success' ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <p style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 700,
                fontSize: '22px',
                color: '#A084E8',
                margin: 0,
              }}>
                Richiesta inviata!
              </p>
              <p style={{ color: '#888', fontSize: '15px', marginTop: '8px' }}>
                Ti contatteremo presto.
              </p>
            </div>
          ) : formStatus === 'duplicate' ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>✉️</div>
              <p style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 700,
                fontSize: '18px',
                color: '#A084E8',
                margin: 0,
              }}>
                Hai già inviato una richiesta!
              </p>
              <p style={{ color: '#888', fontSize: '14px', marginTop: '8px' }}>
                Ti contatteremo presto.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                placeholder="Nome e cognome"
                required
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                style={inputStyle}
              />
              <input
                type="email"
                placeholder="Email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={inputStyle}
              />
              <textarea
                placeholder="Perché vuoi provare Imaginaria? (opzionale)&#10;Ho un bambino di 4 anni che disegna ogni giorno..."
                value={form.messaggio}
                onChange={e => setForm(f => ({ ...f, messaggio: e.target.value }))}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', borderRadius: '16px', lineHeight: 1.5 }}
              />

              {formStatus === 'error' && (
                <p style={{ color: '#FF7F6A', fontSize: '13px', margin: '0', textAlign: 'center' }}>
                  Qualcosa è andato storto. Riprova tra poco.
                </p>
              )}

              <button
                type="submit"
                disabled={formLoading || !form.nome.trim() || !form.email.trim()}
                style={{
                  background: formLoading || !form.nome.trim() || !form.email.trim()
                    ? '#ccc' : '#FF7F6A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  width: '100%',
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: formLoading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {formLoading ? 'Invio...' : 'Richiedi accesso →'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: '#1C1C1E',
        padding: '28px 24px',
        textAlign: 'center',
      }}>
        <p style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '13px',
          margin: 0,
          fontFamily: 'Inter, sans-serif',
        }}>
          © 2025 Imaginaria — Immagina. Scatta. Crea.
        </p>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
      `}</style>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '13px 18px',
  borderRadius: '50px',
  border: '2px solid #e8e4df',
  fontFamily: 'Inter, sans-serif',
  fontSize: '15px',
  color: '#2D2D2D',
  outline: 'none',
  boxSizing: 'border-box',
  background: 'white',
  transition: 'border-color 0.2s',
}
