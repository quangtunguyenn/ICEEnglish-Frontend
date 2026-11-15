import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageIntro } from '../components/PageIntro'
import { getApiErrorMessage, getPracticeHistory } from '../services/api'
import { formatPracticeSubmissionDate } from '../utils/practiceHistory'

const PAGE_SIZE = 20
const CHART = { W: 600, H: 140, P: 14 }

const ICONS = {
  back: 'M10 19l-7-7m0 0l7-7m-7 7h18',
  prev: 'M15 19l-7-7 7-7',
  next: 'M9 5l7 7-7 7',
  chevron: 'M8.25 4.5l7.5 7.5-7.5 7.5',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  empty: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
}

function Icon({ name, className = 'h-4 w-4', strokeWidth = 2 }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} viewBox="0 0 24 24">
      <path d={ICONS[name]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const toScore = (item) => {
  const value = item.score == null || item.score === '' ? null : Number(item.score)
  return Number.isFinite(value) ? value : null
}
const formatScore = (value) => value.toLocaleString('vi-VN', { maximumFractionDigits: 2 })
const scoreTone = (value) =>
  value >= 8 ? 'bg-emerald-50 text-emerald-700' : value >= 5 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'

const DAY_FORMAT = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
const dayKey = (iso) => DAY_FORMAT.format(new Date(iso))
const dayLabel = (key) => `${key.slice(8)}/${key.slice(5, 7)}`
const scrollToTop = () =>
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })

/* ───────────── Biểu đồ: đường điểm số, hoặc số lần làm theo ngày nếu chưa có điểm ───────────── */

function ChartCard({ stat, unit, note, label, axis, children }) {
  return (
    <section aria-label={label} className="mt-8 grid gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[200px_1fr] md:items-center md:p-6">
      <div>
        <p className="font-momo text-4xl font-bold leading-none text-ice-navy">
          {stat}
          <span className="ml-1 text-sm font-medium text-slate-400">{unit}</span>
        </p>
        <p className="mt-2 text-sm text-slate-500">{note}</p>
      </div>
      <div>
        <svg aria-label={label} className="block h-auto w-full overflow-visible text-ice-navy" role="img" viewBox={`0 0 ${CHART.W} ${CHART.H}`}>
          {children}
        </svg>
        <div className="mt-1.5 flex justify-between text-xs tabular-nums text-slate-400">
          <span>{axis[0]}</span>
          <span>{axis[1]}</span>
        </div>
      </div>
    </section>
  )
}

function PracticeChart({ items, scoped }) {
  const { W, H, P } = CHART
  const chrono = [...items].sort((a, b) => Date.parse(a.submittedAt) - Date.parse(b.submittedAt))
  if (chrono.length < 2) return null
  const scope = scoped ? ' trong trang này' : ''
  const axis = [dayLabel(dayKey(chrono[0].submittedAt)), dayLabel(dayKey(chrono[chrono.length - 1].submittedAt))]
  const scores = chrono.map(toScore)

  if (scores.every((value) => value !== null)) {
    const top = Math.max(10, ...scores)
    const x = (i) => P + (i * (W - 2 * P)) / (scores.length - 1)
    const y = (v) => H - P - (Math.max(v, 0) / top) * (H - 2 * P)
    const points = scores.map((v, i) => [x(i), y(v)])
    const line = 'M' + points.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join('L')
    const best = Math.max(...scores)
    const bestAt = points[scores.indexOf(best)]
    const last = points[points.length - 1]
    const gain = scores[scores.length - 1] - scores[0]
    return (
      <ChartCard
        axis={axis}
        label={`Biểu đồ điểm qua ${scores.length} lần làm`}
        note={<>Điểm cao nhất{scope}. {gain >= 0 ? 'Tăng' : 'Giảm'} <strong className="font-semibold text-slate-800">{formatScore(Math.abs(gain))} điểm</strong> so với lần đầu.</>}
        stat={formatScore(best)}
        unit="điểm"
      >
        <path d={`${line}L${x(scores.length - 1)} ${H - P}L${x(0)} ${H - P}Z`} fill="currentColor" opacity="0.1" />
        <path d={line} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        <circle cx={bestAt[0]} cy={bestAt[1]} fill="white" r="5" stroke="currentColor" strokeWidth="2.5" />
        <circle cx={last[0]} cy={last[1]} fill="currentColor" r="5" />
      </ChartCard>
    )
  }

  const counts = new Map()
  chrono.forEach((item) => counts.set(dayKey(item.submittedAt), (counts.get(dayKey(item.submittedAt)) || 0) + 1))
  const days = [...counts.values()]
  if (days.length < 2) return null
  const max = Math.max(...days)
  const gap = 6
  const bw = Math.min(40, (W - 2 * P - gap * (days.length - 1)) / days.length)
  const left = (W - (days.length * bw + gap * (days.length - 1))) / 2
  return (
    <ChartCard
      axis={axis}
      label={`Số lần làm trong ${days.length} ngày`}
      note={<>Trải trên <strong className="font-semibold text-slate-800">{days.length} ngày</strong>{scope}. Ngày làm nhiều nhất: {max} lần.</>}
      stat={chrono.length}
      unit="lần làm"
    >
      {days.map((count, i) => {
        const h = (count / max) * (H - 2 * P)
        return <rect key={i} fill="currentColor" height={h} opacity="0.85" rx="4" width={bw} x={left + i * (bw + gap)} y={H - P - h} />
      })}
    </ChartCard>
  )
}

