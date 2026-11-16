import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

let server
let AboutPage

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ AboutPage } = await server.ssrLoadModule('/src/pages/AboutPage.jsx'))
})

after(async () => {
  await server?.close()
})

test('about page tells the ICE story and links to the current course', () => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(AboutPage)))
  for (const text of [
    'tổ chức giáo dục', 'kiến thức và', 'tâm lý', 'lấy học sinh làm trung tâm',
    'Innovative', 'Creative', 'Effective', 'cải tiến công nghệ', 'tư duy khai phóng',
    'giá trị mang đến cho học sinh', 'ICE Masterclass', 'cam kết mang đến trải nghiệm học tập trọn vẹn',
  ]) {
    assert.ok(html.includes(text), `Missing about information: ${text}`)
  }
  assert.match(html, /href="\/khoa-hoc\/ice-masterclass"/)
  assert.match(html, /href="\/#tu-van"/)
})
