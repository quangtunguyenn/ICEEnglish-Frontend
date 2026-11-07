import assert from 'node:assert/strict'
import { test } from 'node:test'
import { applyDisplayNumbers, renumberText } from './examNumbering.js'

const map = new Map([[13, 1], [14, 2], [15, 3]])

test('renumberText rewrites question prefix, blanks, ranges and placeholders for mapped numbers only', () => {
  assert.equal(renumberText('**Question 13. Choose blank (14).**', map), '**Question 1. Choose blank (2).**')
  assert.equal(renumberText('Part 3 (Questions 13-15)', map), 'Part 3 (Questions 1-3)')
  assert.equal(renumberText('Ô {{q:15}} và (2007) và (99)', map), 'Ô 3 và (2007) và (99)')
})

test('applyDisplayNumbers uses backend displayNumber and keeps ids, order and untouched text', () => {
  const parts = applyDisplayNumbers([
    {
      id: 'p3',
      partName: 'Part 3 (Questions 3-4)',
      passageText: 'Blank (3) and (4)',
      questions: [
        { id: 'q3', orderIndex: 3, displayNumber: 1, content: '**Question 3.**' },
        { id: 'q4', orderIndex: 4, displayNumber: 2, content: '**Question 4.**' },
      ],
    },
    {
      id: 'p1',
      partName: 'Part 1',
      passageText: 'Blank (1)',
      questions: [{ id: 'q1', orderIndex: 1, displayNumber: 3, content: '**Question 1.**' }],
    },
  ])

  assert.deepEqual(parts.map((part) => part.id), ['p3', 'p1'])
  assert.equal(parts[0].partName, 'Part 3 (Questions 1-2)')
  assert.equal(parts[0].passageText, 'Blank (1) and (2)')
  assert.equal(parts[0].questions[1].content, '**Question 2.**')
  assert.equal(parts[1].passageText, 'Blank (3)')
  assert.equal(parts[1].questions[0].content, '**Question 3.**')
})

test('applyDisplayNumbers counts 1..N in returned order when displayNumber is missing', () => {
  const [part] = applyDisplayNumbers([
    { id: 'p', questions: [{ id: 'a', orderIndex: 5, content: 'x' }, { id: 'b', orderIndex: 6, content: 'y' }] },
  ])
  assert.deepEqual(part.questions.map((question) => question.displayNumber), [1, 2])
})
