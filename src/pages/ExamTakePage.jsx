import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMatch, useNavigate, useParams } from 'react-router-dom'
import { ExamQuestion } from '../components/ExamQuestion'
import { PassageViewer } from '../components/PassageViewer'
import { useExamTimer } from '../hooks/useExamTimer'
import { getApiErrorMessage, getExam, startExam, submitExam } from '../services/api'
import { readMockDraft, removeMockDraft, writeMockDraft } from '../utils/mockDraft'

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
  const [highlightedPassages, setHighlightedPassages] = useState({})
  const [securityWarning, setSecurityWarning] = useState(false)
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false)
  const timerDeadlineRef = useRef(null)
  const autoSubmittedRef = useRef(false)
  const fullscreenStartedRef = useRef(false)
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

  useEffect(() => {
    if (!isMock || !mockDraft) return
    const deadline = mockDraft.deadline
    const updateRemaining = () => {
      setRemainingSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
      if (Date.now() >= deadline) setMockExpired(true)
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
        const submission = savedMock ? { submissionId: savedMock.submissionId, mode: 'MOCK' } : await startExam(examId)
        const submissionId =
          submission.submissionId ||
          submission.submission_id ||
          submission.submission?.id ||
          submission.id

        if (!submissionId) {
          throw new Error('Backend bắt đầu bài thi nhưng không trả về submissionId.')
        }

        const examDetail = await getExam(examId)
        const loadedExam = {
          ...submission,
          ...examDetail,
          mode: submission.mode || examDetail.mode,
          submissionId,
        }
        if (!isMockRoute) return { loadedExam }

        const duration = getDurationSeconds(loadedExam)
        if (!duration || !Number.isFinite(duration)) throw new Error('Đề thi thử không có thời lượng hợp lệ.')
        const draft = savedMock || {
          version: 1,
          accountId: String(accountId),
          examId: String(examId),
          submissionId: String(submissionId),
          deadline: Date.now() + duration * 1000,
          answers: {},
          partTimes: {},
        }
        if (!savedMock) writeMockDraft(localStorage, draft)
        return { loadedExam, draft, restored: Boolean(savedMock) }
      })()
      loadRequestRef.current = { examId, isMockRoute, request }
    }

    loadRequestRef.current.request
      .then(({ loadedExam, draft, restored }) => {
        if (!active) return
        if (draft) {
          setAnswers(draft.answers)
          restorePartTimes(draft.partTimes)
          setMockDraft(draft)
          timerDeadlineRef.current = draft.deadline
          setRemainingSeconds(Math.max(0, Math.ceil((draft.deadline - Date.now()) / 1000)))
          setMockExpired(Date.now() >= draft.deadline)
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
    if (submitting || (isMock && (!mockDraft || Date.now() >= mockDraft.deadline))) return
    answersTouchedRef.current = true
    setAnswers((current) => ({ ...current, [questionId]: selectedOpt }))
    setHasUnsavedChanges(true)
  }

  function handleSaveDraft() {
    if (isMock) {
      if (!mockDraft || Date.now() >= mockDraft.deadline || submitting) return
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
  }, [answers, exam, getPartTimes, isGeneralExam, isMock, mockDraft, navigate])

  useEffect(() => {
    if (
      !isMock ||
      !exam ||
      !mockDraft ||
      !timerDeadlineRef.current ||
      Date.now() < timerDeadlineRef.current ||
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
          <button
            className="rounded bg-blue-500 px-4 py-1.5 font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
            disabled={submitting || (isMock && mockExpired)}
            onClick={handleSaveDraft}
            type="button"
          >
            Lưu
          </button>
          <button
            className="rounded bg-emerald-700 px-4 py-1.5 font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-50"
            disabled={submitting}
            onClick={handleSubmit}
            type="button"
          >
            {submitting ? 'Đang nộp...' : isMock && mockExpired ? 'Thử nộp lại' : 'Nộp bài'}
          </button>
          <span className="text-lg text-slate-500">⊟ ⊞ ▤</span>
        </div>
      </header>
      {(isGeneralExam || isMock) && (
        <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs">
          <p className="text-slate-600">
            Bản lưu chỉ có trên trình duyệt và thiết bị này; dữ liệu có thể mất nếu xóa dữ liệu trình duyệt hoặc đổi thiết bị.
            {hasUnsavedChanges && <span className="ml-1 font-semibold text-amber-700">Có thay đổi chưa lưu.</span>}
          </p>
          {isMock && (
            <p className="mt-1 text-slate-600">
              Hãy bấm Lưu thường xuyên. Đồng hồ chạy cả khi đóng tab và dựa vào giờ trên máy, không được server xác thực.
              Khi hết giờ, bài chỉ được nộp khi trang đang mở và có kết nối; nếu quay lại, chỉ bản đã lưu mới được khôi phục.
              Không mở cùng lượt thi trong nhiều tab hoặc thiết bị.
            </p>
          )}
          {isMock && mockExpired && (
            <p className="mt-1 font-semibold text-red-700" role="status">
              Đã hết giờ. Không thể tiếp tục làm bài; nếu chưa nộp được, hãy kết nối mạng và thử nộp lại.
            </p>
          )}
          {saveStatus && (
            <p aria-live="polite" className={`mt-1 ${saveStatus.error ? 'text-red-600' : 'text-emerald-700'}`} role="status">
              {saveStatus.message}
            </p>
          )}
          {timerStorageWarning && (
            <p aria-live="polite" className="mt-1 text-amber-700" role="status">
              {timerStorageWarning}
            </p>
          )}
          {isMock && error && <p className="mt-1 text-red-700" role="alert">{error}</p>}
        </div>
      )}
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
              allowHighlight={!isMock}
              answer={answers[question.id]}
              disabled={submitting || (isMock && mockExpired)}
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
        {!isMock && error && <p className="col-span-full text-xs text-red-600">{error}</p>}
      </footer>
      {(!isMock || !mockExpired) && (!hasEnteredFullscreen || securityWarning) && (
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
