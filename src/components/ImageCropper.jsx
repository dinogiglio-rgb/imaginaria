import { useState, useRef, useEffect } from 'react'

export default function ImageCropper({ immagine, onConferma, onAnnulla }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const imgRef = useRef(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgRect, setImgRect] = useState(null)

  const [box, setBox] = useState(null)
  const dragging = useRef(null)
  const startPos = useRef(null)
  const startBox = useRef(null)

  const HANDLE_SIZE = 22

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setImgLoaded(true)
    }
    img.src = immagine
  }, [immagine])

  useEffect(() => {
    if (!imgLoaded || !containerRef.current) return
    const container = containerRef.current
    const cw = container.clientWidth
    const ch = container.clientHeight
    const img = imgRef.current
    const scale = Math.min(cw / img.width, ch / img.height, 1)
    const dw = img.width * scale
    const dh = img.height * scale
    const dx = (cw - dw) / 2
    const dy = (ch - dh) / 2
    const rect = { x: dx, y: dy, w: dw, h: dh }
    setImgRect(rect)
    setBox({
      x: dx + dw * 0.1,
      y: dy + dh * 0.1,
      w: dw * 0.8,
      h: dh * 0.8
    })
  }, [imgLoaded])

  useEffect(() => {
    if (!canvasRef.current || !imgRect || !box || !imgRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const cw = canvas.width
    const ch = canvas.height
    ctx.clearRect(0, 0, cw, ch)

    ctx.drawImage(imgRef.current, imgRect.x, imgRect.y, imgRect.w, imgRect.h)

    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, cw, ch)
    ctx.clearRect(box.x, box.y, box.w, box.h)

    ctx.save()
    ctx.beginPath()
    ctx.rect(box.x, box.y, box.w, box.h)
    ctx.clip()
    ctx.drawImage(imgRef.current, imgRect.x, imgRect.y, imgRect.w, imgRect.h)
    ctx.restore()

    ctx.strokeStyle = '#FF7F6A'
    ctx.lineWidth = 2
    ctx.strokeRect(box.x, box.y, box.w, box.h)

    ctx.strokeStyle = 'rgba(255,127,106,0.35)'
    ctx.lineWidth = 1
    for (let i = 1; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(box.x + (box.w / 3) * i, box.y)
      ctx.lineTo(box.x + (box.w / 3) * i, box.y + box.h)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(box.x, box.y + (box.h / 3) * i)
      ctx.lineTo(box.x + box.w, box.y + (box.h / 3) * i)
      ctx.stroke()
    }

    const handles = getHandles(box)
    handles.forEach(h => {
      ctx.fillStyle = 'white'
      ctx.shadowColor = 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = 4
      ctx.beginPath()
      ctx.arc(h.x, h.y, HANDLE_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = '#FF7F6A'
      ctx.lineWidth = 2.5
      ctx.stroke()
    })
  }, [box, imgRect, imgLoaded])

  const getHandles = (b) => [
    { id: 'tl', x: b.x,           y: b.y },
    { id: 'tc', x: b.x + b.w / 2, y: b.y },
    { id: 'tr', x: b.x + b.w,     y: b.y },
    { id: 'ml', x: b.x,           y: b.y + b.h / 2 },
    { id: 'mr', x: b.x + b.w,     y: b.y + b.h / 2 },
    { id: 'bl', x: b.x,           y: b.y + b.h },
    { id: 'bc', x: b.x + b.w / 2, y: b.y + b.h },
    { id: 'br', x: b.x + b.w,     y: b.y + b.h },
  ]

  const getEventPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  const hitHandle = (pos) => {
    if (!box) return null
    const handles = getHandles(box)
    return handles.find(h =>
      Math.hypot(h.x - pos.x, h.y - pos.y) < HANDLE_SIZE
    )
  }

  const isInsideBox = (pos) => {
    if (!box) return false
    return pos.x > box.x && pos.x < box.x + box.w &&
           pos.y > box.y && pos.y < box.y + box.h
  }

  const onPointerDown = (e) => {
    e.preventDefault()
    const pos = getEventPos(e)
    const handle = hitHandle(pos)
    if (handle) {
      dragging.current = handle.id
    } else if (isInsideBox(pos)) {
      dragging.current = 'move'
    } else {
      return
    }
    startPos.current = pos
    startBox.current = { ...box }
  }

  const onPointerMove = (e) => {
    e.preventDefault()
    if (!dragging.current || !startPos.current || !startBox.current) return
    const pos = getEventPos(e)
    const dx = pos.x - startPos.current.x
    const dy = pos.y - startPos.current.y
    const sb = startBox.current
    const MIN = 60

    let newBox = { ...sb }

    if (dragging.current === 'move') {
      newBox.x = sb.x + dx
      newBox.y = sb.y + dy
    } else {
      if (dragging.current.includes('l')) {
        newBox.x = sb.x + dx
        newBox.w = sb.w - dx
        if (newBox.w < MIN) { newBox.x = sb.x + sb.w - MIN; newBox.w = MIN }
      }
      if (dragging.current.includes('r')) {
        newBox.w = sb.w + dx
        if (newBox.w < MIN) newBox.w = MIN
      }
      if (dragging.current.includes('t')) {
        newBox.y = sb.y + dy
        newBox.h = sb.h - dy
        if (newBox.h < MIN) { newBox.y = sb.y + sb.h - MIN; newBox.h = MIN }
      }
      if (dragging.current.includes('b')) {
        newBox.h = sb.h + dy
        if (newBox.h < MIN) newBox.h = MIN
      }
    }

    if (imgRect) {
      newBox.x = Math.max(imgRect.x, Math.min(newBox.x, imgRect.x + imgRect.w - newBox.w))
      newBox.y = Math.max(imgRect.y, Math.min(newBox.y, imgRect.y + imgRect.h - newBox.h))
      newBox.w = Math.min(newBox.w, imgRect.x + imgRect.w - newBox.x)
      newBox.h = Math.min(newBox.h, imgRect.y + imgRect.h - newBox.y)
    }

    setBox(newBox)
  }

  const onPointerUp = () => {
    dragging.current = null
    startPos.current = null
    startBox.current = null
  }

  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 })
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(() => {
      setCanvasSize({
        w: containerRef.current.clientWidth,
        h: containerRef.current.clientHeight
      })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const handleConferma = () => {
    if (!box || !imgRef.current || !imgRect) return
    const img = imgRef.current
    const scaleX = img.width / imgRect.w
    const scaleY = img.height / imgRect.h
    const cropX = (box.x - imgRect.x) * scaleX
    const cropY = (box.y - imgRect.y) * scaleY
    const cropW = box.w * scaleX
    const cropH = box.h * scaleY

    const canvas = document.createElement('canvas')
    canvas.width = cropW
    canvas.height = cropH
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

    canvas.toBlob(blob => {
      onConferma(Object.assign(blob, { name: 'ritaglio.jpg' }))
    }, 'image/jpeg', 0.92)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: '#111',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 10, flexShrink: 0
      }}>
        <button onClick={onAnnulla} style={{
          background: 'none', border: 'none', color: 'white',
          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          fontSize: '0.95rem', fontWeight: 600, opacity: 0.8
        }}>
          Annulla
        </button>
        <h2 style={{
          fontFamily: 'Outfit, sans-serif', fontWeight: 700,
          fontSize: '1rem', color: 'white', margin: 0
        }}>
          Ritaglia disegno
        </h2>
        <button onClick={handleConferma} style={{
          background: 'linear-gradient(135deg, #FF7F6A, #A084E8)',
          border: 'none', borderRadius: '50px', color: 'white',
          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          fontSize: '0.95rem', fontWeight: 700, padding: '8px 20px'
        }}>
          Conferma ✓
        </button>
      </div>

      {/* Canvas */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        />
      </div>

      {/* Istruzioni */}
      <div style={{
        padding: '12px 20px 24px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        textAlign: 'center', flexShrink: 0
      }}>
        <p style={{
          color: 'rgba(255,255,255,0.5)',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.78rem', margin: 0
        }}>
          Trascina i cerchi bianchi per ridimensionare • Trascina dentro il riquadro per spostarlo
        </p>
      </div>
    </div>
  )
}
