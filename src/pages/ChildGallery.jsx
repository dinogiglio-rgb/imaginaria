import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'
import DrawingCard from '../components/DrawingCard'
import EmptyState from '../components/EmptyState'

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

export default function ChildGallery({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bambino, setBambino] = useState(null)
  const [drawings, setDrawings] = useState([])
  const [loading, setLoading] = useState(true)
  const [confermaElimina, setConfermaElimina] = useState(null)
  const [filtriAperti, setFiltriAperti] = useState(false)
  const [filtri, setFiltri] = useState({ categoria: '', ordinamento: 'recenti' })

  useEffect(() => {
    fetchBambino()
    fetchDrawings()
  }, [id])

  const fetchBambino = async () => {
    const { data } = await supabase
      .from('children')
      .select('*')
      .eq('id', id)
      .single()
    setBambino(data)
  }

  const fetchDrawings = async () => {
    try {
      const { data, error } = await supabase
        .from('drawings')
        .select('*')
        .eq('child_id', id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setDrawings(data || [])
    } catch (err) {
      console.error('Errore caricamento:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleElimina = async (drawingId) => {
    try {
      const estensioni = ['jpg', 'jpeg', 'png', 'webp']
      for (const ext of estensioni) {
        await supabase.storage.from('originals').remove([`${drawingId}.${ext}`])
        await supabase.storage.from('processed').remove([`${drawingId}.${ext}`])
      }
      await supabase.storage.from('renders').remove([
        `${drawingId}/cartoon.jpg`,
        `${drawingId}/toy.jpg`,
        `${drawingId}/realistic.jpg`
      ])
      const { error } = await supabase.from('drawings').delete().eq('id', drawingId)
      if (error) throw error
      setDrawings(prev => prev.filter(d => d.id !== drawingId))
      setConfermaElimina(null)
    } catch (err) {
      console.error('Errore eliminazione:', err)
    }
  }

  const categorie = useMemo(() => {
    const cats = drawings.map(d => d.category).filter(Boolean)
    return [...new Set(cats)].sort()
  }, [drawings])

  const drawingsFiltrati = useMemo(() => {
    let lista = [...drawings]
    if (filtri.categoria) lista = lista.filter(d => d.category === filtri.categoria)
    if (filtri.ordinamento === 'recenti') lista.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    if (filtri.ordinamento === 'vecchi') lista.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    if (filtri.ordinamento === 'titolo') lista.sort((a, b) => (a.ai_title || '').localeCompare(b.ai_title || ''))
    return lista
  }, [drawings, filtri])

  const filtriAttivi = filtri.categoria || filtri.ordinamento !== 'recenti'
  const resetFiltri = () => setFiltri({ categoria: '', ordinamento: 'recenti' })

  const isMaschio = bambino?.gender === 'maschio'
  const icona = isMaschio ? '🧒' : '👧'
  const eta = calcolaEta(bambino?.birth_date)

  return (
    <div style={{ backgroundColor: '#FAF9F6', minHeight: '100vh' }}>
      <Header user={user} />

      <main style={{ paddingTop: '64px', paddingBottom: '100px' }}>
        <div style={{ padding: '20px 16px 12px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600,
              fontSize: '0.9rem', color: '#888',
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '0 0 12px 0'
            }}
          >
            ← Tutti i bambini
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                fontSize: '1.5rem', color: '#2D2D2D', margin: '0 0 2px 0'
              }}>
                {bambino?.name} {icona}
              </h1>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#999', margin: 0 }}>
                {eta && `${eta} · `}{drawingsFiltrati.length} disegn{drawingsFiltrati.length === 1 ? 'o' : 'i'}
                {filtriAttivi ? ' (filtrati)' : ''}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => navigate(`/book?childId=${id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', background: 'white',
                  border: '2px solid #e8e4df', borderRadius: '50px', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontWeight: 600,
                  fontSize: '0.85rem', color: '#666',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                📚 Libro
              </button>
              <button
                onClick={() => setFiltriAperti(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px',
                  background: filtriAttivi ? 'linear-gradient(135deg, #FF7F6A, #A084E8)' : 'white',
                  border: filtriAttivi ? 'none' : '2px solid #e8e4df',
                  borderRadius: '50px', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontWeight: 600,
                  fontSize: '0.85rem', color: filtriAttivi ? 'white' : '#666',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                <span>⚙️</span>
                Filtri{filtriAttivi ? ' •' : ''}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              border: '4px solid #f0ede8', borderTopColor: '#FF7F6A',
              animation: 'spin 0.8s linear infinite'
            }} />
          </div>
        ) : drawingsFiltrati.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            padding: '4px 12px',
          }}>
            {drawingsFiltrati.map(drawing => (
              <DrawingCard
                key={drawing.id}
                drawing={drawing}
                onClick={() => navigate(`/drawing/${drawing.id}`)}
                onElimina={(drawId) => setConfermaElimina(drawId)}
              />
            ))}
          </div>
        )}
      </main>

      <button
        onClick={() => navigate(`/upload?childId=${id}`)}
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

      {filtriAperti && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 998, backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setFiltriAperti(false)}
        >
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              backgroundColor: 'white', borderRadius: '24px 24px 0 0',
              padding: '24px 20px 40px', maxHeight: '85vh', overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: '40px', height: '4px', backgroundColor: '#e0ddd8', borderRadius: '2px', margin: '0 auto 20px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#2D2D2D', margin: 0 }}>
                Filtri
              </h2>
              {filtriAttivi && (
                <button onClick={resetFiltri} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: '#FF7F6A' }}>
                  Reset filtri
                </button>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={labelFiltroStyle}>Ordina per</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { key: 'recenti', label: '🕐 Più recenti' },
                  { key: 'vecchi', label: '📅 Più vecchi' },
                  { key: 'titolo', label: '🔤 Titolo' },
                ].map(o => (
                  <button key={o.key} onClick={() => setFiltri(f => ({ ...f, ordinamento: o.key }))}
                    style={chipStyle(filtri.ordinamento === o.key)}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {categorie.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <p style={labelFiltroStyle}>Categoria</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => setFiltri(f => ({ ...f, categoria: '' }))} style={chipStyle(!filtri.categoria)}>
                    Tutte
                  </button>
                  {categorie.map(cat => (
                    <button key={cat} onClick={() => setFiltri(f => ({ ...f, categoria: cat }))} style={chipStyle(filtri.categoria === cat)}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setFiltriAperti(false)}
              style={{
                width: '100%', padding: '15px',
                background: 'linear-gradient(135deg, #FF7F6A, #A084E8)',
                border: 'none', borderRadius: '50px', cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                fontSize: '1rem', color: 'white', marginTop: '8px'
              }}
            >
              Mostra risultati ({drawingsFiltrati.length})
            </button>
          </div>
        </div>
      )}

      {confermaElimina && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '24px',
            padding: '28px 24px', width: '100%', maxWidth: '420px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#2D2D2D', margin: '0 0 8px 0' }}>
              Elimina disegno?
            </h3>
            <p style={{ fontFamily: 'Inter, sans-serif', color: '#999', fontSize: '0.9rem', margin: '0 0 24px 0' }}>
              Il disegno e tutte le trasformazioni magiche verranno eliminati per sempre.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfermaElimina(null)} style={{
                flex: 1, padding: '14px', background: '#f5f3f0',
                border: 'none', borderRadius: '50px', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: 600,
                fontSize: '0.95rem', color: '#666'
              }}>
                Annulla
              </button>
              <button onClick={() => handleElimina(confermaElimina)} style={{
                flex: 1, padding: '14px',
                background: 'linear-gradient(135deg, #FF7F6A, #ff4444)',
                border: 'none', borderRadius: '50px', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: 700,
                fontSize: '0.95rem', color: 'white'
              }}>
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const labelFiltroStyle = {
  fontFamily: 'Inter, sans-serif', fontWeight: 700,
  fontSize: '0.85rem', color: '#2D2D2D',
  margin: '0 0 10px 0', textTransform: 'uppercase',
  letterSpacing: '0.05em'
}

const chipStyle = (attivo) => ({
  padding: '8px 16px',
  borderRadius: '50px',
  border: '2px solid',
  borderColor: attivo ? '#A084E8' : '#e8e4df',
  background: attivo ? '#A084E8' : 'white',
  color: attivo ? 'white' : '#666',
  cursor: 'pointer',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.85rem',
  fontWeight: 500,
  transition: 'all 0.15s'
})
