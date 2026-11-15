import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BrandPageIntro } from '../components/PageIntro'
import { useGuestMode } from '../hooks/useGuestMode'
import {
  getApiErrorMessage,
  getGuestVideos,
  getGuestVideoVocabularies,
  getVideoTitles,
  getVideoVocabularies,
} from '../services/api'
import { sortVideoTitles } from '../utils/videoTitles'
import { normalizeVideoVocabularies } from '../utils/videoVocabulary'

/* ICE English: xanh navy (ice-navy) + vàng hổ phách (amber), lấy từ logo.
   Flashcard được dựng ngay trong file này nên không còn cần import VocabularyFlashcard. */

const EMPTY_VOCABULARIES = []
const SIDEBAR_KEY = 'vocabulary-sidebar-open'
const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

const KEYFRAMES = `
@keyframes vp-in-next{from{opacity:0;transform:translateX(32px) scale(.97)}to{opacity:1;transform:none}}
@keyframes vp-in-prev{from{opacity:0;transform:translateX(-32px) scale(.97)}to{opacity:1;transform:none}}
.vp-enter-next{animation:vp-in-next .38s cubic-bezier(.2,.8,.2,1)}
.vp-enter-prev{animation:vp-in-prev .38s cubic-bezier(.2,.8,.2,1)}
.vp-card-flip{transition:transform 700ms cubic-bezier(.22,.75,.22,1)}
@media (prefers-reduced-motion:reduce){.vp-enter-next,.vp-enter-prev{animation:none}.vp-card-flip{transition:none}}
`

const ICONS = {
  list: 'M4 6h16M4 12h16M4 18h7',
  close: 'M6 18L18 6M6 6l12 12',
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  back: 'M10 19l-7-7m0 0l7-7m-7 7h18',
  prev: 'M15 19l-7-7 7-7',
  next: 'M9 5l7 7-7 7',
  first: 'M11 19l-7-7 7-7m8 14l-7-7 7-7',
  reset: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  shuffle: 'M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
  flip: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  speaker: 'M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z',
  check: 'M5 13l4 4L19 7',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
}

