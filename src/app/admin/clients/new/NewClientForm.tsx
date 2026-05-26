'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function slugify(p1: string, p2: string) {
  return [p1, p2]
    .map(n => n.toLowerCase().trim().replace(/[^a-z0-9]/g, ''))
    .join('-') + '-' + Date.now().toString(36)
}

export function NewClientForm() {
  const [saving, setSaving] = useState(false)
  const [portalUrl, setPortalUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    partner1_name: '',
    partner2_name: '',
    partner1_role: 'Bride',
    partner2_role: 'Groom',
    email: '',
    wedding_date: '',
    ceremony_venue: '',
    ceremony_time: '',
    reception_venue: '',
    package_name: '',
    vsco_job_id: '',
    zoho_contact_id: '',
    vsco_questionnaire_url: '',
  })

  function update(key: string, value: string) {
    setForm(p => ({ ...p, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const slug = slugify(form.partner1_name, form.partner2_name)

    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, slug }),
    })

    setSaving(false)
    if (res.ok) {
      const { portalUrl } = await res.json()
      setPortalUrl(portalUrl)
    } else {
      const { error: msg } = await res.json().catch(() => ({ error: 'Something went wrong' }))
      setError(msg || 'Something went wrong')
    }
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (portalUrl) {
    return (
      <div className="bg-white border border-[#e0ddd8] p-10 space-y-6">
        <div className="text-center space-y-2">
          <p className="font-serif text-2xl">Portal created</p>
          <p className="text-sm text-[#888]">
            {form.partner1_name} & {form.partner2_name} — send them this link:
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            readOnly
            value={portalUrl}
            className="flex-1 border border-[#e0ddd8] px-4 py-3 text-sm bg-[#faf9f7] text-[#1a1a1a] font-mono"
          />
          <Button variant="outline" onClick={copyUrl}>
            {copied ? 'Copied ✓' : 'Copy'}
          </Button>
        </div>
        <p className="text-xs text-center text-[#aaa]">
          This is their permanent portal link — no login required.
        </p>
        <div className="text-center">
          <a href="/admin" className="text-xs tracking-[0.1em] uppercase underline hover:no-underline">
            Back to admin
          </a>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#e0ddd8] p-8 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Partner 1 name" value={form.partner1_name} onChange={e => update('partner1_name', e.target.value)} required />
        <Input label="Partner 2 name" value={form.partner2_name} onChange={e => update('partner2_name', e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs tracking-[0.1em] uppercase text-[#888]">Partner 1 role</label>
          <select value={form.partner1_role} onChange={e => update('partner1_role', e.target.value)}
            className="px-3 py-2.5 text-sm border border-[#e0ddd8] rounded-lg bg-white focus:outline-none focus:border-[#c8c4be]">
            <option>Bride</option><option>Groom</option><option>Partner</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs tracking-[0.1em] uppercase text-[#888]">Partner 2 role</label>
          <select value={form.partner2_role} onChange={e => update('partner2_role', e.target.value)}
            className="px-3 py-2.5 text-sm border border-[#e0ddd8] rounded-lg bg-white focus:outline-none focus:border-[#c8c4be]">
            <option>Bride</option><option>Groom</option><option>Partner</option>
          </select>
        </div>
      </div>
      <Input label="Client email" type="email" value={form.email} onChange={e => update('email', e.target.value)} required />
      <Input label="Wedding date" type="date" value={form.wedding_date} onChange={e => update('wedding_date', e.target.value)} />
      <Input label="Ceremony venue" value={form.ceremony_venue} onChange={e => update('ceremony_venue', e.target.value)} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Ceremony time" type="time" value={form.ceremony_time} onChange={e => update('ceremony_time', e.target.value)} />
        <Input label="Package" value={form.package_name} onChange={e => update('package_name', e.target.value)} placeholder="e.g. Gold Collection" />
      </div>
      <Input label="Reception venue" value={form.reception_venue} onChange={e => update('reception_venue', e.target.value)} hint="Leave blank if same as ceremony" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="VSCO Job ID" value={form.vsco_job_id} onChange={e => update('vsco_job_id', e.target.value)} hint="Optional" />
        <Input label="Zoho Contact ID" value={form.zoho_contact_id} onChange={e => update('zoho_contact_id', e.target.value)} hint="Optional" />
      </div>
      <Input label="VSCO Questionnaire URL" value={form.vsco_questionnaire_url} onChange={e => update('vsco_questionnaire_url', e.target.value)} hint="Paste after creating in VSCO" />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button variant="filled" className="w-full" type="submit" disabled={saving}>
        {saving ? 'Creating…' : 'Create portal'}
      </Button>
    </form>
  )
}
