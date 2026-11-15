import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getMockLoginError, guestMockProfile } from './mockExamCredentials.js'

test('mock login compares the profile credentials without treating them as real authentication', () => {
  const profile = { studentIrn: 'IRN-001', passwordMock: 'practice-123' }
  assert.equal(getMockLoginError(profile, ' IRN-001 ', 'practice-123'), '')
  assert.match(getMockLoginError(profile, 'IRN-002', 'practice-123'), /không đúng/)
  assert.match(getMockLoginError(profile, 'IRN-001', 'Practice-123'), /không đúng/)
  assert.match(getMockLoginError(profile, 'IRN-001', 'practice-123 '), /không đúng/)
})

test('missing practice credentials are reported and never accepted as blank values', () => {
  assert.match(getMockLoginError({ studentIrn: null, passwordMock: null }, '', ''), /chưa có/)
  assert.match(getMockLoginError({ studentIrn: 'IRN', passwordMock: '' }, 'IRN', ''), /chưa có/)
  assert.equal(getMockLoginError(guestMockProfile, '9999010120091', 'guest'), '')
})
