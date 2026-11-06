import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage, getPracticeSubmissionReview } from '../services/api'
import { ExamResultPage } from './ExamResultPage'

export function PracticeReviewPage() {
  const { submissionId } = useParams()
  const [retry, setRetry] = useState(0)
  const [loaded, setLoaded] = useState(null)
  const requestKey = `${submissionId}:${retry}`
  const current = loaded?.key === requestKey ? loaded : null

  useEffect(() => {
    let active = true
    getPracticeSubmissionReview(submissionId)
      .then((result) => {
        if (active) setLoaded({ key: requestKey, result })
      })
      .catch((error) => {
        if (active) setLoaded({ key: requestKey, error: getApiErrorMessage(error, 'Không thể tải chi tiết bài làm.') })
      })
    return () => { active = false }
  }, [submissionId, requestKey])

  if (!current) return <div className="p-12 text-center text-slate-600">Đang tải chi tiết bài làm...</div>
  if (current.error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-red-600" role="alert">{current.error}</p>
        <button className="mt-4 font-bold text-cyan-800 underline" onClick={() => setRetry((value) => value + 1)} type="button">Thử lại</button>
        <Link className="mt-6 block font-semibold text-slate-700 underline" to="/luyen-de">Về danh sách luyện đề</Link>
      </div>
    )
  }

  return (
    <ExamResultPage
      resultOverride={current.result}
      returnLabel="Quay lại danh sách bài đã làm"
      returnTo={`/luyen-de/${encodeURIComponent(current.result.examId)}/lich-su`}
    />
  )
}
