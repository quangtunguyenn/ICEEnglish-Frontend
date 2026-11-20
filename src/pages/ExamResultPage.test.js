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

function renderResult(details, guest = false) {
  const result = { examId: 1, totalQuestions: details.length, details, guest }
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

test('review shows all related videos returned for a question', () => {
  const html = renderResult([{
    questionId: 1,
    relatedVideos: [
      { videoId: 'v1', videoTitle: 'Video 1' },
      { videoId: 'v2', videoTitle: 'Video 2' },
    ],
  }])

  assert.match(html, /href="\/video\?videoId=v1"[^>]*>Xem video ôn tập: Video 1/)
  assert.match(html, /href="\/video\?videoId=v2"[^>]*>Xem video ôn tập: Video 2/)
})

test('guest result opens accessible videos and gates locked videos', () => {
  const html = renderResult([{
    questionId: 1,
    relatedVideos: [
      { videoId: 'v1', videoTitle: 'Video trải nghiệm', accessible: true },
      { videoId: 'v2', videoTitle: 'Video dành cho học viên', accessible: false },
    ],
  }], true)

  assert.match(html, /href="\/video\?videoId=v1"[^>]*>Xem video ôn tập: Video trải nghiệm/)
  assert.match(html, /<button[^>]*>Xem video ôn tập: Video dành cho học viên<\/button>/)
  assert.doesNotMatch(html, /href="\/video\?videoId=v2"/)
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
      { partId: 'p2', orderIndex: 2, displayIndex: 2, partName: 'Part 2', passageText: 'Second passage' },
      { partId: 'p1', orderIndex: 1, displayIndex: 1, partName: 'Part 1', passageText: 'First passage' },
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

test('formats translated passage headings and emphasis without rendering unsafe HTML', () => {
  const result = {
    guest: true,
    parts: [{ partId: 'p1', partName: 'Part 1', passageText: '# Original\n\nEnglish text' }],
    partTranslations: [{
      partId: 'p1',
      translate: '# Tiêu đề tiếng Việt\n\nĐã **<u>tăng mạnh</u>**.\nDòng tiếp theo.\n\n<script>alert(1)</script>',
    }],
    details: [{ questionId: 'q1', partId: 'p1', content: 'Question' }],
  }
  const html = renderToStaticMarkup(createElement(
    MemoryRouter,
    { initialEntries: [{ pathname: '/ket-qua/khach', state: { result } }] },
    createElement(Routes, null, createElement(Route, { path: '/ket-qua/:submissionId', element: createElement(ExamResultPage) })),
  ))

  assert.match(html, /<h2>Tiêu đề tiếng Việt<\/h2>/)
  assert.match(html, /<strong><u>tăng mạnh<\/u><\/strong>/)
  assert.match(html, /Dòng tiếp theo\./)
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  assert.doesNotMatch(html, /<script>|# Tiêu đề tiếng Việt|\*\*/)
})

test('orders parts by displayIndex so shuffled attempts keep their saved part order', () => {
  const result = {
    examId: 1,
    parts: [
      { partId: 'p1', orderIndex: 1, displayIndex: 2, partName: 'Part 1', passageText: 'First passage' },
      { partId: 'p2', orderIndex: 2, displayIndex: 1, partName: 'Part 2', passageText: 'Second passage' },
    ],
    details: [
      { questionId: 'q1', partId: 'p1', orderIndex: 1, content: 'Q1', optA: 'a1', optB: 'b1', optC: 'c1', optD: 'd1' },
      { questionId: 'q2', partId: 'p2', orderIndex: 2, content: 'Q2', optA: 'a2', optB: 'b2', optC: 'c2', optD: 'd2' },
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

  assert.ok(html.indexOf('Second passage') < html.indexOf('First passage'))
  assert.match(html, /Câu 1\./)
  assert.match(html, /Câu 2\./)
})

test('uses the attempt log order for both timing cards and answer groups in practice and mock results', () => {
  for (const resultMode of ['practice', 'mock']) {
    const result = {
      guest: true,
      resultMode,
      parts: [
        { partId: 'p1', orderIndex: 1, partName: 'Tên gốc A', passageText: 'Đoạn A' },
        { partId: 'p2', orderIndex: 2, partName: 'Tên gốc B', passageText: 'Đoạn B' },
      ],
      partTimeLogs: [
        { partId: 'p1', partName: 'Tên gốc A', displayIndex: 2, timeSpentSeconds: 30, recommendedTimeSeconds: 60 },
        { partId: 'p2', partName: 'Tên gốc B', displayIndex: 1, timeSpentSeconds: 60, recommendedTimeSeconds: 60 },
      ],
      details: [
        { questionId: 'q1', partId: 'p1', content: 'Câu hỏi A' },
        { questionId: 'q2', partId: 'p2', content: 'Câu hỏi B' },
      ],
    }
    const html = renderToStaticMarkup(createElement(
      MemoryRouter,
      { initialEntries: [{ pathname: '/ket-qua/khach', state: { result } }] },
      createElement(Routes, null, createElement(Route, { path: '/ket-qua/:submissionId', element: createElement(ExamResultPage) })),
    ))
    const [times, answers] = html.split('Chi tiết đáp án')
    assert.ok(times.indexOf('Part 1') < times.indexOf('Part 2'))
    assert.match(times, /Part 1: Tên gốc B/)
    assert.match(times, /Part 2: Tên gốc A/)
    assert.ok(answers.indexOf('Part 1') < answers.indexOf('Đoạn B'))
    assert.ok(answers.indexOf('Đoạn B') < answers.indexOf('Part 2'))
    assert.ok(answers.indexOf('Đoạn B') < answers.indexOf('Đoạn A'))
    assert.ok(answers.indexOf('Câu hỏi B') < answers.indexOf('Câu hỏi A'))
  }
})

test('labels answer groups by attempt order when parts metadata is missing', () => {
  const result = {
    guest: true,
    partTimeLogs: [
      { partId: 'p1', partName: 'Tên từ server A', displayIndex: 2 },
      { partId: 'p2', partName: 'Tên từ server B', displayIndex: 1 },
    ],
    details: [
      { questionId: 'q1', partId: 'p1', content: 'Câu hỏi A' },
      { questionId: 'q2', partId: 'p2', content: 'Câu hỏi B' },
    ],
  }
  const html = renderToStaticMarkup(createElement(
    MemoryRouter,
    { initialEntries: [{ pathname: '/ket-qua/khach', state: { result } }] },
    createElement(Routes, null, createElement(Route, { path: '/ket-qua/:submissionId', element: createElement(ExamResultPage) })),
  ))
  const answers = html.split('Chi tiết đáp án')[1]
  assert.match(answers, /Part 1: Tên từ server B/)
  assert.match(answers, /Part 2: Tên từ server A/)
  assert.ok(answers.indexOf('Part 1') < answers.indexOf('Câu hỏi B'))
  assert.ok(answers.indexOf('Câu hỏi B') < answers.indexOf('Part 2'))
  assert.ok(answers.indexOf('Câu hỏi B') < answers.indexOf('Câu hỏi A'))
})

test('preserves the server response order if display indexes are incomplete', () => {
  const result = {
    guest: true,
    partTimeLogs: [
      { partId: 'p2', partName: 'Tên B', displayIndex: 1 },
      { partId: 'p1', partName: 'Tên A', displayIndex: null },
    ],
    details: [
      { questionId: 'q1', partId: 'p1', content: 'Câu hỏi A' },
      { questionId: 'q2', partId: 'p2', content: 'Câu hỏi B' },
    ],
  }
  const html = renderToStaticMarkup(createElement(
    MemoryRouter,
    { initialEntries: [{ pathname: '/ket-qua/khach', state: { result } }] },
    createElement(Routes, null, createElement(Route, { path: '/ket-qua/:submissionId', element: createElement(ExamResultPage) })),
  ))
  const [times, answers] = html.split('Chi tiết đáp án')
  assert.ok(times.indexOf('Part 1') < times.indexOf('Part 2'))
  assert.match(times, /Part 1: Tên B/)
  assert.match(times, /Part 2: Tên A/)
  assert.ok(answers.indexOf('Câu hỏi B') < answers.indexOf('Câu hỏi A'))
})

test('labels all six shuffled parts consistently without changing their associated data', () => {
  for (const resultMode of ['practice', 'mock']) {
    const result = {
      guest: true,
      resultMode,
      partTimeLogs: [5, 2, 6, 3, 1, 4].map((number) => ({
        partId: `p${number}`,
        partName: `Part ${number}: Chủ đề ${number}`,
        displayIndex: 7 - number,
        timeSpentSeconds: number,
        recommendedTimeSeconds: 60,
      })),
      details: [1, 2, 3, 4, 5, 6].map((number) => ({
        questionId: `q${number}`, partId: `p${number}`, content: `Nội dung ${number}`,
      })),
    }
    const html = renderToStaticMarkup(createElement(
      MemoryRouter,
      { initialEntries: [{ pathname: '/ket-qua/khach', state: { result } }] },
      createElement(Routes, null, createElement(Route, { path: '/ket-qua/:submissionId', element: createElement(ExamResultPage) })),
    ))
    const [times, answers] = html.split('Chi tiết đáp án')
    for (const section of [times, answers]) {
      assert.deepEqual([...section.matchAll(/<h3[^>]*>Part (\d+): Chủ đề (\d+)<\/h3>/g)].map((match) => [Number(match[1]), Number(match[2])]), [[1, 6], [2, 5], [3, 4], [4, 3], [5, 2], [6, 1]])
    }
    const timeParts = times.split(/<h3[^>]*>Part \d+: Chủ đề \d+<\/h3>/)
    const answerParts = answers.split(/<h3[^>]*>Part \d+: Chủ đề \d+<\/h3>/)
    for (let position = 1; position <= 6; position++) {
      assert.match(answerParts[position], new RegExp(`Nội dung ${7 - position}`))
      assert.match(timeParts[position], new RegExp(`0 phút ${7 - position} giây`))
    }
  }
})

test('preserves the part title and displayed question range in both result sections', () => {
  const result = {
    guest: true,
    parts: [{ partId: 'p4', partName: 'Part 4: Tipping in Japan (Questions 18-22)' }],
    partTimeLogs: [{
      partId: 'p4', partName: 'Part 4: Tipping in Japan (Questions 18-22)',
      displayIndex: 1, timeSpentSeconds: 1, recommendedTimeSeconds: 60,
    }],
    details: [
      { questionId: 'q18', partId: 'p4', orderIndex: 18, displayNumber: 1 },
      { questionId: 'q22', partId: 'p4', orderIndex: 22, displayNumber: 5 },
    ],
  }
  const html = renderToStaticMarkup(createElement(
    MemoryRouter,
    { initialEntries: [{ pathname: '/ket-qua/khach', state: { result } }] },
    createElement(Routes, null, createElement(Route, { path: '/ket-qua/:submissionId', element: createElement(ExamResultPage) })),
  ))
  assert.equal((html.match(/Part 1: Tipping in Japan \(Questions 1-5\)/g) || []).length, 2)
  assert.doesNotMatch(html, /Part 4: Tipping/)
})

test('keeps the correct part number when an earlier part has no answer details', () => {
  const result = {
    guest: true,
    partTimeLogs: [
      { partId: 'p1', displayIndex: 1 },
      { partId: 'p2', displayIndex: 2 },
    ],
    details: [{ questionId: 'q2', partId: 'p2', content: 'Câu hỏi B' }],
  }
  const html = renderToStaticMarkup(createElement(
    MemoryRouter,
    { initialEntries: [{ pathname: '/ket-qua/khach', state: { result } }] },
    createElement(Routes, null, createElement(Route, { path: '/ket-qua/:submissionId', element: createElement(ExamResultPage) })),
  ))
  const answers = html.split('Chi tiết đáp án')[1]
  assert.match(answers, /Part 2<\/h3>/)
  assert.doesNotMatch(answers, /Part 1<\/h3>/)

  const withoutLogs = {
    guest: true,
    parts: [
      { partId: 'p2', displayIndex: 2 },
      { partId: 'p1', displayIndex: 1 },
    ],
    details: result.details,
  }
  const fallbackHtml = renderToStaticMarkup(createElement(
    MemoryRouter,
    { initialEntries: [{ pathname: '/ket-qua/khach', state: { result: withoutLogs } }] },
    createElement(Routes, null, createElement(Route, { path: '/ket-qua/:submissionId', element: createElement(ExamResultPage) })),
  ))
  assert.match(fallbackHtml.split('Chi tiết đáp án')[1], /Part 2<\/h3>/)
})

test('waits for attempt order instead of briefly displaying the original part order', () => {
  const result = {
    examId: 1,
    parts: [
      { partId: 'p1', orderIndex: 1, passageText: 'Đoạn A' },
      { partId: 'p2', orderIndex: 2, passageText: 'Đoạn B' },
    ],
    details: [
      { questionId: 'q1', partId: 'p1', content: 'Câu hỏi A' },
      { questionId: 'q2', partId: 'p2', content: 'Câu hỏi B' },
    ],
  }
  const html = renderToStaticMarkup(createElement(
    MemoryRouter,
    { initialEntries: [{ pathname: '/ket-qua/1', state: { result } }] },
    createElement(Routes, null, createElement(Route, { path: '/ket-qua/:submissionId', element: createElement(ExamResultPage) })),
  ))
  assert.match(html, /Đang xác định thứ tự Part của lượt làm/)
  assert.doesNotMatch(html, /Đoạn A|Đoạn B/)
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

test('result navigation points to the correct list above the banner', () => {
  for (const [resultMode, path, label, title] of [
    ['practice', '/luyen-de', 'Về danh sách luyện đề', 'KẾT QUẢ BÀI LÀM'],
    ['mock', '/thi-thu', 'Về danh sách thi thử', 'KẾT QUẢ THI THỬ'],
    ['homework', '/video', 'Quay lại video', 'KẾT QUẢ BÀI TẬP'],
  ]) {
    const result = { guest: true, resultMode, totalQuestions: 2, totalCorrect: 1, totalIncorrect: 1, score: 0, details: [] }
    const html = renderToStaticMarkup(createElement(
      MemoryRouter,
      { initialEntries: [{ pathname: '/ket-qua/khach', state: { result } }] },
      createElement(Routes, null, createElement(Route, { path: '/ket-qua/:submissionId', element: createElement(ExamResultPage) })),
    ))
    assert.match(html, new RegExp(`href="${path}"[^>]*>.*${label}`))
    assert.ok(html.indexOf(label) < html.indexOf(title))
    assert.match(html, /50% câu trả lời đúng/)
    assert.match(html, />0<\/p>/)
  }
})

test('mock mode in the saved result keeps its list link after reload', () => {
  const previousStorage = globalThis.sessionStorage
  globalThis.sessionStorage = {
    getItem: () => JSON.stringify({ guest: true, resultMode: 'mock', totalQuestions: 0, details: [] }),
  }
  try {
    const html = renderToStaticMarkup(createElement(
      MemoryRouter,
      { initialEntries: ['/ket-qua/khach'] },
      createElement(Routes, null, createElement(Route, { path: '/ket-qua/:submissionId', element: createElement(ExamResultPage) })),
    ))
    assert.match(html, /href="\/thi-thu"[^>]*>.*Về danh sách thi thử/)
    assert.doesNotMatch(html, /NaN%/)
  } finally {
    if (previousStorage === undefined) delete globalThis.sessionStorage
    else globalThis.sessionStorage = previousStorage
  }
})

test('guest result without exam ID does not claim visible answers are hidden', () => {
  const result = {
    guest: true,
    resultMode: 'mock',
    details: [{ questionId: 'q1', correctOpt: 'A', selectedOpt: 'A', optA: 'Answer', isCorrect: true }],
  }
  const html = renderToStaticMarkup(createElement(
    MemoryRouter,
    { initialEntries: [{ pathname: '/ket-qua/khach', state: { result } }] },
    createElement(Routes, null, createElement(Route, { path: '/ket-qua/:submissionId', element: createElement(ExamResultPage) })),
  ))
  assert.match(html, /Đáp án đúng/)
  assert.doesNotMatch(html, /đáp án được ẩn/)
})

test('compares server part durations in attempt order without treating zero as missing', () => {
  const result = {
    guest: true,
    submittedAt: '2026-11-07T10:42:10Z',
    partTimeLogs: [
      { partId: 'p3', partName: 'Part C', displayIndex: 3, timeSpentSeconds: 281, recommendedTimeSeconds: 240 },
      { partId: 'p1', partName: 'Part A', displayIndex: 1, timeSpentSeconds: 0, recommendedTimeSeconds: 60 },
      { partId: 'p2', partName: 'Part B', displayIndex: 2, timeSpentSeconds: 240, recommendedTimeSeconds: 240 },
    ],
    details: [],
  }
  const html = renderToStaticMarkup(createElement(
    MemoryRouter,
    { initialEntries: [{ pathname: '/ket-qua/khach', state: { result } }] },
    createElement(Routes, null, createElement(Route, { path: '/ket-qua/:submissionId', element: createElement(ExamResultPage) })),
  ))
  assert.ok(html.indexOf('Part 1') < html.indexOf('Part 2'))
  assert.ok(html.indexOf('Part 2') < html.indexOf('Part 3'))
  assert.match(html, /Ít hơn 1 phút 0 giây so với gợi ý/)
  assert.match(html, /Bằng thời gian gợi ý/)
  assert.match(html, /Lâu hơn 0 phút 41 giây so với gợi ý/)
  assert.match(html, /0 phút 0 giây/)
  assert.match(html, /17:42/)
  assert.match(html, /bao gồm lúc bạn rời hoặc đóng trang/)
})

test('does not compare missing or invalid durations and excludes homework', () => {
  const result = {
    guest: true,
    partTimeLogs: [
      { partId: 'p1', partName: 'Part missing', displayIndex: 1, timeSpentSeconds: null, recommendedTimeSeconds: null },
      { partId: 'p2', partName: 'Part invalid', displayIndex: 2, timeSpentSeconds: -1, recommendedTimeSeconds: 2.5 },
      { partId: 'p3', partName: 'Part zero', displayIndex: 3, timeSpentSeconds: 0, recommendedTimeSeconds: 0 },
    ],
    details: [],
  }
  const render = (value) => renderToStaticMarkup(createElement(
    MemoryRouter,
    { initialEntries: [{ pathname: '/ket-qua/khach', state: { result: value } }] },
    createElement(Routes, null, createElement(Route, { path: '/ket-qua/:submissionId', element: createElement(ExamResultPage) })),
  ))
  const html = render(result)
  assert.match(html, /Chưa ghi nhận/)
  assert.match(html, /Chưa có gợi ý/)
  assert.equal((html.match(/Dữ liệu không hợp lệ/g) || []).length, 2)
  assert.equal((html.match(/Bằng thời gian gợi ý/g) || []).length, 1)
  assert.doesNotMatch(html, /(?:Lâu hơn|Ít hơn).*so với gợi ý/)
  assert.doesNotMatch(render({ ...result, resultMode: 'homework' }), /Thời gian theo từng Part/)
})
