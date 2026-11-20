import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { useConsultationInvite } from '../components/ConsultationInvite'
import { useGuestMode } from '../hooks/useGuestMode'
import { getApiErrorMessage, getExamAnswersRevealed, getGuestExamPartLogs, getSubmissionPartLogs } from '../services/api'
import { buildNumberMap, renumberText } from '../utils/examNumbering'
import { formatInlineText, questionToHtml, textToHtml } from '../utils/textFormatting'
import { formatPracticeSubmissionDate } from '../utils/practiceHistory'
import { ResultOverview } from '../components/ResultOverview'

const EMPTY_PART_LOGS = []

function formatDate(value) {
  if (!value) return '—'
  if (!Number.isFinite(Date.parse(value))) return 'Không xác định'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value))
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes} phút ${remainingSeconds} giây`
}

function validDuration(value, minimum = 0) {
  return Number.isSafeInteger(value) && value >= minimum
}

function formatPartName(name, displayNumber) {
  const label = `Part ${displayNumber}`
  const title = typeof name === 'string' ? name.trim() : ''
  if (!title || /^part$/i.test(title)) return label
  if (/^part\s*\d+\b/i.test(title)) return title.replace(/^part\s*\d+\b/i, label)
  return `${label}: ${title}`
}

function PartTimeCard({ part, displayNumber, name }) {
  const actual = part.timeSpentSeconds
  const recommended = part.recommendedTimeSeconds
  const hasActual = validDuration(actual)
  const hasRecommended = validDuration(recommended)
  const difference = hasActual && hasRecommended ? actual - recommended : null
  const comparison = difference === null ? '' : difference === 0
    ? 'Bằng thời gian gợi ý'
    : `${difference > 0 ? 'Lâu hơn' : 'Ít hơn'} ${formatDuration(Math.abs(difference))} so với gợi ý`

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-bold text-slate-900">{formatPartName(name, displayNumber)}</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">Thời gian đã làm</p>
          <p className="mt-1 text-lg font-extrabold text-ice-navy">{hasActual ? formatDuration(actual) : actual == null ? 'Chưa ghi nhận' : 'Dữ liệu không hợp lệ'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">Thời gian gợi ý</p>
          <p className="mt-1 text-lg font-bold text-slate-700">{hasRecommended ? formatDuration(recommended) : recommended == null ? 'Chưa có gợi ý' : 'Dữ liệu không hợp lệ'}</p>
        </div>
      </div>
      {comparison && <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">{comparison}</p>}
    </article>
  )
}

function readStoredResult(submissionId) {
  const stored = sessionStorage.getItem(`exam-result:${submissionId}`)
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

function groupQuestionsByPart(result, partTimeLogs) {
  const details = result?.details || []
  const logByPartId = new Map(partTimeLogs.map((part, index) => [String(part.partId), { ...part, position: index }]))
  const translations = new Map(
    (result?.partTranslations || []).map((part) => [part.partId, part]),
  )
  const partPosition = (part) => part.displayIndex ?? part.orderIndex ?? 0
  const parts = [...(result?.parts || [])].sort(
    (first, second) => partPosition(first) - partPosition(second),
  )
  const groups = new Map(parts.map((part) => [part.partId, {
    key: part.partId,
    name: part.partName || logByPartId.get(String(part.partId))?.partName,
    passageText: part.passageText || part.passage_text || '',
    translate: translations.get(part.partId)?.translate || '',
    questions: [],
  }]))

  details.forEach((question) => {
    const key = question.partId || 'ungrouped'
    if (!groups.has(key)) {
      const translation = translations.get(key)
      groups.set(key, {
        key,
        name: translation?.partName || logByPartId.get(String(key))?.partName || '',
        passageText: translation?.passage_text || translation?.passageText || '',
        translate: translation?.translate || '',
        questions: [],
      })
    }
    groups.get(key).questions.push(question)
  })

  const populatedGroups = [...groups.values()].filter((group) => group.questions.length > 0)
  if (populatedGroups.every((group) => logByPartId.has(String(group.key)))) {
    populatedGroups.sort((first, second) =>
      logByPartId.get(String(first.key)).position - logByPartId.get(String(second.key)).position,
    )
  }
  return populatedGroups
    .map((group) => {
      const map = buildNumberMap(group.questions)
      return {
        ...group,
        name: renumberText(group.name, map),
        passageText: renumberText(group.passageText, map),
        questions: [...group.questions]
          .sort((first, second) => (first.orderIndex ?? 0) - (second.orderIndex ?? 0))
          .map((question) => ({
            ...question,
            content: renumberText(question.content, map),
            explanation: renumberText(question.explanation, map),
          })),
      }
    })
}

export function ExamResultPage({ resultOverride, returnTo, returnLabel }) {
  const { submissionId } = useParams()
  const location = useLocation()
  const promptConsultation = useConsultationInvite()
  const isGuest = useGuestMode()
  const result = resultOverride || location.state?.result || readStoredResult(submissionId)
  const guest = location.state?.guest === true || result?.guest === true ||
    (isGuest && submissionId === 'khach')
  const requiresLogin = isGuest && !guest
  const examId = result?.examId || result?.exam_id
  const isHomework = result?.resultMode === 'homework' || location.state?.returnTo === '/video'
  const embeddedPartLogs = Array.isArray(result?.partTimeLogs) &&
    result.partTimeLogs.every((part) => part && typeof part === 'object' && part.partId)
    ? result.partTimeLogs : null
  const guestSubmissionId = guest ? result?.submissionId : null
  const needsGuestLogs = guest && !embeddedPartLogs && Boolean(examId) && Boolean(guestSubmissionId)
  const [partLogsRetry, setPartLogsRetry] = useState(0)
  const partLogsKey = !isHomework && needsGuestLogs ? `guest:${examId}:${guestSubmissionId}:${partLogsRetry}`
    : !isHomework && !guest && !requiresLogin && submissionId ? `student:${submissionId}:${partLogsRetry}` : ''
  const [partLogsState, setPartLogsState] = useState(null)
  const [answerReveal, setAnswerReveal] = useState(null)
  const currentPartLogs = partLogsState?.key === partLogsKey ? partLogsState : null
  const partTimeLogs = currentPartLogs?.logs || embeddedPartLogs || EMPTY_PART_LOGS
  const partLogsLoading = Boolean(partLogsKey && !currentPartLogs)
  const partLogsError = currentPartLogs?.error || ''
  const orderedPartLogs = useMemo(() => {
    const indexes = partTimeLogs.map((part) => part.displayIndex)
    if (!indexes.every(Number.isSafeInteger) || new Set(indexes).size !== indexes.length) return partTimeLogs
    return [...partTimeLogs].sort((first, second) => first.displayIndex - second.displayIndex)
  }, [partTimeLogs])

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    if (!examId || guest || requiresLogin) return

    let active = true
    getExamAnswersRevealed(examId)
      .then((revealed) => {
        if (active) setAnswerReveal({ examId, revealed, error: '' })
      })
      .catch(() => {
        if (active) setAnswerReveal({ examId, revealed: false, error: 'Không thể xác minh trạng thái công bố đáp án.' })
      })

    return () => {
      active = false
    }
  }, [examId, guest, requiresLogin])

  useEffect(() => {
    if (!partLogsKey) return
    let active = true
    const request = guest
      ? getGuestExamPartLogs(examId, guestSubmissionId)
      : getSubmissionPartLogs(submissionId)
    request
      .then((logs) => { if (active) setPartLogsState({ key: partLogsKey, logs, error: '' }) })
      .catch((requestError) => {
        if (active) setPartLogsState({ key: partLogsKey, logs: null, error: getApiErrorMessage(requestError, 'Không thể tải thời gian làm bài.') })
      })
    return () => { active = false }
  }, [examId, guest, guestSubmissionId, partLogsKey, submissionId])

  const percentage = useMemo(() => {
    if (!Number.isFinite(result?.totalCorrect) || !Number.isFinite(result?.totalQuestions) || result.totalQuestions <= 0) return null
    return Math.round((result.totalCorrect / result.totalQuestions) * 100)
  }, [result])
  const currentAnswerReveal = answerReveal?.examId === examId ? answerReveal : null
  const answersRevealed = guest || currentAnswerReveal?.revealed === true
  const answerParts = useMemo(() => groupQuestionsByPart(result, orderedPartLogs), [result, orderedPartLogs])
  const answerPartNames = new Map(answerParts.map((part) => [String(part.key), part.name]))
  const logPartNumbers = new Map(orderedPartLogs.map((part, index) => [String(part.partId), index + 1]))
  const hasCompleteLogOrder = answerParts.every((group) => logPartNumbers.has(String(group.key)))
  const answerPartIndexes = answerParts.map((group) =>
    result?.parts?.find((part) => String(part.partId) === String(group.key))?.displayIndex,
  )
  const hasAnswerPartOrder = hasCompleteLogOrder ||
    (answerPartIndexes.every(Number.isSafeInteger) && new Set(answerPartIndexes).size === answerPartIndexes.length)
  const resultParts = result?.parts || []
  const resultPartIndexes = resultParts.map((part) => part.displayIndex)
  const resultPartNumbers = resultPartIndexes.every(Number.isSafeInteger) && new Set(resultPartIndexes).size === resultPartIndexes.length
    ? new Map([...resultParts].sort((first, second) => first.displayIndex - second.displayIndex)
      .map((part, index) => [String(part.partId), index + 1]))
    : new Map()
  const waitForAnswerOrder = answerParts.length > 1 && partLogsLoading && !hasAnswerPartOrder
  const isMock = result?.resultMode === 'mock' || String(result?.mode || '').toUpperCase() === 'MOCK'
  const backTo = returnTo || location.state?.returnTo || (isHomework ? '/video' : isMock ? '/thi-thu' : '/luyen-de')
  const backLabel = returnLabel || (isHomework || location.state?.returnTo ? 'Quay lại video' : isMock ? 'Về danh sách thi thử' : 'Về danh sách luyện đề')

  if (requiresLogin) {
    return <Navigate replace to="/dang-nhap" state={{ from: { pathname: location.pathname, search: location.search } }} />
  }

  if (!result) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">Không tìm thấy kết quả</h1>
        <p className="mt-3 text-slate-500">Kết quả có thể đã hết phiên lưu trữ.</p>
        <Link className="mt-6 inline-flex rounded-lg bg-ice-navy px-5 py-3 font-bold text-white" to={backTo}>
          {backLabel}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-6 sm:px-6 lg:py-8">
      <ResultOverview
        backLabel={backLabel}
        backTo={backTo}
        description={<>{result.examTitle || (isHomework ? 'Bài tập video' : isMock ? 'Bài thi thử' : 'Bài luyện đề')} · Nộp lúc: {resultOverride ? formatPracticeSubmissionDate(result.submittedAt) : formatDate(result.submittedAt)}</>}
        eyebrow={isHomework ? 'Bài tập video' : isMock ? 'Thi thử' : 'Luyện đề'}
        stats={[
          { label: 'Điểm số', value: result.score ?? '—', caption: percentage == null ? null : `${percentage}% câu trả lời đúng`, primary: true },
          { label: 'Tổng số câu', value: result.totalQuestions ?? 0 },
          { label: 'Câu đúng', value: result.totalCorrect ?? 0, valueClass: 'text-emerald-700' },
          { label: 'Câu sai', value: result.totalIncorrect ?? 0, valueClass: 'text-red-700' },
        ]}
        title={isHomework ? 'KẾT QUẢ BÀI TẬP' : isMock ? 'KẾT QUẢ THI THỬ' : 'KẾT QUẢ BÀI LÀM'}
      />

      {location.state?.submissionWarnings?.map((warning) => (
        <p className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-800" key={warning}>
          {warning}
        </p>
      ))}

      {guest && (result.answerUrl || result.answerUrlError) && (
        <section className="mt-6 rounded-2xl border border-ice-gold/40 bg-ice-gold-50 p-5">
          {result.answerUrl && (
            <a className="inline-flex rounded-lg bg-ice-navy px-4 py-2 font-bold text-white hover:bg-ice-navy/90" href={result.answerUrl} rel="noreferrer" target="_blank">
              Xem đáp án chi tiết
            </a>
          )}
          {result.answerUrlError && <p className="text-sm font-semibold text-amber-800">{result.answerUrlError}</p>}
        </section>
      )}

      {!isHomework && <section className="mt-10">
        <h2 className="font-gf text-2xl font-bold text-ice-navy">Thời gian theo từng Part</h2>
        <p className="mt-2 text-sm text-slate-500">Thời gian do hệ thống ghi nhận có thể bao gồm lúc bạn rời hoặc đóng trang.</p>
        {partLogsLoading && <p className="mt-4 text-sm text-slate-500">Đang tải thời gian làm bài...</p>}
        {partLogsError && (
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600" role="alert">
            <p>{partLogsError}</p>
            <button className="mt-2 font-semibold underline" onClick={() => setPartLogsRetry((value) => value + 1)} type="button">Thử lại</button>
          </div>
        )}
        {!partLogsLoading && !partLogsError && partTimeLogs.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">Chưa có dữ liệu thời gian cho bài làm này.</p>
        )}
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orderedPartLogs.map((part, index) => (
            <PartTimeCard
              key={part.partId}
              part={part}
              displayNumber={index + 1}
              name={answerPartNames.get(String(part.partId)) || part.partName}
            />
          ))}
        </div>
      </section>}

      <section className="mt-10">
        <h2 className="font-gf text-2xl font-bold text-ice-navy">
          {answersRevealed ? 'Chi tiết đáp án' : 'Chi tiết câu trả lời'}
        </h2>
        {!guest && !currentAnswerReveal && examId && (
          <p className="mt-3 text-sm text-slate-500">Đang kiểm tra trạng thái công bố đáp án...</p>
        )}
        {currentAnswerReveal && !answersRevealed && (
          <p className="mt-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            {currentAnswerReveal.error || 'Đề thi chưa công bố đáp án. Bạn vẫn có thể xem lựa chọn và video ôn tập nếu có.'}
          </p>
        )}
        {!examId && !answersRevealed && (
          <p className="mt-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            Không xác định được đề thi nên đáp án được ẩn.
          </p>
        )}
        {answerParts.length > 1 && !partLogsLoading && !hasAnswerPartOrder && (
          <p className="mt-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            Không thể xác minh đầy đủ thứ tự Part của lượt làm này.
          </p>
        )}
        {waitForAnswerOrder && <p className="mt-3 text-sm text-slate-500">Đang xác định thứ tự Part của lượt làm...</p>}
        {answerParts.length === 0 && <p className="mt-3 text-sm text-slate-500">Chưa có chi tiết câu trả lời.</p>}
        <div className="mt-4 space-y-8">
          {!waitForAnswerOrder && answerParts.map((part, index) => (
            <section className="space-y-4" key={part.key}>
              {isHomework
                ? part.name && <h3 className="text-lg font-extrabold text-slate-900">{part.name}</h3>
                : part.key !== 'ungrouped' && (
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {formatPartName(part.name, (hasCompleteLogOrder ? logPartNumbers.get(String(part.key)) : resultPartNumbers.get(String(part.key))) ?? index + 1)}
                  </h3>
                )}
              {part.passageText && <PartPassage part={part} />}
              {part.questions.map((question) => (
                <QuestionResult
                  guest={guest}
                  key={question.questionId}
                  onGuestVideoClick={promptConsultation}
                  question={question}
                  showAnswer={answersRevealed}
                  showVideo={!location.state?.hideVideos && !isHomework}
                />
              ))}
            </section>
          ))}
        </div>
      </section>
    </div>
  )
}

function PartPassage({ part }) {
  return (
    <article className="rounded-xl border border-ice-gold/40 bg-ice-gold-50/50 p-5">
      <div className={part.translate ? 'grid gap-5 lg:grid-cols-2' : ''}>
        <div>
          <h4 className="text-sm font-bold text-ice-navy">{part.translate ? 'Nguyên văn' : 'Bài đọc'}</h4>
          <div
            className="mt-2 text-sm leading-7 text-slate-700 [&_h2]:text-center [&_h2]:font-bold [&_h2]:uppercase [&_p]:mb-3"
            dangerouslySetInnerHTML={{ __html: textToHtml(part.passageText) }}
          />
        </div>
        {part.translate && (
          <div>
            <h4 className="text-sm font-bold text-emerald-700">Bản dịch tiếng Việt</h4>
            <div
              className="mt-2 text-sm leading-7 text-slate-700 [&_h2]:text-center [&_h2]:font-bold [&_p]:mb-3"
              dangerouslySetInnerHTML={{ __html: textToHtml(part.translate) }}
            />
          </div>
        )}
      </div>
    </article>
  )
}

const optionKeys = ['A', 'B', 'C', 'D']

function QuestionResult({ question, showAnswer, showVideo = true, guest = false, onGuestVideoClick }) {
  const isCorrect = question.isCorrect === true
  const legacyVideo = question.relatedVideo || question.related_video
  const responseVideos = question.relatedVideos || question.related_videos
  const videos = showVideo
    ? responseVideos?.length ? responseVideos : legacyVideo ? [legacyVideo] : []
    : []

  return (
    <article className={`rounded-xl border bg-white p-5 shadow-sm ${showAnswer ? (isCorrect ? 'border-emerald-200' : 'border-red-200') : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div
          className="font-bold text-slate-900"
          dangerouslySetInnerHTML={{
            __html: questionToHtml(question.displayNumber ?? question.orderIndex, question.content, 'Câu'),
          }}
        />
        {showAnswer && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {isCorrect ? 'Đúng' : 'Sai'}
          </span>
        )}
      </div>
      <ul className="mt-4 grid gap-2">
        {optionKeys.map((key) => {
          const text = question[`opt${key}`]
          if (text == null || text === '') return null
          const selected = question.selectedOpt === key
          const correct = showAnswer && question.correctOpt === key
          const tone = correct
            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
            : selected
              ? showAnswer ? 'border-red-300 bg-red-50 text-red-900' : 'border-ice-navy/30 bg-ice-navy/5 text-ice-navy'
              : 'border-slate-200 text-slate-700'

          return (
            <li className={`flex flex-wrap items-start gap-2 rounded-lg border px-3 py-2 text-sm ${tone}`} key={key}>
              <span
                className="min-w-0 flex-1"
                dangerouslySetInnerHTML={{ __html: `<strong>${key}.</strong> ${formatInlineText(text)}` }}
              />
              {selected && <span className="text-xs font-bold">Bạn chọn</span>}
              {correct && <span className="text-xs font-bold">Đáp án đúng</span>}
            </li>
          )
        })}
      </ul>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <span className="text-slate-600">Bạn chọn: <strong>{question.selectedOpt || 'Chưa chọn'}</strong></span>
        {showAnswer && (
          <span className="text-slate-600">Đáp án đúng: <strong>{question.correctOpt || '—'}</strong></span>
        )}
      </div>
      {showAnswer && question.explanation && (
        <p
          className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600"
          dangerouslySetInnerHTML={{
            __html: formatInlineText(question.explanation).replace(/\n/g, '<br>'),
          }}
        />
      )}
      {videos.map((video, index) => {
        const videoId = video?.videoId ?? video?.video_id ?? video?.id
        const videoTitle = video?.videoTitle || video?.video_title || video?.title
        const hasVideoId = videoId != null && String(videoId).trim() !== ''
        const label = `Xem video ôn tập${videoTitle ? `: ${videoTitle}` : ''}`
        if (guest) {
          if (video?.accessible === true && hasVideoId) {
            return (
              <Link
                className="mt-4 mr-2 inline-flex items-center rounded-lg border border-ice-navy/20 bg-ice-navy/5 px-4 py-2 text-sm font-bold text-ice-navy hover:border-ice-navy/40 hover:bg-ice-navy/10"
                key={videoId}
                state={{ selectedTitle: videoTitle }}
                to={`/video?videoId=${encodeURIComponent(videoId)}`}
              >
                {label}
              </Link>
            )
          }
          return (
            <button
              className="mt-4 mr-2 inline-flex items-center rounded-lg border border-ice-navy/20 bg-ice-navy/5 px-4 py-2 text-sm font-bold text-ice-navy hover:border-ice-navy/40 hover:bg-ice-navy/10"
              key={hasVideoId ? videoId : `video-${index}`}
              onClick={() => onGuestVideoClick?.(videoTitle)}
              type="button"
            >
              {label}
            </button>
          )
        }
        if (hasVideoId) {
          return (
            <Link
              className="mt-4 mr-2 inline-flex items-center rounded-lg border border-ice-navy/20 bg-ice-navy/5 px-4 py-2 text-sm font-bold text-ice-navy hover:border-ice-navy/40 hover:bg-ice-navy/10"
              key={videoId}
              state={{ selectedTitle: videoTitle }}
              to={`/video?videoId=${encodeURIComponent(videoId)}`}
            >
              {label}
            </Link>
          )
        }
        return (
          <div className="mt-4 text-sm font-semibold text-amber-800" key={`video-${index}`}>
            {videoTitle && <p>Video ôn tập: {videoTitle}</p>}
            <p>Không thể mở video ôn tập vì dữ liệu chưa có video ID.</p>
          </div>
        )
      })}
    </article>
  )
}
