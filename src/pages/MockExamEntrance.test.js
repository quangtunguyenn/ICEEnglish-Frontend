import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createServer } from 'vite'

let server
let MockExamEntrance
let token = null
const originalStorage = globalThis.localStorage

before(async () => {
  globalThis.localStorage = { getItem: (key) => key === 'accessToken' ? token : null }
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ MockExamEntrance } = await server.ssrLoadModule('/src/pages/MockExamEntrance.jsx'))
})

after(async () => {
  await server?.close()
  if (originalStorage === undefined) delete globalThis.localStorage
  else globalThis.localStorage = originalStorage
})

function renderEntrance() {
  return renderToStaticMarkup(createElement(
    MemoryRouter,
    { initialEntries: [{ pathname: '/thi-thu/exam-1/vao-phong', state: { examTitle: 'Đề thi mẫu' } }] },
    createElement(Routes, null, createElement(Route, {
      path: '/thi-thu/:examId/vao-phong',
      element: createElement(MockExamEntrance),
    })),
  ))
}

test('student starts with empty practice credentials, while guest credentials remain prefilled', () => {
  token = 'student-token'
  const student = renderEntrance()
  assert.match(student, /name="mock-student-irn"[^>]*value=""/)
  assert.match(student, /name="mock-practice-password"[^>]*value=""/)
  assert.match(student, /autoComplete="new-password"/)

  token = null
  const guest = renderEntrance()
  assert.match(guest, /name="mock-student-irn"[^>]*value="9999010120091"/)
  assert.match(guest, /readOnly=""[^>]*name="mock-student-irn"/)
  assert.match(guest, /name="mock-practice-password"[^>]*value="guest"/)
  assert.match(guest, /readOnly=""[^>]*name="mock-practice-password"/)
  assert.match(guest, /Bạn chỉ cần bấm vào thi, không cần sửa gì hết/)
  assert.match(guest, />Vào thi<\/button>/)
})
