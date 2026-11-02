import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ExamQuestion } from '../components/ExamQuestion'
import { PassageViewer } from '../components/PassageViewer'
import { useExamTimer } from '../hooks/useExamTimer'
import { getApiErrorMessage, getExam, startExam, submitExam } from '../services/api'

function formatTime(seconds) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}

function getDurationSeconds(exam) {
  const duration = Number(
    exam?.durationMinutes ||
      exam?.timeLimitMinutes ||
      exam?.duration ||
      exam?.timeLimit ||
      0,
  )
  return duration > 0 ? duration * 60 : 0
}

export function ExamTakePage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [partIndex, setPartIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [markedQuestions, setMarkedQuestions] = useState({})
  const [securityWarning, setSecurityWarning] = useState(false)
  const timerDeadlineRef = useRef(null)
  const autoSubmittedRef = useRef(false)
  const activePart = exam?.parts?.[partIndex]
  const { getPartTimes, partTimes } = useExamTimer(activePart?.id)
  const isMock = String(exam?.mode || '').toUpperCase() === 'MOCK'
  const durationSeconds = getDurationSeconds(exam)

  useEffect(() => {
    if (!isMock || !durationSeconds) {
      timerDeadlineRef.current = null
      return
    }

    const deadline = Date.now() + durationSeconds * 1000
    timerDeadlineRef.current = deadline
    const updateRemaining = () => {
      setRemainingSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
    }

    updateRemaining()
    const timerId = window.setInterval(updateRemaining, 250)
    return () => window.clearInterval(timerId)
  }, [isMock, durationSeconds])

  useEffect(() => {
    startExam(examId)
      .then((submission) => {
        const submissionId =
          submission.submissionId ||
          submission.submission_id ||
          submission.submission?.id ||
          submission.id

        if (!submissionId) {
          throw new Error('Backend bắt đầu bài thi nhưng không trả về submissionId.')
        }

        return getExam(examId).then((examDetail) => ({
          ...submission,
          ...examDetail,
          mode: submission.mode || examDetail.mode,
          submissionId,
        }))
      })
      .then(setExam)
      .catch((requestError) =>
        setError(getApiErrorMessage(requestError, 'Không thể bắt đầu bài thi. Vui lòng thử lại.')),
      )
      .finally(() => setLoading(false))
  }, [examId])

  const questionCount = useMemo(
    () => exam?.parts?.reduce((total, part) => total + part.questions.length, 0) || 0,
    [exam],
  )
  const questionItems = useMemo(
    () =>
      exam?.parts?.flatMap((part, index) =>
        part.questions.map((question) => ({ ...question, partIndex: index })),
      ) || [],
    [exam],
  )
  const answeredCount = Object.keys(answers).length

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) return
      if (document.fullscreenElement === null) setSecurityWarning(true)
    }

    function handleFullscreenChange() {
      if (document.fullscreenElement === null && !document.hidden) setSecurityWarning(true)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  function enterFullscreen() {
    document.documentElement.requestFullscreen?.().catch(() => {})
    setSecurityWarning(false)
  }

  function chooseAnswer(questionId, selectedOpt) {
    setAnswers((current) => ({ ...current, [questionId]: selectedOpt }))
  }

  function toggleMark(questionId) {
    setMarkedQuestions((current) => ({ ...current, [questionId]: !current[questionId] }))
  }

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    setError('')
    const finalPartTimes = getPartTimes()
    const payload = {
      submissionId: exam.submissionId,
      answers: Object.entries(answers).map(([questionId, selectedOpt]) => ({
        questionId,
        selectedOpt,
      })),
      partLogs: exam.parts.map((part) => ({
        partId: part.id || part.partId,
        timeSpentSeconds: finalPartTimes[part.id || part.partId] || 0,
      })),
      exam_id: exam.examId || exam.exam_id || exam.id,
    }

    try {
      const result = await submitExam(payload)
      sessionStorage.setItem(`exam-result:${result.submissionId}`, JSON.stringify(result))
      navigate(`/ket-qua/${result.submissionId}`, { state: { result } })
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Nộp bài thất bại. Vui lòng kiểm tra kết nối và thử lại.'))
      setSubmitting(false)
    }
  }, [answers, exam, getPartTimes, navigate, submitting])

  useEffect(() => {
    if (
      !isMock ||
      !durationSeconds ||
      !timerDeadlineRef.current ||
      Date.now() < timerDeadlineRef.current ||
      remainingSeconds > 0 ||
      autoSubmittedRef.current ||
      submitting
    ) return
    autoSubmittedRef.current = true
    handleSubmit()
  }, [handleSubmit, durationSeconds, isMock, remainingSeconds, submitting])

  if (loading) return <div className="p-12 text-center text-slate-600">Đang tải bài thi...</div>
  if (error && !exam) return <div className="p-12 text-center text-red-600">{error}</div>
  if (!exam || !activePart) return null

  return (
    <div className="flex h-[calc(100vh-73px)] min-h-[620px] flex-col overflow-hidden bg-white text-slate-700">
      <header className="flex h-11 shrink-0 items-center justify-between border-t-4 border-blue-900 border-b border-slate-200 bg-white px-4 text-xs">
        <Link className="rounded border border-blue-300 px-4 py-1.5 font-semibold text-blue-700 hover:bg-blue-50" to={isMock ? '/thi-thu' : '/luyen-de'}>
          Quay lại
        </Link>
        <button
          className="rounded bg-blue-500 px-4 py-1.5 font-semibold text-white hover:bg-blue-600"
          onClick={() => setPartIndex((index) => Math.min(index + 1, exam.parts.length - 1))}
          type="button"
        >
          Tiếp theo
        </button>
        <div className="ml-auto flex items-center gap-3">
          <span className="font-bold text-slate-700">Số câu đã trả lời: <b className="text-green-600">{answeredCount}</b> / {questionCount}</span>
          <span className={`font-mono font-bold ${isMock && remainingSeconds < 60 ? 'text-red-600' : 'text-slate-700'}`}>
            {isMock ? formatTime(remainingSeconds) : formatTime(partTimes[activePart.id] || 0)}
          </span>
          <button className="rounded bg-blue-500 px-4 py-1.5 font-semibold text-white hover:bg-blue-600" onClick={handleSubmit} type="button">
            Lưu
          </button>
          <span className="text-lg text-slate-500">⊟ ⊞ ▤</span>
        </div>
      </header>
      <main className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-slate-300 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:divide-x lg:divide-y-0" onClick={enterFullscreen}>
        <PassageViewer
          allowHighlight={!isMock}
          key={activePart.id}
          text={activePart.passageText}
          title={activePart.title || activePart.passageTitle}
        />
        <section className="min-h-0 overflow-y-auto bg-white">
          {activePart.questions.map((question) => (
            <ExamQuestion
              answer={answers[question.id]}
              key={question.id}
              marked={markedQuestions[question.id]}
              onAnswer={chooseAnswer}
              onToggleMark={toggleMark}
              question={question}
            />
          ))}
        </section>
      </main>
      <footer
        className="grid min-h-9 shrink-0 items-center gap-1 border-t border-slate-200 bg-white px-3 py-1"
        style={{ gridTemplateColumns: `repeat(${Math.max(questionItems.length, 1)}, minmax(0, 1fr))` }}
      >
        {questionItems.map((question, index) => (
          <button
            className={`exam-question-dot h-5 w-full rounded-full px-1 text-[10px] font-semibold ${
              markedQuestions[question.id]
                ? answers[question.id]
                  ? 'exam-question-dot--answered-marked'
                  : 'bg-red-500 text-white'
                : answers[question.id]
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-slate-600'
            } ${question.partIndex === partIndex ? 'ring-1 ring-blue-500' : ''}`}
            key={question.id}
            onClick={() => setPartIndex(question.partIndex)}
            title={`Câu ${index + 1}`}
            type="button"
          >
            {index + 1}
          </button>
        ))}
        {error && <p className="col-span-full text-xs text-red-600">{error}</p>}
      </footer>
      {securityWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-6">
          <div className="max-w-md rounded-xl bg-white p-6 text-center shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Vui lòng quay lại chế độ làm bài</h2>
            <p className="mt-2 text-sm text-slate-600">Không được chuyển tab hoặc thoát toàn màn hình trong khi làm bài.</p>
            <button className="mt-5 rounded bg-blue-600 px-5 py-2 font-semibold text-white" onClick={enterFullscreen} type="button">
              Tiếp tục làm bài
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
