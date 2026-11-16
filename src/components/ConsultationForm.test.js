import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'
import { validateConsultation } from '../utils/consultationValidation.js'

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
    assert.match(form, /<input(?=[^>]*name="course")(?=[^>]*readOnly="")[^>]*>/)
    assert.doesNotMatch(form, /<button[^>]*disabled/)
    assert.match(form, /<input(?=[^>]*name="birthYear")(?=[^>]*step="1")[^>]*>/)
    assert.match(form, /<input(?=[^>]*name="targetScore")(?=[^>]*step="any")[^>]*>/)
  }
})

test('consultation validates names, years, scores and ten-digit phone numbers', () => {
  const values = {
    studentName: '  Nguyễn   Thị Ánh  ',
    birthYear: '2008',
    targetScore: '8.5',
    phone: '0901234567',
  }
  const validate = (overrides = {}) => {
    const form = new FormData()
    for (const [key, value] of Object.entries({ ...values, ...overrides })) form.set(key, value)
    return validateConsultation(form, 2026)
  }

  assert.deepEqual(validate().payload, {
    studentFullname: 'Nguyễn Thị Ánh', bod: 2008, targetGrade: 8.5, phoneNumberRequest: '0901234567',
  })
  assert.equal(validate({ studentName: 'A' }).field, 'studentName')
  assert.equal(validate({ studentName: 'Học sinh 123' }).field, 'studentName')
  assert.ok(validate({ studentName: "D'Arcy" }).payload)
  for (const birthYear of ['0000', '200', '2027', '']) {
    assert.equal(validate({ birthYear }).field, 'birthYear')
  }
  assert.ok(validate({ birthYear: '1900' }).payload)
  for (const targetScore of ['', '-1', '10.01']) {
    assert.equal(validate({ targetScore }).field, 'targetScore')
  }
  assert.ok(validate({ targetScore: '0' }).payload)
  assert.ok(validate({ targetScore: '10' }).payload)
  for (const phone of ['091234567', '09123456789', '09a2345678', '0901 234567']) {
    assert.equal(validate({ phone }).field, 'phone')
  }
})

test('login keeps a labeled password field and an accessible visibility control', () => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(LoginPage)))
  assert.match(html, /<label[^>]*for="login-password"[^>]*>Mật khẩu<\/label>/)
  assert.match(html, /<input(?=[^>]*id="login-password")(?=[^>]*type="password")[^>]*>/)
  assert.match(html, /<button(?=[^>]*aria-label="Hiện mật khẩu")(?=[^>]*aria-pressed="false")(?=[^>]*type="button")[^>]*>/)
})

test('homepage hero shows the Masterclass roadmap instead of the old illustration', () => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(HomePage)))
  const hero = html.match(/<div class="hero-visual">([\s\S]*?)<\/section>/)?.[1]
  assert.ok(hero)
  for (const text of ['ICE MASTERCLASS', 'Củng cố ngữ pháp', 'Rèn luyện không giới hạn', 'Giải đề xuyên suốt', 'Tăng tốc đúng thời điểm']) {
    assert.ok(hero.includes(text))
  }
  assert.doesNotMatch(hero, /ice-learning-hero\.png/)
  assert.match(html, /href="\/khoa-hoc\/ice-masterclass"/)
})

test('homepage content images share accessible zoom controls', () => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(HomePage)))
  const imageButtons = html.match(/<button[^>]*class="image-zoom-trigger"[\s\S]*?<\/button>/g) ?? []
  assert.equal(imageButtons.length, 13)
  for (const image of ['phong-thi-ao.png', 'bai-giang.png', 'flashcard.png', 'thu-vien.png', 'giao dien vao thi.png', 'giao dien vao thi 2.png', 'chi-tiet-ket-qua.png', 'dap-an.png', 'doan-dich.png', 'chi-tiet-thi-thu.png', 'bieu-do-diem.png', 'bo-de.png']) {
    assert.ok(imageButtons.some((button) => button.includes(image)))
  }
  assert.match(html, /<dialog[^>]*aria-label="Ảnh phóng to"/)
  assert.match(html, /aria-label="Đóng ảnh"/)
})
