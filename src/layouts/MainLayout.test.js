import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

let server
let MainLayout
let token = null
const originalStorage = globalThis.localStorage

before(async () => {
  globalThis.localStorage = { getItem: (key) => key === 'accessToken' ? token : null }
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ MainLayout } = await server.ssrLoadModule('/src/layouts/MainLayout.jsx'))
})

after(async () => {
  await server?.close()
  if (originalStorage === undefined) delete globalThis.localStorage
  else globalThis.localStorage = originalStorage
})

function renderLayout() {
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(MainLayout)))
}

test('guest sees login instead of logout', () => {
  token = null
  const html = renderLayout()
  assert.match(html, /Đăng nhập/)
  assert.doesNotMatch(html, /Đăng xuất/)
})

test('signed-in user sees logout instead of login', () => {
  token = 'student-token'
  const html = renderLayout()
  assert.match(html, /Đăng xuất/)
  assert.doesNotMatch(html, /Đăng nhập/)
})

test('navigation uses the requested order and the public logo', () => {
  token = null
  const html = renderLayout()
  const labels = [
    'Trang chủ',
    'Khóa học',
    'ICE Masterclass: Bứt phá điểm số THPTQG 2027',
    'Phòng thi',
    'Luyện đề',
    'Thi thử',
    'Học tập',
    'Bài giảng',
    'Từ vựng',
    'Thư viện',
    'Về chúng tôi',
  ]

  assert.match(html, /src="\/logo\.jpg"/)
  assert.match(html, /aria-label="Điều hướng chính"/)
  const navHtml = html.slice(html.indexOf('<nav'), html.indexOf('</nav>'))
  assert.equal((navHtml.match(/aria-current="page"/g) ?? []).length, 1)
  let previousIndex = -1
  for (const label of labels) {
    const index = html.indexOf(label)
    assert.ok(index > previousIndex, `Expected "${label}" after the previous navigation item`)
    previousIndex = index
  }
})
