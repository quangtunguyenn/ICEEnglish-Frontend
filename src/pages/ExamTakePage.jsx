import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMatch, useNavigate, useParams } from 'react-router-dom'
import { ExamTakeView } from '../components/ExamTakeView'
import { useExamTimer } from '../hooks/useExamTimer'
import { getApiErrorMessage, getExam, setActivePart, startExam, submitExam } from '../services/api'
import { applyDisplayNumbers } from '../utils/examNumbering'
import { readMockDraft, removeMockDraft, writeMockDraft } from '../utils/mockDraft'
import { getServerRemainingMs } from '../utils/serverTime'

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

function getCurrentAccountId() {
  const profile = JSON.parse(localStorage.getItem('currentUser') || 'null')
  const accountId =
    profile?.id ||
    profile?.userId ||
    profile?.studentId ||
    profile?.username ||
    profile?.userName

  return accountId ? String(accountId) : ''
}

function getPracticeDraftKey(accountId, submissionId) {
  return `iceenglish:practice-draft:${encodeURIComponent(accountId)}:${encodeURIComponent(String(submissionId))}`
}

function getPracticeTimerKey(accountId, submissionId) {
  return `iceenglish:practice-part-times:${encodeURIComponent(accountId)}:${encodeURIComponent(String(submissionId))}`
}

