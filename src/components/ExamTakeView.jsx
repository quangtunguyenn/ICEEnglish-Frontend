import { useEffect, useRef, useState } from 'react'
import { ExamIdentityBar } from './ExamIdentityBar'
import { ExamQuestion } from './ExamQuestion'
import { PassageViewer } from './PassageViewer'
import { SubmitConfirmationDialog } from './SubmitConfirmationDialog'

function formatTime(seconds) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}

export function ExamTakeView({
  exam, activePart, activePartKey, partIndex, answers, isMock,
  remainingSeconds, submitting,
  error, markedQuestions, questionItems,
  questionCount, answeredCount, questionRefs, chooseAnswer, toggleMark,
  handleSaveDraft, handleSubmit, goToQuestion, goToNextPart, goToPreviousPart,
  candidateName = 'Thí sinh', candidateSbd = '—', examStartedAt,
  trackingError, retryTracking, timerUnavailable,
}) {
  const [highlightedPassages, setHighlightedPassages] = useState({})
  const [submitConfirmationOpen, setSubmitConfirmationOpen] = useState(false)
  const [securityWarning, setSecurityWarning] = useState(false)
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(
    () => typeof document !== 'undefined' && Boolean(document.fullscreenElement),
  )
  const fullscreenStartedRef = useRef(false)

  useEffect(() => {
    if (document.fullscreenElement) fullscreenStartedRef.current = true

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

  return (
    <div className="flex h-[calc(100vh-73px)] min-h-[620px] flex-col overflow-hidden bg-white text-slate-700 [:fullscreen_&]:h-screen">
      <ExamIdentityBar candidateName={candidateName} candidateSbd={candidateSbd} examStartedAt={examStartedAt}>
        {isMock && (
          <span aria-label="Thời gian còn lại" className={`flex items-center gap-2 font-google-sans text-2xl font-bold tabular-nums ${remainingSeconds < 60 ? 'text-amber-300' : 'text-white'}`} role="timer">
            <svg aria-hidden="true" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {timerUnavailable ? 'Không khả dụng' : formatTime(remainingSeconds)}
          </span>
        )}
        <button
          className="rounded bg-white px-4 py-1.5 font-bold text-[#102b5c] hover:bg-blue-50 disabled:cursor-wait disabled:opacity-50"
          disabled={submitting}
          onClick={() => setSubmitConfirmationOpen(true)}
          type="button"
        >
          {submitting ? 'Đang nộp...' : 'NỘP BÀI'}
        </button>
      </ExamIdentityBar>
      {trackingError && (
        <div className="shrink-0 bg-amber-50 px-4 py-2 text-sm text-amber-900" role="alert">
          Không thể ghi nhận thời gian phần đang làm: {trackingError} Thời gian từng phần có thể chưa chính xác.{' '}
          <button className="font-bold underline" onClick={retryTracking} type="button">Thử lại</button>
        </div>
      )}
      {error && <p className="shrink-0 bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">{error}</p>}
      {isMock && !timerUnavailable && remainingSeconds === 0 && (
        <p className="shrink-0 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Đồng hồ tham khảo đã về 0. Hãy nộp bài; hệ thống sẽ kiểm tra thời hạn.
        </p>
      )}
      <div aria-label="Điều khiển bài thi" className="grid min-h-11 shrink-0 grid-cols-1 items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 text-xs lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]" role="toolbar">
        <div aria-hidden="true" className="hidden lg:block" />
        <div className="flex items-center justify-center gap-2">
          <button
            className="rounded border border-blue-300 px-4 py-1.5 font-medium font-inter text-[14px] text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={partIndex === 0}
            onClick={goToPreviousPart}
            type="button"
          >
          Quay lại
          </button>
          <button
            className="rounded bg-blue-500 px-4 py-1.5 font-medium font-inter text-[14px] text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={partIndex >= exam.parts.length - 1}
            onClick={goToNextPart}
            type="button"
          >
            Tiếp theo
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 lg:col-start-3 lg:ml-auto lg:justify-end">
          <span className="font-bold font-google-sans text-[15px] text-slate-700">Số câu đã trả lời: <b className="text-green-600">{answeredCount}</b> / {questionCount}</span>
          <button
            className="rounded bg-blue-500 px-4 py-1.5 font-gf text-[13px] font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            disabled={submitting}
            onClick={handleSaveDraft}
            type="button"
          >
            Lưu
          </button>
        </div>
      </div>
    
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
              disabled={submitting}
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
        className="flex min-h-12 shrink-0 items-center gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-t border-slate-200 bg-white px-3 py-2"
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
      </footer>
      {submitConfirmationOpen && (
        <SubmitConfirmationDialog
          onCancel={() => setSubmitConfirmationOpen(false)}
          onConfirm={() => {
            setSubmitConfirmationOpen(false)
            handleSubmit()
          }}
          unansweredCount={Math.max(0, questionCount - answeredCount)}
        />
      )}
      {!submitting && (!hasEnteredFullscreen || securityWarning) && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-x-hidden overflow-y-auto overscroll-contain bg-slate-950/75 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
        >
          <div className="my-auto w-full min-w-0 max-w-md break-words rounded-xl bg-white p-5 text-center shadow-2xl sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
              {securityWarning ? 'Vui lòng quay lại chế độ làm bài' : 'Bắt đầu làm bài'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {securityWarning
                ? 'Bạn đã thoát khỏi chế độ khóa màn hình hoặc chuyển tab. Hãy quay lại toàn màn hình để tiếp tục làm bài.'
                : 'Khi bắt đầu làm bài, giao diện bài thi sẽ bị khóa trong chế độ toàn màn hình. Nếu thoát chế độ này hoặc chuyển tab, hệ thống sẽ cảnh báo và yêu cầu quay lại.'}
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
