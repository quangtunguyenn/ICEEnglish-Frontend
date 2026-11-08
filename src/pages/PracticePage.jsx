import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ExamPager, ExamSearchForm } from '../components/ExamListControls'
import { PageIntro } from '../components/PageIntro'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { getApiErrorMessage, getGeneralExams } from '../services/api'

const PAGE_SIZE = 12

export function PracticePage() {
  const location = useLocation()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [keywordInput, setKeywordInput] = useState('')
  const keyword = useDebouncedValue(keywordInput.trim())

  useEffect(() => {
    let active = true
    getGeneralExams({ page, size: PAGE_SIZE, keyword })
      .then((result) => {
        if (!active) return
        setExams(result.items)
        setTotalPages(result.totalPages)
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError, 'Không thể tải danh sách bài thi. Vui lòng thử lại.'))
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [keyword, page, retry])

  function retryLoading() {
    setError('')
    setLoading(true)
    setRetry((current) => current + 1)
  }

  function changePage(nextPage) {
    setLoading(true)
    setPage(nextPage)
  }

  function changeKeyword(value) {
    setKeywordInput(value)
    setPage(0)
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <PageIntro
        description="Chọn một bài thi đã được phát hành và bắt đầu luyện tập theo tốc độ của bạn."
        eyebrow="Luyện tập"
        title="Luyện đề"
      />
      {location.state?.submitted && (
        <p className="mb-6 rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          Bài làm đã được nộp thành công.
        </p>
      )}
      <ExamSearchForm keywordInput={keywordInput} onKeywordChange={changeKeyword} />
      {loading && <p className="text-slate-500">Đang tải danh sách bài thi...</p>}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-600" role="alert">
          <p>{error}</p>
          <button className="mt-2 font-semibold underline" onClick={retryLoading} type="button">Thử lại</button>
        </div>
      )}
      {!loading && !error && exams.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          {keyword ? 'Không tìm thấy bài thi phù hợp.' : 'Chưa có bài thi nào được phát hành.'}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {exams.map((exam) => (
          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" key={exam.id}>
            <span className="text-sm font-bold uppercase tracking-wider text-cyan-600">
              {exam.mode || 'GENERAL_EXAM'}
            </span>
            <h2 className="mt-3 text-xl font-bold text-slate-900">
              {exam.title || exam.name || 'Bài luyện đề'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {exam.durationMinutes || exam.duration || 0} phút · {exam.totalQuestions || exam.questionCount || 'Nhiều'} câu hỏi
            </p>
            {exam.latestScore != null && (
              <>
                <p className="mt-3 text-sm font-bold text-emerald-600">
                  Điểm gần nhất: {exam.latestScore}
                </p>
                <Link
                  className="mt-3 text-sm font-bold text-cyan-800 underline decoration-cyan-300 underline-offset-4 hover:text-cyan-950"
                  to={`/luyen-de/${encodeURIComponent(exam.id)}/lich-su`}
                >
                  Xem danh sách bài đã làm
                </Link>
              </>
            )}
            <Link
              className="mt-6 inline-flex justify-center rounded-lg bg-cyan-500 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
              to={`/luyen-de/${exam.id}`}
            >
              Làm bài thi
            </Link>
          </article>
        ))}
      </div>
      <ExamPager onPageChange={changePage} page={page} totalPages={totalPages} />
    </div>
  )
}
