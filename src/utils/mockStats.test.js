import assert from 'node:assert/strict'
import test from 'node:test'
import { formatDuration, formatPercent, formatScore } from './mockStats.js'

test('formats null as a dash', () => {
  assert.equal(formatScore(null), '—')
  assert.equal(formatPercent(null), '—')
  assert.equal(formatDuration(null), '—')
})

test('formats scores, percents and durations', () => {
  assert.equal(formatScore(9.75), '9.75')
  assert.equal(formatScore(10), '10')
  assert.equal(formatScore(0), '0')
  assert.equal(formatPercent(79.66), '79.7%')
  assert.equal(formatPercent(60), '60%')
  assert.equal(formatDuration(2410), '40:10')
})
