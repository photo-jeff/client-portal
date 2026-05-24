import Link from 'next/link'
import { CalendarHeart } from 'lucide-react'

interface Props {
  shootAt: string | null
  rescheduleUrl: string | null
  slug: string
}

export function PrewedShootCard({ shootAt, rescheduleUrl, slug }: Props) {
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

  return (
    <div className="mb-6 bg-[#1a1a1a] text-white rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <CalendarHeart size={20} className="shrink-0 mt-0.5 text-[#b5b8ba]" />
          <div className="flex-1">
            <p className="text-xs tracking-[0.12em] uppercase text-[#b5b8ba] mb-1">Pre-Wedding Shoot</p>

            {shootAt ? (
              /* Booked */
              <>
                <p className="font-serif text-xl mb-1">Your shoot is confirmed</p>
                <p className="text-sm text-[#e8e4df] mb-5 font-light">
                  {formattedDate} at {formattedTime}
                </p>
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
              /* Not booked */
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
