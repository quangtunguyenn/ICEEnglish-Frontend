import { useEffect, useRef, useState } from 'react'
import { ExamQuestion } from './ExamQuestion'
import { PassageViewer } from './PassageViewer'

function formatTime(seconds) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}

export function ExamTakeView({
  exam, activePart, activePartKey, partIndex, answers, isMock, isGeneralExam,
  remainingSeconds, mockExpired, partTimes, submitting, hasUnsavedChanges,
  saveStatus, timerStorageWarning, error, markedQuestions, questionItems,
  questionCount, answeredCount, questionRefs, chooseAnswer, toggleMark,
  handleSaveDraft, handleSubmit, goToQuestion, goToNextPart, goToPreviousPart,
  guest = false,
}) {
  const [highlightedPassages, setHighlightedPassages] = useState({})
  const [securityWarning, setSecurityWarning] = useState(false)
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false)
  const fullscreenStartedRef = useRef(false)

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

  return (
    <div className="flex h-[calc(100vh-73px)] min-h-[620px] flex-col overflow-hidden bg-white text-slate-700">
      <header className="grid min-h-11 shrink-0 grid-cols-1 items-center gap-2 border-t-4 border-blue-900 border-b border-slate-200 bg-white px-4 py-2 text-xs lg:grid-cols-[1fr_auto_1fr]">
        <div className="hidden lg:block" />
        <div className="flex items-center justify-center gap-2">
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
        <div className="flex flex-wrap items-center justify-center gap-3 lg:ml-auto lg:justify-end">
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
              {guest
                ? 'Đồng hồ và thời hạn nộp được máy chủ xác thực. Bài tự nộp khi hết giờ nếu trang đang mở và có kết nối; phiên khách có thể mất khi máy chủ khởi động lại.'
                : 'Hãy bấm Lưu thường xuyên. Đồng hồ chạy cả khi đóng tab và dựa vào giờ trên máy, không được server xác thực. Khi hết giờ, bài chỉ được nộp khi trang đang mở và có kết nối; nếu quay lại, chỉ bản đã lưu mới được khôi phục. Không mở cùng lượt thi trong nhiều tab hoặc thiết bị.'}
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
