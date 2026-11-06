import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ExamQuestion } from '../components/ExamQuestion'
import { PassageViewer } from '../components/PassageViewer'
import { useExamTimer } from '../hooks/useExamTimer'
import {
  getApiErrorMessage,
  getVideoHomework,
  getVideoHomeworkAnswerUrl,
  getVideoHomeworkAnswers,
  startVideoHomework,
  submitVideoHomework,
} from '../services/api'

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
  const [homework, setHomework] = useState(() => location.state?.homework || null)
  const [submission, setSubmission] = useState(null)
  const [answers, setAnswers] = useState({})
  const [markedQuestions, setMarkedQuestions] = useState({})
  const [highlightedContent, setHighlightedContent] = useState({})
  const [partIndex, setPartIndex] = useState(0)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(() => !location.state?.homework)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [answerUrl, setAnswerUrl] = useState('')
  const [answerLoading, setAnswerLoading] = useState(false)
  const [answerError, setAnswerError] = useState('')
  const [securityWarning, setSecurityWarning] = useState(false)
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false)
  const startRequestedForRef = useRef(null)
  const fullscreenStartedRef = useRef(false)
  const questionRefs = useRef({})

  useEffect(() => {
    if (location.state?.homework) return

    getVideoHomework(videoId)
      .then(setHomework)
      .catch((requestError) => setError(
        getApiErrorMessage(requestError, 'Không thể tải bài tập về nhà.'),
      ))
      .finally(() => setLoading(false))
  }, [location.state, videoId])

  useEffect(() => {
    const examId = getExamId(homework)
    if (!examId || startRequestedForRef.current === examId) return
    startRequestedForRef.current = examId
    setLoading(true)

    startVideoHomework(videoId)
      .then((startedSubmission) => {
        const submissionId = getSubmissionId(startedSubmission)
        if (!submissionId) {
          throw new Error('Backend bắt đầu bài tập nhưng không trả về submissionId.')
        }
        setSubmission({ ...startedSubmission, submissionId, examId })
      })
      .catch((requestError) => setError(
        getApiErrorMessage(requestError, 'Không thể bắt đầu bài tập. Vui lòng thử lại.'),
      ))
      .finally(() => setLoading(false))
  }, [homework, videoId])

  const parts = useMemo(() => getHomeworkParts(homework), [homework])
  const activePart = parts[partIndex]
  const { partTimes } = useExamTimer(activePart?.id)
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
      const submittedResult = await submitVideoHomework({
        submissionId: submission.submissionId,
        exam_id: examId,
        answers: questionItems.map((question) => ({
          questionId: question.id,
          selectedOpt: answers[question.id] ?? null,
        })),
      })
      setResult(submittedResult)
      const completionKey = `video-homework-completed:${videoId}:${examId}`
      const submittedAnswerUrl = getVideoHomeworkAnswerUrl(submittedResult)
      sessionStorage.setItem(completionKey, submittedAnswerUrl || 'completed')
      setAnswerUrl(submittedAnswerUrl)
      setAnswerLoading(true)
      setAnswerError('')
      getVideoHomeworkAnswers(examId)
        .then((answerResponse) => {
          const fetchedAnswerUrl = getVideoHomeworkAnswerUrl(answerResponse)
          if (!fetchedAnswerUrl) {
            throw new Error('API không trả về answer_url.')
          }
          setAnswerUrl(fetchedAnswerUrl)
          sessionStorage.setItem(completionKey, fetchedAnswerUrl)
        })
        .catch((requestError) => {
          if (!submittedAnswerUrl) {
            setAnswerError(getApiErrorMessage(requestError, 'Không thể tải đáp án chi tiết.'))
          }
        })
        .finally(() => setAnswerLoading(false))
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {})
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Nộp bài tập thất bại. Vui lòng thử lại.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
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
      <main className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-cyan-700">Bài tập video</p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900">{location.state?.title || homework?.title || 'Kết quả bài tập'}</h1>
          </div>
          <button className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white" onClick={() => navigate('/video', { state: { selectedTitle: location.state?.title } })} type="button">
            Quay lại video
          </button>
        </header>
        <section className="mb-6 rounded-2xl border border-cyan-100 bg-cyan-50 p-5">
          <h2 className="font-bold text-slate-900">Đáp án chi tiết</h2>
          {answerLoading && <p className="mt-2 text-sm text-slate-600">Đang tải liên kết đáp án...</p>}
          {answerUrl && (
            <a className="mt-3 inline-flex rounded-lg bg-cyan-600 px-4 py-2 font-bold text-white hover:bg-cyan-700" href={answerUrl} rel="noreferrer" target="_blank">
              Xem đáp án chi tiết
            </a>
          )}
          {answerError && <p className="mt-2 text-sm font-semibold text-red-700">{answerError}</p>}
        </section>
        <section className="space-y-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <ResultStat label="Tổng câu" value={result.totalQuestions ?? questionItems.length} />
            <ResultStat label="Câu đúng" value={result.totalCorrect ?? 0} />
            <ResultStat label="Câu sai" value={result.totalIncorrect ?? 0} />
          </div>
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
    <div className="flex h-[calc(100vh-73px)] min-h-155 flex-col overflow-hidden bg-white text-slate-700">
      <header className="grid h-11 shrink-0 grid-cols-[auto_1fr] items-center border-t-4 border-t-blue-900 border-b border-b-slate-200 bg-white px-4 text-xs">
        <button className="justify-self-start font-semibold text-blue-700 hover:underline" onClick={() => navigate('/video', { state: { selectedTitle: location.state?.title } })} type="button">
          ← Video bài giảng
        </button>
        <div className="ml-auto flex items-center gap-3">
          <span className="font-bold text-slate-700">Số câu đã trả lời: <b className="text-green-600">{answeredCount}</b> / {questionItems.length}</span>
          <span className="font-mono font-bold text-slate-700">
            {Math.floor((partTimes[activePart.id] || 0) / 60).toString().padStart(2, '0')}:{((partTimes[activePart.id] || 0) % 60).toString().padStart(2, '0')}
          </span>
          <button
            className="rounded bg-blue-500 px-4 py-1.5 font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!questionItems.length || submitting || !submission}
            onClick={handleSubmit}
            type="button"
          >
            {submitting ? 'Đang nộp...' : 'Nộp bài'}
          </button>
        </div>
      </header>
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

function ResultStat({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-3 text-center">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  )
}
