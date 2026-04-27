import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export async function sendPushToUser(supabaseAdmin, userId, payload) {
  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)

  for (const sub of subs || []) {
    try {
      await webpush.sendNotification(
        JSON.parse(sub.subscription_json),
        JSON.stringify(payload)
      )
    } catch (err) {
      if (err.statusCode === 410) {
        await supabaseAdmin
          .from('push_subscriptions')
          .delete()
          .eq('id', sub.id)
      }
    }
  }
}
