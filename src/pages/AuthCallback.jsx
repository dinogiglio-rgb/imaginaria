import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  useEffect(() => {
    // Supabase gestisce automaticamente il token dall'URL
    supabase.auth.getSession().then(() => {
      window.location.href = '/'
    })
  }, [])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: '#FAF9F6' }}
    >
      <div
        className="animate-spin rounded-full h-12 w-12 border-4 border-transparent"
        style={{ borderTopColor: '#FF7F6A' }}
      ></div>
      <p style={{ fontFamily: 'Inter, sans-serif', color: '#A084E8', fontSize: '1.1rem' }}>
        Accesso in corso...
      </p>
    </div>
  )
}
