import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement, createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server
let ExamTakeView

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ ExamTakeView } = await server.ssrLoadModule('/src/components/ExamTakeView.jsx'))
})

after(async () => {
  await server?.close()
})

function renderExam(guest, isMock) {
  const question = { id: 'q1', orderIndex: 1, content: 'Question', optA: 'Answer' }
  const activePart = { id: 'p1', questions: [question] }
  const noop = () => {}
  return renderToStaticMarkup(createElement(ExamTakeView, {
    guest,
    isMock,
    isGeneralExam: !isMock,
    exam: { parts: [activePart] },
    activePart,
    activePartKey: 'p1',
    partIndex: 0,
    answers: {},
    markedQuestions: {},
    questionItems: [{ ...question, partIndex: 0 }],
    questionCount: 1,
    answeredCount: 0,
    questionRefs: createRef(),
    partTimes: {},
    remainingSeconds: 100,
    chooseAnswer: noop,
    toggleMark: noop,
    handleSaveDraft: noop,
    handleSubmit: noop,
    goToQuestion: noop,
    goToNextPart: noop,
    goToPreviousPart: noop,
  }))
}

for (const isMock of [false, true]) {
  test(`${isMock ? 'mock' : 'practice'} exam has the same controls and fullscreen gate for guests and students`, () => {
    const guest = renderExam(true, isMock)
    const student = renderExam(false, isMock)
    for (const html of [guest, student]) {
      for (const label of ['Quay lại', 'Tiếp theo', 'Lưu', 'Nộp bài', 'Bắt đầu làm bài', 'Bắt đầu toàn màn hình']) {
        assert.ok(html.includes(label), `Missing ${label}`)
      }
      assert.match(html, /role="dialog"/)
      assert.match(html, /exam-question-dot/)
      assert.match(html, /Đánh dấu câu 1/)
    }
    if (isMock) assert.match(guest, /thời hạn nộp được máy chủ xác thực/)
  })
}
