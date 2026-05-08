export function parseTime(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export function subtractMinutes(timeStr: string, minutes: number): string {
  const d = parseTime(timeStr)
  d.setMinutes(d.getMinutes() - minutes)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function calculatePhotographerTimings(departureTime: string) {
  if (!departureTime) return null
  return {
    photographerArrival: subtractMinutes(departureTime, 120),
    brideReadyBy: subtractMinutes(departureTime, 60),
  }
}

export function formatDisplayTime(timeStr: string): string {
  if (!timeStr) return ''
  return formatTime(parseTime(timeStr))
}
