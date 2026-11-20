export function getExamCandidate(guest = false) {
  let profile = null
  if (typeof localStorage !== 'undefined') {
    try {
      profile = JSON.parse(localStorage.getItem('currentUser') || 'null')
    } catch {
      profile = null
    }
  }

  const fullName = typeof profile?.fullName === 'string' ? profile.fullName.trim() : ''
  const username = typeof profile?.username === 'string' ? profile.username.trim() : ''
  const studentIrn = typeof profile?.studentIrn === 'string' ? profile.studentIrn.trim() : ''
  return {
    fullName: fullName || username || (guest ? 'Khách' : 'Thí sinh'),
    studentIrn: studentIrn || '—',
  }
}

export function getExamStartedAt(...values) {
  for (const value of values) {
    if (typeof value !== 'string' && typeof value !== 'number') continue
    const timestamp = typeof value === 'number' ? value : Date.parse(value)
    if (Number.isFinite(timestamp)) return new Date(timestamp).toISOString()
  }
  return ''
}
