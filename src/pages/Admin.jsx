import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const BRAND = {
  bg: '#FAF9F6',
  coral: '#FF7F6A',
  purple: '#A084E8',
  lightBlue: '#B2EBF2',
  text: '#2D2D2D',
  muted: '#888',
  border: '#E8E3DC',
  cardBg: '#FFFFFF',
}

const btn = (color, outline = false) => ({
  padding: '8px 20px',
  borderRadius: '50px',
  border: outline ? `2px solid ${color}` : 'none',
  background: outline ? 'transparent' : color,
  color: outline ? color : '#fff',
  fontFamily: 'Inter, sans-serif',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 0.15s',
})

function RoleBadge({ role }) {
  const color = role === 'admin' ? BRAND.purple : BRAND.lightBlue
  const textColor = role === 'admin' ? '#fff' : '#2D2D2D'
  return (
    <span style={{
      background: color,
      color: textColor,
      padding: '3px 12px',
      borderRadius: '50px',
      fontSize: '12px',
      fontWeight: 700,
      fontFamily: 'Inter, sans-serif',
    }}>
      {role}
    </span>
  )
}

function TabButton({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 24px',
      borderRadius: '50px',
      border: 'none',
      background: active ? BRAND.coral : 'transparent',
      color: active ? '#fff' : BRAND.muted,
      fontFamily: 'Outfit, sans-serif',
      fontSize: '15px',
      fontWeight: active ? 700 : 500,
      cursor: 'pointer',
      transition: 'all 0.15s',
    }}>
      {label}
    </button>
  )
}

