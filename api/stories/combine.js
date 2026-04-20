import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non autorizzato' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: 'Token non valido' })

    const { storyIds, indicazioni } = req.body
    if (!storyIds || storyIds.length < 2) return res.status(400).json({ error: 'Servono almeno 2 storie' })

    // Carica le storie selezionate con i loro disegni
    const { data: storie, error: dbError } = await supabase
      .from('stories')
      .select('*, drawings(ai_title, ai_description)')
      .in('id', storyIds)

    if (dbError || !storie) return res.status(404).json({ error: 'Storie non trovate' })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const riassuntoStorie = storie.map((s, i) =>
      `STORIA ${i + 1} — "${s.drawings?.ai_title || 'Senza titolo'}":
${s.testo}`
    ).join('\n\n---\n\n')

    const promptIndicazioni = indicazioni
      ? `\nIndicazioni speciali: "${indicazioni}"`
      : ''

    const prompt = `Sei un narratore magico che scrive favole per bambini.

Hai queste ${storie.length} storie con personaggi diversi:

${riassuntoStorie}
${promptIndicazioni}

Scrivi una NUOVA STORIA UNICA (8-10 paragrafi) in italiano che:
- Unisce TUTTI i personaggi delle storie in un'unica avventura
- Fa incontrare i personaggi in modo naturale e magico
- Ha un intreccio coinvolgente con un finale felice
- Usa linguaggio poetico e adatto a bambini
- Fa sentire ogni personaggio importante

Inizia direttamente con la storia, senza titolo e senza introduzioni.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    })

    const storiaUnita = response.content[0].text.trim()

    return res.status(200).json({ storia: storiaUnita })

  } catch (err) {
    console.error('Errore combinazione storie:', err)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
