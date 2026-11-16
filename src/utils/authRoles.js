export function getUserRoles(profile) {
  return [profile?.role, ...(Array.isArray(profile?.authorities) ? profile.authorities : [])]
    .map((role) => String(role || '').toUpperCase().replace(/^ROLE_/, ''))
    .filter(Boolean)
}

export function hasUserRole(profile, role) {
  const expectedRole = String(role || '').toUpperCase().replace(/^ROLE_/, '')
  return getUserRoles(profile).includes(expectedRole)
}
