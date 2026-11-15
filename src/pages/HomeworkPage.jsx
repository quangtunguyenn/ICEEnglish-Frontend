import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ExamQuestion } from '../components/ExamQuestion'
import { ExamIdentityBar } from '../components/ExamIdentityBar'
import { ResultOverview } from '../components/ResultOverview'
import { PassageViewer } from '../components/PassageViewer'
import { useExamTimer } from '../hooks/useExamTimer'
import { useGuestMode } from '../hooks/useGuestMode'
import {
  getApiErrorMessage,
  getGuestHomeworkAnswers,
  getGuestVideoLearningContent,
  getVideoHomework,
  getVideoHomeworkAnswerUrl,
  getVideoHomeworkAnswers,
  startGuestHomework,
  startVideoHomework,
  submitGuestHomework,
  submitVideoHomework,
} from '../services/api'
import { exitFullscreenIfNeeded } from '../utils/fullscreen'
import { getExamCandidate, getExamStartedAt } from '../utils/examHeader'

function getHomeworkParts(homework) {
  const source = Array.isArray(homework)
    ? [{ questions: homework }]
    : Array.isArray(homework?.parts) && homework.parts.length > 0
      ? homework.parts
      : [{
          ...homework,
          questions: homework?.questions || homework?.items || [],
        }]

  return source.map((part, partIndex) => ({
    ...part,
    id: part.id || part.partId || `homework-part-${partIndex}`,
    title: part.title || part.passageTitle,
    passageText: part.passageText || part.passage_text || part.passage || '',
    questions: (Array.isArray(part.questions) ? part.questions : [part])
      .map((question, questionIndex) => ({
        ...question,
        id: question.id || question.questionId || question.question_id,
        orderIndex: question.orderIndex || question.order_index || questionIndex + 1,
      }))
      .filter((question) => question.id),
  }))
}

function getExamId(homework) {
  return homework?.examId || homework?.exam_id || homework?.id
}

function getSubmissionId(submission) {
  return submission?.submissionId ||
    submission?.submission_id ||
    submission?.submission?.id ||
    submission?.id
}

