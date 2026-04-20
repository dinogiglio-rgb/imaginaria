export default function EmptyState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      gap: '16px',
    }}>
      {/* Icona matita */}
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #FF7F6A22, #A084E822)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2.5rem',
      }}>
        🎨
      </div>
      <h2 style={{
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 700,
        fontSize: '1.3rem',
        color: '#2D2D2D',
        margin: 0,
        textAlign: 'center',
      }}>
        Nessun disegno ancora!
      </h2>
      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.95rem',
        color: '#999',
        margin: 0,
        textAlign: 'center',
        maxWidth: '240px',
      }}>
        Premi il pulsante in basso per fotografare il primo disegno ✨
      </p>
    </div>
  )
}
