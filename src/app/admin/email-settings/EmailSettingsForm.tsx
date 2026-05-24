'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  initialSubject: string
  initialBody: string
}

export function EmailSettingsForm({ initialSubject, initialBody }: Props) {
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await Promise.all([
        fetch('/api/admin/email-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'invite_email_subject', value: subject }),
        }),
        fetch('/api/admin/email-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'invite_email_body', value: body }),
        }),
      ])
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save — please try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs tracking-[0.1em] uppercase text-[#888] mb-2">
          Subject line
        </label>
        <p className="text-xs text-[#bbb] mb-2">Use <code className="bg-[#f0ede8] px-1 rounded">{'{partner_names}'}</code> for the couple&apos;s names.</p>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full px-4 py-3 text-sm border border-[#e0ddd8] rounded-lg bg-white focus:outline-none focus:border-[#c8c4be]"
        />
      </div>

      <div>
        <label className="block text-xs tracking-[0.1em] uppercase text-[#888] mb-2">
          Email body
        </label>
        <p className="text-xs text-[#bbb] mb-2">
          Use <code className="bg-[#f0ede8] px-1 rounded">{'{first_name}'}</code> for their first name
          and <code className="bg-[#f0ede8] px-1 rounded">{'{partner_names}'}</code> for both names.
          The portal link button is added automatically below this text.
        </p>
        <textarea
          rows={5}
          value={body}
          onChange={e => setBody(e.target.value)}
          className="w-full px-4 py-3 text-sm border border-[#e0ddd8] rounded-lg bg-white focus:outline-none focus:border-[#c8c4be] resize-y leading-relaxed"
        />
      </div>

      <div className="flex items-center gap-4">
        <Button variant="filled" size="sm" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        {saved && <span className="text-sm text-green-600">Saved ✓</span>}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>

      <div className="bg-[#faf9f7] border border-[#e0ddd8] rounded-xl p-5">
        <p className="text-xs tracking-[0.1em] uppercase text-[#888] mb-3">Preview</p>
        <p className="text-xs text-[#888] mb-1">Subject: <span className="text-[#1a1a1a]">{subject.replace('{partner_names}', 'Sarah & James')}</span></p>
        <hr className="border-[#e8e4df] my-3" />
        <p className="text-sm text-[#555] leading-relaxed whitespace-pre-wrap">
          {body
            .replace('{first_name}', 'Sarah')
            .replace('{partner_names}', 'Sarah & James')}
        </p>
        <div className="mt-4 inline-block bg-[#1a1a1a] text-white text-xs tracking-[2px] uppercase px-6 py-3">
          Open your portal →
        </div>
      </div>
    </div>
  )
}
