import assert from 'node:assert/strict'
import { createServer as createHttpServer } from 'node:http'
import { after, before, test } from 'node:test'
import { createServer as createViteServer } from 'vite'

let server
let vite
let api
let requests
let responseBody
let responseStatus = 200
const originalApiUrl = process.env.VITE_API_BASE_URL
const originalStorage = globalThis.localStorage
const storage = new Map([['accessToken', 'student-token'], ['refreshToken', 'refresh-token'], ['currentUser', '{"id":"student"}']])

before(async () => {
  requests = []
  server = createHttpServer((request, reply) => {
    const chunks = []
    request.on('data', (chunk) => chunks.push(chunk))
    request.on('end', () => {
      requests.push({
        method: request.method,
        url: request.url,
        authorization: request.headers.authorization,
        guestAttempt: request.headers['x-guest-attempt'],
        body: Buffer.concat(chunks).toString(),
      })
      reply.writeHead(responseStatus, { 'Content-Type': 'application/json' })
      reply.end(JSON.stringify(responseBody))
    })
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  process.env.VITE_API_BASE_URL = `http://127.0.0.1:${server.address().port}`
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  }
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

test('guest content requests omit student authorization', async () => {
  requests.length = 0
  responseBody = [{ id: 'exam-1', mode: 'MOCK' }]

  assert.deepEqual(await api.getGuestExams('MOCK'), responseBody)
  assert.deepEqual(requests[0], {
    method: 'GET',
    url: '/api/v1/guest/exams?mode=MOCK',
    authorization: undefined,
    guestAttempt: undefined,
    body: '',
  })
})

test('guest attempt requests use the private session header without student authorization', async () => {
  requests.length = 0
  responseBody = { data: { submissionId: 'attempt-1' } }

  assert.deepEqual(await api.startGuestExam('exam-1', 'attempt-1'), responseBody.data)
  assert.equal(requests[0].method, 'POST')
  assert.equal(requests[0].url, '/api/v1/guest/exams/exam-1/start')
  assert.equal(requests[0].guestAttempt, 'attempt-1')
  assert.equal(requests[0].authorization, undefined)
})

test('guest homework submissions send only answers and the attempt header', async () => {
  requests.length = 0
  responseBody = { data: { score: 1 } }
  const payload = { answers: [{ questionId: 'q-1', selectedOpt: 'B' }] }

  assert.deepEqual(await api.submitGuestHomework('video-1', 'attempt-2', payload), responseBody.data)
  assert.equal(requests[0].method, 'POST')
  assert.equal(requests[0].url, '/api/v1/guest/videos/video-1/homework/submit')
  assert.equal(requests[0].guestAttempt, 'attempt-2')
  assert.equal(requests[0].authorization, undefined)
  assert.deepEqual(JSON.parse(requests[0].body), payload)
})

test('invalid token response clears stale student credentials', async () => {
  requests.length = 0
  responseStatus = 401
  responseBody = { message: 'Token thiếu, sai, hết hạn hoặc user/role không hợp lệ' }

  await assert.rejects(api.getGeneralExams())
  assert.equal(requests[0].authorization, 'Bearer student-token')
  assert.equal(storage.has('accessToken'), false)
  assert.equal(storage.has('refreshToken'), false)
  assert.equal(storage.has('currentUser'), false)
})

test('logout removes credentials but keeps unrelated browser data', () => {
  storage.set('accessToken', 'student-token')
  storage.set('refreshToken', 'refresh-token')
  storage.set('currentUser', '{"id":"student"}')
  storage.set('other-data', 'preserved')

  api.logout()

  assert.equal(storage.has('accessToken'), false)
  assert.equal(storage.has('refreshToken'), false)
  assert.equal(storage.has('currentUser'), false)
  assert.equal(storage.get('other-data'), 'preserved')
  assert.equal(api.isGuestUser(), true)
})

test('reading APIs use separate guest and student routes with direct JSON responses', async () => {
  storage.set('accessToken', 'student-token')
  responseStatus = 200
  requests.length = 0
  responseBody = { items: [{ id: 'blog-1', accessible: false }], page: 0, totalPages: 1 }
  assert.deepEqual(await api.getReadingBlogs(true, { page: 0, size: 12, topic: 'environment' }), responseBody)
  assert.equal(requests[0].url, '/api/v1/guest/reading-blogs?page=0&size=12&topic=environment')
  assert.equal(requests[0].authorization, undefined)

  responseBody = [{ slug: 'environment', name: 'Environment' }]
  assert.deepEqual(await api.getReadingTopics(false), responseBody)
  assert.equal(requests[1].url, '/api/v1/reading-blogs/topics')
  assert.ok(requests[1].authorization)

  responseBody = [{ id: 'v-1', word: 'garden', meaning: 'khu vườn' }]
  assert.deepEqual(await api.getReadingVocabularies(true, 'blog-1'), responseBody)
  assert.equal(requests[2].url, '/api/v1/guest/reading-blogs/blog-1/vocabularies')
  assert.equal(requests[2].authorization, undefined)
})

test('reading answer submits revision and option, preserving errors', async () => {
  requests.length = 0
  responseStatus = 200
  responseBody = { questionId: 'q-1', selectedOption: 'C', isCorrect: true }
  const payload = { revision: 1, selectedOption: 'C' }
  assert.deepEqual(await api.answerReadingQuestion(true, 'blog-1', 'q-1', payload), responseBody)
  assert.equal(requests[0].url, '/api/v1/guest/reading-blogs/blog-1/questions/q-1/answer')
  assert.equal(requests[0].authorization, undefined)
  assert.deepEqual(JSON.parse(requests[0].body), payload)
  responseStatus = 409
  responseBody = { message: 'Revision cũ' }
  await assert.rejects(api.answerReadingQuestion(false, 'blog-1', 'q-1', payload), (error) => error.response.status === 409)
  responseStatus = 200
})

test('reading admin uses PUT for guest access and PATCH for lifecycle', async () => {
  requests.length = 0
  responseBody = {}
  await api.setReadingGuestAccess('blog-1', true)
  await api.publishReadingBlog('blog-1')
  await api.archiveReadingBlog('blog-1')
  assert.equal(requests[0].method, 'PUT')
  assert.equal(requests[0].url, '/api/v1/admin/reading-blogs/blog-1/guest-access')
  assert.deepEqual(JSON.parse(requests[0].body), { guestAccessible: true })
  assert.ok(requests[0].authorization)
  assert.equal(requests[1].method, 'PATCH')
  assert.equal(requests[1].url, '/api/v1/admin/reading-blogs/blog-1/publish')
  assert.equal(requests[2].method, 'PATCH')
  assert.equal(requests[2].url, '/api/v1/admin/reading-blogs/blog-1/archive')
})
