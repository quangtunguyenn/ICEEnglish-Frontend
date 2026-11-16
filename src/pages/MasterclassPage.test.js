import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

let server
let MasterclassPage

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ MasterclassPage } = await server.ssrLoadModule('/src/pages/MasterclassPage.jsx'))
})

after(async () => {
  await server?.close()
})

test('masterclass page presents the price, course benefits and a working consultation link', () => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(MasterclassPage)))
  for (const text of [
    '599.000', 'VND', '2 đề mỗi tuần', '1 đề đánh giá năng lực thường xuyên',
    '3 buổi chữa đề online mỗi tuần', '40 đề', 'Bộ Giáo dục và Đào tạo',
    'Sở Giáo dục và Đào tạo', 'flashcard', 'Bài tập về nhà', 'Biểu đồ điểm số',
    'lịch sử làm đề', 'nguồn uy tín',
  ]) {
    assert.ok(html.includes(text), `Missing course information: ${text}`)
  }
  assert.match(html, /href="\/#tu-van"/)
  assert.match(html, /href="\/thi-thu"/)
  assert.match(html, /href="\/doc-hieu"/)
})
