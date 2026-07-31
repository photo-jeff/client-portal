// Couple type drives which VSCO questionnaire template a client's answers are
// written back to, which questions the portal asks, and which FAQ blocks it
// shows. It is derived from partner1_role / partner2_role on the client record.
//
// Anything that isn't clearly two brides or two grooms falls back to 'bg' —
// the historic default, and the shape of ~95% of bookings. Jeff sets the roles
// in /admin before sending the portal link, and the VSCO booking email now
// carries bride_2 / groom_2 so most records arrive correct.

export type CoupleType = 'bg' | 'bb' | 'gg'

interface RoleFields {
  partner1_role?: string | null
  partner2_role?: string | null
}

export function getCoupleType(client: RoleFields | Record<string, unknown>): CoupleType {
  const r = client as RoleFields
  const r1 = (r.partner1_role ?? '').trim().toLowerCase()
  const r2 = (r.partner2_role ?? '').trim().toLowerCase()
  if (r1 === 'bride' && r2 === 'bride') return 'bb'
  if (r1 === 'groom' && r2 === 'groom') return 'gg'
  return 'bg'
}

// ── Per-type questionnaire behaviour ────────────────────────────────────────
// These mirror the actual VSCO templates — see docs/vsco-field-maps.md. Asking
// a question with nowhere to write it back to just loses the answer, so the
// portal's question set has to track the forms exactly.

/** GG's VSCO form has no make-up or hair fields — Jeff's deliberate choice. */
export function asksHairAndMakeup(type: CoupleType): boolean {
  return type !== 'gg'
}

/** Only BB and GG ask about surname changes. BG assumes the groom's surname. */
export function asksSurname(type: CoupleType): boolean {
  return type !== 'bg'
}

/**
 * BG has separate dress and suit fields. BB and GG each have a single combined
 * field ("Dresses/Suits" and "Suits"), so the portal asks one question too.
 */
export function hasSeparateGarmentFields(type: CoupleType): boolean {
  return type === 'bg'
}