// --- TAB BAMBINI ---
function TabBambini({ session }) {
  const [bambini, setBambini] = useState([])
  const [loading, setLoading] = useState(true)
  const [formAperto, setFormAperto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [eliminando, setEliminando] = useState(null)
  const [nuovoBambino, setNuovoBambino] = useState({ nome: '', birthDate: '', gender: '' })

  useEffect(() => { fetchBambini() }, [])

  const fetchBambini = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*, drawings(count)')
        .order('name', { ascending: true })
      if (error) throw error
      setBambini(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const calcolaEta = (birthDate) => {
    if (!birthDate) return '—'
    const nato = new Date(birthDate)
    const oggi = new Date()
    let totalMesi = (oggi.getFullYear() - nato.getFullYear()) * 12 + (oggi.getMonth() - nato.getMonth())
    if (oggi.getDate() < nato.getDate()) totalMesi--
    if (totalMesi < 0) return '—'
    const anni = Math.floor(totalMesi / 12)
    const mesi = totalMesi % 12
    if (anni === 0) return `${mesi} mes${mesi === 1 ? 'e' : 'i'}`
    if (mesi === 0) return `${anni} ann${anni === 1 ? 'o' : 'i'}`
    return `${anni} ann${anni === 1 ? 'o' : 'i'} e ${mesi} mes${mesi === 1 ? 'e' : 'i'}`
  }

  const salva = async () => {
    if (!nuovoBambino.nome.trim() || !nuovoBambino.birthDate || !nuovoBambino.gender) return
    setSalvando(true)
    try {
      const { data, error } = await supabase
        .from('children')
        .insert({
          name: nuovoBambino.nome.trim(),
          birth_date: nuovoBambino.birthDate,
          gender: nuovoBambino.gender,
          created_by: session.user.id,
        })
        .select('*, drawings(count)')
        .single()
      if (error) throw error
      setBambini(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setNuovoBambino({ nome: '', birthDate: '', gender: '' })
      setFormAperto(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSalvando(false)
    }
  }

  const elimina = async (bambino) => {
    setEliminando(bambino.id)
    try {
      const { error } = await supabase.from('children').delete().eq('id', bambino.id)
      if (error) throw error
      setBambini(prev => prev.filter(b => b.id !== bambino.id))
    } catch (err) {
      console.error(err)
    } finally {
      setEliminando(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button onClick={() => setFormAperto(v => !v)} style={btn(BRAND.coral)}>
          {formAperto ? '✕ Annulla' : '+ Aggiungi bambino'}
        </button>
      </div>

      {formAperto && (
        <div style={{
          background: BRAND.cardBg, borderRadius: '20px',
          border: `1px solid ${BRAND.border}`, padding: '24px 20px',
          marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px'
        }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '16px', color: BRAND.text, margin: 0 }}>
            Nuovo bambino
          </h3>
          <input
            type="text"
            placeholder="Nome"
            value={nuovoBambino.nome}
            onChange={e => setNuovoBambino(v => ({ ...v, nome: e.target.value }))}
            style={{
              padding: '10px 16px', borderRadius: '50px',
              border: `1.5px solid ${BRAND.border}`,
              fontFamily: 'Inter, sans-serif', fontSize: '14px',
              outline: 'none', background: '#fff',
            }}
          />
          <div>
            <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: BRAND.muted, display: 'block', marginBottom: '6px' }}>
              Data di nascita
            </label>
            <input
              type="date"
              value={nuovoBambino.birthDate}
              onChange={e => setNuovoBambino(v => ({ ...v, birthDate: e.target.value }))}
              style={{
                padding: '10px 16px', borderRadius: '50px',
                border: `1.5px solid ${BRAND.border}`,
                fontFamily: 'Inter, sans-serif', fontSize: '14px',
                outline: 'none', background: '#fff', width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: BRAND.muted, display: 'block', marginBottom: '8px' }}>
              Genere
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { value: 'maschio', label: '🧒 Maschio', color: BRAND.coral },
                { value: 'femmina', label: '👧 Femmina', color: BRAND.purple },
              ].map(g => (
                <button
                  key={g.value}
                  onClick={() => setNuovoBambino(v => ({ ...v, gender: g.value }))}
                  style={{
                    padding: '10px 20px', borderRadius: '50px',
                    border: `2px solid ${nuovoBambino.gender === g.value ? g.color : BRAND.border}`,
                    background: nuovoBambino.gender === g.value ? g.color : 'white',
                    color: nuovoBambino.gender === g.value ? 'white' : BRAND.muted,
                    fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={salva}
            disabled={salvando || !nuovoBambino.nome.trim() || !nuovoBambino.birthDate || !nuovoBambino.gender}
            style={{
              ...btn(BRAND.coral),
              opacity: (!nuovoBambino.nome.trim() || !nuovoBambino.birthDate || !nuovoBambino.gender) ? 0.5 : 1,
              alignSelf: 'flex-start',
            }}
          >
            {salvando ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {bambini.map(b => {
          const numDisegni = b.drawings?.[0]?.count ?? 0
          const isMaschio = b.gender === 'maschio'
          const colore = isMaschio ? BRAND.coral : BRAND.purple
          return (
            <div key={b.id} style={{
              background: BRAND.cardBg, borderRadius: '16px',
              border: `1px solid ${BRAND.border}`, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '1.8rem' }}>{isMaschio ? '🧒' : '👧'}</span>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '16px', color: BRAND.text }}>
                  {b.name}
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: BRAND.muted, marginTop: '2px' }}>
                  {calcolaEta(b.birth_date)} · {b.birth_date ? new Date(b.birth_date).toLocaleDateString('it-IT') : '—'}
                </div>
              </div>
              <span style={{
                background: colore + '20', color: colore,
                padding: '3px 12px', borderRadius: '50px',
                fontSize: '12px', fontWeight: 700, fontFamily: 'Inter, sans-serif',
              }}>
                {isMaschio ? 'Maschio' : 'Femmina'}
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: BRAND.muted }}>
                {numDisegni} disegni
              </span>
              <button
                onClick={() => elimina(b)}
                disabled={numDisegni > 0 || eliminando === b.id}
                title={numDisegni > 0 ? 'Ha dei disegni, non eliminabile' : 'Elimina'}
                style={{
                  ...btn('#E57373', true),
                  opacity: numDisegni > 0 ? 0.4 : 1,
                  cursor: numDisegni > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {eliminando === b.id ? '...' : 'Elimina'}
              </button>
            </div>
          )
        })}
        {bambini.length === 0 && (
          <p style={{ color: BRAND.muted, fontFamily: 'Inter, sans-serif', textAlign: 'center', marginTop: '32px' }}>
            Nessun bambino ancora.
          </p>
        )}
      </div>
    </div>
  )
}

// --- TAB UTENTI ---
function TabUtenti({ session }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [revoking, setRevoking] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin?action=users', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (res.ok) setUsers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const cambiaRuolo = async (userId, newRole) => {
    setUpdating(userId)
    try {
      const res = await fetch('/api/admin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'setrole', userId, newRole }),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  const revocaAccesso = async (u) => {
    if (!confirm(`Revocare l'accesso a ${u.display_name || u.email}?`)) return
    setRevoking(u.id)
    try {
      await supabase
        .from('profiles')
        .update({ beta_expires_at: '2020-01-01T00:00:00Z' })
        .eq('id', u.id)

      await supabase
        .from('allowed_emails')
        .delete()
        .eq('email', u.email)

      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, beta_expires_at: '2020-01-01T00:00:00Z' } : x))
      alert(`Accesso revocato per ${u.display_name || u.email}. ✓`)
    } catch (err) {
      console.error(err)
      alert('Errore durante la revoca.')
    } finally {
      setRevoking(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {users.map(u => (
        <div key={u.id} style={{
          background: BRAND.cardBg,
          borderRadius: '16px',
          border: `1px solid ${BRAND.border}`,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '16px', color: BRAND.text }}>
              {u.display_name || '—'}
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: BRAND.muted, marginTop: '2px' }}>
              {u.email}
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: BRAND.muted, marginTop: '2px' }}>
              {u.created_at ? new Date(u.created_at).toLocaleDateString('it-IT', {
                day: 'numeric', month: 'long', year: 'numeric'
              }) : '—'}
            </div>
          </div>
          <RoleBadge role={u.role || 'user'} />
          {u.id !== session.user.id && (
            <>
              <button
                onClick={() => cambiaRuolo(u.id, u.role === 'admin' ? 'user' : 'admin')}
                disabled={updating === u.id}
                style={btn(u.role === 'admin' ? BRAND.muted : BRAND.purple, true)}
              >
                {updating === u.id ? '...' : u.role === 'admin' ? 'Rendi User' : 'Rendi Admin'}
              </button>
              {u.role !== 'admin' && (
                <button
                  onClick={() => revocaAccesso(u)}
                  disabled={revoking === u.id}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '50px',
                    border: 'none',
                    background: '#F8D7DA',
                    color: '#721C24',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: revoking === u.id ? 'not-allowed' : 'pointer',
                    opacity: revoking === u.id ? 0.6 : 1,
                  }}
                >
                  {revoking === u.id ? '...' : '🚫 Revoca accesso'}
                </button>
              )}
            </>
          )}
        </div>
      ))}
      {users.length === 0 && (
        <p style={{ color: BRAND.muted, fontFamily: 'Inter, sans-serif', textAlign: 'center', marginTop: '32px' }}>
          Nessun utente trovato.
        </p>
      )}
    </div>
  )
}

