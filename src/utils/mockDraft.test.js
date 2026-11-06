import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readMockDraft, removeMockDraft, writeMockDraft } from './mockDraft.js'

function createStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

function createDraft() {
  return {
    version: 1,
    accountId: 'student/1',
    examId: 'exam:1',
    submissionId: 'submission-1',
    deadline: 1800000000000,
    answers: { q1: 'A', q2: 'D' },
    partTimes: { part1: 42 },
  }
}

test('mock draft retains the submission, deadline, answers and part times', () => {
  const storage = createStorage()
  const draft = createDraft()
  writeMockDraft(storage, draft)
  assert.deepEqual(readMockDraft(storage, draft.accountId, draft.examId), draft)
  assert.equal(readMockDraft(storage, 'another-student', draft.examId), null)
  assert.equal(readMockDraft(storage, draft.accountId, 'another-exam'), null)
  removeMockDraft(storage, draft.accountId, draft.examId)
  assert.equal(readMockDraft(storage, draft.accountId, draft.examId), null)
})

test('saving replaces the snapshot, including removed answers', () => {
  const storage = createStorage()
  const draft = createDraft()
  writeMockDraft(storage, draft)
  writeMockDraft(storage, { ...draft, answers: { q2: 'B' } })
  assert.deepEqual(readMockDraft(storage, draft.accountId, draft.examId).answers, { q2: 'B' })
})

test('corrupt or mismatched snapshots are rejected without deleting them', () => {
  const storage = createStorage()
  const draft = createDraft()
  for (const invalid of [
    { ...draft, deadline: null },
    { ...draft, submissionId: '' },
    { ...draft, accountId: 'other' },
    { ...draft, answers: { q1: 'E' } },
    { ...draft, partTimes: { part1: -1 } },
  ]) {
    storage.setItem('iceenglish:mock-draft:student%2F1:exam%3A1', JSON.stringify(invalid))
    assert.throws(() => readMockDraft(storage, draft.accountId, draft.examId), /không hợp lệ/)
    assert.notEqual(storage.getItem('iceenglish:mock-draft:student%2F1:exam%3A1'), null)
  }
  storage.setItem('iceenglish:mock-draft:student%2F1:exam%3A1', '{')
  assert.throws(() => readMockDraft(storage, draft.accountId, draft.examId), /không hợp lệ/)
})

test('storage access failures are propagated', () => {
  const storage = {
    getItem: () => { throw new Error('read denied') },
    setItem: () => { throw new Error('quota exceeded') },
    removeItem: () => { throw new Error('delete denied') },
  }
  const draft = createDraft()
  assert.throws(() => readMockDraft(storage, draft.accountId, draft.examId), /read denied/)
  assert.throws(() => writeMockDraft(storage, draft), /quota exceeded/)
  assert.throws(() => removeMockDraft(storage, draft.accountId, draft.examId), /delete denied/)
})
