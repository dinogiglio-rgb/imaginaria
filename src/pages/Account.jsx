import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Account() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [famiglia, setFamiglia] = useState(null)
  const [membri, setMembri] = useState([])
  const [linkInvito, setLinkInvito] = useState(null)
  const [copiato, setCopiato] = useState(false)
  const [generando, setGenerando] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, email, role')
        .eq('id', user.id)
        .single()

      setProfile({ ...profileData, id: user.id, email: profileData?.email || user.email })

      const { data: memberData } = await supabase
        .from('family_members')
        .select('family_id, role, families(name, owner_id)')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!memberData) { setLoading(false); return }

      setFamiglia({
        id: memberData.family_id,
        name: memberData.families.name,
        owner_id: memberData.families.owner_id,
      })

      const { data: membriData } = await supabase
        .from('family_members')
        .select('role, user_id, profiles(display_name, email)')
        .eq('family_id', memberData.family_id)

      setMembri(membriData || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const generaECopiaLink = async () => {
    setGenerando(true)
    try {
      const { data: existing } = await supabase
        .from('family_invites')
        .select('token')
        .eq('family_id', famiglia.id)
        .eq('status', 'pending')
        .maybeSingle()

      let inviteToken
      if (existing?.token) {
        inviteToken = existing.token
      } else {
        const newToken = crypto.randomUUID()
        await supabase
          .from('family_invites')
          .insert({ family_id: famiglia.id, token: newToken })
        inviteToken = newToken
      }

      const link = window.location.origin + '/invite/' + inviteToken
      setLinkInvito(link)
      await navigator.clipboard.writeText(link)
      setCopiato(true)
      setTimeout(() => setCopiato(false), 4000)
    } catch (err) {
      console.error(err)
    } finally {
      setGenerando(false)
    }
  }

  if (loading) {
    return (
      <div style={{ ...containerStyle, justifyContent: 'center' }}>
        <div style={spinnerStyle} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const iniziale = (profile?.display_name || profile?.email || 'U').substring(0, 1).toUpperCase()
  const isOwner = famiglia && famiglia.owner_id === profile?.id

  return (
    <div style={containerStyle}>
      <div style={{ width: '100%', maxWidth: '520px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={() => { window.location.href = '/' }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '22px', color: '#888', padding: '4px 8px 4px 0', lineHeight: 1,
            }}
          >
            ←
          </button>
          <h1 style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 800,
            fontSize: '24px', color: '#FF7F6A', margin: 0,
          }}>
            Il mio account
          </h1>
        </div>

        {/* Profilo */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: '#FF7F6A', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'white', fontFamily: 'Outfit, sans-serif',
              fontWeight: 800, fontSize: '26px', flexShrink: 0,
            }}>
              {iniziale}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '18px',
                color: '#2D2D2D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {profile?.display_name || '—'}
              </div>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#888', marginTop: '2px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {profile?.email}
              </div>
              <span style={{
                display: 'inline-block', marginTop: '6px',
                background: profile?.role === 'admin' ? '#FF7F6A' : '#A084E8',
                color: 'white', padding: '2px 12px', borderRadius: '50px',
                fontSize: '12px', fontWeight: 700, fontFamily: 'Inter, sans-serif',
              }}>
                {profile?.role === 'admin' ? 'Admin' : 'Membro'}
              </span>
            </div>
          </div>
        </div>

        {/* Famiglia */}
        {!famiglia ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '32px 20px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', color: '#888', margin: 0 }}>
              Non sei ancora in una famiglia.
            </p>
          </div>
        ) : (
          <>
            {/* Nome famiglia */}
            <div style={cardStyle}>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#888',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px',
              }}>
                La tua famiglia
              </div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '22px', color: '#FF7F6A' }}>
                {famiglia.name}
              </div>
            </div>

            {/* Membri */}
            <div style={cardStyle}>
              <h3 style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                fontSize: '15px', color: '#2D2D2D', margin: '0 0 14px 0',
              }}>
                Membri ({membri.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {membri.map(m => (
                  <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      background: m.role === 'owner' ? '#FF7F6A20' : '#A084E820',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '14px',
                      color: m.role === 'owner' ? '#FF7F6A' : '#A084E8',
                    }}>
                      {(m.profiles?.display_name || m.profiles?.email || '?').substring(0, 1).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '14px',
                        color: '#2D2D2D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {m.profiles?.display_name || m.profiles?.email || '—'}
                      </div>
                      {m.profiles?.display_name && (
                        <div style={{
                          fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#888',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {m.profiles.email}
                        </div>
                      )}
                    </div>
                    <span style={{
                      background: m.role === 'owner' ? '#FF7F6A20' : '#A084E820',
                      color: m.role === 'owner' ? '#FF7F6A' : '#A084E8',
                      padding: '3px 10px', borderRadius: '50px', flexShrink: 0,
                      fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, sans-serif',
                    }}>
                      {m.role === 'owner' ? 'Owner' : 'Membro'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Invita partner — solo owner */}
            {isOwner && (
              <div style={cardStyle}>
                <h3 style={{
                  fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                  fontSize: '15px', color: '#2D2D2D', margin: '0 0 6px 0',
                }}>
                  Invita il partner
                </h3>
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '13px',
                  color: '#888', margin: '0 0 14px 0',
                }}>
                  Genera un link da mandare al tuo partner per farlo entrare nella famiglia.
                </p>

                <button
                  onClick={generaECopiaLink}
                  disabled={generando}
                  style={{
                    backgroundColor: generando ? '#ccc' : '#FF7F6A',
                    color: 'white', border: 'none', borderRadius: '50px',
                    padding: '12px 24px',
                    fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '15px',
                    cursor: generando ? 'not-allowed' : 'pointer',
                    marginBottom: linkInvito ? '12px' : 0,
                  }}
                >
                  {generando ? '...' : 'Genera link di invito 🔗'}
                </button>

                {linkInvito && (
                  <div style={{
                    background: '#f8f6ff', borderRadius: '12px',
                    border: '1.5px solid #A084E830', padding: '14px',
                    display: 'flex', flexDirection: 'column', gap: '8px',
                  }}>
                    <div style={{
                      fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#2D2D2D',
                      wordBreak: 'break-all', background: 'white',
                      padding: '8px 12px', borderRadius: '8px', border: '1px solid #E8E3DC',
                    }}>
                      {linkInvito}
                    </div>
                    {copiato && (
                      <p style={{
                        fontFamily: 'Inter, sans-serif', fontSize: '13px',
                        color: '#4CAF50', margin: 0, fontWeight: 600,
                      }}>
                        ✓ Link copiato! 🎉 Mandalo al tuo partner
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const containerStyle = {
  minHeight: '100vh',
  backgroundColor: '#FAF9F6',
  padding: '24px 16px 48px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '16px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  padding: '20px',
  marginBottom: '16px',
}

const spinnerStyle = {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  border: '4px solid #f0ede8',
  borderTopColor: '#FF7F6A',
  animation: 'spin 0.8s linear infinite',
}
