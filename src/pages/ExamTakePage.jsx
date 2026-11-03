import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
  const [questionPositions, setQuestionPositions] = useState({})
  const [highlightedPassages, setHighlightedPassages] = useState({})
  const [securityWarning, setSecurityWarning] = useState(false)
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false)
  const timerDeadlineRef = useRef(null)
  const autoSubmittedRef = useRef(false)
  const fullscreenStartedRef = useRef(false)
  const activePart = exam?.parts?.[partIndex]
  const activePartKey = activePart?.id || activePart?.partId || String(partIndex)
  const activeQuestionIndex = questionPositions[activePartKey] ?? 0
  const questionRefs = useRef({})
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
    if (!activePart?.questions.length) return
    const questionIndex = Math.min(activeQuestionIndex, activePart.questions.length - 1)
    const questionId = activePart.questions[questionIndex]?.id
    questionRefs.current[questionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [activePart, activeQuestionIndex])

  useEffect(() => {
    function handleVisibilityChange() {
      if (fullscreenStartedRef.current && (document.hidden || document.fullscreenElement === null)) {
        setSecurityWarning(true)
      }
    }

    function handleFullscreenChange() {
      if (document.fullscreenElement) {
        fullscreenStartedRef.current = true
        setHasEnteredFullscreen(true)
        setSecurityWarning(false)
      } else if (fullscreenStartedRef.current && !document.hidden) {
        setSecurityWarning(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  function enterFullscreen() {
    if (!document.documentElement.requestFullscreen) {
      setSecurityWarning(true)
      return
    }

    document.documentElement
      .requestFullscreen()
      .then(() => {
        fullscreenStartedRef.current = true
        setHasEnteredFullscreen(true)
        setSecurityWarning(false)
      })
      .catch(() => {
        setSecurityWarning(true)
      })
  }

  function chooseAnswer(questionId, selectedOpt) {
    setAnswers((current) => ({ ...current, [questionId]: selectedOpt }))
  }

  function toggleMark(questionId) {
    setMarkedQuestions((current) => ({ ...current, [questionId]: !current[questionId] }))
  }

  function goToQuestion(nextPartIndex, questionIndex) {
    const part = exam.parts[nextPartIndex]
    if (!part?.questions.length) return
    const partKey = part.id || part.partId || String(nextPartIndex)
    setQuestionPositions((current) => ({
      ...current,
      [partKey]: Math.min(questionIndex, part.questions.length - 1),
    }))
    setPartIndex(nextPartIndex)
  }

  function goToNextPart() {
    if (partIndex >= exam.parts.length - 1) return
    const nextPartIndex = partIndex + 1
    const nextPart = exam.parts[nextPartIndex]
    const nextPartKey = nextPart.id || nextPart.partId || String(nextPartIndex)
    const nextQuestionIndex = questionPositions[nextPartKey] ?? 0
    goToQuestion(nextPartIndex, nextQuestionIndex)
  }

  function goToPreviousPart() {
    if (partIndex <= 0) return
    const previousPartIndex = partIndex - 1
    const previousPart = exam.parts[previousPartIndex]
    const previousPartKey = previousPart.id || previousPart.partId || String(previousPartIndex)
    const previousQuestionIndex = questionPositions[previousPartKey] ?? 0
    goToQuestion(previousPartIndex, previousQuestionIndex)
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
      <header className="grid h-11 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-t-4 border-blue-900 border-b border-slate-200 bg-white px-4 text-xs">
        <div />
        <div className="flex items-center gap-2">
          <button
            className="rounded border border-blue-300 px-4 py-1.5 font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={partIndex === 0}
            onClick={goToPreviousPart}
            type="button"
          >
          Quay lại
          </button>
          <button
            className="rounded bg-blue-500 px-4 py-1.5 font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={partIndex >= exam.parts.length - 1}
            onClick={goToNextPart}
            type="button"
          >
            Tiếp theo
          </button>
        </div>
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
      <main className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-slate-300 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:divide-x lg:divide-y-0">
        <PassageViewer
          allowHighlight={!isMock}
          key={activePartKey}
          onContentChange={(content) => {
            setHighlightedPassages((current) => ({
              ...current,
              [activePartKey]: content,
            }))
          }}
          savedContent={highlightedPassages[activePartKey]}
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
              highlightedContent={highlightedPassages[question.id] || {}}
              onContentChange={(content, contentKey) => {
                setHighlightedPassages((current) => ({
                  ...current,
                  [question.id]: {
                    ...(current[question.id] || {}),
                    [contentKey]: content,
                  },
                }))
              }}
              questionRef={(element) => {
                questionRefs.current[question.id] = element
              }}
            />
          ))}
        </section>
      </main>
      <footer
        className="flex min-h-12 shrink-0 items-center gap-0 overflow-x-auto border-t border-slate-200 bg-white px-3 py-2"
      >
        {questionItems.map((question, index) => (
          <span className="flex min-w-8 flex-1 justify-center" key={question.id}>
            <button
              className={`exam-question-dot flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border px-0 text-[11px] font-semibold transition ${
                markedQuestions[question.id]
                  ? 'border-orange-500 bg-orange-500 text-white'
                  : answers[question.id]
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
              } ${question.partIndex === partIndex ? '!border-blue-500' : ''}`}
              onClick={() => goToQuestion(
                question.partIndex,
                exam.parts[question.partIndex].questions.findIndex((item) => item.id === question.id),
              )}
              title={`Câu ${index + 1}`}
              type="button"
            >
              {index + 1}
            </button>
          </span>
        ))}
        {error && <p className="col-span-full text-xs text-red-600">{error}</p>}
      </footer>
      {(!hasEnteredFullscreen || securityWarning) && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-6 backdrop-blur-sm"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">
              {securityWarning ? 'Vui lòng quay lại chế độ làm bài' : 'Bắt đầu làm bài'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {securityWarning
                ? 'Bạn đã thoát khỏi chế độ khóa màn hình hoặc chuyển tab. Hãy quay lại toàn màn hình để tiếp tục làm bài.'
                : 'Bài thi yêu cầu chế độ toàn màn hình. Nhấn nút bên dưới để bắt đầu.'}
            </p>
            <button
              autoFocus
              className="mt-5 rounded bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-700"
              onClick={enterFullscreen}
              type="button"
            >
              {securityWarning ? 'Tiếp tục làm bài' : 'Bắt đầu toàn màn hình'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
