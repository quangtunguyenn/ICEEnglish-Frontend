import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getApiErrorMessage, getExamAnswersRevealed, getSubmissionPartLogs } from '../services/api'
import { formatInlineText } from '../utils/textFormatting'
import { formatPracticeSubmissionDate } from '../utils/practiceHistory'

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

function groupQuestionsByPart(result) {
  const details = result?.details || []
  const translations = new Map(
    (result?.partTranslations || []).map((part) => [part.partId, part]),
  )
  const parts = [...(result?.parts || [])].sort(
    (first, second) => (first.orderIndex ?? 0) - (second.orderIndex ?? 0),
  )
  const groups = new Map(parts.map((part) => [part.partId, {
    key: part.partId,
    name: part.partName,
    passageText: part.passageText || part.passage_text || '',
    translate: translations.get(part.partId)?.translate || '',
    questions: [],
  }]))

  details.forEach((question) => {
    const key = question.partId || 'ungrouped'
    if (!groups.has(key)) {
      const translation = translations.get(key)
      groups.set(key, {
        key,
        name: translation?.partName || '',
        passageText: translation?.passage_text || translation?.passageText || '',
        translate: translation?.translate || '',
        questions: [],
      })
    }
    groups.get(key).questions.push(question)
  })

  return [...groups.values()]
    .filter((group) => group.questions.length > 0)
    .map((group) => ({
      ...group,
      questions: [...group.questions].sort(
        (first, second) => (first.orderIndex ?? 0) - (second.orderIndex ?? 0),
      ),
    }))
}

export function ExamResultPage({ resultOverride, returnTo, returnLabel }) {
  const { submissionId } = useParams()
  const location = useLocation()
  const result = resultOverride || location.state?.result || readStoredResult(submissionId)
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
  const answerParts = useMemo(() => groupQuestionsByPart(result), [result])

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
            Nộp lúc: {resultOverride ? formatPracticeSubmissionDate(result.submittedAt) : formatDate(result.submittedAt)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900 px-8 py-5 text-center text-white">
          <p className="text-sm text-slate-300">Điểm số</p>
          <p className="mt-1 text-4xl font-black text-cyan-400">{result.score ?? 0}</p>
          <p className="text-xs text-slate-400">{percentage}%</p>
        </div>
      </div>

      {location.state?.submissionWarnings?.map((warning) => (
        <p className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-800" key={warning}>
          {warning}
        </p>
      ))}

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
            {currentAnswerReveal.error || 'Đề thi chưa công bố đáp án. Bạn vẫn có thể xem lựa chọn và video ôn tập nếu có.'}
          </p>
        )}
        {!examId && (
          <p className="mt-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            Không xác định được đề thi nên đáp án được ẩn.
          </p>
        )}
        <div className="mt-4 space-y-8">
          {answerParts.map((part) => (
            <section className="space-y-4" key={part.key}>
              {part.name && <h3 className="text-lg font-extrabold text-slate-900">{part.name}</h3>}
              {part.passageText && <PartPassage part={part} />}
              {part.questions.map((question) => (
                <QuestionResult
                  key={question.questionId}
                  question={question}
                  showAnswer={answersRevealed}
                  showVideo={!location.state?.hideVideos}
                />
              ))}
            </section>
          ))}
        </div>
      </section>

      <Link className="mt-10 inline-flex rounded-lg bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-700" to={returnTo || location.state?.returnTo || '/luyen-de'}>
        {returnLabel || (location.state?.returnTo ? 'Quay lại video' : 'Làm bài khác')}
      </Link>
    </div>
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

function PartPassage({ part }) {
  return (
    <article className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-5">
      <div className={part.translate ? 'grid gap-5 lg:grid-cols-2' : ''}>
        <div>
          <h4 className="text-sm font-bold text-cyan-700">{part.translate ? 'Nguyên văn' : 'Bài đọc'}</h4>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{part.passageText}</p>
        </div>
        {part.translate && (
          <div>
            <h4 className="text-sm font-bold text-emerald-700">Bản dịch tiếng Việt</h4>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{part.translate}</p>
          </div>
        )}
      </div>
    </article>
  )
}

const optionKeys = ['A', 'B', 'C', 'D']

function QuestionResult({ question, showAnswer, showVideo = true }) {
  const isCorrect = question.isCorrect === true
  const video = showVideo ? question.relatedVideo || question.related_video : null
  const videoId = video?.videoId ?? video?.video_id ?? video?.id
  const videoTitle = video?.videoTitle || video?.video_title || video?.title
  const hasVideoId = videoId != null && String(videoId).trim() !== ''

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
      <ul className="mt-4 grid gap-2">
        {optionKeys.map((key) => {
          const text = question[`opt${key}`]
          if (text == null || text === '') return null
          const selected = question.selectedOpt === key
          const correct = showAnswer && question.correctOpt === key
          const tone = correct
            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
            : selected
              ? showAnswer ? 'border-red-300 bg-red-50 text-red-900' : 'border-cyan-300 bg-cyan-50 text-cyan-900'
              : 'border-slate-200 text-slate-700'

          return (
            <li className={`flex flex-wrap items-start gap-2 rounded-lg border px-3 py-2 text-sm ${tone}`} key={key}>
              <span
                className="min-w-0 flex-1"
                dangerouslySetInnerHTML={{ __html: `<strong>${key}.</strong> ${formatInlineText(text)}` }}
              />
              {selected && <span className="text-xs font-bold">Bạn chọn</span>}
              {correct && <span className="text-xs font-bold">Đáp án đúng</span>}
            </li>
          )
        })}
      </ul>
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
      {video && hasVideoId && (
        <Link
          className="mt-4 inline-flex items-center rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-800 hover:border-cyan-400 hover:bg-cyan-100"
          state={{ selectedTitle: videoTitle }}
          to={`/video?videoId=${encodeURIComponent(videoId)}`}
        >
          Xem video ôn tập{videoTitle ? `: ${videoTitle}` : ''}
        </Link>
      )}
      {video && !hasVideoId && (
        <div className="mt-4 text-sm font-semibold text-amber-800">
          {videoTitle && <p>Video ôn tập: {videoTitle}</p>}
          <p>Không thể mở video ôn tập vì dữ liệu chưa có video ID.</p>
        </div>
      )}
    </article>
  )
}
