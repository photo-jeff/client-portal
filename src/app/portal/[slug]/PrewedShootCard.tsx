'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CalendarHeart } from 'lucide-react'

const MAX_WAIT_MS = 10 * 60 * 1000  // clear optimistic state after 10 min

interface Props {
  shootAt: string | null
  rescheduleUrl: string | null
  slug: string
}

function hasRecentBooking(key: string): boolean {
  const val = sessionStorage.getItem(key)
  if (!val) return false
  const ts = parseInt(val, 10)
  if (isNaN(ts)) { sessionStorage.removeItem(key); return false }   // old 'true' format
  if (Date.now() - ts > MAX_WAIT_MS) { sessionStorage.removeItem(key); return false }
  return true
}

export function PrewedShootCard({ shootAt, rescheduleUrl, slug }: Props) {
  const storageKey = `prewed-booked-${slug}`
  const [optimisticBooked, setOptimisticBooked] = useState(false)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router  = useRouter()

  // Pick up a recent booking set by PrewedBookingWidget
  useEffect(() => {
    if (!shootAt && hasRecentBooking(storageKey)) {
      setOptimisticBooked(true)
    }
  }, [shootAt, storageKey])

  // When in optimistic state, poll every 8s so the card auto-updates when
  // the webhook writes the real date to Supabase.
  useEffect(() => {
    if (shootAt || !optimisticBooked) return

    async function poll() {
      if (!hasRecentBooking(storageKey)) {
        setOptimisticBooked(false)
        return
      }
      try {
        const res = await fetch(`/api/portal/prewedding-check/${slug}`)
        const { shootAt: live } = await res.json()
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
  }, [optimisticBooked, shootAt, slug, storageKey, router])

  // Format booked date/time in UK timezone
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

  const isBooked = !!shootAt || optimisticBooked

  return (
    <div className="mb-6 bg-[#1a1a1a] text-white rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <CalendarHeart size={20} className="shrink-0 mt-0.5 text-[#b5b8ba]" />
          <div className="flex-1">
            <p className="text-xs tracking-[0.12em] uppercase text-[#b5b8ba] mb-1">Pre-Wedding Shoot</p>

            {isBooked ? (
              <>
                <p className="font-serif text-xl mb-1">Your shoot is confirmed</p>
                {shootAt ? (
                  <p className="text-sm text-[#e8e4df] mb-5 font-light">
                    {formattedDate} at {formattedTime}
                  </p>
                ) : (
                  <p className="text-sm text-[#b5b8ba] mb-5 font-light">
                    Just a moment — confirming your date…
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/portal/${slug}/pre-wed-shoot/faq`}
                    className="text-xs tracking-[0.1em] uppercase border border-white/30 px-4 py-2 hover:bg-white/10 transition-colors rounded"
                  >
                    FAQ
                  </Link>
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
              </>
            ) : (
              <>
                <p className="font-serif text-xl mb-2">Book your pre-wedding shoot</p>
                <p className="text-sm text-[#b5b8ba] mb-5">
                  A relaxed shoot a few months before the big day — a great chance to get comfortable in front of the camera.
                </p>
                <Link
                  href={`/portal/${slug}/pre-wed-shoot`}
                  className="inline-block text-xs tracking-[0.1em] uppercase border border-white/40 px-4 py-2 hover:bg-white hover:text-[#535353] transition-colors"
                >
                  Book your shoot →
                </Link>
              </>
            )}
          </div>
        </div>
    </div>
  )
}
