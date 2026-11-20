import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

let server
let SiteFooter

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ SiteFooter } = await server.ssrLoadModule('/src/components/SiteFooter.jsx'))
})

after(async () => {
  await server?.close()
})

test('footer shows honest contact and social placeholders without dead links', () => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(SiteFooter)))

  assert.equal((html.match(/Số điện thoại/g) ?? []).length, 1)
  assert.match(html, /href="tel:0327357150">0327 357 150<\/a>/)
  assert.match(html, /Email \/ Gmail/)
  assert.equal((html.match(/Chưa cập nhật/g) ?? []).length, 2)
  assert.match(html, /Facebook: chưa cập nhật liên kết/)
  assert.match(html, /TikTok: chưa cập nhật liên kết/)
  assert.doesNotMatch(html, /href="(?:#|mailto:|tel:)"/)
  for (const route of ['/ve-chung-toi', '/khoa-hoc/ice-masterclass', '/vinh-danh', '/luyen-de', '/thi-thu', '/video', '/tu-vung', '/doc-hieu']) {
    assert.ok(html.includes(`href="${route}"`), `Missing footer link: ${route}`)
  }
})
