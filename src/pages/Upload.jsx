import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ImageCropper from '../components/ImageCropper'

const CATEGORIE = [
  'Animali', 'Persone', 'Fantasia', 'Natura',
  'Veicoli', 'Casa', 'Mostri', 'Supereroi', 'Altra...'
]

export default function Upload({ user }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const childId = searchParams.get('childId')
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const [foto, setFoto] = useState(null)
  const [anteprima, setAnteprima] = useState(null)
  const [mostraCropper, setMostraCropper] = useState(false)
  const [immagineDaCroppare, setImmagineDaCroppare] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState(null)
  const [categoriaCustom, setCategoriaCustom] = useState(false)

  const [form, setForm] = useState({
    titolo: '',
    categoria: '',
    categoriaPersonalizzata: '',
    autore: '',
    eta: '',
    dataDisegno: new Date().toISOString().split('T')[0],
    note: '',
  })

  const handleFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validazione tipo
    if (!file.type.startsWith('image/')) {
      setErrore("Il file selezionato non è un'immagine. Scegli un JPG, PNG o HEIC.")
      e.target.value = ''
      return
    }

    // Validazione dimensione (max 20MB)
    const MAX_MB = 20
    if (file.size > MAX_MB * 1024 * 1024) {
      setErrore(`Il file è troppo grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Massimo ${MAX_MB} MB.`)
      e.target.value = ''
      return
    }

    setErrore(null)
    const url = URL.createObjectURL(file)
    setImmagineDaCroppare(url)
    setMostraCropper(true)
  }

  const handleCropConferma = (blob) => {
    setFoto(blob)
    setAnteprima(URL.createObjectURL(blob))
    setMostraCropper(false)
    setImmagineDaCroppare(null)
  }

  const handleCropAnnulla = () => {
    setMostraCropper(false)
    setImmagineDaCroppare(null)
  }

  const handleForm = (campo, valore) => {
    if (campo === 'categoria' && valore === 'Altra...') {
      setCategoriaCustom(true)
      setForm(f => ({ ...f, categoria: 'Altra...' }))
    } else {
      if (campo === 'categoria') setCategoriaCustom(false)
      setForm(f => ({ ...f, [campo]: valore }))
    }
  }

  const comprimiImmagine = async (blob, maxWidth = 1200, qualita = 0.82) => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('Compressione timeout — uso immagine originale')
        resolve(blob)
      }, 8000)

      const img = new Image()
      const url = URL.createObjectURL(blob)

      img.onerror = () => {
        clearTimeout(timeout)
        URL.revokeObjectURL(url)
        resolve(blob)
      }

      img.onload = () => {
        try {
          const ratio = Math.min(1, maxWidth / img.width)
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(img.width * ratio)
          canvas.height = Math.round(img.height * ratio)
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          URL.revokeObjectURL(url)

          canvas.toBlob(
            (result) => {
              clearTimeout(timeout)
              resolve(result || blob)
            },
            'image/jpeg',
            qualita
          )
        } catch (e) {
          clearTimeout(timeout)
          URL.revokeObjectURL(url)
          resolve(blob)
        }
      }

      img.src = url
    })
  }

  const handleSalva = async () => {
    if (!foto) {
      setErrore('Aggiungi prima una foto del disegno!')
      return
    }

    try {
      console.log('UPLOAD STEP 1 - inizio')
      setLoading(true)
      setErrore(null)

      // Verifica limiti beta
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, beta_expires_at')
        .eq('id', user.id)
        .single()

      if (profile && profile.role !== 'admin') {
        if (profile.beta_expires_at && new Date() > new Date(profile.beta_expires_at)) {
          setErrore('Hai raggiunto il limite beta, ci vediamo al lancio! 🚀')
          setLoading(false)
          return
        }

        if (childId) {
          const { count: drawingsCount } = await supabase
            .from('drawings')
            .select('id', { count: 'exact', head: true })
            .eq('child_id', childId)

          if (drawingsCount >= 4) {
            setErrore('Hai raggiunto il limite beta, ci vediamo al lancio! 🚀')
            setLoading(false)
            return
          }
        }
      }

      // 1. Crea il record disegno nel database
      const categoriaFinale = categoriaCustom
        ? form.categoriaPersonalizzata
        : form.categoria

      const { data: drawing, error: dbError } = await supabase
        .from('drawings')
        .insert({
          author_id: user.id,
          child_id: childId || null,
          title: form.titolo || null,
          category: categoriaFinale || null,
          notes: form.note || null,
          child_age_months: form.eta ? parseInt(form.eta) * 12 : null,
          created_at: form.dataDisegno
            ? new Date(form.dataDisegno).toISOString()
            : new Date().toISOString(),
        })
        .select()
        .single()

      if (dbError) throw dbError
      console.log('UPLOAD STEP 2 - DB insert ok, id:', drawing?.id)

      // 2. Comprimi e carica la foto su Supabase Storage
      const fotoOriginale = foto
      console.log('UPLOAD STEP 3 - inizio compressione, size originale:', (fotoOriginale.size/1024/1024).toFixed(1) + 'MB')
      const fotoCompressa = await comprimiImmagine(fotoOriginale)
      console.log('UPLOAD STEP 4 - compressione ok, size:', fotoCompressa?.size, '(' + (fotoCompressa.size/1024).toFixed(0) + 'KB)')

      const percorso = `${drawing.id}.jpg`

      console.log('UPLOAD STEP 5 - inizio upload storage')

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
      const { data: { session } } = await supabase.auth.getSession()

      const abortController = new AbortController()
      const uploadTimeout = setTimeout(() => abortController.abort(), 20000)

      const uploadRes = await fetch(
        `${SUPABASE_URL}/storage/v1/object/originals/${drawing.id}.jpg`,
        {
          method: 'POST',
          signal: abortController.signal,
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_KEY,
            'Content-Type': 'image/jpeg',
            'x-upsert': 'true'
          },
          body: fotoCompressa
        }
      )
      clearTimeout(uploadTimeout)

      if (!uploadRes.ok) {
        const errBody = await uploadRes.text()
        throw new Error(`Upload fallito (${uploadRes.status}): ${errBody}`)
      }

      console.log('UPLOAD STEP 6 - upload ok')

      // 3. Ottieni l'URL pubblico e salvalo
      const { data: urlData } = supabase.storage
        .from('originals')
        .getPublicUrl(percorso)

      await supabase
        .from('drawings')
        .update({ original_url: urlData.publicUrl })
        .eq('id', drawing.id)

      console.log('UPLOAD STEP 7 - URL salvato, navigo verso:', `/drawing/${drawing.id}`)
      // 4. Vai alla pagina del disegno
      navigate(`/drawing/${drawing.id}`)

    } catch (err) {
      console.error('ERRORE SALVATAGGIO:', err.message, err.stack)
      setErrore(err.message || 'Errore durante il salvataggio. Riprova.')
      setLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#FAF9F6', minHeight: '100vh', paddingBottom: '40px' }}>

      {mostraCropper && immagineDaCroppare && (
        <ImageCropper
          immagine={immagineDaCroppare}
          onConferma={handleCropConferma}
          onAnnulla={handleCropAnnulla}
        />
      )}

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: '#FAF9F6',
        borderBottom: '1px solid #f0ede8',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.4rem', padding: '4px', lineHeight: 1
          }}
        >
          ←
        </button>
        <h1 style={{
          fontFamily: 'Outfit, sans-serif', fontWeight: 800,
          fontSize: '1.2rem', color: '#2D2D2D', margin: 0
        }}>
          Nuovo disegno
        </h1>
      </header>

      <div style={{ padding: '20px' }}>

        {/* Zona foto */}
        {!anteprima ? (
          <div style={{
            border: '2px dashed #A084E8',
            borderRadius: '20px',
            padding: '40px 20px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '16px',
            marginBottom: '24px',
            backgroundColor: '#A084E808'
          }}>
            <div style={{ fontSize: '3rem' }}>🖼️</div>
            <p style={{
              fontFamily: 'Inter, sans-serif', color: '#999',
              fontSize: '0.95rem', margin: 0, textAlign: 'center'
            }}>
              Scatta una foto o scegli dalla galleria
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => cameraInputRef.current.click()}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #FF7F6A, #A084E8)',
                  border: 'none', borderRadius: '50px',
                  color: 'white', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontWeight: 600,
                  fontSize: '0.95rem', display: 'flex',
                  alignItems: 'center', gap: '8px'
                }}
              >
                📷 Scatta foto
              </button>
              <button
                onClick={() => fileInputRef.current.click()}
                style={{
                  padding: '12px 24px',
                  background: 'white',
                  border: '2px solid #A084E8',
                  borderRadius: '50px', color: '#A084E8',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontWeight: 600,
                  fontSize: '0.95rem', display: 'flex',
                  alignItems: 'center', gap: '8px'
                }}
              >
                🖼️ Galleria
              </button>
            </div>
            <input
              ref={cameraInputRef} type="file"
              accept="image/*" capture="environment"
              onChange={handleFoto} style={{ display: 'none' }}
            />
            <input
              ref={fileInputRef} type="file"
              accept="image/*"
              onChange={handleFoto} style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: '24px', position: 'relative' }}>
            <img
              src={anteprima} alt="Anteprima"
              style={{
                width: '100%', borderRadius: '20px',
                maxHeight: '320px', objectFit: 'cover',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}
            />
            <button
              onClick={() => { setFoto(null); setAnteprima(null) }}
              style={{
                position: 'absolute', top: '12px', right: '12px',
                background: 'rgba(0,0,0,0.5)', border: 'none',
                borderRadius: '50%', width: '32px', height: '32px',
                color: 'white', cursor: 'pointer', fontSize: '1rem'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Titolo */}
          <div>
            <label style={labelStyle}>Titolo <span style={{ color: '#ccc' }}>(opzionale — lo genera l'AI)</span></label>
            <input
              type="text" placeholder="Es: Il drago di Lorenzo"
              value={form.titolo}
              onChange={e => handleForm('titolo', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Categoria */}
          <div>
            <label style={labelStyle}>Categoria</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CATEGORIE.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleForm('categoria', cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '50px',
                    border: '2px solid',
                    borderColor: form.categoria === cat ? '#A084E8' : '#e8e4df',
                    background: form.categoria === cat ? '#A084E8' : 'white',
                    color: form.categoria === cat ? 'white' : '#666',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    transition: 'all 0.15s'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            {categoriaCustom && (
              <input
                type="text" placeholder="Scrivi la categoria..."
                value={form.categoriaPersonalizzata}
                onChange={e => handleForm('categoriaPersonalizzata', e.target.value)}
                style={{ ...inputStyle, marginTop: '10px' }}
              />
            )}
          </div>

          {/* Autore */}
          <div>
            <label style={labelStyle}>Autore/i</label>
            <input
              type="text" placeholder="Es: Lorenzo, oppure Lorenzo e Sofia"
              value={form.autore}
              onChange={e => handleForm('autore', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Età e Data su una riga */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Età (anni)</label>
              <input
                type="number"
                min="0"
                max="18"
                placeholder="Es: 5"
                value={form.eta}
                onChange={e => handleForm('eta', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Data disegno</label>
              <input
                type="date"
                value={form.dataDisegno}
                onChange={e => handleForm('dataDisegno', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label style={labelStyle}>Note <span style={{ color: '#ccc' }}>(opzionale)</span></label>
            <textarea
              placeholder="Un ricordo, un aneddoto..."
              value={form.note}
              onChange={e => handleForm('note', e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {/* Errore */}
          {errore && (
            <p style={{ color: '#FF7F6A', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', margin: 0 }}>
              ⚠️ {errore}
            </p>
          )}

          {/* Bottone salva */}
          <button
            onClick={handleSalva}
            disabled={loading || !foto}
            style={{
              padding: '16px',
              background: loading || !foto
                ? '#ccc'
                : 'linear-gradient(135deg, #FF7F6A, #A084E8)',
              border: 'none', borderRadius: '50px',
              color: 'white', cursor: loading || !foto ? 'not-allowed' : 'pointer',
              fontFamily: 'Outfit, sans-serif', fontWeight: 700,
              fontSize: '1.1rem',
              boxShadow: foto ? '0 8px 28px rgba(255,127,106,0.3)' : 'none',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '10px'
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Salvataggio...
              </>
            ) : (
              '✨ Salva e analizza'
            )}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: '0.9rem',
  color: '#2D2D2D',
  marginBottom: '8px'
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '14px',
  border: '2px solid #e8e4df',
  backgroundColor: 'white',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.95rem',
  color: '#2D2D2D',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s'
}