function Icon({ name, className = 'h-5 w-5', strokeWidth = 2 }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} viewBox="0 0 24 24">
      <path d={ICONS[name]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice-navy/40 focus-visible:ring-offset-2'
const btnPrimary = `inline-flex items-center justify-center gap-2 rounded-xl bg-ice-navy px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-ice-navy/90 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`
const btnGold = `inline-flex items-center justify-center gap-2 rounded-xl bg-ice-gold px-5 py-3 text-sm font-bold text-ice-navy shadow-sm transition hover:bg-ice-gold-300 ${focusRing}`
const btnOutline = `inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-ice-navy transition hover:border-ice-navy/40 hover:bg-ice-navy/5 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`

function readSidebarPreference(hasSelectedVideo) {
  try {
    const saved = localStorage.getItem(SIDEBAR_KEY)
    if (saved !== null && isDesktop()) return saved === '1'
  } catch {
    /* localStorage không khả dụng */
  }
  return isDesktop() || !hasSelectedVideo
}

function getVideoId(video) {
  return video?.videoId || video?.video_id || video?.id || ''
}

function getVideoTitle(video) {
  return typeof video === 'string'
    ? video
    : video?.title || video?.videoTitle || video?.video_title || ''
}

function shuffleItems(items) {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

/** Thứ tự thẻ mới (mảng chỉ số), luôn khác thứ tự hiện tại khi có từ 2 thẻ trở lên. */
function createShuffledOrder(length, previous) {
  const indexes = Array.from({ length }, (_, index) => index)
  const isSame = (candidate) => candidate.every((value, index) => value === (previous ? previous[index] : index))
  let next = shuffleItems(indexes)
  for (let attempt = 0; attempt < 5 && length > 1 && isSame(next); attempt += 1) next = shuffleItems(indexes)
  return next
}

function createQuizDeck(vocabularies) {
  return vocabularies.map((answer, answerIndex) => {
    const distractors = shuffleItems(
      vocabularies.filter((item, index) =>
        index !== answerIndex && item.meaning.toLocaleLowerCase() !== answer.meaning.toLocaleLowerCase(),
      ),
    ).slice(0, 3)

    return { choices: shuffleItems([answer, ...distractors]) }
  })
}

function speak(text) {
  if (!text || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

/* ───────────── Flashcard 3D: lật hai chiều, nghiêng theo con trỏ ───────────── */

function Flashcard({ vocabulary, isFlipped, onFlip }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [reduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const example = vocabulary.exampleSentence || vocabulary.example
  const exampleTranslation = vocabulary.exampleSentenceTranslate
  const face = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }
  const accessibleLabel = isFlipped
    ? `${vocabulary.meaning}. ${exampleTranslation || ''} Nhấn để xem từ tiếng Anh.`
    : `${vocabulary.word}. ${vocabulary.phonetic || ''} ${example || ''} Nhấn để xem nghĩa tiếng Việt.`

  function handlePointerMove(event) {
    if (reduceMotion || event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    setTilt({
      x: ((event.clientY - rect.top) / rect.height - 0.5) * -8,
      y: ((event.clientX - rect.left) / rect.width - 0.5) * 10,
    })
  }

  return (
    <div className="relative mx-auto mb-8 w-full max-w-2xl">
      <span aria-hidden="true" className="absolute inset-x-6 -bottom-3 top-4 rounded-3xl bg-ice-navy/10" />
      <span aria-hidden="true" className="absolute inset-x-12 -bottom-6 top-8 rounded-3xl bg-ice-navy/5" />

      <div
        className="relative"
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        onPointerMove={handlePointerMove}
        style={{ perspective: '1200px' }}
      >
        <div style={{ transformStyle: 'preserve-3d', transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transition: reduceMotion ? 'none' : 'transform 240ms ease-out' }}>
          <div
            aria-label={accessibleLabel}
            aria-pressed={isFlipped}
            className="vp-card-flip relative block h-80 w-full cursor-pointer select-none rounded-3xl outline-none focus-visible:ring-4 focus-visible:ring-ice-gold-300 sm:h-96"
            onClick={onFlip}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onFlip()
              }
            }}
            role="button"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateY(${isFlipped ? 180 : 0}deg)`,
            }}
            tabIndex={0}
          >
            {/* Mặt trước: tiếng Anh */}
            <div aria-hidden={isFlipped} className="absolute inset-0 flex flex-col items-center overflow-hidden rounded-3xl border border-white/10 bg-ice-navy bg-gradient-to-br from-[#183b70] via-[#102b5c] to-[#091a35] px-8 pb-12 pt-10 text-center text-white shadow-2xl" style={{ ...face, transform: 'translateZ(1px)' }}>
              <span aria-hidden="true" className="absolute bottom-6 left-5 top-6 w-2.5 rounded-full bg-ice-gold" />
              <img alt="" aria-hidden="true" className="pointer-events-none absolute bottom-2 right-2 w-8 opacity-20 mix-blend-screen grayscale invert sm:bottom-4 sm:right-4 sm:w-14" src="/ice_english_emblem_vector.svg" />
              <div className="min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto">
                <div className="flex min-h-full flex-col items-center justify-center">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">Tiếng Anh</span>
                  <h3 className="mt-4 max-w-full break-words text-4xl font-extrabold tracking-tight text-white sm:text-6xl">{vocabulary.word}</h3>
                  {vocabulary.phonetic && <p className="mt-2 max-w-full break-words text-lg font-medium text-ice-gold-300">{vocabulary.phonetic}</p>}
                  {example && <p className="mt-4 w-full max-w-md break-words border-t border-white/15 pt-3 text-sm font-medium italic leading-6 text-white/85">{example}</p>}
                </div>
              </div>
              <p className="absolute bottom-5 inline-flex items-center gap-1.5 text-xs font-medium text-white/60">
                <Icon className="h-3.5 w-3.5" name="flip" />
                Chạm hoặc nhấn Space để lật
              </p>
            </div>

            {/* Mặt sau: tiếng Việt */}
            <div aria-hidden={!isFlipped} className="absolute inset-0 flex flex-col items-center overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-8 pb-12 pt-10 text-center shadow-2xl" style={{ ...face, transform: 'rotateY(180deg) translateZ(1px)' }}>
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-2 bg-ice-gold" />
              <img alt="" aria-hidden="true" className="pointer-events-none absolute bottom-2 right-2 w-8 opacity-15 mix-blend-multiply sm:bottom-4 sm:right-4 sm:w-14" src="/ice_english_emblem_vector.svg" />
              <div className="min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto">
                <div className="flex min-h-full flex-col items-center justify-center">
                  <span className="rounded-full bg-ice-gold-100 px-3 py-1 text-xs font-semibold text-ice-gold-800">Nghĩa tiếng Việt</span>
                  <h3 className="mt-4 max-w-full break-words text-3xl font-extrabold text-ice-navy sm:text-5xl">{vocabulary.meaning}</h3>
                  {exampleTranslation && <p className="mt-4 w-full max-w-md break-words border-t border-slate-200 pt-3 text-sm leading-6 text-slate-600">{exampleTranslation}</p>}
                </div>
              </div>
              <p className="absolute bottom-5 text-xs font-medium text-slate-500">Chạm để lật lại</p>
            </div>
          </div>
        </div>
      </div>

      <button
        aria-label={`Nghe phát âm từ ${vocabulary.word}`}
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ice-navy shadow-md ring-1 ring-black/5 transition hover:bg-ice-gold-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice-gold"
        onClick={() => speak(vocabulary.word)}
        title="Nghe phát âm"
        type="button"
      >
        <Icon name="speaker" />
      </button>
    </div>
  )
}

/* ───────────── Trang chính ───────────── */

export function VocabularyPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const guest = useGuestMode()
  const [videos, setVideos] = useState([])
  const [videosLoading, setVideosLoading] = useState(true)
  const [videosError, setVideosError] = useState('')
  const [selectedVideoId, setSelectedVideoId] = useState(location.state?.videoId || '')
  const [selectedVideoTitle, setSelectedVideoTitle] = useState(location.state?.title || '')
  const [vocabularies, setVocabularies] = useState(() =>
    normalizeVideoVocabularies(location.state?.vocabularies),
  )
  const [vocabulariesLoading, setVocabulariesLoading] = useState(false)
  const [vocabulariesError, setVocabulariesError] = useState('')
  const selectedVideoLocked = guest && Boolean(selectedVideoId) && (
    videosLoading || videos.find((video) => getVideoId(video) === selectedVideoId)?.accessible !== true
  )
  const availableVocabularies = selectedVideoLocked ? EMPTY_VOCABULARIES : vocabularies
  const availableVocabulariesError = selectedVideoLocked
    ? 'Chuyên đề này yêu cầu đăng nhập để xem từ vựng.'
    : vocabulariesError
  const [deckSeed, setDeckSeed] = useState(0)
  // order: thứ tự thẻ sau khi xáo (mảng chỉ số), null = thứ tự gốc. Dùng chung cho Thẻ lật và Chọn đáp án.
  const [order, setOrder] = useState(null)
  const isShuffled = Boolean(order && order.length === availableVocabularies.length)
  const deckVocabularies = useMemo(
    () => (isShuffled ? order.map((itemIndex) => availableVocabularies[itemIndex]) : availableVocabularies),
    [availableVocabularies, isShuffled, order],
  )
  // deckSeed chỉ dùng để xáo lại đáp án khi bấm "Đặt lại" hoặc "Xáo thẻ"
  const quizDeck = useMemo(() => createQuizDeck(deckVocabularies), [deckVocabularies, deckSeed])
  const [mode, setMode] = useState('flip')
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState('next')
  const [isFlipped, setIsFlipped] = useState(false)
  const [selectedVocabularyId, setSelectedVocabularyId] = useState('')
  const [quizResults, setQuizResults] = useState({})
  const [sidebarOpen, setSidebarOpen] = useState(() => readSidebarPreference(Boolean(location.state?.videoId)))
  const vocabularyRequestId = useRef(0)

  useEffect(() => {
    let active = true
    const request = guest ? getGuestVideos() : getVideoTitles()
    request
      .then((items) => {
        if (active) setVideos(sortVideoTitles(items))
      })
      .catch((requestError) => {
        if (active) setVideosError(getApiErrorMessage(requestError, 'Không thể tải danh sách video.'))
      })
      .finally(() => {
        if (active) setVideosLoading(false)
      })

    return () => {
      active = false
    }
  }, [guest])

  async function selectVideo(video) {
    const videoId = getVideoId(video)
    const videoTitle = getVideoTitle(video)
    if (!videoId) {
      setVocabulariesError('Video này chưa có video_id hợp lệ.')
      return
    }
    if (guest && video.accessible !== true) {
      navigate('/dang-nhap', {
        state: { from: { pathname: '/video', search: `?videoId=${encodeURIComponent(videoId)}` } },
      })
      return
    }

    setSelectedVideoId(videoId)
    setSelectedVideoTitle(videoTitle)
    setIndex(0)
    setIsFlipped(false)
    setSelectedVocabularyId('')
    setQuizResults({})
    setOrder(null)
    setVocabulariesError('')
    if (!isDesktop()) setSidebarOpen(false)
    if (videoId === selectedVideoId && vocabularies.length) return

    const requestId = ++vocabularyRequestId.current
    setVocabulariesLoading(true)
    try {
      const items = guest
        ? await getGuestVideoVocabularies(videoId)
        : await getVideoVocabularies(videoId)
      if (requestId !== vocabularyRequestId.current) return
      setVocabularies(normalizeVideoVocabularies(items))
    } catch (requestError) {
      if (requestId === vocabularyRequestId.current) {
        setVocabularies([])
        setVocabulariesError(
          getApiErrorMessage(requestError, 'Không thể tải từ vựng của bài học.'),
        )
      }
    } finally {
      if (requestId === vocabularyRequestId.current) setVocabulariesLoading(false)
    }
  }

  const total = availableVocabularies.length
  const currentIndex = Math.min(index, Math.max(total - 1, 0))
  const currentVocabulary = deckVocabularies[currentIndex]
  const currentQuiz = quizDeck[currentIndex]
  const isQuizCorrect = selectedVocabularyId === currentVocabulary?.id
  const isLast = currentIndex >= total - 1
  const answeredCount = Object.keys(quizResults).length
  const correctCount = Object.values(quizResults).filter(Boolean).length

  function changeMode(nextMode) {
    setMode(nextMode)
    setIsFlipped(false)
    setSelectedVocabularyId('')
  }

  function moveTo(nextIndex) {
    setDirection(nextIndex >= currentIndex ? 'next' : 'prev')
    setIndex(nextIndex)
    setIsFlipped(false)
    setSelectedVocabularyId('')
  }

  /** Về thẻ đầu tiên, giữ nguyên chế độ và kết quả đã làm. */
  const goToFirst = () => moveTo(0)

  /** Xáo thứ tự thẻ (cả Thẻ lật và Chọn đáp án), bắt đầu lại từ thẻ đầu với kết quả mới. */
  function shuffleDeck() {
    if (total < 2) return
    setOrder((previous) => createShuffledOrder(total, previous))
    setDirection('next')
    setIndex(0)
    setIsFlipped(false)
    setSelectedVocabularyId('')
    setQuizResults({})
    setDeckSeed((seed) => seed + 1)
  }

  /** Đặt lại toàn bộ phiên: thẻ 1, thứ tự gốc, mặt trước, xóa kết quả, xáo lại đáp án. */
  function resetSession() {
    setDirection('prev')
    setIndex(0)
    setIsFlipped(false)
    setSelectedVocabularyId('')
    setQuizResults({})
    setOrder(null)
    setDeckSeed((seed) => seed + 1)
  }

  function answerQuiz(choiceId) {
    setSelectedVocabularyId(choiceId)
    setQuizResults((results) => ({ ...results, [currentVocabulary.id]: choiceId === currentVocabulary.id }))
  }

  function toggleSidebar() {
    const next = !sidebarOpen
    setSidebarOpen(next)
    if (isDesktop()) {
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0')
      } catch {
        /* bỏ qua */
      }
    }
  }

  useEffect(() => {
    if (!sidebarOpen) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isDesktop()) setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sidebarOpen])

  /* Phím tắt: ← → chuyển thẻ, Home về thẻ đầu, Space lật thẻ */
  useEffect(() => {
    if (!currentVocabulary) return
    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.target.closest?.('input, textarea, select')) return
      if (event.key === 'ArrowRight' && currentIndex < total - 1) {
        setDirection('next')
        setIndex(currentIndex + 1)
        setIsFlipped(false)
        setSelectedVocabularyId('')
      } else if (event.key === 'ArrowLeft' && currentIndex > 0) {
        setDirection('prev')
        setIndex(currentIndex - 1)
        setIsFlipped(false)
        setSelectedVocabularyId('')
      } else if (event.key === 'Home') {
        event.preventDefault()
        setDirection('prev')
        setIndex(0)
        setIsFlipped(false)
        setSelectedVocabularyId('')
      } else if (event.key === ' ' && mode === 'flip' && !event.target.closest?.('button, a, [role="button"]')) {
        event.preventDefault()
        setIsFlipped((flipped) => !flipped)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentVocabulary, currentIndex, total, mode])

  const showStatusCard = vocabulariesLoading || availableVocabulariesError || (!availableVocabularies.length)

  return (
    <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-6 sm:px-6 lg:py-8">
      <style>{KEYFRAMES}</style>

      <BrandPageIntro
        description="Chọn một bài học để ôn tập từ vựng với thẻ ghi nhớ và câu hỏi trắc nghiệm."
        eyebrow="Học tập"
        logo
        title="LUYỆN TẬP TỪ VỰNG"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="min-w-0 border-l-4 border-ice-gold pl-4">
          <p className="text-sm font-bold text-ice-navy">Bài học hiện tại</p>
          <p className="mt-1 text-sm text-slate-600">
            {selectedVideoTitle
              ? `${selectedVideoTitle}${availableVocabularies.length > 0 ? `, ${availableVocabularies.length} từ vựng` : ''}`
              : 'Chọn một bài học để ôn tập từ vựng.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-controls="lesson-list"
            aria-expanded={sidebarOpen}
            className={btnOutline}
            onClick={toggleSidebar}
            type="button"
          >
            <Icon name="list" />
            {sidebarOpen ? 'Ẩn danh sách' : 'Danh sách bài'}
          </button>
          <Link className={`${btnOutline} hidden sm:inline-flex`} to="/video">
            <Icon className="h-4 w-4" name="back" />
            Quay lại video
          </Link>
        </div>
      </div>

      <div className="flex items-start gap-6">
        {/* ───────── Sidebar danh sách bài học (trượt ra/vào) ───────── */}
        <button
          aria-hidden={!sidebarOpen}
          aria-label="Đóng danh sách bài học"
          className={`fixed inset-0 z-[60] bg-ice-navy/50 backdrop-blur-[2px] transition-[opacity,visibility] duration-300 motion-reduce:transition-none lg:hidden ${sidebarOpen ? 'visible opacity-100' : 'invisible pointer-events-none opacity-0'}`}
          inert={!sidebarOpen}
          onClick={() => setSidebarOpen(false)}
          tabIndex={-1}
          type="button"
        />
        <aside
          aria-hidden={!sidebarOpen}
          aria-label="Chọn bài học"
          className={`fixed bottom-0 left-0 top-0 z-[70] flex w-80 max-w-[88vw] flex-col overflow-hidden bg-white shadow-2xl transition-[translate,width,margin,opacity,visibility] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none lg:sticky lg:bottom-auto lg:left-auto lg:top-6 lg:z-auto lg:max-w-none lg:shrink-0 lg:rounded-2xl lg:border lg:border-slate-200 lg:shadow-sm lg:duration-300 ${
            sidebarOpen ? 'visible translate-x-0 lg:w-80' : 'invisible -translate-x-full lg:-mr-6 lg:w-0 lg:translate-x-0 lg:border-transparent lg:opacity-0'
          }`}
          id="lesson-list"
          inert={!sidebarOpen}
        >
          <div className="flex min-h-0 w-full flex-1 flex-col lg:w-80 lg:flex-none">
            <div className="flex items-center justify-between gap-3 border-b-4 border-ice-gold bg-ice-navy px-5 py-4">
              <div>
                <h2 className="font-extrabold text-white">Bài học</h2>
                <p className="mt-0.5 text-xs text-white/70">{videos.length} video</p>
              </div>
              <button
                aria-label="Ẩn danh sách bài học"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice-gold"
                onClick={toggleSidebar}
                type="button"
              >
                <Icon name="close" />
              </button>
            </div>

            {videosLoading && (
              <div aria-hidden="true" className="animate-pulse space-y-3 p-4">
                {[0, 1, 2, 3].map((i) => <div className="h-12 rounded-xl bg-slate-100" key={i} />)}
              </div>
            )}
            {videosError && <p className="p-5 text-sm font-semibold text-red-700">{videosError}</p>}
            {!videosLoading && !videosError && videos.length === 0 && <p className="p-5 text-sm text-slate-500">Chưa có bài học nào.</p>}

            <nav className="flex-1 overflow-y-auto p-3 lg:max-h-[calc(100vh-11rem)] lg:flex-none">
              <ul className="space-y-1.5">
                {videos.map((video, videoIndex) => {
                  const videoId = getVideoId(video)
                  const title = getVideoTitle(video)
                  const isSelected = selectedVideoId === videoId
                  const isLocked = guest && video.accessible !== true

                  return (
                    <li key={videoId || `${title}-${videoIndex}`}>
                      <button
                        aria-current={isSelected ? 'true' : undefined}
                        className={`relative flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition disabled:cursor-wait ${isSelected ? 'bg-ice-navy/5 ring-1 ring-ice-navy/15' : 'hover:bg-slate-50'} ${focusRing}`}
                        disabled={!videoId || vocabulariesLoading}
                        onClick={() => selectVideo(video)}
                        type="button"
                      >
                        {isSelected && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-full bg-ice-gold" />}
                        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${isSelected ? 'bg-ice-navy text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {videoIndex + 1}
                        </span>
                        <span className={`flex-1 text-sm font-semibold ${isLocked ? 'text-slate-400' : isSelected ? 'text-ice-navy' : 'text-slate-700'}`}>{title}</span>
                        {isLocked && (
                          <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-400">
                            <Icon className="h-3.5 w-3.5" name="lock" />
                            Đăng nhập
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>
        </aside>

        {/* ───────── Khu vực luyện tập ───────── */}
        <section className="min-w-0 flex-1">
          {showStatusCard && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              {vocabulariesLoading && (
                <p aria-live="polite" className="py-6 text-sm font-medium text-slate-500">Đang tải từ vựng bài học...</p>
              )}
              {!vocabulariesLoading && availableVocabulariesError && (
                <p className="mx-auto flex max-w-md items-start gap-3 rounded-xl bg-red-50 p-4 text-left text-sm font-semibold text-red-700" role="alert">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" name="warning" />
                  {availableVocabulariesError}
                </p>
              )}
              {!vocabulariesLoading && !availableVocabulariesError && (
                <div className="py-8">
                  <p className="text-lg font-bold text-ice-navy">
                    {selectedVideoTitle ? 'Bài học này chưa có từ vựng.' : 'Chọn một bài học để bắt đầu luyện tập.'}
                  </p>
                  {!selectedVideoTitle && (
                    <button className={`${btnGold} mt-5`} onClick={() => setSidebarOpen(true)} type="button">
                      Mở danh sách bài học
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {currentVocabulary && currentQuiz && !vocabulariesLoading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              {/* Thanh công cụ */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div aria-label="Chế độ luyện tập" className="inline-flex rounded-xl bg-slate-100 p-1" role="group">
                  {[['flip', 'Thẻ lật'], ['quiz', 'Chọn đáp án']].map(([value, label]) => (
                    <button
                      aria-pressed={mode === value}
                      className={`rounded-lg px-4 py-2 text-sm font-bold transition ${mode === value ? 'bg-ice-navy text-white shadow-sm' : 'text-slate-600 hover:text-ice-navy'} ${focusRing}`}
                      key={value}
                      onClick={() => changeMode(value)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button aria-label="Về thẻ đầu tiên" className={btnOutline} disabled={currentIndex === 0} onClick={goToFirst} title="Về thẻ đầu tiên (Home)" type="button">
                    <Icon className="h-4 w-4" name="first" />
                    <span className="hidden sm:inline">Thẻ đầu tiên</span>
                  </button>
                  <button aria-label="Xáo trộn thứ tự thẻ" className={btnOutline} disabled={total < 2} onClick={shuffleDeck} title="Xáo trộn thứ tự thẻ" type="button">
                    <Icon className="h-4 w-4" name="shuffle" />
                    <span className="hidden sm:inline">Xáo thẻ</span>
                  </button>
                  <button aria-label="Đặt lại phiên luyện tập" className={btnOutline} onClick={resetSession} title="Đặt lại từ đầu" type="button">
                    <Icon className="h-4 w-4" name="reset" />
                    <span className="hidden sm:inline">Đặt lại</span>
                  </button>
                </div>
              </div>

              {/* Tiến độ */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm">
                  <p className="font-bold text-ice-navy">
                    {mode === 'flip' ? 'Thẻ ghi nhớ' : 'Trắc nghiệm'}
                    {isShuffled && (
                      <span className="ml-3 rounded-full bg-ice-gold-100 px-2.5 py-0.5 text-xs font-semibold text-ice-gold-800">
                        Đã xáo trộn
                      </span>
                    )}
                    {mode === 'quiz' && answeredCount > 0 && (
                      <span className="ml-3 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        Đúng {correctCount}/{answeredCount}
                      </span>
                    )}
                  </p>
                  <p className="font-semibold tabular-nums text-slate-500">{currentIndex + 1} / {total}</p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-ice-gold transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${((currentIndex + 1) / total) * 100}%` }} />
                </div>
              </div>

              {/* Thẻ / câu hỏi */}
              <div className="mt-8" key={`${selectedVideoId}-${currentIndex}-${deckSeed}`}>
                <div className={direction === 'next' ? 'vp-enter-next' : 'vp-enter-prev'}>
                  {mode === 'flip' ? (
                    <Flashcard
                      isFlipped={isFlipped}
                      onFlip={() => setIsFlipped((flipped) => !flipped)}
                      vocabulary={currentVocabulary}
                    />
                  ) : (
                    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-lg sm:p-7">
                      <span className="rounded-full bg-ice-gold-100 px-3 py-1 text-xs font-semibold text-ice-gold-800">Chọn nghĩa tiếng Việt</span>
                      <h3 className="mt-4 break-words text-3xl font-extrabold text-ice-navy">{currentVocabulary.word}</h3>
                      {currentVocabulary.phonetic && <p className="mt-1 text-slate-500">{currentVocabulary.phonetic}</p>}
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {currentQuiz.choices.map((choice, choiceIndex) => {
                          const isSelected = selectedVocabularyId === choice.id
                          const isCorrectChoice = choice.id === currentVocabulary.id
                          const choiceStyle = selectedVocabularyId && isCorrectChoice
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                            : isSelected
                              ? 'border-red-400 bg-red-50 text-red-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-ice-gold hover:bg-ice-gold-50'

                          return (
                            <button
                              aria-pressed={isSelected}
                              className={`flex min-h-16 items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition disabled:cursor-default ${choiceStyle} ${focusRing}`}
                              disabled={Boolean(selectedVocabularyId)}
                              key={`${choice.id}-${choiceIndex}`}
                              onClick={() => answerQuiz(choice.id)}
                              type="button"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                                {String.fromCharCode(65 + choiceIndex)}
                              </span>
                              {choice.meaning}
                            </button>
                          )
                        })}
                      </div>
                      {selectedVocabularyId && (
                        <p aria-live="polite" className={`mt-5 flex items-center gap-2 text-sm font-bold ${isQuizCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                          <Icon className="h-5 w-5" name={isQuizCorrect ? 'check' : 'close'} strokeWidth={2.5} />
                          {isQuizCorrect ? 'Chính xác' : `Chưa chính xác. Đáp án: ${currentVocabulary.meaning}`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Điều hướng */}
              <footer className="mt-6 flex items-center justify-between gap-3">
                <button className={btnOutline} disabled={currentIndex === 0} onClick={() => moveTo(currentIndex - 1)} type="button">
                  <Icon className="h-4 w-4" name="prev" />
                  Trước
                </button>
                <p className="hidden text-center text-xs text-slate-400 md:block">
                  Phím tắt: ← → chuyển thẻ, Space lật thẻ, Home về thẻ đầu
                </p>
                {isLast ? (
                  <button className={btnGold} onClick={resetSession} type="button">
                    <Icon className="h-4 w-4" name="reset" />
                    Học lại từ đầu
                  </button>
                ) : (
                  <button className={btnPrimary} onClick={() => moveTo(currentIndex + 1)} type="button">
                    Tiếp theo
                    <Icon className="h-4 w-4" name="next" />
                  </button>
                )}
              </footer>
            </div>
          )}
        </section>
      </div>

      {/* Nút nổi mở danh sách bài học trên mobile */}
      {!sidebarOpen && (
        <button
          aria-controls="lesson-list"
          aria-expanded="false"
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 inline-flex items-center gap-2 rounded-full bg-ice-navy py-3 pl-4 pr-3 text-sm font-bold text-white shadow-lg ring-2 ring-ice-gold transition hover:bg-ice-navy/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ice-gold-300 lg:hidden"
          onClick={() => setSidebarOpen(true)}
          type="button"
        >
          <Icon className="h-5 w-5 text-ice-gold" name="list" />
          <span className="text-white">Danh sách bài học</span>
          {videos.length > 0 && <span className="rounded-full bg-ice-gold px-2 py-0.5 text-xs font-extrabold text-ice-navy">{videos.length}</span>}
        </button>
      )}
    </main>
  )
}