import assert from 'node:assert/strict'
import { createServer as createHttpServer } from 'node:http'
import { after, before, test } from 'node:test'
import { createServer as createViteServer } from 'vite'
import { formatPracticeSubmissionDate } from '../utils/practiceHistory.js'

let server
let vite
let api
let requests
let response
const originalApiUrl = process.env.VITE_API_BASE_URL
const originalStorage = globalThis.localStorage

before(async () => {
  requests = []
  server = createHttpServer((request, reply) => {
    requests.push(request.url)
    reply.writeHead(response.status || 200, { 'Content-Type': 'application/json' })
    reply.end(JSON.stringify(response.body))
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  process.env.VITE_API_BASE_URL = `http://127.0.0.1:${server.address().port}`
  globalThis.localStorage = { getItem: () => null }
  vite = await createViteServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  api = await vite.ssrLoadModule('/src/services/api.js')
})

after(async () => {
  await vite?.close()
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  if (originalApiUrl === undefined) delete process.env.VITE_API_BASE_URL
  else process.env.VITE_API_BASE_URL = originalApiUrl
  if (originalStorage === undefined) delete globalThis.localStorage
  else globalThis.localStorage = originalStorage
})

test('history requests the requested exam and page and preserves all submissions', async () => {
  requests.length = 0
  const history = {
    examId: 'exam-1',
    examTitle: 'Đề 1',
    items: [
      { submissionId: 'sub-2', submittedAt: '2026-11-06T14:30:00Z' },
      { submissionId: 'sub-1', submittedAt: '2026-11-05T09:15:00Z' },
    ],
    page: 1,
    totalPages: 2,
    totalElements: 22,
  }
  response = { body: { data: history } }
  assert.deepEqual(await api.getPracticeHistory('exam-1', 1, 20), history)
  assert.equal(requests[0], '/api/v1/submissions/practice/exam-1/history?page=1&size=20')
})

test('empty history is distinct from invalid responses and server errors', async () => {
  response = { body: { data: { examId: 'exam-1', items: [], page: 0, totalPages: 0, totalElements: 0 } } }
  assert.equal((await api.getPracticeHistory('exam-1')).totalElements, 0)
  response = { body: { data: { examId: 'exam-1', items: [], page: 1, totalPages: 2, totalElements: 22 } } }
  await assert.rejects(api.getPracticeHistory('exam-1'), /không hợp lệ/)
  response = { body: { data: { examId: 'exam-1', items: [{ submissionId: 's', submittedAt: 'invalid' }], page: 0, totalPages: 1, totalElements: 1 } } }
  await assert.rejects(api.getPracticeHistory('exam-1'), /Thời gian nộp bài không hợp lệ/)
  response = { status: 500, body: { message: 'Không thể tải lịch sử' } }
  await assert.rejects(api.getPracticeHistory('exam-1'), (error) => error.response.status === 500)
})

test('review loads the specified submission and rejects a different result', async () => {
  requests.length = 0
  const result = {
    submissionId: 'sub-1',
    examId: 'exam-1',
    submittedAt: '2026-11-06T14:30:00Z',
    details: [{ questionId: 'q-1', selectedOpt: 'B' }],
  }
  response = { body: { data: result } }
  assert.deepEqual(await api.getPracticeSubmissionReview('sub-1'), result)
  assert.equal(requests[0], '/api/v1/submissions/practice/sub-1/review')
  response = { body: { data: { ...result, submissionId: 'sub-2' } } }
  await assert.rejects(api.getPracticeSubmissionReview('sub-1'), /không hợp lệ/)
  response = { status: 403, body: { message: 'Không có quyền' } }
  await assert.rejects(api.getPracticeSubmissionReview('sub-1'), (error) => error.response.status === 403)
})

test('submission date is displayed in Vietnam time regardless of device timezone', () => {
  const formatted = formatPracticeSubmissionDate('2026-11-06T14:30:00Z')
  assert.match(formatted, /21:30/)
  assert.match(formatted, /06\/11\/2026/)
  assert.throws(() => formatPracticeSubmissionDate('2026-11-06T14:30:00'), /không hợp lệ/)
})
