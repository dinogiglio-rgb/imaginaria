import https from 'https'
import http from 'http'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ALLOWED_HOSTS = [
  'supabase.co',
  'supabase.in',
  'fal.media',
  'fal.run',
  'v3.fal.media',
  'storage.googleapis.com',
]

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non autorizzato' })
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Token non valido' })

  const { url, filename } = req.query
  if (!url) return res.status(400).json({ error: 'url mancante' })

  try {
    const parsed = new URL(url)
    const isAllowed = ALLOWED_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h))
    if (!isAllowed) return res.status(403).json({ error: 'URL non consentito' })
  } catch {
    return res.status(400).json({ error: 'URL non valido' })
  }

  try {
    const client = url.startsWith('https') ? https : http
    client.get(url, (fileRes) => {
      res.setHeader('Content-Disposition', `attachment; filename="${filename || 'download'}"`)
      res.setHeader('Content-Type', fileRes.headers['content-type'] || 'application/octet-stream')
      fileRes.pipe(res)
    }).on('error', (err) => {
      res.status(500).json({ error: err.message })
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
