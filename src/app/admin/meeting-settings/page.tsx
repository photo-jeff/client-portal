import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Divider } from '@/components/ui/Divider'
import { MeetingSettingsForm } from './MeetingSettingsForm'

export default async function MeetingSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') redirect('/login')

  const admin = createAdminClient()
  const { data: rows } = await admin
    .from('portal_settings')
    .select('key, value')
    .in('key', ['final_meeting_calendly_url', 'phone_call_calendly_url'])

  const settings = Object.fromEntries((rows ?? []).map(r => [r.key, r.value]))

  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      <header className="bg-white border-b border-[#e0ddd8]">
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-4">
          <Link href="/admin" className="text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a]">
            ‹ Back
          </Link>
          <h1 className="font-serif text-xl">Meeting Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl mb-2">Calendly URLs</h2>
          <Divider />
          <p className="text-sm text-[#919295] mt-4">
            Paste your Calendly event URLs here. Enable them per couple from their client page.
          </p>
        </div>

        <div className="bg-white border border-[#e0ddd8] rounded-2xl p-8">
          <MeetingSettingsForm
            initialFinalMeetingUrl={settings.final_meeting_calendly_url ?? ''}
            initialPhoneCallUrl={settings.phone_call_calendly_url ?? ''}
          />
        </div>
      </main>
    </div>
  )
}
