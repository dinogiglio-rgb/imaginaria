import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

function calcolaAnni(birthDate) {
  if (!birthDate) return null
  const nato = new Date(birthDate)
  const oggi = new Date()
  let anni = oggi.getFullYear() - nato.getFullYear()
  const m = oggi.getMonth() - nato.getMonth()
  if (m < 0 || (m === 0 && oggi.getDate() < nato.getDate())) anni--
  return anni
}

function buildContestoEta(bambino) {
  if (!bambino) return ''
  const anni = calcolaAnni(bambino.birth_date)
  const isMaschio = bambino.gender === 'maschio'
  const articolo = isMaschio ? 'un bambino' : 'una bambina'
  const pronome = isMaschio ? 'lui' : 'lei'
  const riferimento = isMaschio ? 'il bambino' : 'la bambina'
  const etaStr = anni !== null ? ` di ${anni} anni` : ''

  return `Stai scrivendo una storia per ${bambino.name}, ${articolo}${etaStr}.
Genere: ${bambino.gender}.

Linee guida per l'età:
- 2-4 anni: frasi cortissime, parole semplici, personaggi animali simpatici, finale sempre felice, massimo 5 righe
- 5-6 anni: frasi brevi, piccola avventura, un problema semplice da risolvere, massimo 8 righe
- 7-8 anni: più dettagli, suspense leggera, amicizia e coraggio come temi, massimo 12 righe
- 9-10 anni: trama con inizio/svolgimento/fine, personaggio complesso, emozioni più profonde, massimo 15 righe
- 11+ anni: storia articolata, temi come identità e avventura, stile più maturo

Usa sempre ${pronome} e ${riferimento} in base al genere.
Il protagonista della storia è sempre ${bambino.name}.

`
}

console.log('ENV CHECK:', {
  hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
  hasFalKey: !!process.env.FAL_KEY,
  hasSupabase: !!process.env.SUPABASE_SERVICE_ROLE_KEY
})

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

    const { storyIds, indicazioni, titolo, personaggi, tema } = req.body

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 50000 })
    let prompt = ''

    if (personaggi && personaggi.length >= 2) {
      const { data: primoBambino } = await supabase
        .from('children')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      const contestoEta = buildContestoEta(primoBambino)

      const listaPersonaggi = personaggi.join(', ')
      prompt = `${contestoEta}Scrivi una storia per bambini di circa 400 parole con questi personaggi: ${listaPersonaggi}. Tema: ${tema}. Stile magico e poetico. Vai dritto alla storia senza introduzioni.`

    } else if (storyIds && storyIds.length >= 2) {
      const { data: storie, error: dbError } = await supabase
        .from('stories')
        .select('*, drawings(ai_title, ai_description, child_id)')
        .in('id', storyIds)

      if (dbError || !storie) return res.status(404).json({ error: 'Storie non trovate' })

      const firstChildId = storie.find(s => s.drawings?.child_id)?.drawings?.child_id
      let bambino = null
      if (firstChildId) {
        const { data } = await supabase.from('children').select('*').eq('id', firstChildId).single()
        bambino = data
      }
      const contestoEta = buildContestoEta(bambino)

      const riassuntoStorie = storie.map((s, i) =>
        `STORIA ${i + 1} — "${s.drawings?.ai_title || 'Senza titolo'}": ${s.testo.slice(0, 300)}`
      ).join('\n\n')

      const promptIndicazioni = indicazioni ? ` Indicazioni: "${indicazioni}".` : ''

      prompt = `${contestoEta}Scrivi una storia per bambini di circa 400 parole che unisce questi personaggi in un'unica avventura magica:

${riassuntoStorie}
${promptIndicazioni}
Vai dritto alla storia senza introduzioni.`

    } else {
      return res.status(400).json({ error: 'Servono almeno 2 storie o 2 personaggi' })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })

    const storiaUnita = response.content[0].text.trim()

    const { data: storySalvata, error: saveError } = await supabase
      .from('stories')
      .insert({
        drawing_id: null,
        author_id: user.id,
        tipo: 'combinata',
        testo: storiaUnita,
        indicazioni: titolo || null,
      })
      .select()
      .single()

    if (saveError) console.error('Errore salvataggio storia combinata:', saveError)

    return res.status(200).json({ success: true, storia: storiaUnita, testo: storiaUnita, id: storySalvata?.id })

  } catch (err) {
    console.error('ERRORE DETTAGLIATO:', {
      message: err.message,
      stack: err.stack,
      cause: err.cause
    })
    return res.status(500).json({
      error: err.message,
      detail: err.stack?.split('\n')[0]
    })
  }
}
