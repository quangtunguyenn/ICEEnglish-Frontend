export function getServerRemainingMs(attempt, fallbackMs = 0) {
  const serverNow = Date.parse(attempt?.serverNow)
  const expiresAt = Date.parse(attempt?.expiresAt)
  if (!Number.isFinite(serverNow) || !Number.isFinite(expiresAt)) return Math.max(0, fallbackMs)
  return Math.max(0, expiresAt - serverNow)
}

export function formatVietnamTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date)
}
