// Fetches structured job details from the VSCO API to enrich portal records.
//
// The Cloudflare email parser only extracts a handful of fields (name, email,
// mobile, address, job_id), so venue / date / package usually arrive null from
// the Mac webhook. This helper pulls them straight from the VSCO job instead.
//
// NOTE: VSCO models a wedding with a SINGLE venue — one "Wedding Venue" custom
// field and one event location. There is no ceremony/reception distinction, so
// we surface one venue only; the reception split has to come from the couple or
// admin.

const VSCO_API = 'https://workspace.vsco.co/api/v2'

// Custom field IDs (see systems-reference)
const FIELD_WEDDING_VENUE = '01dy25qdz8pf7gsxrp69yxqa07'
const FIELD_COLLECTION = '01dy5kp0pg6f44va4wpp4dv90r'

export interface VscoJobDetails {
  wedding_date: string | null   // YYYY-MM-DD (job.eventDate)
  venue: string | null          // single VSCO venue — Wedding Venue field, then event location
  package_name: string | null   // Collection/Package custom field
  guest_count: number | null
}

interface VscoCustomField {
  fieldId: string
  value: string | null
}

export async function fetchVscoJobDetails(jobId: string): Promise<VscoJobDetails | null> {
  const key = process.env.VSCO_API_KEY
  if (!key) return null

  try {
    const res = await fetch(`${VSCO_API}/job/${jobId}`, {
      headers: { 'X-API-KEY': key },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const job = await res.json()

    const fields: VscoCustomField[] = Array.isArray(job.customFields) ? job.customFields : []
    const fieldValue = (id: string) => fields.find(f => f.fieldId === id)?.value?.trim() || null

    let venue = fieldValue(FIELD_WEDDING_VENUE)

    // Fall back to the primary session event's location name if the field is empty
    const eventHref: string | undefined = job.links?.primarySessionId?.href
    if (!venue && eventHref) {
      try {
        const evRes = await fetch(eventHref, {
          headers: { 'X-API-KEY': key },
          next: { revalidate: 3600 },
        })
        if (evRes.ok) {
          const ev = await evRes.json()
          venue = ev.location?.address?.name?.trim() || null
        }
      } catch {
        // event lookup is best-effort — ignore
      }
    }

    return {
      wedding_date: typeof job.eventDate === 'string' ? job.eventDate : null,
      venue,
      package_name: fieldValue(FIELD_COLLECTION),
      guest_count: typeof job.guestCount === 'number' ? job.guestCount : null,
    }
  } catch {
    return null
  }
}
