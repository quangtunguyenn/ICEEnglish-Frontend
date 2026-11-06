import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createServer } from 'vite'

let server
let ExamResultPage

before(async () => {
  server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  ;({ ExamResultPage } = await server.ssrLoadModule('/src/pages/ExamResultPage.jsx'))
})

after(async () => {
  await server?.close()
})

function renderResult(details) {
  const result = { examId: 1, totalQuestions: details.length, details }
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [{ pathname: '/ket-qua/1', state: { result } }] },
      createElement(Routes, null,
        createElement(Route, { path: '/ket-qua/:submissionId', element: createElement(ExamResultPage) }),
      ),
    ),
  )
}

test('review links are shown for correct, incorrect and unanswered questions before answer reveal', () => {
  const html = renderResult([
    { questionId: 1, isCorrect: true, relatedVideo: { videoId: 11, videoTitle: 'Video đúng' } },
    { questionId: 2, isCorrect: false, relatedVideo: { video_id: 12, video_title: 'Video sai' } },
    { questionId: 3, related_video: { id: 'a/b', title: 'Video chưa chọn' } },
  ])

  assert.match(html, /href="\/video\?videoId=11"[^>]*>Xem video ôn tập: Video đúng/)
  assert.match(html, /href="\/video\?videoId=12"[^>]*>Xem video ôn tập: Video sai/)
  assert.match(html, /href="\/video\?videoId=a%2Fb"[^>]*>Xem video ôn tập: Video chưa chọn/)
  assert.doesNotMatch(html, /Đáp án đúng:/)
})

test('missing video ID is reported instead of linking to the wrong lesson', () => {
  const html = renderResult([
    { questionId: 1, relatedVideo: { videoTitle: 'Thiếu ID' } },
    { questionId: 2 },
  ])

  assert.match(html, /Video ôn tập: Thiếu ID/)
  assert.match(html, /Không thể mở video ôn tập vì dữ liệu chưa có video ID/)
  assert.doesNotMatch(html, /href="\/video\?videoId=/)
  assert.doesNotMatch(html, /Đáp án đúng:/)
})

test('groups questions by part with passage, four options and selected answer, hiding correct answer and explanation', () => {
  const result = {
    examId: 1,
    parts: [
      { partId: 'p2', orderIndex: 2, partName: 'Part 2', passageText: 'Second passage' },
      { partId: 'p1', orderIndex: 1, partName: 'Part 1', passageText: 'First passage' },
    ],
    details: [
      { questionId: 'q2', partId: 'p2', orderIndex: 2, content: 'Q2', optA: 'a2', optB: 'b2', optC: 'c2', optD: 'd2', selectedOpt: null },
      {
        questionId: 'q1', partId: 'p1', orderIndex: 1, content: 'Q1',
        optA: 'alpha', optB: 'beta', optC: 'gamma', optD: 'delta',
        selectedOpt: 'B', correctOpt: 'C', explanation: 'Secret explanation',
        relatedVideo: { videoId: 'v1', videoTitle: 'Video 1' },
      },
    ],
  }
  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [{ pathname: '/ket-qua/1', state: { result } }] },
      createElement(Routes, null,
        createElement(Route, { path: '/ket-qua/:submissionId', element: createElement(ExamResultPage) }),
      ),
    ),
  )

  assert.ok(html.indexOf('First passage') < html.indexOf('alpha'))
  assert.ok(html.indexOf('alpha') < html.indexOf('Second passage'))
  for (const text of ['alpha', 'beta', 'gamma', 'delta', 'a2', 'd2']) assert.match(html, new RegExp(text))
  assert.match(html, /Bạn chọn: <strong>B<\/strong>/)
  assert.match(html, /Bạn chọn: <strong>Chưa chọn<\/strong>/)
  assert.match(html, /Xem video ôn tập: Video 1/)
  assert.doesNotMatch(html, /Secret explanation|Đáp án đúng/)
})

test('latest practice review displays the returned video title while hiding answers', () => {
  const html = renderResult([{
    content: 'Choose the correct option to fill in blank (1).',
    correctOpt: 'C',
    explanation: 'Giải thích đáp án.',
    isCorrect: false,
    orderIndex: 1,
    questionId: 'question-1',
    relatedVideo: {
      videoId: '10628758-3990-4838-a8b4-c128ebeea56a',
      videoTitle: 'CHUYÊN ĐỀ 3 - DANH TỪ VÀ MẠO TỪ',
      video_url: 'https://www.youtube.com/watch?v=example',
    },
    selectedOpt: 'B',
  }])

  assert.match(html, /href="\/video\?videoId=10628758-3990-4838-a8b4-c128ebeea56a"[^>]*>Xem video ôn tập: CHUYÊN ĐỀ 3 - DANH TỪ VÀ MẠO TỪ/)
  assert.ok(html.indexOf('Bạn chọn:') < html.indexOf('Xem video ôn tập: CHUYÊN ĐỀ 3'))
  assert.doesNotMatch(html, /Đáp án đúng:|Giải thích đáp án\./)
})
