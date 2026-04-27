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

    const { drawingId, tipo, indicazioni } = req.body
    if (!drawingId) return res.status(400).json({ error: 'drawingId mancante' })

    const { data: drawing, error: dbError } = await supabase
      .from('drawings')
      .select('*, children(*)')
      .eq('id', drawingId)
      .single()

    if (dbError || !drawing) return res.status(404).json({ error: 'Disegno non trovato' })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 55000 })
    const descrizione = indicazioni || drawing.ai_description || drawing.ai_title || 'un disegno di un bambino'
    const titolo = drawing.ai_title || 'il disegno'
    const contestoEta = buildContestoEta(drawing.children)

    let prompt = ''
    if (tipo === 'breve') {
      prompt = `${contestoEta}Sei un narratore magico e poetico che scrive storie per bambini.

Basandoti su questo disegno intitolato "${titolo}" e su questa descrizione:
"${descrizione}"

Scrivi una storia BREVE (3-4 paragrafi, massimo 150 parole) in italiano,
magica e coinvolgente, adatta a bambini piccoli.
La storia deve sembrare che i personaggi del disegno prendano vita.
Usa un linguaggio semplice, poetico e pieno di meraviglia.
Inizia direttamente con la storia, senza titolo e senza introduzioni.`
    } else {
      prompt = `${contestoEta}Sei un narratore magico e poetico che scrive favole per bambini.

Basandoti su questo disegno intitolato "${titolo}" e su questa descrizione:
"${descrizione}"

Scrivi una FAVOLA LUNGA E COMPLETA (circa 2000 parole) in italiano,
ricca di dettagli, emozioni e avventure.

La favola deve avere:
- Un inizio che presenta il protagonista e il suo mondo magico
- Un problema o una sfida da affrontare
- Almeno 3 momenti di avventura o colpi di scena
- Personaggi secondari interessanti che aiutano il protagonista
- Descrizioni vivide dei luoghi e delle atmosfere
- Dialoghi tra i personaggi
- Un climax emozionante
- Un finale magico, positivo e commovente con una morale

Usa un linguaggio poetico, ricco e adatto a bambini ma anche
piacevole da leggere ad alta voce da un genitore.
Inizia direttamente con la storia, senza titolo e senza introduzioni.`
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    })

    const storia = response.content[0].text.trim()

    // Salva la storia nel database
    const { data: storySalvata, error: saveError } = await supabase
      .from('stories')
      .insert({
        drawing_id: drawingId,
        author_id: user.id,
        tipo,
        testo: storia,
        indicazioni: indicazioni || null,
      })
      .select()
      .single()

    if (saveError) console.error('Errore salvataggio storia:', saveError)

    return res.status(200).json({ storia, tipo, id: storySalvata?.id })

  } catch (err) {
    console.error('Errore generazione storia:', err)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
