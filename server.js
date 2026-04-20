import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

async function loadRoutes() {
  try {
    const analyzeModule = await import('./api/drawings/analyze.js')
    app.post('/api/drawings/analyze', (req, res) => analyzeModule.default(req, res))
    console.log('✅ Route /api/drawings/analyze caricata')
  } catch (e) {
    console.error('❌ Errore caricamento route analyze:', e.message)
  }

  try {
    const storyModule = await import('./api/drawings/story.js')
    app.post('/api/drawings/story', (req, res) => storyModule.default(req, res))
    console.log('✅ Route /api/drawings/story caricata')
  } catch (e) {
    console.log('ℹ️  Route story non ancora disponibile, skip')
  }

  try {
    const combineModule = await import('./api/stories/combine.js')
    app.post('/api/stories/combine', (req, res) => combineModule.default(req, res))
    console.log('✅ Route /api/stories/combine caricata')
  } catch (e) {
    console.log('ℹ️  Route combine non disponibile')
  }

  try {
    const renderModule = await import('./api/drawings/render.js')
    app.post('/api/drawings/render', (req, res) => renderModule.default(req, res))
    console.log('✅ Route /api/drawings/render caricata')
  } catch (e) {
    console.error('❌ Errore caricamento route render:', e.message)
  }
}

loadRoutes().then(() => {
  app.listen(3001, () => {
    console.log('🚀 Server API locale avviato su http://localhost:3001')
  })
})
