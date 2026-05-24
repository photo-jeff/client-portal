'use client'
import { useState } from 'react'

interface Props {
  clientId: string
  initialValues: Record<string, string | null>
}

type FieldType = 'text' | 'email' | 'date' | 'time' | 'url'

function Field({
  label, field, initial, clientId, type = 'text',
}: {
  label: string
  field: string
  initial: string | null
  clientId: string
  type?: FieldType
}) {
  const [value, setValue] = useState(initial ?? '')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (value === (initial ?? '')) return
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch(`/api/admin/client/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Save failed (${res.status})`)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
      setValue(initial ?? '') // revert to last known good value
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <dt className="text-xs tracking-[0.1em] uppercase text-[#888] mb-1">{label}</dt>
      <dd className="flex items-center gap-2">
        <input
          type={type}
          value={value}
          onChange={e => { setValue(e.target.value); setSaved(false); setError(null) }}
          onBlur={save}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder="—"
          className="text-sm border-b border-transparent hover:border-[#e0ddd8] focus:border-[#C9A96E] focus:outline-none bg-transparent w-full py-0.5"
        />
        {saving && <span className="text-xs text-[#aaa] shrink-0">Saving…</span>}
        {saved && <span className="text-xs text-green-600 shrink-0">Saved ✓</span>}
        {error && <span className="text-xs text-red-500 shrink-0" title={error}>Failed — {error}</span>}
      </dd>
    </div>
  )
}

export function ClientIdFields({ clientId, initialValues }: Props) {
  const v = (k: string) => initialValues[k] ?? null
  return (
    <>
      <Field label="Partner 1 name"        field="partner1_name"          initial={v('partner1_name')}          clientId={clientId} />
      <Field label="Partner 2 name"        field="partner2_name"          initial={v('partner2_name')}          clientId={clientId} />
      <Field label="Email"                 field="email"                  initial={v('email')}                  clientId={clientId} type="email" />
      <Field label="Wedding date"          field="wedding_date"           initial={v('wedding_date')}           clientId={clientId} type="date" />
      <Field label="Ceremony time"         field="ceremony_time"          initial={v('ceremony_time')}          clientId={clientId} type="time" />
      <Field label="Ceremony venue"        field="ceremony_venue"         initial={v('ceremony_venue')}         clientId={clientId} />
      <Field label="Reception venue"       field="reception_venue"        initial={v('reception_venue')}        clientId={clientId} />
      <Field label="Package"               field="package_name"           initial={v('package_name')}           clientId={clientId} />
      <Field label="VSCO Job ID"           field="vsco_job_id"            initial={v('vsco_job_id')}            clientId={clientId} />
      <Field label="Zoho Contact ID"       field="zoho_contact_id"        initial={v('zoho_contact_id')}        clientId={clientId} />
      <Field label="VSCO Questionnaire URL" field="vsco_questionnaire_url" initial={v('vsco_questionnaire_url')} clientId={clientId} type="url" />
    </>
  )
}
