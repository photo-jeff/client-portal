# VSCO questionnaire field maps

Jeff runs three separate VSCO questionnaire templates (VSCO can't branch a single
form). Each has its own field IDs. The portal must pick the right map from the
client's couple type before submitting.

Forms read 2026-07-31, after Jeff added make-up/hair/social to BB and GG and
replaced the single BG departure field with one per partner.

Dropdown, checkbox and time **values** are identical across all three forms, so
`mapFirstLook()`, `mapSpeeches()`, `toVscoTime()` and the hot-meal checkbox logic
need no changes — only the IDs differ.

## Required fields (identical across all three)

first look · ceremony location · ceremony start time · reception location ·
wedding breakfast start time · speeches timing · slideshow names

An over-long or missing value in any of these fails the whole submission silently.
Both departure-time fields are optional on all three forms.

## Field map

| Portal field | BG | BB | GG |
|---|---|---|---|
| partner 1 prep address | QF6135318 | QF10022138 | QF8401363 |
| partner 2 prep address | QF6135321 | QF10022140 | QF8401361 |
| `first_look` | QF6135324 | QF10022142 | QF8401365 |
| `ceremony_location` | QF6135327 | QF10022144 | QF8401367 |
| `departure_time` (partner 1) | QF10023144 ¹ | QF10022146 | QF8401561 |
| departure time (partner 2) | QF10023142 ¹ | QF10022148 | QF8401437 |
| `ceremony_time` | QF6135330 | QF10022150 | QF8401371 |
| `reception_location` | QF6135333 | QF10022152 | QF8401373 |
| wedding breakfast call-in time | *n/a* | QF10022154 | QF8401439 |
| `wedding_breakfast_time` | QF6135336 | QF10022156 | QF8401375 |
| `hot_meal_arranged` | QF7828059[] | QF10022158[] | QF8401377[] |
| `speeches_timing` | QF6135525 | QF10022160 | QF8401379 |
| `emergency_contact` | QF7826772 | QF10022162 | QF8401381 |
| surname change | *n/a* | QF10022166 | QF8401435 |
| `names_for_slideshow` | QF6135369 | QF10022168 | QF8401385 |
| `aisle_escort` | QF7776981 | QF10023108 | QF8401387 |
| `first_dance_song` | QF6135372 | QF10022172 | QF8401389 |
| `choreographed_dance` | QF6135528 | QF10022174 | QF8401391 |
| `unique_elements` | QF6135378 | QF10022176 | QF8401393 |
| `honeymoon_plans` | QF6135390 | QF10022178 | QF8401395 |
| `social_media` | QF8902296 | QF10023130 | QF10023132 |
| `hashtag` | QF6135375 | QF10022180 | QF8401397 |
| `venue_contact` | QF6135396 | QF10022184 | QF8401401 |
| `wedding_planner` | QF6135399 | QF10022186 | QF8401403 |
| `wedding_dress` | QF6135444 | QF10022188 ² | QF8401407 ² |
| `groom_suit` | QF6135519 | QF10022188 ² | QF8401407 ² |
| `makeup_artist` | QF6135405 | QF10023126 | **none** ³ |
| `hair_stylist` | QF6135438 | QF10023128 | **none** ³ |
| `florist` | QF6135408 | QF10022190 | QF8401413 |
| `venue_styling` | QF6135447 | QF10022192 | QF8401415 |
| `cake` | QF6135420 | QF10022194 | QF8401417 |
| `videographer` | QF6135411 | QF10022196 | QF8401419 |
| `stationery` | QF6135432 | QF10022198 | QF8401421 |
| catering (not collected) | QF6135417 | QF10022200 | QF8401423 |
| `transport` | QF6135414 | QF10022202 | QF8401425 |
| `dj_band` | QF6135423 | QF10022204 | QF8401427 |
| `photo_booth` | QF6135426 | QF10022206 | QF8401429 |
| `jeweller` | QF6135429 | QF10022208 | QF8401431 |
| `additional_vendors` | QF6135435 | QF10022210 | QF8401433 |

¹ **`QF6135522` is retired.** The old single BG departure field was replaced with
one per partner. It survives only in the form's internal FormState blob, not as a
rendered input, so the value the portal currently posts to it is silently
discarded. `src/lib/vsco-questionnaire.ts` still points at it — must be updated.

² BB and GG collapse both garment fields into one — "Dresses/Suits" (BB) and
"Suits" (GG). Two portal fields must merge into one value.

³ Deliberate — Jeff's decision. The GG form has no make-up or hair fields, so the
portal questionnaire must skip both questions entirely for GG couples rather than
ask and discard.

## Gotchas

- **Partner order is not ID order.** On the GG form partner 1 is QF8401363 and
  partner 2 is QF8401361. On the BG departure fields partner 1 is QF10023144 and
  partner 2 is QF10023142. Both are numerically reversed. Always use this table.
- Fields added in July 2026 sit in the QF10023xxx range on **all** templates —
  VSCO allocates IDs globally, not per form. That's why GG's social field is
  QF10023132 and BG's departure fields are QF10023xxx.
- BB's aisle field is QF10023108, outside its neighbours' QF10022xxx range.
- All three forms now have two departure times, so that is no longer a
  same-sex-only special case — the portal should ask both partners for everyone.
