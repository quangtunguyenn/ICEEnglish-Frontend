export function formatScore(value) {
  return value == null ? '—' : Number(value).toFixed(2).replace(/\.?0+$/, '')
}

export function formatPercent(value) {
  return value == null ? '—' : `${Number(value).toFixed(1).replace(/\.0$/, '')}%`
}

export function formatDuration(seconds) {
  if (seconds == null) return '—'
  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)
  return `${minutes}:${String(rest).padStart(2, '0')}`
}
