export default function Viewer3D({ modelUrl, onClose }) {

  const downloadGlb = () => {
    const proxyUrl = `/api/drawings/download?url=${encodeURIComponent(modelUrl)}&filename=disegno-3d.glb`
    const link = document.createElement('a')
    link.href = proxyUrl
    link.download = 'disegno-3d.glb'
    link.click()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 9999, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FAF9F6', borderRadius: '24px',
          padding: '24px', width: '100%', maxWidth: '500px'
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{
          fontFamily: 'Outfit, sans-serif', fontWeight: 800,
          fontSize: '1.3rem', color: '#2D2D2D',
          marginBottom: '16px', textAlign: 'center'
        }}>
          ✨ Il tuo disegno in 3D!
        </h2>

        {/* Viewer 3D ruotabile */}
        <model-viewer
          src={modelUrl}
          alt="Modello 3D del disegno"
          auto-rotate
          camera-controls
          style={{
            width: '100%', height: '300px',
            borderRadius: '16px', backgroundColor: '#f0ede8'
          }}
        />

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={downloadGlb}
            style={{
              flex: 1, padding: '14px', borderRadius: '50px',
              background: 'linear-gradient(135deg, #FF7F6A, #A084E8)',
              color: 'white', fontFamily: 'Outfit, sans-serif',
              fontWeight: 700, fontSize: '1rem', border: 'none',
              cursor: 'pointer'
            }}
          >
            📥 Scarica per stampa 3D
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '14px 20px', borderRadius: '50px',
              background: 'transparent', border: '2px solid #A084E8',
              color: '#A084E8', fontFamily: 'Outfit, sans-serif',
              fontWeight: 700, fontSize: '1rem', cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        <p style={{
          textAlign: 'center', fontSize: '0.75rem', color: '#aaa',
          marginTop: '12px', fontFamily: 'Inter, sans-serif', lineHeight: 1.5
        }}>
          Formato GLB · compatibile con la maggior parte delle stampanti 3D.
          Per convertire in STL usa imagetostl.com
        </p>
      </div>
    </div>
  )
}
