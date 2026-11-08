import assert from 'node:assert/strict'
import test from 'node:test'
import { formatVietnamTime, getServerRemainingMs } from './serverTime.js'

test('remaining time comes from server timestamps only', () => {
  const attempt = { serverNow: '2026-11-07T17:00:02+07:00', expiresAt: '2026-11-07T17:50:00+07:00' }
  assert.equal(getServerRemainingMs(attempt), 2998000)
})

test('remaining time is never negative and falls back when timestamps are missing', () => {
  assert.equal(getServerRemainingMs({ serverNow: '2026-11-07T18:00:00+07:00', expiresAt: '2026-11-07T17:50:00+07:00' }), 0)
  assert.equal(getServerRemainingMs({}, 60000), 60000)
})

test('formats timestamps in Vietnam time', () => {
  assert.match(formatVietnamTime('2026-11-07T10:00:00Z'), /17:00/)
  assert.equal(formatVietnamTime(null), '—')
})
