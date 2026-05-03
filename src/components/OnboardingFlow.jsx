import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STEP_STYLE = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 20px',
  transition: 'opacity 0.4s ease, transform 0.4s ease',
}

export default function OnboardingFlow({ user, onComplete }) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  // form state
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // created child
  const [childId, setChildId] = useState(null)
  const [childName, setChildName] = useState('')

  // fade in on mount & on step change
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [step])

  // step 0 auto-advance after 2500ms
  useEffect(() => {
    if (step !== 0) return
    const t = setTimeout(() => goToStep(1), 2500)
    return () => clearTimeout(t)
  }, [step])

  function goToStep(n) {
    setVisible(false)
    setTimeout(() => setStep(n), 400)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !birthDate || !gender) return
    setSaving(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('children')
      .insert({ name: name.trim(), birth_date: birthDate, gender, created_by: user.id })
      .select('id, name')
      .limit(1)

    setSaving(false)
    if (err) {
      setError('Qualcosa è andato storto. Riprova.')
      return
    }
    const child = data?.[0]
    if (child) {
      setChildId(child.id)
      setChildName(child.name)
    }
    goToStep(2)
  }

  const enterStyle = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
  }

  // ── STEP 0 — Splash ──────────────────────────────────────────────
  if (step === 0) {
    return (
      <div style={{
        ...STEP_STYLE,
        background: 'linear-gradient(135deg, #FF7F6A 0%, #A084E8 100%)',
        ...enterStyle,
      }}>
        <img
          src="/logo-transparent.png"
          alt="Imaginaria"
          style={{ width: '140px', marginBottom: '24px' }}
        />
        <p style={{
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 700,
          fontSize: '24px',
          color: 'white',
          margin: 0,
          textAlign: 'center',
        }}>
          Immagina. Scatta. Crea.
        </p>
      </div>
    )
  }

  // ── STEP 1 — Form bambino ─────────────────────────────────────────
  if (step === 1) {
    return (
      <div style={{
        ...STEP_STYLE,
        backgroundColor: '#FAF9F6',
        overflowY: 'auto',
        ...enterStyle,
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h1 style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 800,
            fontSize: '28px',
            color: '#FF7F6A',
            margin: '0 0 8px 0',
            textAlign: 'center',
          }}>
            Il tuo bambino ✨
          </h1>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            color: '#666',
            textAlign: 'center',
            margin: '0 0 32px 0',
          }}>
            Iniziamo con qualche informazione
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={labelStyle}>Nome del bambino</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Es. Matteo"
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Data di nascita</label>
              <input
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Genere</label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                {[
                  { value: 'maschio', emoji: '🧒', label: 'Maschio', color: '#FF7F6A' },
                  { value: 'femmina', emoji: '👧', label: 'Femmina', color: '#A084E8' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGender(opt.value)}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: '16px',
                      border: `2px solid ${gender === opt.value ? opt.color : '#e0dbd5'}`,
                      backgroundColor: gender === opt.value ? opt.color + '15' : 'white',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: '14px',
                      color: gender === opt.value ? opt.color : '#888',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#E53935',
                margin: 0,
                textAlign: 'center',
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || !name.trim() || !birthDate || !gender}
              style={{
                marginTop: '8px',
                backgroundColor: saving ? '#ccc' : '#FF7F6A',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                padding: '16px',
                width: '100%',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 700,
                fontSize: '17px',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Salvataggio…' : 'Avanti →'}
            </button>

          </form>
        </div>
      </div>
    )
  }

  // ── STEP 2 — Prima foto ───────────────────────────────────────────
  return (
    <div style={{
      ...STEP_STYLE,
      background: 'linear-gradient(180deg, #B2EBF2 0%, #FAF9F6 100%)',
      ...enterStyle,
    }}>
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ fontSize: '80px', lineHeight: 1, marginBottom: '24px' }}>🎨</div>

        <h1 style={{
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 800,
          fontSize: '28px',
          color: '#A084E8',
          margin: '0 0 16px 0',
        }}>
          Tutto pronto!
        </h1>

        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '16px',
          color: '#444',
          lineHeight: 1.6,
          margin: '0 0 40px 0',
        }}>
          Fai la tua prima foto di un disegno{childName ? ` di ${childName}` : ''}
        </p>

        <button
          onClick={() => {
            onComplete()
            window.location.href = '/upload' + (childId ? '?childId=' + childId : '')
          }}
          style={{
            backgroundColor: '#FF7F6A',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '16px',
            width: '100%',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 700,
            fontSize: '17px',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          📷 Fotografa il primo disegno
        </button>

        <button
          onClick={() => {
            onComplete()
            window.location.href = '/'
          }}
          style={{
            backgroundColor: 'transparent',
            color: '#999',
            border: 'none',
            fontFamily: 'Inter, sans-serif',
            fontSize: '15px',
            cursor: 'pointer',
            padding: '8px',
          }}
        >
          Forse dopo
        </button>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontFamily: 'Inter, sans-serif',
  fontSize: '13px',
  fontWeight: 600,
  color: '#888',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '12px',
  border: '1.5px solid #e0dbd5',
  fontFamily: 'Inter, sans-serif',
  fontSize: '16px',
  color: '#2D2D2D',
  backgroundColor: 'white',
  outline: 'none',
  boxSizing: 'border-box',
}
