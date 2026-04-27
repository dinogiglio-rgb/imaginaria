import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non autorizzato' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: 'Token non valido' })

    const { subscription } = req.body
    if (!subscription?.endpoint) return res.status(400).json({ error: 'subscription mancante' })

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          subscription_json: JSON.stringify(subscription),
        },
        { onConflict: 'endpoint' }
      )

    if (error) throw error

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Errore subscribe:', err)
    return res.status(500).json({ error: err.message })
  }
}
