'use client'
import { useState, useEffect } from 'react'
import { CalendarHeart, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const CALENDLY_URL = 'https://calendly.com/jeffoliverphoto/pre-wed-shoot'

const FAQ = [
  {
    q: 'Where does the shoot take place?',
    a: 'Entirely up to you — a favourite spot in your city, a park, somewhere that means something to you, or even at home. We\'ll chat beforehand to find somewhere that feels right.',
  },
  {
    q: 'How long does it last?',
    a: 'Usually about an hour to an hour and a half — enough time to get relaxed and natural without it feeling like an endurance test.',
  },
  {
    q: 'What should we wear?',
    a: 'Something you feel confident and comfortable in. It doesn\'t need to be formal — casual works beautifully. Avoid very busy patterns; complementary tones look lovely together.',
  },
  {
    q: 'When will we receive the photos?',
    a: 'Usually within 2–3 weeks. We\'ll send you a private online gallery you can download from directly.',
  },
  {
    q: 'What if we need to reschedule?',
    a: 'No problem at all — use the Reschedule button on this page to pick a new time. Just try to give us a few days\' notice where you can.',
  },
]

interface Props {
  shootAt: string | null
  rescheduleUrl: string | null
  partnerName: string
  clientEmail: string | null
}

export function PrewedShootCard({ shootAt, rescheduleUrl, partnerName, clientEmail }: Props) {
  const [showFaq, setShowFaq] = useState(false)
  const [optimisticBooked, setOptimisticBooked] = useState(false)

  // Listen for Calendly booking completion from within the iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.origin === 'https://calendly.com' && e.data?.event === 'calendly.event_scheduled') {
        setOptimisticBooked(true)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const isBooked = !!shootAt || optimisticBooked

  // Format date/time in UK timezone
  let formattedDate = ''
  let formattedTime = ''
  if (shootAt) {
    const d = new Date(shootAt)
    formattedDate = d.toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      timeZone: 'Europe/London',
    })
    formattedTime = d.toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/London',
    })
  }

  // Build Calendly embed URL with pre-fill and branding
  const embedUrl = new URL(CALENDLY_URL)
  embedUrl.searchParams.set('hide_gdpr_banner', '1')
  embedUrl.searchParams.set('background_color', 'faf9f7')
  embedUrl.searchParams.set('text_color', '1a1a1a')
  embedUrl.searchParams.set('primary_color', '1a1a1a')
  if (partnerName) embedUrl.searchParams.set('name', partnerName)
  if (clientEmail) embedUrl.searchParams.set('email', clientEmail)

  return (
    <>
      {/* Pre-wed FAQ modal */}
      {showFaq && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 px-4 py-12 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl">Pre-Wedding Shoot</h3>
              <button onClick={() => setShowFaq(false)} className="text-[#919295] hover:text-[#535353] transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-5">
              {FAQ.map(({ q, a }) => (
                <div key={q}>
                  <p className="text-sm font-medium text-[#1a1a1a] mb-1">{q}</p>
                  <p className="text-sm text-[#555] leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Button variant="outline" size="sm" onClick={() => setShowFaq(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Card */}
      <div className="mb-6 bg-[#1a1a1a] text-white rounded-2xl overflow-hidden">
        {isBooked ? (
          /* ── Booked state ─────────────────────────────────────── */
          <div className="p-6">
            <div className="flex items-start gap-4">
              <CalendarHeart size={20} className="shrink-0 mt-0.5 text-[#b5b8ba]" />
              <div className="flex-1">
                <p className="text-xs tracking-[0.12em] uppercase text-[#b5b8ba] mb-1">Pre-Wedding Shoot</p>
                {shootAt ? (
                  <>
                    <p className="font-serif text-xl mb-1">Your shoot is confirmed</p>
                    <p className="text-lg font-light mb-5">
                      {formattedDate} at {formattedTime}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-serif text-xl mb-1">Booking confirmed!</p>
                    <p className="text-sm text-[#b5b8ba] mb-5">
                      Refresh in a moment and your date will appear here.
                    </p>
                  </>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowFaq(true)}
                    className="text-xs tracking-[0.1em] uppercase border border-white/30 px-4 py-2 hover:bg-white/10 transition-colors rounded"
                  >
                    FAQ
                  </button>
                  {rescheduleUrl && (
                    <a
                      href={rescheduleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs tracking-[0.1em] uppercase border border-white/30 px-4 py-2 hover:bg-white/10 transition-colors rounded"
                    >
                      Reschedule
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Not booked — Calendly embed ──────────────────────── */
          <>
            <div className="p-6 pb-4">
              <div className="flex items-start gap-4">
                <CalendarHeart size={20} className="shrink-0 mt-0.5 text-[#b5b8ba]" />
                <div>
                  <p className="text-xs tracking-[0.12em] uppercase text-[#b5b8ba] mb-1">Included in your package</p>
                  <p className="font-serif text-xl mb-1">Pre-Wedding Shoot</p>
                  <p className="text-sm text-[#b5b8ba]">
                    A relaxed shoot in the months before your wedding — a great chance to get comfortable in front of the camera before the big day.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-[#faf9f7]">
              <iframe
                src={embedUrl.toString()}
                width="100%"
                height="660"
                frameBorder="0"
                title="Book your pre-wedding shoot"
                className="block"
              />
            </div>
          </>
        )}
      </div>
    </>
  )
}
