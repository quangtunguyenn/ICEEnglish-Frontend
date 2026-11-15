import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

let server
let HomePage
let LoginPage

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ HomePage } = await server.ssrLoadModule('/src/pages/HomePage.jsx'))
  ;({ LoginPage } = await server.ssrLoadModule('/src/pages/LoginPage.jsx'))
})

after(async () => {
  await server?.close()
})

test('homepage and login consultation forms offer the same enabled fields', () => {
  for (const Page of [HomePage, LoginPage]) {
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Page)))
    const form = html.match(/<form[^>]*class="consultation-form"[\s\S]*?<\/form>/)?.[0]
    assert.ok(form)
    for (const name of ['studentName', 'birthYear', 'targetScore', 'phone', 'course']) {
      assert.match(form, new RegExp(`name="${name}"`))
    }
    assert.match(form, /Tư vấn khóa học ICE Masterclass/)
    assert.match(form, /không được gửi tới hệ thống/)
    assert.doesNotMatch(form, /<button[^>]*disabled/)
    assert.match(form, /<input(?=[^>]*name="birthYear")(?=[^>]*step="1")[^>]*>/)
    assert.match(form, /<input(?=[^>]*name="targetScore")(?=[^>]*step="any")[^>]*>/)
  }
})

test('homepage hero shows the Masterclass roadmap instead of the old illustration', () => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(HomePage)))
  const hero = html.match(/<div class="hero-visual">([\s\S]*?)<\/section>/)?.[1]
  assert.ok(hero)
  for (const text of ['ICE MASTERCLASS', 'Củng cố ngữ pháp', 'Rèn luyện không giới hạn', 'Giải đề xuyên suốt', 'Tăng tốc đúng thời điểm']) {
    assert.ok(hero.includes(text))
  }
  assert.doesNotMatch(hero, /ice-learning-hero\.png/)
})
