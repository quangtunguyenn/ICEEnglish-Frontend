import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server
let SubmitConfirmationDialog

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ SubmitConfirmationDialog } = await server.ssrLoadModule('/src/components/SubmitConfirmationDialog.jsx'))
})

after(async () => {
  await server?.close()
})

function renderDialog(unansweredCount) {
  return renderToStaticMarkup(createElement(SubmitConfirmationDialog, {
    unansweredCount,
    onCancel: () => {},
    onConfirm: () => {},
  }))
}

test('submission confirmation reports the number of unanswered questions', () => {
  const html = renderDialog(3)

  assert.match(html, /3 câu chưa làm/)
  assert.match(html, /Bạn có chắc chắn muốn nộp bài không/)
})

test('submission confirmation omits an unanswered count when all questions are answered', () => {
  const html = renderDialog(0)

  assert.match(html, /Bạn đã hoàn thành tất cả câu hỏi/)
  assert.doesNotMatch(html, /0 câu chưa làm/)
})