export function HomeworkPage() {
  const { videoId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const guest = useGuestMode()
  const [homework, setHomework] = useState(() => guest ? null : location.state?.homework || null)
  const [submission, setSubmission] = useState(null)
  const [answers, setAnswers] = useState({})
  const [markedQuestions, setMarkedQuestions] = useState({})
  const [highlightedContent, setHighlightedContent] = useState({})
  const [partIndex, setPartIndex] = useState(0)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(() => guest || !location.state?.homework)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [answerUrl, setAnswerUrl] = useState('')
  const [answerLoading, setAnswerLoading] = useState(false)
  const [answerError, setAnswerError] = useState('')
  const [examStartedAt, setExamStartedAt] = useState('')
  const [securityWarning, setSecurityWarning] = useState(false)
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false)
  const startRequestedForRef = useRef(null)
  const fullscreenStartedRef = useRef(false)
  const questionRefs = useRef({})
  const candidate = useMemo(() => getExamCandidate(guest), [guest])

  useEffect(() => {
    if (!guest && location.state?.homework) return

    const request = guest
      ? getGuestVideoLearningContent(videoId).then((content) => content?.homework || null)
      : getVideoHomework(videoId)
    request
      .then(setHomework)
      .catch((requestError) => setError(
        getApiErrorMessage(requestError, 'Không thể tải bài tập về nhà.'),
      ))
      .finally(() => setLoading(false))
  }, [guest, location.state, videoId])

  useEffect(() => {
    const examId = getExamId(homework)
    if (!examId || startRequestedForRef.current === examId) return
    startRequestedForRef.current = examId
    setLoading(true)

    const requestStartedAt = new Date().toISOString()
    const request = guest ? startGuestHomework(videoId) : startVideoHomework(videoId)
    request
      .then((startedSubmission) => {
        const submissionId = getSubmissionId(startedSubmission)
        if (!submissionId) {
          throw new Error('Backend bắt đầu bài tập nhưng không trả về submissionId.')
        }
        const startedAt = getExamStartedAt(
          startedSubmission.startedAt,
          startedSubmission.started_at,
          startedSubmission.createdAt,
          startedSubmission.created_at,
          requestStartedAt,
        )
        setSubmission({ ...startedSubmission, submissionId, examId, startedAt })
        setExamStartedAt(startedAt)
      })
      .catch((requestError) => setError(
        getApiErrorMessage(requestError, 'Không thể bắt đầu bài tập. Vui lòng thử lại.'),
      ))
      .finally(() => setLoading(false))
  }, [guest, homework, videoId])

  const parts = useMemo(() => getHomeworkParts(homework), [homework])
  const activePart = parts[partIndex]
  const questionItems = useMemo(
    () => parts.flatMap((part, currentPartIndex) =>
      part.questions.map((question) => ({ ...question, partIndex: currentPartIndex })),
    ),
    [parts],
  )
  const answeredCount = Object.keys(answers).length
  useEffect(() => {
    const question = activePart?.questions[activeQuestionIndex]
    if (question) {
      questionRefs.current[question.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [activePart, activeQuestionIndex])

  useEffect(() => {
    function handleVisibilityChange() {
      if (fullscreenStartedRef.current && (document.hidden || !document.fullscreenElement)) {
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

    document.documentElement.requestFullscreen()
      .then(() => {
        fullscreenStartedRef.current = true
        setHasEnteredFullscreen(true)
        setSecurityWarning(false)
      })
      .catch(() => setSecurityWarning(true))
  }

  function goToQuestion(nextPartIndex, questionIndex) {
    const part = parts[nextPartIndex]
    if (!part?.questions.length) return
    setPartIndex(nextPartIndex)
    setActiveQuestionIndex(Math.min(questionIndex, part.questions.length - 1))
  }

  async function handleSubmit() {
    if (!questionItems.length || !submission || submitting) return

    setSubmitting(true)
    setError('')
    try {
      const examId = getExamId(homework)
      const answerPayload = {
        answers: questionItems.map((question) => ({
          questionId: question.id,
          selectedOpt: answers[question.id] ?? null,
        })),
      }
      const submittedResult = guest
        ? await submitGuestHomework(videoId, submission.submissionId, answerPayload)
        : await submitVideoHomework({
            ...answerPayload,
            submissionId: submission.submissionId,
            exam_id: examId,
          })
      setResult(submittedResult)
      const completionKey = `video-homework-completed:${guest ? 'guest:' : ''}${videoId}:${examId}`
      const submittedAnswerUrl = getVideoHomeworkAnswerUrl(submittedResult)
      setAnswerError('')
      try {
        sessionStorage.setItem(completionKey, submittedAnswerUrl || 'completed')
      } catch {
        setAnswerError('Đã nộp bài nhưng không thể lưu trạng thái hoàn thành trên trình duyệt.')
      }
      setAnswerUrl(submittedAnswerUrl)
      setAnswerLoading(true)
      const answerRequest = guest
        ? getGuestHomeworkAnswers(videoId, submission.submissionId)
        : getVideoHomeworkAnswers(examId)
      answerRequest
        .then((answerResponse) => {
          const fetchedAnswerUrl = getVideoHomeworkAnswerUrl(answerResponse)
          if (!fetchedAnswerUrl && !guest) {
            throw new Error('API không trả về answer_url.')
          }
          setAnswerUrl(fetchedAnswerUrl)
          try {
            sessionStorage.setItem(completionKey, fetchedAnswerUrl || 'completed')
          } catch {
            setAnswerError('Đã tải kết quả nhưng không thể lưu trạng thái hoàn thành trên trình duyệt.')
          }
        })
        .catch((requestError) => {
          if (!submittedAnswerUrl) {
            setAnswerError(getApiErrorMessage(requestError, 'Không thể tải đáp án chi tiết.'))
          }
        })
        .finally(() => setAnswerLoading(false))
      try {
        await exitFullscreenIfNeeded()
      } catch {
        setAnswerError((current) => [
          current,
          'Đã nộp bài nhưng trình duyệt không thể thoát chế độ toàn màn hình.',
        ].filter(Boolean).join(' '))
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Nộp bài tập thất bại. Vui lòng thử lại.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (error && !submission && !result) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <p className="rounded-lg bg-red-50 p-4 text-red-700" role="alert">{error}</p>
        <button className="mt-4 rounded bg-blue-600 px-4 py-2 font-semibold text-white" onClick={() => navigate('/video', { state: { selectedTitle: location.state?.title } })} type="button">
          Quay lại video
        </button>
      </div>
    )
  }

  if (loading || (getExamId(homework) && !submission)) {
    return <div className="p-12 text-center text-slate-600">Đang tải bài tập...</div>
  }

  if (error && !activePart && !result) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>
        <button className="mt-4 rounded bg-blue-600 px-4 py-2 font-semibold text-white" onClick={() => navigate('/video', { state: { selectedTitle: location.state?.title } })} type="button">
          Quay lại video
        </button>
      </div>
    )
  }

  if (!loading && homework && !getExamId(homework)) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <p className="rounded-lg bg-red-50 p-4 text-red-700">Bài tập chưa có exam_id để bắt đầu.</p>
        <button className="mt-4 rounded bg-blue-600 px-4 py-2 font-semibold text-white" onClick={() => navigate('/video', { state: { selectedTitle: location.state?.title } })} type="button">
          Quay lại video
        </button>
      </div>
    )
  }

  if (result) {
    return (
      <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-6 sm:px-6 lg:py-8">
        <ResultOverview
          backLabel="Quay lại video"
          backState={{ selectedTitle: location.state?.title }}
          backTo="/video"
          description={location.state?.title || homework?.title || 'Xem lại kết quả và đáp án bài tập của bạn.'}
          eyebrow="Bài tập video"
          stats={[
            ...(result.score != null ? [{ label: 'Điểm số', value: result.score, primary: true }] : []),
            { label: 'Tổng số câu', value: result.totalQuestions ?? questionItems.length },
            { label: 'Câu đúng', value: result.totalCorrect ?? 0, valueClass: 'text-emerald-700' },
            { label: 'Câu sai', value: result.totalIncorrect ?? 0, valueClass: 'text-red-700' },
          ]}
          title="KẾT QUẢ BÀI TẬP"
        />
        <section className="mt-8 rounded-2xl border border-ice-gold/40 bg-ice-gold-50 p-5">
          <h2 className="font-gf text-xl font-bold text-ice-navy">Đáp án chi tiết</h2>
          {answerLoading && <p className="mt-2 text-sm text-slate-600">Đang tải liên kết đáp án...</p>}
          {answerUrl && (
            <a className="mt-3 inline-flex rounded-lg bg-ice-navy px-4 py-2 font-bold text-white hover:bg-ice-navy/90" href={answerUrl} rel="noreferrer" target="_blank">
              Xem đáp án chi tiết
            </a>
          )}
          {answerError && <p className="mt-2 text-sm font-semibold text-red-700">{answerError}</p>}
          {!answerLoading && !answerUrl && !answerError && <p className="mt-2 text-sm text-slate-600">Chưa có liên kết đáp án cho bài tập này.</p>}
        </section>
        <section className="mt-10 space-y-5">
          <h2 className="font-gf text-2xl font-bold text-ice-navy">Chi tiết câu trả lời</h2>
          {!result.details?.length && <p className="text-sm text-slate-500">Chưa có chi tiết câu trả lời.</p>}
          <div className="space-y-3">
            {(result.details || []).map((detail, index) => (
              <article className="rounded-xl border border-slate-200 bg-white p-4" key={detail.questionId || index}>
                <p className="font-bold text-slate-900">{detail.orderIndex || index + 1}. {detail.content}</p>
                <ul className="mt-3 grid gap-2">
                  {['A', 'B', 'C', 'D'].map((key) => {
                    const text = detail[`opt${key}`]
                    if (text == null || text === '') return null
                    const selected = detail.selectedOpt === key
                    const correct = detail.correctOpt === key
                    const tone = correct
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      : selected
                        ? 'border-red-300 bg-red-50 text-red-900'
                        : 'border-slate-200 text-slate-700'

                    return (
                      <li className={`flex flex-wrap items-start gap-2 rounded-lg border px-3 py-2 text-sm ${tone}`} key={key}>
                        <span className="min-w-0 flex-1"><strong>{key}.</strong> {text}</span>
                        {selected && <span className="text-xs font-bold">Bạn chọn</span>}
                        {correct && <span className="text-xs font-bold">Đáp án đúng</span>}
                      </li>
                    )
                  })}
                </ul>
                <p className="mt-2 text-sm text-slate-600">
                  Bạn chọn: <strong>{detail.selectedOpt || 'Chưa chọn'}</strong> · Đáp án đúng: <strong>{detail.correctOpt || '—'}</strong>
                </p>
                <p className={`mt-2 text-sm font-bold ${detail.isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                  {detail.isCorrect ? 'Đúng' : 'Sai'}
                </p>
                {detail.explanation && <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-600"><strong>Giải thích:</strong> {detail.explanation}</p>}
              </article>
            ))}
          </div>
        </section>
      </main>
    )
  }

  if (!activePart) {
    return <div className="p-12 text-center text-slate-600">Bài tập này chưa có câu hỏi.</div>
  }

  return (
    <div className="flex h-[calc(100vh-73px)] min-h-155 flex-col overflow-hidden bg-white text-slate-700 [:fullscreen_&]:h-screen">
      <ExamIdentityBar candidateName={candidate.fullName} candidateSbd={candidate.studentIrn} examStartedAt={examStartedAt} showIdentity={false}>
        <span className="whitespace-nowrap text-xs font-bold text-white">
          Số câu đã trả lời: <b className="text-emerald-300">{answeredCount}</b> / {questionItems.length}
        </span>
        <HomeworkPartTimer partId={activePart.id} />
        <button
          className="rounded bg-white px-4 py-1.5 font-semibold text-[#102b5c] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!questionItems.length || submitting || !submission}
          onClick={handleSubmit}
          type="button"
        >
          {submitting ? 'Đang nộp...' : 'Nộp bài'}
        </button>
      </ExamIdentityBar>
      <div className="flex min-h-11 shrink-0 items-center border-b border-slate-200 bg-white px-4 py-2 text-xs [:fullscreen_&]:hidden">
        <button className="font-semibold text-blue-700 hover:underline" onClick={() => navigate('/video', { state: { selectedTitle: location.state?.title } })} type="button">
          ← Video bài giảng
        </button>
      </div>
      <main className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-slate-300 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:divide-x lg:divide-y-0">
        <PassageViewer
          key={activePart.id}
          text={activePart.passageText}
          title={activePart.title}
        />
        <section className="min-h-0 overflow-y-auto bg-white">
          {activePart.questions.map((question) => (
            <ExamQuestion
              answer={answers[question.id]}
              key={question.id}
              marked={markedQuestions[question.id]}
              onAnswer={(questionId, selectedOpt) => setAnswers((current) => ({ ...current, [questionId]: selectedOpt }))}
              onToggleMark={(questionId) => setMarkedQuestions((current) => ({ ...current, [questionId]: !current[questionId] }))}
              question={question}
              highlightedContent={highlightedContent[question.id] || {}}
              onContentChange={(content, contentKey) => {
                setHighlightedContent((current) => ({
                  ...current,
                  [question.id]: {
                    ...(current[question.id] || {}),
                    [contentKey]: content,
                  },
                }))
              }}
              questionRef={(element) => { questionRefs.current[question.id] = element }}
            />
          ))}
        </section>
      </main>
      <footer className="flex min-h-12 shrink-0 items-center gap-0 overflow-x-auto border-t border-slate-200 bg-white px-3 py-2">
        {questionItems.map((question, index) => (
          <span className="flex min-w-8 flex-1 justify-center" key={question.id}>
            <button
              className={`exam-question-dot flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border px-0 text-[11px] font-semibold transition ${
                markedQuestions[question.id]
                  ? 'border-orange-500 bg-orange-500 text-white'
                  : answers[question.id]
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
              } ${question.partIndex === partIndex ? 'border-blue-500!' : ''}`}
              onClick={() => {
                goToQuestion(
                  question.partIndex,
                  parts[question.partIndex].questions.findIndex((item) => item.id === question.id),
                )
              }}
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
        <div aria-modal="true" className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/75 p-6 backdrop-blur-sm" role="dialog">
          <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">
              {securityWarning ? 'Vui lòng quay lại chế độ làm bài' : 'Bắt đầu làm bài tập'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {securityWarning
                ? 'Bạn đã thoát khỏi chế độ khóa màn hình hoặc chuyển tab. Hãy quay lại toàn màn hình để tiếp tục làm bài.'
                : 'Bài tập yêu cầu chế độ toàn màn hình. Nhấn nút bên dưới để bắt đầu.'}
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

function HomeworkPartTimer({ partId }) {
  const { partTimes } = useExamTimer(partId)
  const seconds = partTimes[partId] || 0

  return (
    <span aria-label="Thời gian làm bài" className="flex items-center gap-1.5 whitespace-nowrap font-mono font-bold text-white" role="timer">
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}
    </span>
  )
}
