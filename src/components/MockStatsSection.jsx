import { useEffect, useState } from 'react'
import {
  getApiErrorMessage,
  getMockExams,
  getMockExamOverview,
  getMockExamQuestionStats,
  getMockExamTop,
} from '../services/api'
import { ExamSearchForm } from './ExamListControls'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { formatDuration, formatPercent, formatScore } from '../utils/mockStats'

const PAGE_SIZE = 10

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  )
}

export function MockStatsSection() {
  const [keywordInput, setKeywordInput] = useState('')
  const keyword = useDebouncedValue(keywordInput.trim())
  const [page, setPage] = useState(0)
  const [list, setList] = useState(null)
  const [listError, setListError] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let active = true
    getMockExams({ page, size: PAGE_SIZE, keyword, status: 'PUBLISHED' })
      .then((result) => {
        if (!active) return
        setList({ ...result, items: result.items.map((exam) => ({ ...exam, examId: exam.id })) })
        setListError('')
      })
      .catch((error) => {
        if (active) setListError(getApiErrorMessage(error, 'Không tải được danh sách đề thi thử.'))
      })
    return () => { active = false }
  }, [page, keyword])

  if (selected) {
    return <MockExamDetail exam={selected} onBack={() => setSelected(null)} />
  }

  const items = list?.items || []
  const totalPages = list?.totalPages || 0

  return (
    <section>
      <header className="mb-6 border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Thi thử</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">Thống kê đề thi thử</h1>
        <p className="mt-1 text-sm text-slate-500">Các đề MOCK đang publish. Chọn một đề để xem điểm, tỉ lệ đúng sai và bảng xếp hạng.</p>
      </header>
      <ExamSearchForm
        keywordInput={keywordInput}
        onKeywordChange={(value) => {
          setKeywordInput(value)
          setPage(0)
        }}
      />
      {listError && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{listError}</p>}
      {!list && !listError && <p className="text-sm text-slate-500">Đang tải...</p>}
      {list && items.length === 0 && <p className="rounded-lg bg-white p-6 text-center text-sm text-slate-500">Chưa có đề thi thử nào đang publish.</p>}
      <ul className="space-y-2">
        {items.map((exam) => (
          <li key={exam.examId}>
            <button
              className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-cyan-400"
              onClick={() => setSelected(exam)}
              type="button"
            >
              <span>
                <span className="block font-bold text-slate-900">{exam.title}</span>
                <span className="text-xs text-slate-500">
                  {exam.totalQuestions} câu · {exam.durationMinutes ?? '—'} phút
                  {exam.createdAt && ` · ${new Date(exam.createdAt).toLocaleDateString('vi-VN')}`}
                </span>
              </span>
              <span className="text-sm font-bold text-cyan-700">Xem thống kê →</span>
            </button>
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button className="rounded border border-slate-300 bg-white px-3 py-1.5 font-semibold disabled:opacity-40" disabled={page === 0} onClick={() => setPage(page - 1)} type="button">← Trước</button>
          <span className="text-slate-500">Trang {page + 1}/{totalPages}</span>
          <button className="rounded border border-slate-300 bg-white px-3 py-1.5 font-semibold disabled:opacity-40" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)} type="button">Sau →</button>
        </div>
      )}
    </section>
  )
}

