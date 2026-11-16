import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

let server
let MainLayout
let getProfileInitial
let token = null
const originalStorage = globalThis.localStorage

before(async () => {
  globalThis.localStorage = { getItem: (key) => key === 'accessToken' ? token : null }
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ MainLayout } = await server.ssrLoadModule('/src/layouts/MainLayout.jsx'))
  ;({ getProfileInitial } = await server.ssrLoadModule('/src/utils/profile.js'))
})

after(async () => {
  await server?.close()
  if (originalStorage === undefined) delete globalThis.localStorage
  else globalThis.localStorage = originalStorage
})

function renderLayout(path = '/') {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(MainLayout)))
}

test('site footer appears on browsing pages but not immersive exam or homework pages', () => {
  for (const path of ['/', '/ve-chung-toi', '/vinh-danh', '/luyen-de', '/thi-thu', '/luyen-de/123/lich-su', '/video']) {
    const html = renderLayout(path)
    assert.match(html, /<footer\b/)
    assert.match(html, /aria-label="Phòng thi"/)
  }
  for (const path of ['/luyen-de/123', '/thi-thu/123', '/thi-thu/123/vao-phong', '/video/123/homework']) {
    assert.doesNotMatch(renderLayout(path), /<footer\b/)
  }
})

test('navigation is hidden for the mock entrance but remains visible outside fullscreen elsewhere', () => {
  const entranceHeader = renderLayout('/thi-thu/123/vao-phong').match(/<header\b[^>]*>/)?.[0]
  assert.match(entranceHeader, /\shidden=""/)
  for (const path of ['/', '/thi-thu', '/thi-thu/123', '/luyen-de/123']) {
    const header = renderLayout(path).match(/<header\b[^>]*>/)?.[0]
    assert.doesNotMatch(header, /\shidden(?:=|\s|>)/)
  }
})

test('guest sees login instead of logout', () => {
  token = null
  const html = renderLayout()
  assert.match(html, /ĐĂNG NHẬP/)
  assert.match(html, /NHẬN TƯ VẤN/)
  assert.match(html, /href="\/#tu-van"/)
  assert.doesNotMatch(html, /ĐĂNG XUẤT/)
})

test('signed-in user sees a closed account menu instead of login', () => {
  token = 'student-token'
  const html = renderLayout()
  assert.match(html, /aria-label="Tài khoản"/)
  assert.match(html, /aria-expanded="false" aria-label="Tài khoản"/)
  assert.doesNotMatch(html, /Đăng xuất/)
  assert.doesNotMatch(html, /ĐĂNG NHẬP/)
})

test('avatar uses the first letter of the last name component, preserving Vietnamese accents', () => {
  assert.equal(getProfileInitial('Nguyễn Quang Tứ'), 'T')
  assert.equal(getProfileInitial('  Nguyễn   Tiến Đạt  '), 'Đ')
  assert.equal(getProfileInitial('Nguyễn A\u0301nh'), 'Á')
  assert.equal(getProfileInitial(' '), '')
  assert.equal(getProfileInitial(null), '')
})

test('navigation uses the requested order and the public logo', () => {
  token = null
  const html = renderLayout()
  const labels = [
    'TRANG CHỦ',
    'VỀ CHÚNG TÔI',
    'KHÓA HỌC',
    'ICE Masterclass: Bứt phá điểm số THPTQG 2027',
    'PHÒNG THI',
    'LUYỆN ĐỀ',
    'THI THỬ',
    'HỌC TẬP',
    'HỆ THỐNG BÀI GIẢNG',
    'LUYỆN TẬP TỪ VỰNG',
    'THƯ VIỆN ĐỌC HIỂU',
    'VINH DANH',
  ]

  assert.match(html, /src="\/logo\.png"/)
  assert.match(html, /srcSet="\/logo\.png"/)
  assert.match(html, /aria-label="Điều hướng chính"/)
  const navHtml = html.slice(html.indexOf('<nav'), html.indexOf('</nav>'))
  assert.equal((navHtml.match(/aria-current="page"/g) ?? []).length, 1)
  let previousIndex = -1
  for (const label of labels) {
    const index = navHtml.indexOf(label)
    assert.ok(index > previousIndex, `Expected "${label}" after the previous navigation item`)
    previousIndex = index
  }
  assert.match(html, /font-playwrite text-\[18px\]/)
  assert.match(navHtml, /href="\/khoa-hoc\/ice-masterclass"/)
  assert.match(navHtml, /href="\/ve-chung-toi"[^>]*>VỀ CHÚNG TÔI<\/a>/)
  assert.match(navHtml, /href="\/vinh-danh"[^>]*>VINH DANH<\/a>/)
  assert.match(html, /font-gf text-\[16px\]/)
  for (const [label, color] of [
    ['KHÓA HỌC', 'text-[#102B5C]'],
    ['PHÒNG THI', 'text-yellow-600'],
    ['HỌC TẬP', 'text-yellow-600'],
  ]) {
    const button = navHtml.match(new RegExp(`<button\\b[^>]*>\\s*${label}`))?.[0]
    assert.ok(button, `Missing navigation button: ${label}`)
    assert.ok(button.includes(color), `Expected ${label} to use ${color}`)
  }
  assert.match(html, /lg:group-hover:grid-rows-\[1fr\]/)
})
