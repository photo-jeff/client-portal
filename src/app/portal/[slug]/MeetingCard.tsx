'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Phone, CalendarCheck } from 'lucide-react'

const MAX_WAIT_MS = 10 * 60 * 1000  // clear optimistic state after 10 min

interface Props {
  type: 'final_meeting' | 'phone_call'
  slug: string
  meetingAt?: string | null
  rescheduleUrl?: string | null
}

const CONFIG = {
  final_meeting: {
    icon: CalendarCheck,
    label: 'Final Details Meeting',
    heading: 'Book your final details meeting',
    body: "As your wedding day gets closer, we'd love to have a final catch-up to go over everything — timings, shot list, any last-minute details.",
    confirmedHeading: 'Your final meeting is confirmed',
  },
  phone_call: {
    icon: Phone,
    label: 'Phone Call',
    heading: 'Book a phone call',
    body: "Got questions as the big day approaches? Book a quick call and we can go over anything you'd like to discuss.",
    confirmedHeading: 'Your call is confirmed',
  },
}

// Same CTA copy for both meeting types (Jeff's request).
const CTA = 'Book your final details call here →'

function hasRecentBooking(key: string): boolean {
  const val = sessionStorage.getItem(key)
  if (!val) return false
  const ts = parseInt(val, 10)
  if (isNaN(ts)) { sessionStorage.removeItem(key); return false }
  if (Date.now() - ts > MAX_WAIT_MS) { sessionStorage.removeItem(key); return false }
  return true
}

export function MeetingCard({ type, slug, meetingAt = null, rescheduleUrl = null }: Props) {
  const { icon: Icon, label, heading, body, confirmedHeading } = CONFIG[type]

  const storageKey = `meeting-booked-${type}-${slug}`
  const [optimisticBooked, setOptimisticBooked] = useState(false)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  // Pick up a recent booking set by MeetingBookingWidget
  useEffect(() => {
    if (!meetingAt && hasRecentBooking(storageKey)) {
      setOptimisticBooked(true)
    }
  }, [meetingAt, storageKey])

  // While optimistic, poll so the card auto-updates once the webhook writes the date
  useEffect(() => {
    if (meetingAt || !optimisticBooked) return

    async function poll() {
      if (!hasRecentBooking(storageKey)) {
        setOptimisticBooked(false)
        return
      }
      try {
        const res = await fetch(`/api/portal/meeting-check/${slug}`)
        const { meetingAt: live } = await res.json()
        if (live) {
          sessionStorage.removeItem(storageKey)
          router.refresh()
          return
        }
      } catch { /* ignore */ }
      pollRef.current = setTimeout(poll, 8000)
    }

    pollRef.current = setTimeout(poll, 4000)
    return () => { if (pollRef.current) clearTimeout(pollRef.current) }
  }, [optimisticBooked, meetingAt, slug, storageKey, router])

  // Format booked date/time in UK timezone
  let formattedDate = ''
  let formattedTime = ''
  if (meetingAt) {
    const d = new Date(meetingAt)
    formattedDate = d.toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      timeZone: 'Europe/London',
    })
    formattedTime = d.toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/London',
    })
  }

  const isBooked = !!meetingAt || optimisticBooked

  return (
    <div className="mb-6 bg-[#1a1a1a] text-white rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <Icon size={20} className="shrink-0 mt-0.5 text-[#b5b8ba]" />
        <div className="flex-1">
          <p className="text-xs tracking-[0.12em] uppercase text-[#b5b8ba] mb-1">{label}</p>

          {isBooked ? (
            <>
              <p className="font-serif text-xl mb-1">{confirmedHeading}</p>
              {meetingAt ? (
                <p className="text-sm text-[#e8e4df] mb-5 font-light">
                  {formattedDate} at {formattedTime}
                </p>
              ) : (
                <p className="text-sm text-[#b5b8ba] mb-5 font-light">
                  Just a moment — confirming your booking…
                </p>
              )}
              {rescheduleUrl && (
                <div className="flex flex-wrap gap-3">
                  <a
                    href={rescheduleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs tracking-[0.1em] uppercase border border-white/30 px-4 py-2 hover:bg-white/10 transition-colors rounded"
                  >
                    Reschedule
                  </a>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="font-serif text-xl mb-2">{heading}</p>
              <p className="text-sm text-[#b5b8ba] mb-5 font-light">{body}</p>
              <Link
                href={`/portal/${slug}/meeting`}
                className="inline-block text-xs tracking-[0.1em] uppercase border border-white/40 px-4 py-2 hover:bg-white hover:text-[#535353] transition-colors"
              >
                {CTA}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