function MockExamDetail({ exam, onBack }) {
  const [overview, setOverview] = useState(null)
  const [questions, setQuestions] = useState(null)
  const [error, setError] = useState('')
  const [limitInput, setLimitInput] = useState('5')
  const [limit, setLimit] = useState(5)
  const [top, setTop] = useState(null)
  const [topError, setTopError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getMockExamOverview(exam.examId), getMockExamQuestionStats(exam.examId)])
      .then(([overviewResult, questionResult]) => {
        if (!active) return
        setOverview(overviewResult)
        setQuestions(questionResult)
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err, 'Không tải được thống kê đề.'))
      })
    return () => { active = false }
  }, [exam.examId])

  useEffect(() => {
    let active = true
    getMockExamTop(exam.examId, limit)
      .then((result) => {
        if (!active) return
        setTop(result)
        setTopError('')
      })
      .catch((err) => {
        if (active) setTopError(getApiErrorMessage(err, 'Không tải được bảng xếp hạng.'))
      })
    return () => { active = false }
  }, [exam.examId, limit])

  function applyLimit(event) {
    event.preventDefault()
    const value = Math.min(100, Math.max(1, Number.parseInt(limitInput, 10) || 5))
    setLimitInput(String(value))
    setLimit(value)
  }

  const distribution = overview?.scoreDistribution || []
  const maxCount = Math.max(1, ...distribution.map((bucket) => bucket.count))
  const questionList = questions?.questions || []
  const noSubmissions = overview && overview.submittedCount === 0

  return (
    <section>
      <button className="mb-4 text-sm font-bold text-cyan-700 hover:underline" onClick={onBack} type="button">← Danh sách đề</button>
      <h1 className="text-2xl font-black text-slate-950">{exam.title}</h1>
      {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      {!overview && !error && <p className="mt-4 text-sm text-slate-500">Đang tải...</p>}

      {overview && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard label="Bài nộp" value={overview.submittedCount} />
            <StatCard label="Điểm TB" value={formatScore(overview.averageScore)} />
            <StatCard label="Cao nhất" value={formatScore(overview.highestScore)} />
            <StatCard label="Thấp nhất" value={formatScore(overview.lowestScore)} />
            <StatCard label="Thời gian TB" value={formatDuration(overview.averageDurationSeconds)} />
          </div>
          {noSubmissions && <p className="mt-4 rounded-lg bg-white p-4 text-sm text-slate-500">Chưa có học sinh nào nộp bài đề này.</p>}

          <h2 className="mt-8 text-lg font-extrabold text-slate-900">Phân bố điểm</h2>
          <div className="mt-3 space-y-1.5 rounded-lg border border-slate-200 bg-white p-4">
            {distribution.map((bucket) => (
              <div className="grid grid-cols-[4rem_minmax(0,1fr)_8rem] items-center gap-3 text-sm" key={bucket.label}>
                <span className="font-mono font-bold text-slate-700">{bucket.label}</span>
                <div className="h-5 rounded bg-slate-100">
                  <div className="h-5 rounded bg-cyan-500" style={{ width: `${(bucket.count / maxCount) * 100}%` }} />
                </div>
                <span className="text-right text-slate-600">{bucket.count} HS · {formatPercent(bucket.percent)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-extrabold text-slate-900">Top điểm cao nhất</h2>
        <form className="flex items-center gap-2 text-sm" onSubmit={applyLimit}>
          <label htmlFor="top-limit" className="font-semibold text-slate-600">Top</label>
          <input
            className="w-20 rounded border border-slate-300 bg-white px-2 py-1"
            id="top-limit"
            max={100}
            min={1}
            onChange={(event) => setLimitInput(event.target.value)}
            type="number"
            value={limitInput}
          />
          <button className="rounded bg-slate-900 px-3 py-1 font-bold text-white" type="submit">Xem</button>
        </form>
      </div>
      {topError && <p className="mt-3 text-sm font-semibold text-red-700">{topError}</p>}
      {top && top.items.length === 0 && <p className="mt-3 text-sm text-slate-500">Chưa có dữ liệu.</p>}
      {top && top.items.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Học sinh</th><th className="px-3 py-2">Điểm</th><th className="px-3 py-2">Đúng</th><th className="px-3 py-2">Thời gian làm</th><th className="px-3 py-2">Nộp lúc</th></tr>
            </thead>
            <tbody>
              {top.items.map((item) => (
                <tr className="border-t border-slate-100" key={item.submissionId}>
                  <td className="px-3 py-2 font-bold">{item.rank}</td>
                  <td className="px-3 py-2">{item.fullName || '—'}</td>
                  <td className="px-3 py-2 font-bold text-emerald-700">{formatScore(item.score)}</td>
                  <td className="px-3 py-2">{item.correctCount}/{item.totalQuestions}</td>
                  <td className="px-3 py-2">{formatDuration(item.durationSeconds)}</td>
                  <td className="px-3 py-2">{item.submittedAt ? new Date(item.submittedAt).toLocaleString('vi-VN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {questions && (
        <>
          <h2 className="mt-8 text-lg font-extrabold text-slate-900">Tỉ lệ đúng/sai từng câu</h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Câu</th>
                  <th className="px-3 py-2">Đáp án</th>
                  <th className="px-3 py-2">Đúng / Sai</th>
                  <th className="px-3 py-2">Tỉ lệ chọn A / B / C / D</th>
                  <th className="px-3 py-2">Bỏ trống</th>
                </tr>
              </thead>
              <tbody>
                {questionList.map((question) => (
                  <tr className="border-t border-slate-100 align-top" key={question.questionId}>
                    <td className="px-3 py-2 font-bold" title={question.partName || ''}>{question.questionNumber}</td>
                    <td className="px-3 py-2 font-bold text-emerald-700">{question.correctOpt}</td>
                    <td className="px-3 py-2">
                      <span className="font-semibold text-emerald-700">{formatPercent(question.correctPercent)}</span>
                      {' / '}
                      <span className="font-semibold text-red-600">{formatPercent(question.wrongPercent)}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {(question.optionStats || []).map((option) => (
                          <span className={option.correct ? 'font-bold text-emerald-700' : 'text-slate-600'} key={option.option}>
                            {option.option} {formatPercent(option.percent)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-500">{question.unansweredCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
