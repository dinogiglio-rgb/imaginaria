import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import LandingPage from './pages/LandingPage'
import AuthCallback from './pages/AuthCallback'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Drawing from './pages/Drawing'
import Book from './pages/Book'
import Admin from './pages/Admin'
import ChildGallery from './pages/ChildGallery'
import Share from './pages/Share'
import FamilySetup from './components/FamilySetup'
import AcceptInvite from './pages/AcceptInvite'
import Account from './pages/Account'

const Spinner = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF9F6' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid #f0ede8', borderTopColor: '#FF7F6A', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
)

// Definita FUORI dal componente — non viene mai ricreata, nessun rischio di loop
async function checkUserAccess(user, { setUser, setLoading, setShowFamilySetup, setAuthError }) {
  try {
    // 1. Carica profilo
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, beta_expires_at, subscription_status')
      .eq('id', user.id)
      .single()

    if (error || !profile) {
      setUser(null)
      setShowFamilySetup(false)
      setLoading(false)
      return
    }

    // 2. Admin → accesso diretto, nessun altro controllo
    if (profile.role === 'admin') {
      const { data: members } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id)
        .limit(1)
      setAuthError(null)
      setUser({ id: user.id, email: user.email, ...profile })
      setShowFamilySetup(!members?.[0]?.family_id)
      setLoading(false)
      return
    }

    // 3. Controlla whitelist
    const { data: allowed } = await supabase
      .from('allowed_emails')
      .select('email')
      .eq('email', user.email)
      .single()

    if (!allowed) {
      await supabase.auth.signOut()
      setUser(null)
      setShowFamilySetup(false)
      setAuthError('Accesso non autorizzato. Richiedi l\'accesso beta.')
      setLoading(false)
      return
    }

    // 4. Controlla subscription_status
    if (profile.subscription_status === 'suspended') {
      await supabase.auth.signOut()
      setUser(null)
      setShowFamilySetup(false)
      setAuthError('Il tuo accesso è stato sospeso.')
      setLoading(false)
      return
    }

    // 5. Controlla scadenza beta
    if (profile.beta_expires_at && new Date() > new Date(profile.beta_expires_at)) {
      await supabase.auth.signOut()
      setUser(null)
      setShowFamilySetup(false)
      setAuthError('Il tuo accesso beta è scaduto. Ci vediamo al lancio! 🚀')
      setLoading(false)
      return
    }

    // 6. Auto-imposta beta_expires_at al primo accesso
    if (!profile.beta_expires_at) {
      const expiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      await supabase.from('profiles').update({ beta_expires_at: expiry }).eq('id', user.id)
    }

    // 7. Controlla family membership
    const { data: members } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .limit(1)

    setAuthError(null)
    setUser({ id: user.id, email: user.email, ...profile })
    setShowFamilySetup(!members?.[0]?.family_id)
    setLoading(false)

  } catch (err) {
    console.error('Auth check error:', err)
    // Qualsiasi errore imprevisto non deve mai bloccare l'app
    setUser(null)
    setShowFamilySetup(false)
    setLoading(false)
  }
}

function AppContent() {
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showFamilySetup, setShowFamilySetup] = useState(false)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    let mounted = true

    // Timeout di sicurezza — se tutto si blocca, esci dallo spinner dopo 6s
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 6000)

    // onAuthStateChange è l'UNICA fonte di verità per lo stato auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        // TOKEN_REFRESHED non richiede un nuovo check completo
        if (event === 'TOKEN_REFRESHED') return

        if (session?.user) {
          await checkUserAccess(session.user, { setUser, setLoading, setShowFamilySetup, setAuthError })
        } else {
          // SIGNED_OUT o nessuna sessione
          setUser(null)
          setShowFamilySetup(false)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  if (loading) return <Spinner />

  // Utente non autenticato → landing page
  if (!user) {
    return (
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/share/:token" element={<Share />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />
        <Route path="*" element={
          <LandingPage
            accessError={authError}
            onLoginClick={() => setAuthError(null)}
          />
        } />
      </Routes>
    )
  }

  if (showFamilySetup && !location.pathname.startsWith('/invite/') && location.pathname !== '/account') {
    return <FamilySetup user={user} onComplete={() => setShowFamilySetup(false)} />
  }

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/" element={<Home user={user} />} />
      <Route path="/upload" element={<Upload user={user} />} />
      <Route path="/drawing/:id" element={<Drawing user={user} />} />
      <Route path="/book" element={<Book user={user} />} />
      <Route path="/admin" element={<Admin user={user} />} />
      <Route path="/child/:id" element={<ChildGallery user={user} />} />
      <Route path="/account" element={<Account />} />
      <Route path="/share/:token" element={<Share />} />
      <Route path="/invite/:token" element={<AcceptInvite />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
