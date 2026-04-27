import { usePushNotifications } from '../hooks/usePushNotifications'

export default function PushNotificationButton() {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications()

  if (!isSupported) return null

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 18px',
        background: isSubscribed ? 'white' : '#FF7F6A',
        border: isSubscribed ? '2px solid #FF7F6A' : 'none',
        borderRadius: '50px', cursor: isLoading ? 'default' : 'pointer',
        fontFamily: 'Inter, sans-serif', fontWeight: 600,
        fontSize: '0.85rem',
        color: isSubscribed ? '#FF7F6A' : 'white',
        opacity: isLoading ? 0.6 : 1,
        transition: 'all 0.15s',
        boxShadow: isSubscribed ? 'none' : '0 4px 14px rgba(255,127,106,0.35)',
      }}
    >
      {isLoading ? '...' : isSubscribed ? '🔕 Disattiva notifiche' : '🔔 Attiva notifiche'}
    </button>
  )
}
