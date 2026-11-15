import assert from 'node:assert/strict'
import { createServer as createHttpServer } from 'node:http'
import { after, before, test } from 'node:test'
import { createServer as createViteServer } from 'vite'

let server
let vite
let api
let requests
let status = 200
let body = []
let holdResponse
const originalApiUrl = process.env.VITE_API_BASE_URL
const originalStorage = globalThis.localStorage
const storage = new Map()
const student = {
  id: 'student-1', username: 'student001', fullName: null, studentIrn: null,
  passwordMock: null, dob: null, gender: null, isActive: true, createdAt: null,
}

before(async () => {
  requests = []
  server = createHttpServer((request, reply) => {
    const chunks = []
    request.on('data', (chunk) => chunks.push(chunk))
    request.on('end', () => {
      requests.push({ method: request.method, url: request.url, authorization: request.headers.authorization, body: Buffer.concat(chunks).toString() })
      if (holdResponse) { holdResponse(reply); return }
      reply.writeHead(status, { 'Content-Type': 'application/json' })
      reply.end(JSON.stringify(body))
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

test('student list sends encoded filters and accepts nullable fields and empty results', async () => {
  storage.set('accessToken', 'admin-token')
  requests.length = 0
  status = 200
  body = [student]
  assert.deepEqual(await api.getAdminStudents({ isActive: false, keyword: 'Đặng Thị' }), [student])
  const url = new URL(requests[0].url, 'http://localhost')
  assert.equal(url.pathname, '/api/v1/admin/students')
  assert.equal(url.searchParams.get('isActive'), 'false')
  assert.equal(url.searchParams.get('keyword'), 'Đặng Thị')
  assert.equal(requests[0].authorization, 'Bearer admin-token')
  body = []
  assert.deepEqual(await api.getAdminStudents(), [])
  assert.equal(requests[1].url, '/api/v1/admin/students')
  body = { items: [] }
  await assert.rejects(api.getAdminStudents(), /không hợp lệ/)
})

test('status changes send boolean and require a matching response', async () => {
  requests.length = 0
  status = 200
  body = { ...student, isActive: false }
  assert.deepEqual(await api.setStudentActive('student-1', false), body)
  assert.equal(requests[0].method, 'PATCH')
  assert.equal(requests[0].url, '/api/v1/admin/students/student-1/is-active')
  assert.equal(requests[0].authorization, 'Bearer admin-token')
  assert.deepEqual(JSON.parse(requests[0].body), { isActive: false })
  body = { ...student, isActive: true }
  assert.deepEqual(await api.setStudentActive('student-1', true), body)
  await assert.rejects(api.setStudentActive('student-1', false), /Không thể xác nhận/)
  for (const code of [400, 403, 404]) {
    status = code
    body = {}
    await assert.rejects(api.setStudentActive('student-1', false), (error) => error.response.status === code)
    assert.equal(storage.get('accessToken'), 'admin-token')
  }
})

test('authenticated 401 clears matching session without relying on the error body', async () => {
  status = 401
  body = {}
  storage.set('accessToken', 'student-token')
  storage.set('refreshToken', 'refresh-token')
  storage.set('currentUser', '{}')
  await assert.rejects(api.getAuthProfile(), (error) => error.response.status === 401)
  assert.equal(storage.has('accessToken'), false)
  assert.equal(storage.has('refreshToken'), false)
  assert.equal(storage.has('currentUser'), false)
  storage.set('accessToken', 'existing-token')
  await assert.rejects(api.loginStudent({ username: 'student', password: 'bad' }))
  assert.equal(storage.get('accessToken'), 'existing-token')
})

test('a late 401 cannot clear a newer login', async () => {
  storage.set('accessToken', 'old-token')
  let release
  const received = new Promise((resolve) => {
    holdResponse = (reply) => {
      release = () => { reply.writeHead(401, { 'Content-Type': 'application/json' }); reply.end('{}') }
      resolve()
    }
  })
  const pending = api.getAuthProfile()
  await received
  storage.set('accessToken', 'new-token')
  release()
  await assert.rejects(pending)
  assert.equal(storage.get('accessToken'), 'new-token')
  holdResponse = null
})