// --- TAB WHITELIST ---
function TabWhitelist({ session }) {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [nuovaEmail, setNuovaEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState(null)

  useEffect(() => {
    fetchWhitelist()
  }, [])

  const fetchWhitelist = async () => {
    try {
      const res = await fetch('/api/admin?action=whitelist-list', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (res.ok) setEmails(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const aggiungi = async () => {
    if (!nuovaEmail.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'whitelist-add', email: nuovaEmail.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setEmails(prev => [data, ...prev])
        setNuovaEmail('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  const rimuovi = async (email) => {
    setRemoving(email)
    try {
      const res = await fetch('/api/admin', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'whitelist-delete', email }),
      })
      if (res.ok) setEmails(prev => prev.filter(e => e.email !== email))
    } catch (err) {
      console.error(err)
    } finally {
      setRemoving(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      {/* Input aggiungi */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="email"
          value={nuovaEmail}
          onChange={e => setNuovaEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && aggiungi()}
          placeholder="nuova@email.com"
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '10px 16px',
            borderRadius: '50px',
            border: `1.5px solid ${BRAND.border}`,
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            outline: 'none',
            background: '#fff',
          }}
        />
        <button onClick={aggiungi} disabled={adding} style={btn(BRAND.coral)}>
          {adding ? '...' : 'Aggiungi email'}
        </button>
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {emails.map(e => (
          <div key={e.id} style={{
            background: BRAND.cardBg,
            borderRadius: '12px',
            border: `1px solid ${BRAND.border}`,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: BRAND.text }}>
              {e.email}
            </span>
            <button
              onClick={() => rimuovi(e.email)}
              disabled={removing === e.email}
              style={btn('#E57373', true)}
            >
              {removing === e.email ? '...' : 'Rimuovi'}
            </button>
          </div>
        ))}
        {emails.length === 0 && (
          <p style={{ color: BRAND.muted, fontFamily: 'Inter, sans-serif', textAlign: 'center', marginTop: '32px' }}>
            Nessuna email in whitelist.
          </p>
        )}
      </div>
    </div>
  )
}

// --- TAB RICHIESTE BETA ---
function TabRichiesteBeta({ session }) {
  const [richieste, setRichieste] = useState([])
  const [loading, setLoading] = useState(true)
  const [elaborando, setElaborando] = useState(null)

  useEffect(() => {
    fetchRichieste()
  }, [])

  const fetchRichieste = async () => {
    try {
      const { data, error } = await supabase
        .from('beta_requests')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setRichieste(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const approva = async (richiesta) => {
    setElaborando(richiesta.id)
    try {
      // 1. Aggiorna status in beta_requests
      const { error: upErr } = await supabase
        .from('beta_requests')
        .update({ status: 'approved' })
        .eq('id', richiesta.id)
      if (upErr) throw upErr

      // 2. Aggiungi alla whitelist tramite API admin
      await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'whitelist-add', email: richiesta.email }),
      })

      // 3. Se esiste già un profilo, imposta beta_expires_at = +14 giorni
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', richiesta.email)
        .single()

      if (profile) {
        await supabase
          .from('profiles')
          .update({ beta_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() })
          .eq('id', profile.id)
      }

      // 4. Aggiorna lista locale
      setRichieste(prev => prev.map(r => r.id === richiesta.id ? { ...r, status: 'approved' } : r))
      alert(`Accesso approvato per ${richiesta.name}! ✓`)
    } catch (err) {
      console.error(err)
      alert('Errore durante l\'approvazione.')
    } finally {
      setElaborando(null)
    }
  }

  const rifiuta = async (richiesta) => {
    setElaborando(richiesta.id)
    try {
      const { error } = await supabase
        .from('beta_requests')
        .update({ status: 'rejected' })
        .eq('id', richiesta.id)
      if (error) throw error
      setRichieste(prev => prev.map(r => r.id === richiesta.id ? { ...r, status: 'rejected' } : r))
      alert('Richiesta rifiutata.')
    } catch (err) {
      console.error(err)
    } finally {
      setElaborando(null)
    }
  }

  const statusBadge = (status) => {
    const styles = {
      pending: { background: '#FFF3CD', color: '#856404', label: 'In attesa' },
      approved: { background: '#D4EDDA', color: '#155724', label: 'Approvato' },
      rejected: { background: '#F8D7DA', color: '#721C24', label: 'Rifiutato' },
    }
    const s = styles[status] || styles.pending
    return (
      <span style={{
        background: s.background, color: s.color,
        padding: '3px 12px', borderRadius: '50px',
        fontSize: '12px', fontWeight: 700,
        fontFamily: 'Inter, sans-serif',
      }}>
        {s.label}
      </span>
    )
  }

  if (loading) return <LoadingSpinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {richieste.length === 0 && (
        <p style={{ color: BRAND.muted, fontFamily: 'Inter, sans-serif', textAlign: 'center', marginTop: '32px' }}>
          Nessuna richiesta ancora.
        </p>
      )}
      {richieste.map(r => (
        <div key={r.id} style={{
          background: BRAND.cardBg,
          borderRadius: '16px',
          border: `1px solid ${BRAND.border}`,
          padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '16px', color: BRAND.text }}>
                {r.name}
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: BRAND.muted, marginTop: '2px' }}>
                {r.email}
              </div>
            </div>
            {statusBadge(r.status || 'pending')}
          </div>

          {r.message && (
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '14px',
              color: '#444', fontStyle: 'italic',
              margin: '0', lineHeight: 1.5,
              background: '#FAF9F6', borderRadius: '10px', padding: '10px 14px',
            }}>
              "{r.message}"
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: BRAND.muted }}>
              {r.created_at ? new Date(r.created_at).toLocaleDateString('it-IT', {
                day: 'numeric', month: 'long', year: 'numeric',
              }) : '—'}
            </span>

            {(!r.status || r.status === 'pending') && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => approva(r)}
                  disabled={elaborando === r.id}
                  style={{
                    padding: '7px 18px', borderRadius: '50px', border: 'none',
                    background: '#D4EDDA', color: '#155724',
                    fontFamily: 'Inter, sans-serif', fontSize: '13px',
                    fontWeight: 600, cursor: elaborando === r.id ? 'not-allowed' : 'pointer',
                    opacity: elaborando === r.id ? 0.6 : 1,
                  }}
                >
                  {elaborando === r.id ? '...' : '✓ Approva'}
                </button>
                <button
                  onClick={() => rifiuta(r)}
                  disabled={elaborando === r.id}
                  style={{
                    padding: '7px 18px', borderRadius: '50px', border: 'none',
                    background: '#F8D7DA', color: '#721C24',
                    fontFamily: 'Inter, sans-serif', fontSize: '13px',
                    fontWeight: 600, cursor: elaborando === r.id ? 'not-allowed' : 'pointer',
                    opacity: elaborando === r.id ? 0.6 : 1,
                  }}
                >
                  ✗ Rifiuta
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// --- TAB STATISTICHE ---
function TabStatistiche({ session }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin?action=stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (res.ok) setStats(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const totals = [
    { label: 'Disegni totali', value: stats?.drawings ?? 0 },
    { label: 'Render generati', value: stats?.renders ?? 0 },
    { label: 'Storie create', value: stats?.stories ?? 0 },
    { label: 'Video generati', value: stats?.videos ?? 0 },
  ]

  return (
    <div>
      {/* Totali globali */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '36px',
      }}>
        {totals.map(c => (
          <div key={c.label} style={{
            background: BRAND.cardBg,
            borderRadius: '20px',
            border: `1px solid ${BRAND.border}`,
            padding: '28px 24px',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: '48px',
              color: BRAND.coral,
              lineHeight: 1,
            }}>
              {c.value}
            </div>
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: BRAND.muted,
              marginTop: '8px',
            }}>
              {c.label}
            </div>
          </div>
        ))}
      </div>

      {/* Statistiche per utente */}
      {stats?.perUser?.length > 0 && (
        <div>
          <h2 style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 700,
            fontSize: '18px',
            color: BRAND.text,
            margin: '0 0 16px 0',
          }}>
            Statistiche per utente
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.perUser.map(u => (
              <div key={u.userId} style={{
                background: BRAND.cardBg,
                borderRadius: '20px',
                border: `1px solid ${BRAND.border}`,
                padding: '20px 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 700,
                  fontSize: '16px',
                  color: BRAND.coral,
                  marginBottom: '4px',
                }}>
                  {u.displayName || u.email || '—'}
                </div>
                {u.displayName && (
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    color: BRAND.muted,
                    marginBottom: '16px',
                  }}>
                    {u.email}
                  </div>
                )}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  marginTop: u.displayName ? '0' : '12px',
                }}>
                  {[
                    { label: 'Disegni', value: u.drawings },
                    { label: 'Render', value: u.renders },
                    { label: 'Storie', value: u.stories },
                    { label: 'Video', value: u.videos },
                  ].map(m => (
                    <div key={m.label} style={{ textAlign: 'center' }}>
                      <div style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 800,
                        fontSize: '32px',
                        color: BRAND.purple,
                        lineHeight: 1,
                      }}>
                        {m.value}
                      </div>
                      <div style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        color: BRAND.muted,
                        marginTop: '4px',
                      }}>
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
      <div style={{
        width: '36px', height: '36px',
        borderRadius: '50%',
        border: '3px solid #f0ede8',
        borderTopColor: BRAND.coral,
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// --- PAGINA PRINCIPALE ---
export default function Admin({ user }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('bambini')
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    supabase
      .from('beta_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => setPendingCount(count || 0))
  }, [])

  useEffect(() => {
    const check = async () => {
      const { data: { session: s } } = await supabase.auth.getSession()
      if (!s) { navigate('/'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', s.user.id)
        .single()

      if (profile?.role !== 'admin') { navigate('/'); return }
      setSession(s)
      setChecking(false)
    }
    check()
  }, [navigate])

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', background: BRAND.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BRAND.bg, padding: '24px 16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={() => navigate('/')}
            style={{ ...btn(BRAND.muted, true), marginBottom: '20px', fontSize: '13px' }}
          >
            ← Torna alla home
          </button>
          <h1 style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 800,
            fontSize: '32px',
            color: BRAND.coral,
            margin: 0,
          }}>
            Pannello Admin
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', color: BRAND.muted, fontSize: '14px', marginTop: '6px' }}>
            Gestisci utenti, whitelist e statistiche
          </p>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: '#f0ede8',
          borderRadius: '50px',
          padding: '4px',
          marginBottom: '28px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}>
          <TabButton label="Bambini" active={tab === 'bambini'} onClick={() => setTab('bambini')} />
          <TabButton label="Utenti" active={tab === 'utenti'} onClick={() => setTab('utenti')} />
          <TabButton label="Whitelist" active={tab === 'whitelist'} onClick={() => setTab('whitelist')} />
          <TabButton
            label={pendingCount > 0 ? `🔔 Richieste Beta (${pendingCount})` : '🔔 Richieste Beta'}
            active={tab === 'richieste'}
            onClick={() => setTab('richieste')}
          />
          <TabButton label="Statistiche" active={tab === 'statistiche'} onClick={() => setTab('statistiche')} />
        </div>

        {/* Contenuto tab */}
        {tab === 'bambini' && <TabBambini session={session} />}
        {tab === 'utenti' && <TabUtenti session={session} />}
        {tab === 'whitelist' && <TabWhitelist session={session} />}
        {tab === 'richieste' && <TabRichiesteBeta session={session} />}
        {tab === 'statistiche' && <TabStatistiche session={session} />}
      </div>
    </div>
  )
}
