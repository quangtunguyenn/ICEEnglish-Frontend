import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getApiErrorMessage, getExamAnswersRevealed, getSubmissionPartLogs } from '../services/api'
import { formatInlineText } from '../utils/textFormatting'

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDuration(seconds) {
  const totalSeconds = Number(seconds) || 0
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60
  return `${minutes} phút ${remainingSeconds} giây`
}

function readStoredResult(submissionId) {
  const stored = sessionStorage.getItem(`exam-result:${submissionId}`)
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function ExamResultPage() {
  const { submissionId } = useParams()
  const location = useLocation()
  const result = location.state?.result || readStoredResult(submissionId)
  const [partTimeLogs, setPartTimeLogs] = useState(result?.partTimeLogs || [])
  const [partLogsLoading, setPartLogsLoading] = useState(Boolean(submissionId))
  const [partLogsError, setPartLogsError] = useState('')
  const [answerReveal, setAnswerReveal] = useState(null)
  const examId = result?.examId || result?.exam_id

  useEffect(() => {
    if (!examId) return

    let active = true
    getExamAnswersRevealed(examId)
      .then((revealed) => {
        if (active) setAnswerReveal({ examId, revealed, error: '' })
      })
      .catch(() => {
        if (active) setAnswerReveal({ examId, revealed: false, error: 'Không thể xác minh trạng thái công bố đáp án.' })
      })

    return () => {
      active = false
    }
  }, [examId])

  useEffect(() => {
    if (!submissionId) return

    getSubmissionPartLogs(submissionId)
      .then(setPartTimeLogs)
      .catch((requestError) => {
        setPartLogsError(getApiErrorMessage(requestError, 'Không thể tải thời gian làm bài.'))
      })
      .finally(() => setPartLogsLoading(false))
  }, [submissionId])

  const percentage = useMemo(() => {
    if (!result?.totalQuestions) return 0
    return Math.round((result.totalCorrect / result.totalQuestions) * 100)
  }, [result])
  const currentAnswerReveal = answerReveal?.examId === examId ? answerReveal : null
  const answersRevealed = currentAnswerReveal?.revealed === true
  const readingTranslations = (result?.partTranslations || []).filter((part) =>
    ['READING_8', 'READING_10'].includes(String(part.partType || '').toUpperCase()),
  )
  const translationsByType = readingTranslations.reduce((translations, part) => {
    const partType = String(part.partType || '').toUpperCase()
    translations.set(partType, [...(translations.get(partType) || []), part])
    return translations
  }, new Map())
  const displayedTranslationCounts = new Map()
  const answerItems = (result?.details || []).flatMap((question) => {
    const partType = String(question.part_type || question.partType || '').toUpperCase()
    const translations = translationsByType.get(partType) || []
    const translationIndex = displayedTranslationCounts.get(partType) || 0
    const translation = translations[translationIndex]

    if (!translation) {
      return [{ type: 'question', question }]
    }

    displayedTranslationCounts.set(partType, translationIndex + 1)
    return [
      { type: 'translation', part: translation },
      { type: 'question', question },
    ]
  })

  if (!result) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">Không tìm thấy kết quả</h1>
        <p className="mt-3 text-slate-500">Kết quả có thể đã hết phiên lưu trữ.</p>
        <Link className="mt-6 inline-flex rounded-lg bg-cyan-500 px-5 py-3 font-bold text-slate-950" to={location.state?.returnTo || '/luyen-de'}>
          {location.state?.returnTo ? 'Quay lại video' : 'Về danh sách luyện đề'}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-600">Kết quả bài thi</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
            {result.examTitle || 'Bài luyện đề'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Nộp lúc: {formatDate(result.submittedAt)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900 px-8 py-5 text-center text-white">
          <p className="text-sm text-slate-300">Điểm số</p>
          <p className="mt-1 text-4xl font-black text-cyan-400">{result.score ?? 0}</p>
          <p className="text-xs text-slate-400">{percentage}%</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Tổng số câu" value={result.totalQuestions ?? 0} />
        <SummaryCard label="Câu đúng" value={result.totalCorrect ?? 0} valueClass="text-emerald-600" />
        <SummaryCard label="Câu sai" value={result.totalIncorrect ?? 0} valueClass="text-red-600" />
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-extrabold text-slate-900">Thời gian theo từng Part</h2>
        {partLogsLoading && <p className="mt-4 text-sm text-slate-500">Đang tải thời gian làm bài...</p>}
        {partLogsError && (
          <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">{partLogsError}</p>
        )}
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {partTimeLogs.map((part) => (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={part.partId}>
              <p className="font-bold text-slate-900">{part.partName || 'Part'}</p>
              <p className="mt-2 text-2xl font-extrabold text-cyan-600">
                {formatDuration(part.timeSpentSeconds)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-extrabold text-slate-900">
          {answersRevealed ? 'Chi tiết đáp án' : 'Chi tiết câu trả lời'}
        </h2>
        {!currentAnswerReveal && examId && (
          <p className="mt-3 text-sm text-slate-500">Đang kiểm tra trạng thái công bố đáp án...</p>
        )}
        {currentAnswerReveal && !answersRevealed && (
          <p className="mt-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            {currentAnswerReveal.error || 'Đề thi chưa công bố đáp án. Bạn chỉ có thể xem lựa chọn của mình.'}
          </p>
        )}
        {!examId && (
          <p className="mt-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            Không xác định được đề thi nên đáp án được ẩn.
          </p>
        )}
        <div className="mt-4 space-y-4">
          {answerItems.map((item) => item.type === 'translation' ? (
            <PartTranslation key={`translation-${item.part.partId}`} part={item.part} />
          ) : (
            <QuestionResult
              key={item.question.questionId}
              question={item.question}
              showAnswer={answersRevealed}
            />
          ))}
        </div>
      </section>

      <Link className="mt-10 inline-flex rounded-lg bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-700" to={location.state?.returnTo || '/luyen-de'}>
        {location.state?.returnTo ? 'Quay lại video' : 'Làm bài khác'}
      </Link>
    </div>
  )
}

function PartTranslation({ part }) {
  return (
    <article className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-5">
      <h3 className="font-bold text-slate-900">{part.partName || 'Bài đọc'}</h3>
      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-bold text-cyan-700">Nguyên văn</h4>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {part.passage_text || part.passageText || 'Chưa có nội dung bài đọc.'}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold text-emerald-700">Bản dịch tiếng Việt</h4>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {part.translate || 'Chưa có bản dịch.'}
          </p>
        </div>
      </div>
    </article>
  )
}

function SummaryCard({ label, value, valueClass = 'text-slate-900' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-black ${valueClass}`}>{value}</p>
    </div>
  )
}

function QuestionResult({ question, showAnswer }) {
  const isCorrect = question.isCorrect === true
  const video = question.relatedVideo

  return (
    <article className={`rounded-xl border bg-white p-5 shadow-sm ${showAnswer ? (isCorrect ? 'border-emerald-200' : 'border-red-200') : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p
          className="font-bold text-slate-900"
          dangerouslySetInnerHTML={{
            __html: `Câu ${question.orderIndex}. ${formatInlineText(question.content)}`,
          }}
        />
        {showAnswer && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {isCorrect ? 'Đúng' : 'Sai'}
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <span className="text-slate-600">Bạn chọn: <strong>{question.selectedOpt || 'Chưa chọn'}</strong></span>
        {showAnswer && (
          <span className="text-slate-600">Đáp án đúng: <strong>{question.correctOpt || '—'}</strong></span>
        )}
      </div>
      {showAnswer && question.explanation && (
        <p
          className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600"
          dangerouslySetInnerHTML={{
            __html: formatInlineText(question.explanation).replace(/\n/g, '<br>'),
          }}
        />
      )}
      {showAnswer && !isCorrect && video && (
        <a
          className="mt-4 inline-flex text-sm font-bold text-cyan-700 hover:text-cyan-900"
          href={video.video_url || video.videoUrl}
          rel="noreferrer"
          target="_blank"
        >
          Xem video ôn tập: {video.videoTitle}
        </a>
      )}
    </article>
  )
}
