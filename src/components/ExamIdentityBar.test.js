import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server
let ExamIdentityBar

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ ExamIdentityBar } = await server.ssrLoadModule('/src/components/ExamIdentityBar.jsx'))
})

after(async () => {
  await server?.close()
})

test('hides left identity while preserving homework controls and one decorative logo', () => {
  const html = renderToStaticMarkup(createElement(
    ExamIdentityBar,
    {
      showIdentity: false,
      candidateName: 'Học sinh kiểm thử',
      candidateSbd: '12345',
      examStartedAt: '2026-11-15T10:00:00.000Z',
    },
    createElement('div', null, 'Số câu đã trả lời'),
  ))

  assert.doesNotMatch(html, /Học sinh kiểm thử|SBD:|Môn thi:|Ngày thi:/)
  assert.match(html, /Số câu đã trả lời/)
  assert.equal((html.match(/src="\/ice_english_emblem_vector\.svg"/g) || []).length, 1)
  assert.match(html, /absolute left-4 top-1\/2/)
  assert.match(html, /brightness-0 invert/)
})

test('shows one decorative logo next to the candidate information', () => {
  const html = renderToStaticMarkup(createElement(
    ExamIdentityBar,
    { candidateName: 'Học sinh kiểm thử', candidateSbd: '12345' },
    createElement('button', null, 'Nộp bài'),
  ))

  assert.match(html, /Học sinh kiểm thử/)
  assert.match(html, /SBD: 12345/)
  assert.match(html, /Nộp bài/)
  assert.equal((html.match(/src="\/ice_english_emblem_vector\.svg"/g) || []).length, 1)
  assert.match(html, /relative block h-0 shrink-0/)
  assert.match(html, /absolute left-0 top-1\/2 -translate-y-1\/2/)
})
