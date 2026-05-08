'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function slugify(p1: string, p2: string) {
  return [p1, p2]
    .map(n => n.toLowerCase().trim().replace(/[^a-z0-9]/g, ''))
    .join('-') + '-' + Date.now().toString(36)
}

export function NewClientForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    partner1_name: '',
    partner2_name: '',
    email: '',
    wedding_date: '',
    ceremony_venue: '',
    ceremony_time: '',
    reception_venue: '',
    package_name: '',
    vsco_job_id: '',
    zoho_contact_id: '',
  })

  function update(key: string, value: string) {
    setForm(p => ({ ...p, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const supabase = createClient()
    const slug = slugify(form.partner1_name, form.partner2_name)

    const { error: insertError } = await supabase.from('clients').insert({
      ...form,
      portal_slug: slug,
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    // Send magic link invite
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, slug }),
    })

    setSaving(false)
    if (res.ok) {
      setInviteSent(true)
      setTimeout(() => router.push('/admin'), 2000)
    } else {
      router.push('/admin')
    }
  }

  if (inviteSent) {
    return (
      <div className="bg-white border border-[#e0ddd8] p-10 text-center space-y-3">
        <p className="font-serif text-2xl">Portal created</p>
        <p className="text-sm text-[#888]">Invite sent to {form.email}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[#e0ddd8] p-8 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Partner 1 name" value={form.partner1_name} onChange={e => update('partner1_name', e.target.value)} required />
        <Input label="Partner 2 name" value={form.partner2_name} onChange={e => update('partner2_name', e.target.value)} required />
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
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button variant="filled" className="w-full" type="submit" disabled={saving}>
        {saving ? 'Creating…' : 'Create portal & send invite'}
      </Button>
    </form>
  )
}
