import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getUserRoles, hasUserRole } from './authRoles.js'

test('role helpers normalize role prefixes and authorities', () => {
  const profile = {
    role: 'ROLE_TEACHER',
    authorities: ['ROLE_ADMIN', 'student'],
  }

  assert.deepEqual(getUserRoles(profile), ['TEACHER', 'ADMIN', 'STUDENT'])
  assert.equal(hasUserRole(profile, 'teacher'), true)
  assert.equal(hasUserRole(profile, 'ROLE_ADMIN'), true)
  assert.equal(hasUserRole(profile, 'SUPER_ADMIN'), false)
})

test('role helpers handle missing profile roles', () => {
  assert.deepEqual(getUserRoles(null), [])
  assert.equal(hasUserRole({}, 'TEACHER'), false)
})
