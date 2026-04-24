import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Drawing from './pages/Drawing'
import Book from './pages/Book'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FAF9F6'
      }}>
        <div style={{
          width: '48px', height: '48px',
          borderRadius: '50%',
          border: '4px solid #f0ede8',
          borderTopColor: '#FF7F6A',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Home user={user} /> : <Navigate to="/login" />} />
        <Route path="/upload" element={user ? <Upload user={user} /> : <Navigate to="/login" />} />
        <Route path="/drawing/:id" element={user ? <Drawing user={user} /> : <Navigate to="/login" />} />
        <Route path="/book" element={user ? <Book user={user} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}
