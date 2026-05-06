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

function AppContent() {
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showFamilySetup, setShowFamilySetup] = useState(null)
  const [userFamilyId, setUserFamilyId] = useState(null)
  const [accessError, setAccessError] = useState(null)

  const checkAndSetUser = async (u) => {
    if (!u) {
      setUser(null)
      setShowFamilySetup(false)
      return
    }

    // Verifica whitelist
    const { data: allowed } = await supabase
      .from('allowed_emails')
      .select('email')
      .eq('email', u.email)
      .single()

    if (!allowed) {
      await supabase.auth.signOut()
      setUser(null)
      setShowFamilySetup(false)
      setAccessError('Accesso non autorizzato. Richiedi l\'accesso beta.')
      return
    }

    // Auto-imposta beta_expires_at al primo accesso (14 giorni)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, beta_expires_at')
      .eq('id', u.id)
      .single()

    if (profile && profile.role !== 'admin' && !profile.beta_expires_at) {
      const expiryDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      await supabase
        .from('profiles')
        .update({ beta_expires_at: expiryDate.toISOString() })
        .eq('id', u.id)
    }

    setUser(u)
    setAccessError(null)

    const { data: members } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', u.id)
      .limit(1)
    const fid = members?.[0]?.family_id ?? null
    if (fid) {
      setUserFamilyId(fid)
      setShowFamilySetup(false)
    } else {
      setShowFamilySetup(true)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await checkAndSetUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        await checkAndSetUser(session?.user ?? null)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setShowFamilySetup(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <Spinner />

  // Utente non autenticato → landing page (con eventuali route pubbliche)
  if (!user) {
    return (
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/share/:token" element={<Share />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />
        <Route path="*" element={<LandingPage accessError={accessError} />} />
      </Routes>
    )
  }

  if (showFamilySetup === null) return <Spinner />

  if (showFamilySetup === true && !location.pathname.startsWith('/invite/') && location.pathname !== '/account') {
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
