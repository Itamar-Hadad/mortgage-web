import { useEffect } from 'react'

interface Props {
  onClose: () => void
}

export function CompletionPopup({ onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(17,28,44,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full rounded-3xl p-10 text-center"
        style={{
          background: 'linear-gradient(135deg, #006875 0%, #2d628b 100%)',
          boxShadow: '0 32px 80px -20px rgba(0,104,117,0.5)',
          animation: 'popup-enter 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti ring */}
        <div className="relative mx-auto mb-6" style={{ width: 96, height: 96 }}>
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            animation: 'ring-pulse 2s ease-in-out infinite',
          }} />
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            <span className="material-symbols-outlined text-5xl" style={{ color: '#ffffff', fontVariationSettings: "'FILL' 1" }}>
              celebration
            </span>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'var(--font-headline)', color: '#ffffff' }}>
          כל הכבוד! 🎉
        </h2>
        <p className="text-base mb-2" style={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.7 }}>
          הפרטים שלכם התקבלו בהצלחה.
        </p>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
          יועץ אישי ייבחר עבורכם בהקדם ויצור אתכם קשר לתיאום המשך התהליך.
          <br />
          תודה שבחרתם ב-<strong style={{ color: '#fff' }}>SimpleSave</strong>!
        </p>

        <button
          onClick={onClose}
          className="w-full rounded-full font-bold py-3.5 text-base transition-all hover:brightness-110 active:scale-95"
          style={{ background: '#ffffff', color: '#006875', boxShadow: '0 8px 20px -6px rgba(0,0,0,0.2)' }}
        >
          סיום — לאזור האישי
        </button>
      </div>

      <style>{`
        @keyframes popup-enter {
          from { opacity: 0; transform: scale(0.7) translateY(40px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.25); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
