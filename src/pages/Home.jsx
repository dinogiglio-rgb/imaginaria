import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'

function calcolaEta(birthDate) {
  if (!birthDate) return null
  const nato = new Date(birthDate)
  const oggi = new Date()
  let totalMesi = (oggi.getFullYear() - nato.getFullYear()) * 12 + (oggi.getMonth() - nato.getMonth())
  if (oggi.getDate() < nato.getDate()) totalMesi--
  if (totalMesi < 0) return null
  const anni = Math.floor(totalMesi / 12)
  const mesi = totalMesi % 12
  if (anni === 0) return `${mesi} mes${mesi === 1 ? 'e' : 'i'}`
  if (mesi === 0) return `${anni} ann${anni === 1 ? 'o' : 'i'}`
  return `${anni} ann${anni === 1 ? 'o' : 'i'} e ${mesi} mes${mesi === 1 ? 'e' : 'i'}`
}

export default function Home({ user }) {
  const [bambini, setBambini] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { loadChildren() }, [])

  const loadChildren = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setBambini([])
        return
      }

      const { data: memberData, error: memberError } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id)
        .single()

      if (memberError || !memberData) {
        setBambini([])
        return
      }

      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*, drawings(count)')
        .eq('family_id', memberData.family_id)
        .order('created_at', { ascending: true })

      if (!childrenError) {
        setBambini(childrenData || [])
      }
    } catch (err) {
      console.error('Errore caricamento bambini:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#FAF9F6', minHeight: '100vh' }}>
      <Header user={user} />

      <main style={{ paddingTop: '64px', paddingBottom: '100px' }}>
        <div style={{ padding: '24px 16px 16px' }}>
          <h1 style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 800,
            fontSize: '1.6rem', color: '#FF7F6A', margin: '0 0 4px 0'
          }}>
            I nostri bambini ✨
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#999', margin: 0 }}>
            {bambini.length} {bambini.length === 1 ? 'bambino' : 'bambini'}
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              border: '4px solid #f0ede8', borderTopColor: '#FF7F6A',
              animation: 'spin 0.8s linear infinite'
            }} />
          </div>
        ) : bambini.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👶</div>
            <p style={{ fontFamily: 'Inter, sans-serif', color: '#999', fontSize: '0.95rem' }}>
              Nessun bambino ancora. Aggiungili dal pannello admin!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px',
            padding: '4px 16px',
          }}>
            {bambini.map(bambino => {
              const isMaschio = bambino.gender === 'maschio'
              const colore = isMaschio ? '#FF7F6A' : '#A084E8'
              const icona = isMaschio ? '🧒' : '👧'
              const numDisegni = bambino.drawings?.[0]?.count ?? 0
              const eta = calcolaEta(bambino.birth_date)

              return (
                <div
                  key={bambino.id}
                  onClick={() => navigate(`/child/${bambino.id}`)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    border: `2.5px solid ${colore}`,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    padding: '24px 16px 20px',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '8px' }}>{icona}</div>
                  <p style={{
                    fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                    fontSize: '1.1rem', color: '#3D3D3D', margin: '0 0 4px 0'
                  }}>
                    {bambino.name}
                  </p>
                  {eta && (
                    <p style={{
                      fontFamily: 'Inter, sans-serif', fontSize: '0.8rem',
                      color: '#888', margin: '0 0 6px 0'
                    }}>
                      {eta}
                    </p>
                  )}
                  <p style={{
                    fontFamily: 'Inter, sans-serif', fontSize: '0.8rem',
                    color: colore, fontWeight: 600, margin: 0
                  }}>
                    {numDisegni} disegn{numDisegni === 1 ? 'o' : 'i'}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <button
        onClick={() => navigate('/upload')}
        style={{
          position: 'fixed', bottom: '28px', left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #FF7F6A, #A084E8)',
          border: 'none', borderRadius: '50px',
          padding: '15px 28px', color: 'white',
          fontFamily: 'Outfit, sans-serif', fontWeight: 700,
          fontSize: '0.95rem', cursor: 'pointer',
          boxShadow: '0 8px 28px rgba(255,127,106,0.4)',
          display: 'flex', alignItems: 'center', gap: '8px', zIndex: 100,
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>📷</span>
        <span>Fai una foto</span>
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
