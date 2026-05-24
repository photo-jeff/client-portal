import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Divider } from '@/components/ui/Divider'
import { EmailSettingsForm } from './EmailSettingsForm'

const DEFAULTS = {
  invite_email_subject: '{partner_names} — your wedding portal is ready',
  invite_email_body: 'Everything you need in the run-up to your wedding day is in one place — your timeline, questionnaire, shot list, invoice, and more. It\'ll update as your day gets closer, so it\'s worth bookmarking.',
}

export default async function EmailSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') redirect('/login')

  const admin = createAdminClient()
  const { data: rows } = await admin.from('portal_settings').select('key, value')

  const settings = Object.fromEntries((rows ?? []).map(r => [r.key, r.value]))

  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      <header className="bg-white border-b border-[#e0ddd8]">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-4">
          <Link href="/admin" className="text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a]">
            ‹ Admin
          </Link>
          <h1 className="font-serif text-xl">Email Settings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl mb-2">Portal Invite Email</h2>
          <Divider />
          <p className="text-sm text-[#919295] mt-4">
            Sent to clients when you click &ldquo;Send portal invite&rdquo; from their admin page.
          </p>
        </div>

        <div className="bg-white border border-[#e0ddd8] p-8 rounded-2xl">
          <EmailSettingsForm
            initialSubject={settings.invite_email_subject ?? DEFAULTS.invite_email_subject}
            initialBody={settings.invite_email_body ?? DEFAULTS.invite_email_body}
          />
        </div>
      </main>
    </div>
  )
}
