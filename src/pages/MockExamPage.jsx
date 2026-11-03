import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageIntro } from '../components/PageIntro'
import { getApiErrorMessage, getMockExams, getMockReview, getMockScores } from '../services/api'

export function MockExamPage() {
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [scores, setScores] = useState([])
  const [scoresLoading, setScoresLoading] = useState(true)
  const [scoresError, setScoresError] = useState('')
  const [reviewingId, setReviewingId] = useState('')

  async function handleReview(examId) {
    setReviewingId(examId)
    try {
      const review = await getMockReview(examId)
      const reviewId = review.submissionId || examId
      sessionStorage.setItem(`exam-result:${reviewId}`, JSON.stringify(review))
      navigate(`/ket-qua/${reviewId}`, { state: { result: review } })
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải bài review. Vui lòng thử lại.'))
    } finally {
      setReviewingId('')
    }
  }

  useEffect(() => {
    async function loadMockPage() {
      try {
        const items = await getMockExams()
        setExams(items)
        setLoading(false)

        try {
          const scoreItems = await getMockScores()
          setScores(scoreItems)
          setExams(
            items.map((exam) => ({
              ...exam,
              latestScore:
                scoreItems
                  .filter((score) => (score.examId || score.exam_id) === exam.id)
                  .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0] || null,
            })),
          )
        } catch (requestError) {
          setScoresError(getApiErrorMessage(requestError, 'Không thể tải lịch sử điểm thi thử.'))
        } finally {
          setScoresLoading(false)
        }
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Không thể tải danh sách đề thi thử. Vui lòng thử lại.'))
        setLoading(false)
        setScoresLoading(false)
      }
    }

    loadMockPage()
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <PageIntro
        description="Chọn một đề thi thử để làm bài trong thời gian quy định. Bài sẽ tự động nộp khi hết giờ."
        eyebrow="Kiểm tra năng lực"
        title="Thi thử"
      />
      {loading && <p className="text-slate-500">Đang tải danh sách đề thi...</p>}
      {error && <p className="rounded-lg bg-red-50 p-4 text-red-600">{error}</p>}
      {scoresError && <p className="mt-4 rounded-lg bg-amber-50 p-4 text-amber-700">{scoresError}</p>}
      <ScoreChart error={scoresError} loading={scoresLoading} scores={scores} />
      {!loading && !error && exams.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Chưa có đề thi thử nào được phát hành.
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {exams.map((exam) => (
          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" key={exam.id}>
            <span className="text-sm font-bold uppercase tracking-wider text-cyan-600">MOCK</span>
            <h2 className="mt-3 text-xl font-bold text-slate-900">
              {exam.title || exam.name || 'Đề thi thử'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {exam.durationMinutes || exam.duration || exam.timeLimitMinutes || 0} phút ·{' '}
              {exam.totalQuestions || exam.questionCount || 'Nhiều'} câu hỏi
            </p>
            {exam.latestScore && (
              <p className="mt-3 text-sm font-bold text-emerald-600">Điểm gần nhất: {exam.latestScore.score ?? '—'}</p>
            )}
            {exam.latestScore ? (
              <button className="mt-6 rounded-lg bg-slate-900 px-4 py-3 font-bold text-white" disabled={reviewingId === exam.id} onClick={() => handleReview(exam.id)} type="button">
                {reviewingId === exam.id ? 'Đang tải...' : 'Review bài thi'}
              </button>
            ) : (
              <Link className="mt-6 inline-flex justify-center rounded-lg bg-cyan-500 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-400" to={`/thi-thu/${exam.id}`}>
                Vào phòng thi
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

function ScoreChart({ error, loading, scores }) {
  if (loading) {
    return <p className="mt-8 text-sm text-slate-500">Đang tải biểu đồ năng lực...</p>
  }

  if (error || !scores.length) {
    return (
      <section className="mb-10 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
        Chưa có dữ liệu điểm thi thử để vẽ biểu đồ.
      </section>
    )
  }
  const chartData = [...scores]
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
    .map((item, index) => ({
      ...item,
      chartDate: formatChartDate(item.submittedAt),
      chartKey: `${formatChartDate(item.submittedAt)}-${index}`,
      score: Number(item.score) || 0,
    }))

  return (
    <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-cyan-600">Theo dõi tiến bộ</p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Xu hướng năng lực thi thử</h2>
        </div>
        <p className="text-sm text-slate-500">Điểm theo ngày làm bài</p>
      </div>
      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 24, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
            <XAxis
              axisLine={{ stroke: '#cbd5e1' }}
              dataKey="chartKey"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => String(value).split('-').slice(0, 2).join('-')}
            />
            <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 12 }} tickCount={6} />
            <Tooltip content={<ScoreTooltip />} />
            <Line dataKey="score" dot={{ fill: '#0891b2', r: 5, strokeWidth: 2, stroke: '#fff' }} stroke="#0891b2" strokeWidth={3} type="monotone">
              <LabelList dataKey="score" fill="#0e7490" offset={12} position="top" />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function formatChartDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value))
}

function ScoreTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const point = payload[0]
  const item = point.payload || {}
  const score = Number(point.value ?? item.score)

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-lg">
      <p className="font-bold text-slate-900">{item.examTitle || 'Bài thi thử'}</p>
      <p className="mt-1 text-cyan-700">Điểm: <strong>{Number.isFinite(score) ? score : '—'}</strong></p>
      <p className="text-slate-500">Ngày làm: {item.submittedAt ? formatChartDate(item.submittedAt) : item.chartDate || '—'}</p>
    </div>
  )
}
