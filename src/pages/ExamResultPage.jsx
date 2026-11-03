import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getApiErrorMessage, getSubmissionPartLogs } from '../services/api'
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

  if (!result) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">Không tìm thấy kết quả</h1>
        <p className="mt-3 text-slate-500">Kết quả có thể đã hết phiên lưu trữ.</p>
        <Link className="mt-6 inline-flex rounded-lg bg-cyan-500 px-5 py-3 font-bold text-slate-950" to="/luyen-de">
          Về danh sách luyện đề
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
        <h2 className="text-2xl font-extrabold text-slate-900">Chi tiết đáp án</h2>
        <div className="mt-4 space-y-4">
          {(result.details || []).map((question) => (
            <QuestionResult key={question.questionId} question={question} />
          ))}
        </div>
      </section>

      <Link className="mt-10 inline-flex rounded-lg bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-700" to="/luyen-de">
        Làm bài khác
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

function QuestionResult({ question }) {
  const isCorrect = question.isCorrect === true
  const video = question.relatedVideo

  return (
    <article className={`rounded-xl border bg-white p-5 shadow-sm ${isCorrect ? 'border-emerald-200' : 'border-red-200'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p
          className="font-bold text-slate-900"
          dangerouslySetInnerHTML={{
            __html: `Câu ${question.orderIndex}. ${formatInlineText(question.content)}`,
          }}
        />
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {isCorrect ? 'Đúng' : 'Sai'}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <span className="text-slate-600">Bạn chọn: <strong>{question.selectedOpt || 'Chưa chọn'}</strong></span>
        <span className="text-slate-600">Đáp án đúng: <strong>{question.correctOpt || '—'}</strong></span>
      </div>
      {question.explanation && (
        <p
          className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600"
          dangerouslySetInnerHTML={{
            __html: formatInlineText(question.explanation).replace(/\n/g, '<br>'),
          }}
        />
      )}
      {!isCorrect && video && (
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
