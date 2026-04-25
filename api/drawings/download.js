const https = require('https')
const http = require('http')

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end()

  const { url, filename } = req.query
  if (!url) return res.status(400).json({ error: 'url mancante' })

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
