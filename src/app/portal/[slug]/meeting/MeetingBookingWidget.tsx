'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const POLL_INTERVAL    = 3000        // fast poll after booking: every 3s
const POLL_MAX         = 20          // fast poll: stop after 60s (20 × 3s)
const BG_POLL_INTERVAL = 8000        // background poll on mount: every 8s
const MAX_WAIT_MS      = 10 * 60 * 1000  // give up optimistic state after 10 min

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (opts: {
        url: string
        parentElement: HTMLElement
        prefill?: { name?: string; email?: string }
      }) => void
    }
  }
}

interface Props {
  calendlyUrl: string
  partnerName: string
  clientEmail: string | null
  slug: string
  meetingType: 'final_meeting' | 'phone_call'
  label: string    // 'Final Details Meeting' | 'Phone Call'
  meetingAt: string | null
  rescheduleUrl: string | null
}

function hasRecentBooking(key: string): boolean {
  const val = sessionStorage.getItem(key)
  if (!val) return false
  const ts = parseInt(val, 10)
  if (isNaN(ts)) { sessionStorage.removeItem(key); return false }
  if (Date.now() - ts > MAX_WAIT_MS) { sessionStorage.removeItem(key); return false }
  return true
}

export function MeetingBookingWidget({
  calendlyUrl, partnerName, clientEmail, slug, meetingType, label, meetingAt, rescheduleUrl,
}: Props) {
  const storageKey = `meeting-booked-${meetingType}-${slug}`

  const [optimisticBooked, setOptimisticBooked] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const pollCountRef = useRef(0)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bgPollRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router       = useRouter()

  // utm_content carries the slug (client match); utm_campaign carries the meeting
  // type so the Calendly worker knows which columns to write.
  const embedUrl = `${calendlyUrl}?hide_gdpr_banner=1&background_color=faf9f7&text_color=1a1a1a&primary_color=1a1a1a&utm_content=${encodeURIComponent(slug)}&utm_campaign=${encodeURIComponent(meetingType)}`

  // On mount, restore recent optimistic state
  useEffect(() => {
    if (hasRecentBooking(storageKey)) setOptimisticBooked(true)
  }, [storageKey])

  // Once the server has real data, clear everything
  useEffect(() => {
    if (meetingAt) {
      sessionStorage.removeItem(storageKey)
      stopPolling()
      stopBgPoll()
    }
  }, [meetingAt, storageKey])

  function stopPolling() {
    if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); pollTimerRef.current = null }
  }
  function stopBgPoll() {
    if (bgPollRef.current) { clearTimeout(bgPollRef.current); bgPollRef.current = null }
  }

  function startPolling() {
    pollCountRef.current = 0
    stopPolling()

    async function poll() {
      if (!hasRecentBooking(storageKey)) { setOptimisticBooked(false); return }
      try {
        const res = await fetch(`/api/portal/meeting-check/${slug}`)
        const { meetingAt: live } = await res.json()
        if (live) { router.refresh(); return }
      } catch { /* ignore */ }

      pollCountRef.current++
      if (pollCountRef.current < POLL_MAX) {
        pollTimerRef.current = setTimeout(poll, POLL_INTERVAL)
      }
    }

    pollTimerRef.current = setTimeout(poll, 4000)
  }

  function startBgPoll() {
    async function bgPoll() {
      if (meetingAt) return
      if (!hasRecentBooking(storageKey)) { setOptimisticBooked(false); return }
      try {
        const res = await fetch(`/api/portal/meeting-check/${slug}`)
        const { meetingAt: live } = await res.json()
        if (live) { router.refresh(); return }
      } catch { /* ignore */ }
      bgPollRef.current = setTimeout(bgPoll, BG_POLL_INTERVAL)
    }
    bgPollRef.current = setTimeout(bgPoll, BG_POLL_INTERVAL)
  }

  function initWidget() {
    if (!containerRef.current || !window.Calendly) return
    window.Calendly.initInlineWidget({
      url: embedUrl,
      parentElement: containerRef.current,
      prefill: {
        name:  partnerName || undefined,
        email: clientEmail || undefined,
      },
    })
  }

  useEffect(() => {
    if (window.Calendly) initWidget()
    if (!meetingAt) startBgPoll()
    return () => { stopPolling(); stopBgPoll() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.event === 'calendly.event_scheduled') {
        sessionStorage.setItem(storageKey, String(Date.now()))
        setOptimisticBooked(true)
        stopBgPoll()
        startPolling()
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [router, slug, storageKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const isBooked = !!meetingAt || optimisticBooked

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

  if (isBooked) {
    return (
      <div className="bg-white border border-[#e0ddd8] rounded-2xl p-10 text-center space-y-4">
        <CheckCircle size={32} className="mx-auto text-[#535353]" />
        <h2 className="font-serif text-2xl">
          {meetingAt ? "You're booked in" : 'Booking confirmed!'}
        </h2>
        {meetingAt ? (
          <p className="text-[#535353] font-light text-lg">
            {formattedDate} at {formattedTime}
          </p>
        ) : (
          <p className="text-sm text-[#919295]">
            Just a moment — confirming your booking…
          </p>
        )}
        <div className="flex justify-center gap-3 pt-2">
          <Link href={`/portal/${slug}`}>
            <Button variant="outline" size="sm">Back to portal</Button>
          </Link>
          {rescheduleUrl && (
            <a href={rescheduleUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">Reschedule</Button>
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
        onLoad={initWidget}
      />
      <div className="bg-[#faf9f7] border border-[#e0ddd8] rounded-2xl overflow-hidden">
        <p className="text-xs tracking-[0.1em] uppercase text-[#919295] px-6 pt-5 pb-0">{label}</p>
        <div ref={containerRef} style={{ minWidth: 320, height: 700 }} />
      </div>
    </>
  )
}
