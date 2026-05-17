'use client'
import { useState } from 'react'

interface Props {
  clientId: string
  vscoJobId: string | null
  zohoContactId: string | null
}

function Field({ label, field, initial, clientId }: { label: string; field: string; initial: string | null; clientId: string }) {
  const [value, setValue] = useState(initial ?? '')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await fetch(`/api/admin/client/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value.trim() || null }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <dt className="text-xs tracking-[0.1em] uppercase text-[#888] mb-1">{label}</dt>
      <dd className="flex items-center gap-2">
        <input
          value={value}
          onChange={e => { setValue(e.target.value); setSaved(false) }}
          onBlur={save}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder="—"
          className="text-sm border-b border-transparent hover:border-[#e0ddd8] focus:border-[#C9A96E] focus:outline-none bg-transparent w-full py-0.5"
        />
        {saving && <span className="text-xs text-[#aaa] shrink-0">Saving…</span>}
        {saved && <span className="text-xs text-green-600 shrink-0">Saved ✓</span>}
      </dd>
    </div>
  )
}

export function ClientIdFields({ clientId, vscoJobId, zohoContactId }: Props) {
  return (
    <>
      <Field label="VSCO Job ID" field="vsco_job_id" initial={vscoJobId} clientId={clientId} />
      <Field label="Zoho Contact ID" field="zoho_contact_id" initial={zohoContactId} clientId={clientId} />
    </>
  )
}
