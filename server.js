import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

async function loadRoute(label, importPath, method, routePath) {
  try {
    const mod = await import(importPath)
    app[method](routePath, (req, res) => mod.default(req, res))
    console.log(`✅ Route ${routePath} caricata`)
  } catch (e) {
    console.error(`❌ Errore caricamento route ${routePath}:`, e.message)
  }
}

async function loadRoutes() {
  // --- Drawings ---
  await loadRoute('analyze',       './api/drawings/analyze.js',      'post', '/api/drawings/analyze')
  await loadRoute('render',        './api/drawings/render.js',        'post', '/api/drawings/render')
  await loadRoute('story',         './api/drawings/story.js',         'post', '/api/drawings/story')
  await loadRoute('generate3d',    './api/drawings/generate3d.js',    'post', '/api/drawings/generate3d')
  await loadRoute('generatevideo', './api/drawings/generatevideo.js', 'post', '/api/drawings/generatevideo')
  await loadRoute('videostatus',   './api/drawings/videostatus.js',   'post', '/api/drawings/videostatus')
  await loadRoute('share',         './api/drawings/share.js',         'post', '/api/drawings/share')
  await loadRoute('download',      './api/drawings/download.js',      'get',  '/api/drawings/download')

  // sharedata usa GET con query param ?token=
  await loadRoute('sharedata',     './api/drawings/sharedata.js',     'get',  '/api/drawings/sharedata')

  // --- Stories ---
  await loadRoute('combine',       './api/stories/combine.js',        'post', '/api/stories/combine')

  // --- Admin (handler unico con ?action= — serve tutti i metodi) ---
  await loadRoute('admin',         './api/admin/index.js',            'all',  '/api/admin')
}

loadRoutes().then(() => {
  app.listen(3001, () => {
    console.log('🚀 Server API locale avviato su http://localhost:3001')
  })
})