export function ExamTakePage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const isMockRoute = Boolean(useMatch('/thi-thu/:examId'))
  const [exam, setExam] = useState(null)
  const [partIndex, setPartIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [saveStatus, setSaveStatus] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [timerStorageContext, setTimerStorageContext] = useState(null)
  const [timerStorageWarning, setTimerStorageWarning] = useState('')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [mockDraft, setMockDraft] = useState(null)
  const [mockExpired, setMockExpired] = useState(false)
  const [markedQuestions, setMarkedQuestions] = useState({})
  const [questionPositions, setQuestionPositions] = useState({})
  const timerDeadlineRef = useRef(null)
  const autoSubmittedRef = useRef(false)
  const answersTouchedRef = useRef(false)
  const loadRequestRef = useRef(null)
  const submitInFlightRef = useRef(false)
  const activePart = exam?.parts?.[partIndex]
  const activePartKey = activePart?.id || activePart?.partId || String(partIndex)
  const activeQuestionIndex = questionPositions[activePartKey] ?? 0
  const questionRefs = useRef({})
  const { getPartTimes, partTimes, restorePartTimes } = useExamTimer(activePart?.id)
  const isMock = isMockRoute || String(exam?.mode || '').toUpperCase() === 'MOCK'
  const isGeneralExam = !isMock

  // timerDeadlineRef holds a performance.now() based deadline derived from the server's serverNow/expiresAt.
  useEffect(() => {
    if (!isMock || !mockDraft) return
    const updateRemaining = () => {
      const remainingMs = timerDeadlineRef.current - performance.now()
      setRemainingSeconds(Math.max(0, Math.ceil(remainingMs / 1000)))
      if (remainingMs <= 0) setMockExpired(true)
    }

    updateRemaining()
    const timerId = window.setInterval(updateRemaining, 250)
    return () => window.clearInterval(timerId)
  }, [isMock, mockDraft])

  useEffect(() => {
    let active = true
    if (!loadRequestRef.current || loadRequestRef.current.examId !== examId || loadRequestRef.current.isMockRoute !== isMockRoute) {
      const request = (async () => {
        let accountId
        let savedMock
        if (isMockRoute) {
          accountId = getCurrentAccountId()
          if (!accountId) throw new Error('Không xác định được tài khoản để lưu hoặc khôi phục lượt thi thử.')
          savedMock = readMockDraft(localStorage, accountId, examId)
        }
        const submission = await startExam(examId)
        const submissionId =
          submission.submissionId ||
          submission.submission_id ||
          submission.submission?.id ||
          submission.id

        if (!submissionId) {
          throw new Error('Backend bắt đầu bài thi nhưng không trả về submissionId.')
        }

        // submissionId makes the backend return parts in this attempt's saved (possibly shuffled) order.
        const examDetail = await getExam(examId, submissionId)
        const loadedExam = {
          ...submission,
          ...examDetail,
          parts: applyDisplayNumbers(examDetail.parts),
          mode: submission.mode || examDetail.mode,
          submissionId,
        }
        if (!isMockRoute) return { loadedExam }

        const duration = getDurationSeconds(loadedExam)
        const remainingMs = getServerRemainingMs(submission, duration * 1000)
        if (!remainingMs && !submission.expiresAt) throw new Error('Đề thi thử không có thời lượng hợp lệ.')
        const deadlineAt = performance.now() + remainingMs
        // A draft belongs to one attempt; if the server resumed a different one, start clean.
        const usableDraft = savedMock && String(savedMock.submissionId) === String(submissionId) ? savedMock : null
        const expiresAtMs = Date.parse(submission.expiresAt)
        const draft = usableDraft || {
          version: 1,
          accountId: String(accountId),
          examId: String(examId),
          submissionId: String(submissionId),
          deadline: Number.isFinite(expiresAtMs) ? expiresAtMs : Date.now() + remainingMs,
          answers: {},
          partTimes: {},
        }
        if (!usableDraft) writeMockDraft(localStorage, draft)
        return { loadedExam, draft, deadlineAt, restored: Boolean(usableDraft) }
      })()
      loadRequestRef.current = { examId, isMockRoute, request }
    }

    loadRequestRef.current.request
      .then(({ loadedExam, draft, deadlineAt, restored }) => {
        if (!active) return
        if (draft) {
          setAnswers(draft.answers)
          restorePartTimes(draft.partTimes)
          timerDeadlineRef.current = deadlineAt
          setMockDraft(draft)
          setRemainingSeconds(Math.max(0, Math.ceil((deadlineAt - performance.now()) / 1000)))
          setMockExpired(performance.now() >= deadlineAt)
          if (restored) setSaveStatus({ error: false, message: 'Đã khôi phục bản lưu thi thử trên máy này.' })
        }
        setExam(loadedExam)
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError, 'Không thể bắt đầu hoặc khôi phục bài thi. Hãy kiểm tra kết nối và bộ nhớ trình duyệt.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [examId, isMockRoute, restorePartTimes])

  useEffect(() => {
    if (!exam || !isGeneralExam || answersTouchedRef.current) return

    try {
      const accountId = getCurrentAccountId()
      if (!accountId) {
        // oxlint-disable-next-line react-hooks/set-state-in-effect
        setSaveStatus({
          error: true,
          message: 'Không xác định được tài khoản; chưa thể khôi phục bản lưu.',
        })
        return
      }

      const submissionId = String(exam.submissionId)
      const questionIds = new Set(
        exam.parts.flatMap((part) => part.questions.map((question) => String(question.id))),
      )
      const partIds = new Set(
        exam.parts.map((part) => String(part.id || part.partId)).filter(Boolean),
      )
      const savedDraft = localStorage.getItem(getPracticeDraftKey(accountId, submissionId))
      let restoredAnswerCount = 0

      if (savedDraft) {
        const draft = JSON.parse(savedDraft)
        if (
          draft?.version !== 1 ||
          draft.accountId !== accountId ||
          String(draft.submissionId) !== submissionId ||
          !draft.answers ||
          typeof draft.answers !== 'object' ||
          Array.isArray(draft.answers)
        ) {
          setSaveStatus({
            error: true,
            message: 'Bản lưu đáp án trên máy không hợp lệ nên chưa được khôi phục.',
          })
        } else {
          const restoredAnswers = Object.fromEntries(
            Object.entries(draft.answers).filter(
              ([questionId, answer]) =>
                questionIds.has(questionId) && ['A', 'B', 'C', 'D'].includes(answer),
            ),
          )
          restoredAnswerCount = Object.keys(restoredAnswers).length
          setAnswers(restoredAnswers)
          setHasUnsavedChanges(false)
        }
      }

      let restoredTimes = {}
      const savedTimerData = localStorage.getItem(getPracticeTimerKey(accountId, submissionId))
      if (savedTimerData) {
        const timerSnapshot = JSON.parse(savedTimerData)
        if (
          timerSnapshot?.version === 1 &&
          timerSnapshot.accountId === accountId &&
          String(timerSnapshot.submissionId) === submissionId &&
          timerSnapshot.partTimes &&
          typeof timerSnapshot.partTimes === 'object' &&
          !Array.isArray(timerSnapshot.partTimes)
        ) {
          restoredTimes = Object.fromEntries(
            Object.entries(timerSnapshot.partTimes).filter(
              ([partId, seconds]) =>
                partIds.has(partId) &&
                Number.isFinite(seconds) &&
                seconds >= 0,
            ),
          )
        }
      }
      restorePartTimes(restoredTimes)
      setTimerStorageContext({ accountId, submissionId })
      if (savedDraft && restoredAnswerCount > 0) {
        setSaveStatus({
          error: false,
          message: `Đã khôi phục ${restoredAnswerCount} câu trả lời từ bản lưu trên máy.`,
        })
      }
    } catch {
      setTimerStorageWarning('Không thể đọc hoặc khôi phục dữ liệu trên máy; thời gian Part chưa được khôi phục.')
    }
  }, [exam, isGeneralExam, restorePartTimes])

  useEffect(() => {
    if (!isGeneralExam || !timerStorageContext) return

    try {
      localStorage.setItem(
        getPracticeTimerKey(timerStorageContext.accountId, timerStorageContext.submissionId),
        JSON.stringify({
          version: 1,
          ...timerStorageContext,
          partTimes,
          savedAt: new Date().toISOString(),
        }),
      )
      if (timerStorageWarning) {
        // oxlint-disable-next-line react-hooks/set-state-in-effect
        setTimerStorageWarning('')
      }
    } catch {
      if (!timerStorageWarning) {
        // oxlint-disable-next-line react-hooks/set-state-in-effect
        setTimerStorageWarning('Không tự lưu được thời gian Part trên máy; hãy kiểm tra dung lượng hoặc quyền lưu trữ.')
      }
    }
  }, [isGeneralExam, partTimes, timerStorageContext, timerStorageWarning])

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

  function chooseAnswer(questionId, selectedOpt) {
    if (submitting || (isMock && (!mockDraft || performance.now() >= timerDeadlineRef.current))) return
    answersTouchedRef.current = true
    setAnswers((current) => ({ ...current, [questionId]: selectedOpt }))
    setHasUnsavedChanges(true)
  }

  function handleSaveDraft() {
    if (isMock) {
      if (!mockDraft || performance.now() >= timerDeadlineRef.current || submitting) return
      try {
        if (getCurrentAccountId() !== mockDraft.accountId) {
          throw new Error('Tài khoản hiện tại đã thay đổi; không thể lưu lượt thi này.')
        }
        const snapshot = { ...mockDraft, answers, partTimes: getPartTimes(), savedAt: new Date().toISOString() }
        writeMockDraft(localStorage, snapshot)
        setMockDraft(snapshot)
        setHasUnsavedChanges(false)
        setSaveStatus({ error: false, message: 'Đã lưu trên trình duyệt này; đáp án không được đồng bộ lên server.' })
      } catch (saveError) {
        setSaveStatus({
          error: true,
          message: getApiErrorMessage(saveError, 'Không lưu được trên máy. Hãy kiểm tra bộ nhớ trình duyệt.'),
        })
      }
      return
    }

    const finalPartTimes = getPartTimes()
    try {
      const accountId = getCurrentAccountId()
      if (!accountId) {
        setSaveStatus({
          error: true,
          message: 'Không xác định được tài khoản; chưa lưu được bài làm.',
        })
        return
      }

      localStorage.setItem(
        getPracticeDraftKey(accountId, exam.submissionId),
        JSON.stringify({
          version: 1,
          accountId,
          submissionId: String(exam.submissionId),
          examId: String(examId),
          answers,
          partTimes: finalPartTimes,
          savedAt: new Date().toISOString(),
        }),
      )
      setHasUnsavedChanges(false)
      setSaveStatus({
        error: false,
        message: 'Đã lưu đáp án và thời gian trên trình duyệt này.',
      })
      try {
        localStorage.setItem(
          getPracticeTimerKey(accountId, exam.submissionId),
          JSON.stringify({
            version: 1,
            accountId,
            submissionId: String(exam.submissionId),
            partTimes: finalPartTimes,
            savedAt: new Date().toISOString(),
          }),
        )
        setTimerStorageContext({ accountId, submissionId: String(exam.submissionId) })
      } catch {
        setTimerStorageWarning('Đáp án đã lưu, nhưng không lưu được thời gian Part trên máy.')
      }
    } catch {
      setSaveStatus({
        error: true,
        message: 'Không lưu được trên máy. Bộ nhớ có thể bị từ chối hoặc đã hết dung lượng.',
      })
    }
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
    if (submitInFlightRef.current) return
    if (isMock) {
      try {
        if (!mockDraft || getCurrentAccountId() !== mockDraft.accountId) {
          setError('Tài khoản hiện tại đã thay đổi; không thể nộp lượt thi này.')
          return
        }
      } catch {
        setError('Không thể xác minh tài khoản trên trình duyệt; chưa thể nộp bài.')
        return
      }
    }
    submitInFlightRef.current = true
    setSubmitting(true)
    setError('')
    const payload = {
      submissionId: exam.submissionId,
      answers: Object.entries(answers).map(([questionId, selectedOpt]) => ({
        questionId,
        selectedOpt,
      })),
      exam_id: exam.examId || exam.exam_id || exam.id,
    }

    let result
    try {
      result = await submitExam(payload)
    } catch (requestError) {
      setError(`${getApiErrorMessage(requestError, 'Không thể xác nhận nộp bài.')} Bản lưu trên máy được giữ lại; hãy kiểm tra kết quả hoặc thử nộp lại.`)
      submitInFlightRef.current = false
      setSubmitting(false)
      return
    }

    const submissionWarnings = []
    if (isGeneralExam) {
      try {
        const accountId = getCurrentAccountId()
        if (accountId) {
          localStorage.removeItem(getPracticeDraftKey(accountId, exam.submissionId))
          localStorage.removeItem(getPracticeTimerKey(accountId, exam.submissionId))
        }
      } catch {
        submissionWarnings.push('Đã nộp bài nhưng không thể xóa toàn bộ dữ liệu lưu trên máy.')
      }
    } else if (mockDraft) {
      try {
        removeMockDraft(localStorage, mockDraft.accountId, mockDraft.examId)
      } catch {
        submissionWarnings.push('Đã nộp bài nhưng không thể xóa bản lưu thi thử trên máy.')
      }
    }

    try {
      sessionStorage.setItem(`exam-result:${result.submissionId}`, JSON.stringify(result))
    } catch {
      submissionWarnings.push('Không thể lưu kết quả trong phiên trình duyệt; hãy giữ trang kết quả mở.')
    }
    navigate(`/ket-qua/${result.submissionId}`, { state: { result, submissionWarnings } })
  }, [answers, exam, isGeneralExam, isMock, mockDraft, navigate])

  const activePartId = activePart?.id || activePart?.partId
  const submissionIdForTracking = exam?.submissionId
  useEffect(() => {
    if (!submissionIdForTracking || !activePartId) return
    setActivePart(submissionIdForTracking, activePartId).catch((trackingError) => {
      setSaveStatus({
        error: true,
        message: getApiErrorMessage(trackingError, 'Không ghi nhận được part đang làm lên server. Hãy chuyển part lại để thử lần nữa.'),
      })
    })
  }, [activePartId, submissionIdForTracking])

  useEffect(() => {
    if (
      !isMock ||
      !exam ||
      !mockDraft ||
      !timerDeadlineRef.current ||
      performance.now() < timerDeadlineRef.current ||
      remainingSeconds > 0 ||
      autoSubmittedRef.current
    ) return
    autoSubmittedRef.current = true
    handleSubmit()
  }, [exam, handleSubmit, isMock, mockDraft, remainingSeconds])

  useEffect(() => {
    if (!isMock || !mockExpired) return
    const retryOnReconnect = () => handleSubmit()
    window.addEventListener('online', retryOnReconnect)
    return () => window.removeEventListener('online', retryOnReconnect)
  }, [handleSubmit, isMock, mockExpired])

  if (loading) return <div className="p-12 text-center text-slate-600">Đang tải bài thi...</div>
  if (error && !exam) return <div className="p-12 text-center text-red-600">{error}</div>
  if (!exam || !activePart) return null

  return (
    <ExamTakeView
      activePart={activePart} activePartKey={activePartKey} answers={answers}
      answeredCount={answeredCount} chooseAnswer={chooseAnswer} error={error} exam={exam}
      goToNextPart={goToNextPart} goToPreviousPart={goToPreviousPart} goToQuestion={goToQuestion}
      handleSaveDraft={handleSaveDraft} handleSubmit={handleSubmit} hasUnsavedChanges={hasUnsavedChanges}
      isGeneralExam={isGeneralExam} isMock={isMock} markedQuestions={markedQuestions}
      mockExpired={mockExpired} partIndex={partIndex} partTimes={partTimes} questionCount={questionCount}
      questionItems={questionItems} questionRefs={questionRefs} remainingSeconds={remainingSeconds}
      saveStatus={saveStatus} submitting={submitting} timerStorageWarning={timerStorageWarning} toggleMark={toggleMark}
    />
  )
}