/* ───────────── Thành phần giao diện ───────────── */

function ListSkeleton() {
  return (
    <div aria-hidden="true" className="mt-4 animate-pulse space-y-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex-1 space-y-3">
            <div className="h-4 w-2/5 rounded bg-slate-100" />
            <div className="h-2 w-1/3 rounded bg-slate-100" />
          </div>
          <div className="h-8 w-16 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

function HistoryRow({ item, attempt }) {
  const score = toScore(item)
  const hasCorrect = item.totalCorrect != null && item.totalQuestions > 0
  const percent = hasCorrect ? Math.min(100, Math.round((item.totalCorrect / item.totalQuestions) * 100)) : 0
  return (
    <li>
      <Link
        className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-ice-navy/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice-navy/40 motion-safe:hover:-translate-y-0.5 sm:p-5"
        to={`/luyen-de/bai-lam/${encodeURIComponent(item.submissionId)}`}
      >
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="text-base font-bold text-slate-900">Lần {attempt}</span>
            <time className="text-sm tabular-nums text-slate-500" dateTime={item.submittedAt}>
              {formatPracticeSubmissionDate(item.submittedAt)}
            </time>
          </p>
          {hasCorrect ? (
            <div className="mt-2.5 flex items-center gap-3">
              <div className="h-1.5 w-full max-w-[12rem] overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
              </div>
              <span className="whitespace-nowrap text-sm font-medium text-emerald-700">
                {item.totalCorrect}/{item.totalQuestions} câu đúng
              </span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-500">Xem chi tiết bài làm</p>
          )}
        </div>

        {score !== null ? (
          <span className={`font-momo shrink-0 rounded-full px-3.5 py-1.5 text-lg font-bold tabular-nums ${scoreTone(score)}`}>
            {formatScore(score)}
            <span className="ml-1 text-xs font-medium opacity-70">điểm</span>
          </span>
        ) : (
          <span className="shrink-0 text-slate-300">--</span>
        )}

        <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors duration-200 group-hover:bg-ice-navy group-hover:text-white sm:flex">
          <Icon className="h-5 w-5" name="chevron" strokeWidth={2.5} />
        </span>
      </Link>
    </li>
  )
}

const pagerButton =
  'inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice-navy/40 disabled:pointer-events-none disabled:opacity-40'

function PracticeHistoryContent({ examId }) {
  const [page, setPage] = useState(0)
  const [retry, setRetry] = useState(0)
  const [loaded, setLoaded] = useState(null)

  const requestKey = `${examId}:${page}:${retry}`
  const isCurrent = loaded?.key === requestKey
  const error = isCurrent ? loaded.error : null
  const history = loaded?.history && loaded.examId === examId ? loaded.history : null
  const isLoading = !isCurrent

  useEffect(() => {
    let active = true
    getPracticeHistory(examId, page, PAGE_SIZE)
      .then((result) => {
        if (active) setLoaded({ key: requestKey, examId, history: result })
      })
      .catch((err) => {
        if (active) setLoaded({ key: requestKey, examId, error: getApiErrorMessage(err, 'Không thể tải lịch sử bài làm.') })
      })
    return () => { active = false }
  }, [examId, page, requestKey])

  const goTo = (nextPage) => {
    setPage(nextPage)
    scrollToTop()
  }
  const hasItems = Boolean(history && history.items.length > 0)

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <Link
        className="mb-6 inline-flex items-center gap-2 rounded-md text-sm font-semibold text-slate-500 transition-colors hover:text-ice-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice-navy/40"
        to="/luyen-de"
      >
        <Icon name="back" />
        Trở về danh sách luyện đề
      </Link>

      <PageIntro
        description={history?.examTitle || 'Danh sách các lần nộp bài và thành tích của bạn.'}
     
        title="LỊCH SỬ LUYỆN TẬP"
      />

      <div aria-busy={isLoading} aria-live="polite">
        {isLoading && !history && <ListSkeleton />}

        {error && (
          <div className="mt-8 flex flex-col items-center rounded-2xl bg-red-50 p-8 text-center" role="alert">
            <Icon className="mb-3 h-8 w-8 text-red-500" name="warning" />
            <p className="font-medium text-red-800">{error}</p>
            <button
              className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              onClick={() => setRetry((value) => value + 1)}
              type="button"
            >
              Thử lại
            </button>
          </div>
        )}

        {history && !hasItems && (
          <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <Icon className="mb-3 h-10 w-10 text-slate-400" name="empty" strokeWidth={1.5} />
            <p className="text-lg font-semibold text-slate-700">
              {history.totalElements === 0 ? 'Bạn chưa làm bài đề này' : 'Không có bài làm ở trang này'}
            </p>
            <p className="mt-1 text-sm text-slate-500">Mỗi lần nộp bài sẽ được lưu lại để bạn xem điểm và xem lại từng câu.</p>
            {history.totalElements === 0 ? (
              <Link className="mt-5 rounded-lg bg-ice-navy px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90" to="/luyen-de">
                Chọn đề để luyện tập
              </Link>
            ) : (
              <button className="mt-5 rounded-lg bg-ice-navy px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90" onClick={() => goTo(0)} type="button">
                Về trang đầu
              </button>
            )}
          </div>
        )}

        {hasItems && (
          <div className={isLoading ? 'pointer-events-none opacity-50 transition-opacity' : 'transition-opacity'}>
            <PracticeChart items={history.items} key={history.page} scoped={history.totalPages > 1} />
            <p className="mb-3 mt-8 text-sm font-medium text-slate-500">{history.totalElements} lần nộp bài</p>
            <ul className="space-y-4">
              {history.items.map((item, index) => (
                <HistoryRow attempt={history.totalElements - (history.page * PAGE_SIZE + index)} item={item} key={item.submissionId} />
              ))}
            </ul>
          </div>
        )}
      </div>

      {history && history.totalPages > 1 && (
        <nav aria-label="Phân trang lịch sử" className="mt-10 flex items-center justify-center gap-4">
          <button className={pagerButton} disabled={page === 0 || isLoading} onClick={() => goTo(page - 1)} type="button">
            <Icon name="prev" />
            Trước
          </button>
          <span className="text-sm font-medium text-slate-500">
            Trang <span className="font-bold text-slate-900">{page + 1}</span> / {history.totalPages}
          </span>
          <button className={pagerButton} disabled={page + 1 >= history.totalPages || isLoading} onClick={() => goTo(page + 1)} type="button">
            Sau
            <Icon name="next" />
          </button>
        </nav>
      )}
    </div>
  )
}

/** key={examId}: đổi đề sẽ đặt lại trang và không hiển thị dữ liệu của đề trước. */
export function PracticeHistoryPage() {
  const { examId } = useParams()
  return <PracticeHistoryContent examId={examId} key={examId} />
}