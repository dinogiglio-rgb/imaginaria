import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AcceptInvite() {
  const { token } = useParams()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        localStorage.setItem('pendingInvite', token)
        setStatus('login_required')
        return
      }

      const { data: invite } = await supabase
        .from('family_invites')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .maybeSingle()

      if (!invite) {
        setStatus('invalid')
        return
      }

      const { data: members } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id)
        .limit(1)

      if (members && members.length > 0) {
        setStatus('already_member')
        return
      }

      const { error: insertError } = await supabase
        .from('family_members')
        .insert({ family_id: invite.family_id, user_id: user.id, role: 'member' })

      if (insertError) {
        setStatus('invalid')
        return
      }

      await supabase
        .from('family_invites')
        .update({ status: 'accepted' })
        .eq('token', token)

      localStorage.removeItem('pendingInvite')
      setStatus('success')
    }

    init()
  }, [token])

  if (status === 'loading') {
    return (
      <div style={containerStyle}>
        <div style={spinnerStyle} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (status === 'login_required') {
    return (
      <div style={containerStyle}>
        <img src="/logo-transparent.png" alt="Imaginaria" style={{ width: '120px', marginBottom: '24px' }} />
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '28px', color: '#FF7F6A', margin: '0 0 12px 0', textAlign: 'center' }}>
          Sei stato invitato! 🎉
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', color: '#666', textAlign: 'center', margin: '0 0 32px 0', maxWidth: '320px' }}>
          Accedi con Google per entrare nella famiglia
        </p>
        <button
          onClick={() => supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + '/invite/' + token }
          })}
          style={primaryBtnStyle}
        >
          Accedi con Google 🚀
        </button>
      </div>
    )
  }

  if (status === 'already_member') {
    return (
      <div style={containerStyle}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>👨‍👩‍👧</div>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '28px', color: '#FF7F6A', margin: '0 0 12px 0', textAlign: 'center' }}>
          Sei già in una famiglia!
        </h1>
        <button onClick={() => { window.location.href = '/' }} style={primaryBtnStyle}>
          Vai all'app →
        </button>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div style={containerStyle}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '24px', color: '#888', margin: '0 0 12px 0', textAlign: 'center' }}>
          Invito non valido o già usato
        </h1>
        <button onClick={() => { window.location.href = '/' }} style={{ ...primaryBtnStyle, backgroundColor: '#888' }}>
          Torna all'app →
        </button>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={{ fontSize: '80px', lineHeight: 1, marginBottom: '24px' }}>🎉</div>
      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '28px', color: '#A084E8', margin: '0 0 12px 0', textAlign: 'center' }}>
        Benvenuto nella famiglia!
      </h1>
      <button onClick={() => { window.location.href = '/' }} style={primaryBtnStyle}>
        Entra nell'app →
      </button>
    </div>
  )
}

const containerStyle = {
  minHeight: '100vh',
  backgroundColor: '#FAF9F6',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 20px',
}

const spinnerStyle = {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  border: '4px solid #f0ede8',
  borderTopColor: '#FF7F6A',
  animation: 'spin 0.8s linear infinite',
}

const primaryBtnStyle = {
  backgroundColor: '#FF7F6A',
  color: 'white',
  border: 'none',
  borderRadius: '50px',
  padding: '16px 32px',
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 700,
  fontSize: '17px',
  cursor: 'pointer',
  width: '100%',
  maxWidth: '320px',
}
