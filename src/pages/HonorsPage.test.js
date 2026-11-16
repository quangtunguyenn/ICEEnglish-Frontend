import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

let server
let HonorsPage

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ HonorsPage } = await server.ssrLoadModule('/src/pages/HonorsPage.jsx'))
})

after(async () => {
  await server?.close()
})

test('honors page preserves each student result, available photo and feedback', () => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(HonorsPage)))
  const cards = html.match(/<article class="honors-student-card"[^>]*>[\s\S]*?<\/article>/g) ?? []
  const expected = [
    ['Lê Duy Mạnh Phước', '6.8', '8.75', true, true],
    ['Nguyễn Phương Trang', '7.3', '8.75', true, true],
    ['Nguyễn Thanh Xuân', '8', '8.5', true, false],
    ['Nguyễn Thiên Quỳnh Anh', '7.3', '8', true, false],
    ['Huỳnh Nguyễn Quỳnh Anh', '9.4', '9.5', false, false],
    ['Nguyễn Như Hà Anh', null, '8.5', false, false],
    ['Lê Hà Khánh Ly', null, '8', true, false],
    ['Nguyễn Viết Trung Nguyên', '6.5', '9', true, true],
    ['Nguyễn Kim Bảo Ngọc', '8.25', '8.75', true, true],
    ['Nguyễn Bảo Nhi', '7.8', '8.75', true, false],
    ['Tô Hoàng Ngọc Trâm', '4.6', '7', true, true],
  ]
  assert.equal(cards.length, expected.length)
  for (const [name, before, after, photo, feedback] of expected) {
    const card = cards.find((item) => item.includes(`<h3>${name}</h3>`))
    assert.ok(card, `Missing student: ${name}`)
    assert.ok(card.includes(`>${before ?? 'Chưa có thông tin'}</dd>`))
    assert.ok(card.includes(`>${after}</dd>`))
    assert.equal(card.includes(`src="/${name}.jpg"`), photo)
    assert.equal(card.includes('<blockquote>'), feedback)
    assert.equal(card.includes('class="honors-quote-preview"'), feedback)
    if (feedback) {
      assert.ok(card.includes(`<summary>Đọc đầy đủ chia sẻ của ${name}</summary>`))
    }
  }
  assert.match(html, /href="#giua-ky-1-2026-2027"/)
  assert.match(html, /href="\/khoa-hoc\/ice-masterclass"/)
})
