import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
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

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
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
      } else {
        setShowFamilySetup(false)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <Spinner />

  if (user && showFamilySetup === null) return <Spinner />

  if (user && showFamilySetup === true && !location.pathname.startsWith('/invite/') && location.pathname !== '/account') {
    return <FamilySetup user={user} onComplete={() => setShowFamilySetup(false)} />
  }

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <Home user={user} /> : <Navigate to="/login" />} />
      <Route path="/upload" element={user ? <Upload user={user} /> : <Navigate to="/login" />} />
      <Route path="/drawing/:id" element={user ? <Drawing user={user} /> : <Navigate to="/login" />} />
      <Route path="/book" element={user ? <Book user={user} /> : <Navigate to="/login" />} />
      <Route path="/admin" element={user ? <Admin user={user} /> : <Navigate to="/login" />} />
      <Route path="/child/:id" element={user ? <ChildGallery user={user} /> : <Navigate to="/login" />} />
      <Route path="/account" element={user ? <Account /> : <Navigate to="/login" />} />
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
