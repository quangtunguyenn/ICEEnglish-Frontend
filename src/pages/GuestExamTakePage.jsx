import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMatch, useNavigate, useParams } from 'react-router-dom'
import { ExamTakeView } from '../components/ExamTakeView'
import { useExamTimer } from '../hooks/useExamTimer'
import {
  getApiErrorMessage,
  getGuestExam,
  getGuestExamAnswerUrl,
  setGuestExamActivePart,
  startGuestExam,
  submitGuestExam,
} from '../services/api'
import { applyDisplayNumbers } from '../utils/examNumbering'
import { getServerRemainingMs } from '../utils/serverTime'

function getGuestAttemptKey(examId) {
  return `iceenglish:guest-exam:${encodeURIComponent(String(examId))}`
}

function readGuestAttempt(examId) {
  const key = getGuestAttemptKey(examId)
  const saved = sessionStorage.getItem(key)
  if (!saved) return null

  try {
    const parsed = JSON.parse(saved)
    if (parsed?.submissionId && parsed.answers && typeof parsed.answers === 'object') return parsed
  } catch {
    sessionStorage.removeItem(key)
  }
  return null
}

export function GuestExamTakePage() {
  const { examId } = useParams()
  const isMockRoute = Boolean(useMatch('/thi-thu/:examId'))
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [submissionId, setSubmissionId] = useState('')
  const [answers, setAnswers] = useState({})
  const [partIndex, setPartIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [saveStatus, setSaveStatus] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [retry, setRetry] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [markedQuestions, setMarkedQuestions] = useState({})
  const [questionPositions, setQuestionPositions] = useState({})
  const timerDeadlineRef = useRef(null)
  const startRequestRef = useRef(null)
  const submitInFlightRef = useRef(false)
  const autoSubmittedRef = useRef(false)
  const questionRefs = useRef({})
  const activePart = exam?.parts?.[partIndex]
  const activePartKey = activePart?.id || activePart?.partId || String(partIndex)
  const { partTimes } = useExamTimer(activePart?.id)
  const isMock = isMockRoute || String(exam?.mode || '').toUpperCase() === 'MOCK'

  useEffect(() => {
    let active = true
    async function loadExam() {
      setLoading(true)
      setError('')
      setWarning('')
      setExam(null)
      setSubmissionId('')
      setAnswers({})
      timerDeadlineRef.current = null
      autoSubmittedRef.current = false
      try {
        const saved = retry === 0 ? readGuestAttempt(examId) : null
        let started
        try {
          const requestKey = `${examId}:${retry}`
          if (startRequestRef.current?.key !== requestKey) {
            startRequestRef.current = {
              key: requestKey,
              promise: startGuestExam(examId, saved?.submissionId),
            }
          }
          started = await startRequestRef.current.promise
        } catch (requestError) {
          if (saved && requestError?.response?.status === 404) {
            sessionStorage.removeItem(getGuestAttemptKey(examId))
            throw new Error('Phiên làm bài khách không còn tồn tại hoặc đã hết hạn. Hãy bắt đầu lượt mới.')
          }
          throw requestError
        }

        const attemptId = started?.submissionId || started?.submission_id
        if (!attemptId) throw new Error('API bắt đầu đề khách không trả về mã phiên.')

        const detail = await getGuestExam(examId, attemptId)
        if (!active) return
        const parts = applyDisplayNumbers(detail?.parts || started?.parts || [])
        if (!parts.length) throw new Error('Đề mẫu chưa có phần thi để hiển thị.')
        const loadedExam = {
          ...started,
          ...detail,
          parts,
          mode: started.mode || detail.mode,
          examId: detail.examId || started.examId || examId,
        }
        if (isMockRoute || String(loadedExam.mode).toUpperCase() === 'MOCK') {
          if (!Number.isFinite(Date.parse(started?.serverNow)) || !Number.isFinite(Date.parse(started?.expiresAt))) {
            throw new Error('Đề thi thử không có thời lượng hợp lệ.')
          }
          const remainingMs = getServerRemainingMs(started)
          timerDeadlineRef.current = performance.now() + remainingMs
          setRemainingSeconds(Math.max(0, Math.ceil(remainingMs / 1000)))
        }
        setSubmissionId(attemptId)
        setExam(loadedExam)
        const restoredAnswers = saved?.submissionId === attemptId ? saved.answers : {}
        setAnswers(restoredAnswers)
        try {
          sessionStorage.setItem(
            getGuestAttemptKey(examId),
            JSON.stringify({ submissionId: attemptId, answers: restoredAnswers }),
          )
          if (saved?.submissionId === attemptId) {
            setSaveStatus({ error: false, message: 'Đã khôi phục câu trả lời tạm thời trên trình duyệt này.' })
          }
        } catch {
          setWarning('Không lưu được lượt làm tạm thời trên trình duyệt; tránh tải lại trang.')
        }
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'Không thể tải đề mẫu. Vui lòng thử lại.'))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadExam()
    return () => { active = false }
  }, [examId, isMockRoute, retry])

  useEffect(() => {
    if (!isMock || !timerDeadlineRef.current) return
    const updateRemaining = () => {
      const left = Math.max(0, timerDeadlineRef.current - performance.now())
      setRemainingSeconds(Math.ceil(left / 1000))
    }
    const timerId = window.setInterval(updateRemaining, 250)
    return () => window.clearInterval(timerId)
  }, [isMock, exam])

  useEffect(() => {
    if (!exam || !submissionId || !activePart?.id && !activePart?.partId) return
    const partId = activePart.id || activePart.partId
    setGuestExamActivePart(examId, partId, submissionId).catch((requestError) => {
      setError(getApiErrorMessage(requestError, 'Không ghi nhận được phần đang làm. Hãy thử chuyển phần lại.'))
    })
  }, [activePart, exam, examId, submissionId])

  const questionItems = useMemo(
    () => exam?.parts?.flatMap((part, index) =>
      (part.questions || []).map((question) => ({ ...question, partIndex: index })),
    ) || [],
    [exam],
  )
  const questionCount = questionItems.length
  const answeredCount = Object.keys(answers).length

  useEffect(() => {
    const question = activePart?.questions?.[questionPositions[activePartKey] || 0]
    questionRefs.current[question?.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [activePart, activePartKey, questionPositions])

  const handleSubmit = useCallback(async () => {
    if (submitInFlightRef.current || !exam || !submissionId) return
    submitInFlightRef.current = true
    setSubmitting(true)
    setError('')
    try {
      const result = await submitGuestExam(examId, submissionId, {
        answers: questionItems.map((question) => ({
          questionId: question.id,
          selectedOpt: answers[question.id] ?? null,
        })),
      })
      let answerUrl = ''
      let answerUrlError = ''
      try {
        const answerResponse = await getGuestExamAnswerUrl(examId, submissionId)
        answerUrl = typeof answerResponse === 'string'
          ? answerResponse
          : answerResponse?.answer_url || answerResponse?.answerUrl || ''
      } catch (answerError) {
        if (answerError?.response?.status !== 404) {
          answerUrlError = getApiErrorMessage(answerError, 'Không thể tải liên kết đáp án.')
        }
      }
      const guestResult = { ...result, guest: true, answerUrl, answerUrlError }
      try {
        sessionStorage.removeItem(getGuestAttemptKey(examId))
      } catch {
        setWarning('Đã nộp bài nhưng không thể xóa bản làm tạm trên trình duyệt.')
      }
      try {
        sessionStorage.setItem('exam-result:khach', JSON.stringify(guestResult))
      } catch {
        setWarning('Đã nộp bài; kết quả chỉ còn trên trang hiện tại và sẽ mất khi tải lại.')
      }
      navigate('/ket-qua/khach', { state: { result: guestResult, guest: true } })
    } catch (requestError) {
      setError(`${getApiErrorMessage(requestError, 'Không thể nộp bài.')} Phiên làm bài vẫn được giữ để bạn thử lại.`)
    } finally {
      submitInFlightRef.current = false
      setSubmitting(false)
    }
  }, [answers, exam, examId, navigate, questionItems, submissionId])

  useEffect(() => {
    if (!isMock || !exam || remainingSeconds > 0 || autoSubmittedRef.current) return
    autoSubmittedRef.current = true
    handleSubmit()
  }, [exam, handleSubmit, isMock, remainingSeconds])

  useEffect(() => {
    if (!isMock || !exam || remainingSeconds > 0) return
    const retryOnReconnect = () => handleSubmit()
    window.addEventListener('online', retryOnReconnect)
    return () => window.removeEventListener('online', retryOnReconnect)
  }, [exam, handleSubmit, isMock, remainingSeconds])

  function goToQuestion(nextPartIndex, questionIndex) {
    const part = exam.parts[nextPartIndex]
    if (!part?.questions?.length) return
    const key = part.id || part.partId || String(nextPartIndex)
    setQuestionPositions((current) => ({
      ...current,
      [key]: Math.min(questionIndex, part.questions.length - 1),
    }))
    setPartIndex(nextPartIndex)
  }

  function chooseAnswer(questionId, selectedOpt) {
    if (submitting || (isMock && performance.now() >= timerDeadlineRef.current)) return
    const nextAnswers = { ...answers, [questionId]: selectedOpt }
    setAnswers(nextAnswers)
    setHasUnsavedChanges(true)
    if (!submissionId) return
    try {
      sessionStorage.setItem(
        getGuestAttemptKey(examId),
        JSON.stringify({ submissionId, answers: nextAnswers }),
      )
      setHasUnsavedChanges(false)
      setWarning('')
    } catch {
      setWarning('Không lưu được câu trả lời tạm thời trên trình duyệt; tránh tải lại trang.')
    }
  }

  function handleSaveDraft() {
    if (!submissionId || submitting || (isMock && remainingSeconds === 0)) return
    try {
      sessionStorage.setItem(getGuestAttemptKey(examId), JSON.stringify({ submissionId, answers }))
      setHasUnsavedChanges(false)
      setSaveStatus({ error: false, message: 'Đã lưu đáp án trên trình duyệt này; không đồng bộ lên server.' })
    } catch {
      setSaveStatus({ error: true, message: 'Không lưu được trên máy. Bộ nhớ có thể bị từ chối hoặc đã hết dung lượng.' })
    }
  }

  function toggleMark(questionId) {
    setMarkedQuestions((current) => ({ ...current, [questionId]: !current[questionId] }))
  }

  function goToAdjacentPart(nextPartIndex) {
    const part = exam.parts[nextPartIndex]
    if (!part) return
    const key = part.id || part.partId || String(nextPartIndex)
    goToQuestion(nextPartIndex, questionPositions[key] ?? 0)
  }

  if (loading) return <div className="p-12 text-center text-slate-600">Đang tải đề mẫu...</div>
  if (error && !exam) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <p className="rounded-lg bg-red-50 p-4 text-red-700" role="alert">{error}</p>
        <button className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 font-bold text-white" onClick={() => setRetry((value) => value + 1)} type="button">
          Bắt đầu lượt mới / thử lại
        </button>
      </div>
    )
  }
  if (!exam || !activePart) return null

  return (
    <ExamTakeView
      activePart={activePart} activePartKey={activePartKey} answers={answers}
      answeredCount={answeredCount} chooseAnswer={chooseAnswer} error={error} exam={exam}
      goToNextPart={() => goToAdjacentPart(partIndex + 1)}
      goToPreviousPart={() => goToAdjacentPart(partIndex - 1)}
      goToQuestion={goToQuestion} guest handleSaveDraft={handleSaveDraft} handleSubmit={handleSubmit}
      hasUnsavedChanges={hasUnsavedChanges} isGeneralExam={!isMock} isMock={isMock}
      markedQuestions={markedQuestions} mockExpired={isMock && remainingSeconds === 0}
      partIndex={partIndex} partTimes={partTimes} questionCount={questionCount}
      questionItems={questionItems} questionRefs={questionRefs} remainingSeconds={remainingSeconds}
      saveStatus={saveStatus} submitting={submitting} timerStorageWarning={warning} toggleMark={toggleMark}
    />
  )
}
