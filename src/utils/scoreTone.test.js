import assert from 'node:assert/strict'
import test from 'node:test'
import { getScoreTone } from './scoreTone.js'

test('uses the ICE navy and gold palette consistently across score indicators', () => {
  const tones = [
    [4.99, 'Cần ôn thêm', 'needs-work', '#57816c'],
    [5, 'Đạt', 'pass', '#6ee7b7'],
    [8, 'Rất tốt', 'excellent', '#9b6b00'],
  ]

  for (const [score, label, key, hex] of tones) {
    const tone = getScoreTone(score)
    assert.equal(tone.label, label)
    assert.equal(tone.stroke, `stroke-ice-score-${key}`)
    assert.equal(tone.fill, `bg-ice-score-${key}`)
    assert.equal(tone.hex, hex)
  }
})
