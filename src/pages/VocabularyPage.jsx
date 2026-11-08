import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useGuestMode } from '../hooks/useGuestMode'
import {
  getApiErrorMessage,
  getGuestVideos,
  getGuestVideoVocabularies,
  getVideoTitles,
  getVideoVocabularies,
} from '../services/api'
import { sortVideoTitles } from '../utils/videoTitles'

const EMPTY_VOCABULARIES = []

function getVideoId(video) {
  return video?.videoId || video?.video_id || video?.id || ''
}

function getVideoTitle(video) {
  return typeof video === 'string'
    ? video
    : video?.title || video?.videoTitle || video?.video_title || ''
}

function normalizeVocabulary(items) {
  if (!Array.isArray(items)) return []

  return items
    .map((item, index) => {
      const word = String(item.word || item.term || item.vocabulary || '').trim()
      const meaning = String(item.meaning || item.definition || item.translation || '').trim()
      return { id: String(item.id || `${word}-${index}`), word, meaning }
    })
    .filter((item) => item.word && item.meaning)
}

function shuffleItems(items) {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
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
    normalizeVocabulary(location.state?.vocabularies),
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
  const quizDeck = useMemo(() => createQuizDeck(availableVocabularies), [availableVocabularies])
  const [mode, setMode] = useState('flip')
  const [index, setIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [selectedVocabularyId, setSelectedVocabularyId] = useState('')
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
    setVocabulariesError('')
    if (videoId === selectedVideoId && vocabularies.length) return

    const requestId = ++vocabularyRequestId.current
    setVocabulariesLoading(true)
    try {
      const items = guest
        ? await getGuestVideoVocabularies(videoId)
        : await getVideoVocabularies(videoId)
      if (requestId !== vocabularyRequestId.current) return
      setVocabularies(normalizeVocabulary(items))
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

  const currentIndex = Math.min(index, Math.max(availableVocabularies.length - 1, 0))
  const currentVocabulary = availableVocabularies[currentIndex]
  const currentQuiz = quizDeck[currentIndex]
  const isQuizCorrect = selectedVocabularyId === currentVocabulary?.id

  function changeMode(nextMode) {
    setMode(nextMode)
    setIsFlipped(false)
    setSelectedVocabularyId('')
  }

  function moveTo(nextIndex) {
    setIndex(nextIndex)
    setIsFlipped(false)
    setSelectedVocabularyId('')
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">Vocabulary</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Luyện từ vựng</h1>
          <p className="mt-2 text-sm text-slate-500">Chọn một bài học để ôn tập từ vựng.</p>
        </div>
        <Link className="text-sm font-bold text-cyan-800 hover:text-cyan-950" to="/video">
          Quay lại video
        </Link>
      </header>

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(15rem,0.72fr)_minmax(0,1.8fr)]">
        <aside className="border-b border-slate-200 pb-6 lg:border-b-0 lg:border-r lg:pr-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-extrabold text-slate-900">Bài học</h2>
            <span className="text-xs font-semibold text-slate-500">{videos.length} video</span>
          </div>
          {videosLoading && <p className="mt-4 text-sm text-slate-500">Đang tải danh sách video...</p>}
          {videosError && <p className="mt-4 text-sm font-semibold text-red-700">{videosError}</p>}
          {!videosLoading && !videosError && videos.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">Chưa có bài học nào.</p>
          )}
          <nav aria-label="Chọn bài học" className="mt-3 max-h-136 space-y-1 overflow-y-auto">
            {videos.map((video, videoIndex) => {
              const videoId = getVideoId(video)
              const title = getVideoTitle(video)
              const isSelected = selectedVideoId === videoId

              const isLocked = guest && video.accessible !== true
              return (
                <button
                  aria-current={isSelected ? 'true' : undefined}
                  className={`w-full rounded-lg border-l-4 px-3 py-3 text-left text-sm font-semibold transition ${isSelected ? 'border-cyan-600 bg-cyan-50 text-cyan-950' : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                  disabled={!videoId || vocabulariesLoading}
                  key={videoId || `${title}-${videoIndex}`}
                  onClick={() => selectVideo(video)}
                  type="button"
                >
                  <span className="mr-2 text-xs tabular-nums text-slate-400">{String(videoIndex + 1).padStart(2, '0')}</span>
                  {title}{isLocked ? ' · 🔒 Đăng nhập' : ''}
                </button>
              )
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          {selectedVideoTitle && (
            <div className="mb-5 border-b border-slate-200 pb-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">Bài học đang chọn</p>
              <h2 className="mt-1 wrap-break-word text-xl font-extrabold text-slate-900">{selectedVideoTitle}</h2>
              {availableVocabularies.length > 0 && (
                <p className="mt-1 text-sm text-slate-500">{availableVocabularies.length} từ vựng</p>
              )}
            </div>
          )}

          {vocabulariesLoading && <p className="py-10 text-center text-sm text-slate-500">Đang tải từ vựng bài học...</p>}
          {availableVocabulariesError && <p className="rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700">{availableVocabulariesError}</p>}
          {!vocabulariesLoading && !availableVocabulariesError && !availableVocabularies.length && (
            <div className="py-12 text-center text-sm text-slate-500">
              {selectedVideoTitle ? 'Bài học này chưa có từ vựng.' : 'Chọn một bài học để bắt đầu luyện tập.'}
            </div>
          )}

          {currentVocabulary && currentQuiz && (
            <>
              <div aria-label="Chế độ luyện tập" className="inline-flex rounded-lg border border-slate-200 bg-white p-1" role="group">
                <button
                  aria-pressed={mode === 'flip'}
                  className={`rounded-md px-4 py-2 text-sm font-bold ${mode === 'flip' ? 'bg-cyan-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  onClick={() => changeMode('flip')}
                  type="button"
                >
                  Thẻ lật
                </button>
                <button
                  aria-pressed={mode === 'quiz'}
                  className={`rounded-md px-4 py-2 text-sm font-bold ${mode === 'quiz' ? 'bg-cyan-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  onClick={() => changeMode('quiz')}
                  type="button"
                >
                  Chọn đáp án
                </button>
              </div>

              <div className="mt-5 flex items-center justify-between text-sm">
                <p className="font-bold text-slate-700">{mode === 'flip' ? 'Thẻ ghi nhớ' : 'Trắc nghiệm'}</p>
                <p className="font-semibold tabular-nums text-slate-500">{currentIndex + 1} / {availableVocabularies.length}</p>
              </div>

              {mode === 'flip' ? (
                <div className="mt-3">
                  <button
                    aria-label={isFlipped ? 'Hiện từ tiếng Anh' : 'Hiện nghĩa tiếng Việt'}
                    className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm outline-none transition hover:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-600"
                    onClick={() => setIsFlipped((flipped) => !flipped)}
                    type="button"
                  >
                    <span
                      className="relative block min-h-80 transition-transform duration-500 motion-reduce:transition-none"
                      style={{ transform: `rotateY(${isFlipped ? 180 : 0}deg)`, transformStyle: 'preserve-3d' }}
                    >
                      <span
                        className="absolute inset-0 grid place-content-center gap-5 rounded-lg bg-slate-950 px-6 py-10 text-center text-white"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">English</span>
                        <span className="wrap-break-word text-4xl font-black">{currentVocabulary.word}</span>
                      </span>
                      <span
                        className="absolute inset-0 grid place-content-center gap-5 rounded-lg bg-emerald-700 px-6 py-10 text-center text-white"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      >
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">Tiếng Việt</span>
                        <span className="wrap-break-word text-3xl font-extrabold">{currentVocabulary.meaning}</span>
                      </span>
                    </span>
                  </button>
                  <p className="mt-3 text-center text-xs font-semibold text-slate-500">
                    {isFlipped ? 'Tiếng Việt' : 'Tiếng Anh'}
                  </p>
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Chọn nghĩa tiếng Việt</p>
                  <h2 className="mt-3 wrap-break-word text-2xl font-extrabold text-slate-900">{currentVocabulary.word}</h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {currentQuiz.choices.map((choice, choiceIndex) => {
                      const isSelected = selectedVocabularyId === choice.id
                      const isCorrectChoice = choice.id === currentVocabulary.id
                      const choiceStyle = selectedVocabularyId && isCorrectChoice
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                        : isSelected
                          ? 'border-red-400 bg-red-50 text-red-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-500 hover:bg-cyan-50'

                      return (
                        <button
                          aria-pressed={isSelected}
                          className={`min-h-16 rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${choiceStyle}`}
                          disabled={Boolean(selectedVocabularyId)}
                          key={`${choice.id}-${choiceIndex}`}
                          onClick={() => setSelectedVocabularyId(choice.id)}
                          type="button"
                        >
                          <span className="mr-3 text-xs font-bold text-slate-400">{String.fromCharCode(65 + choiceIndex)}</span>
                          {choice.meaning}
                        </button>
                      )
                    })}
                  </div>
                  {selectedVocabularyId && (
                    <p aria-live="polite" className={`mt-4 text-sm font-bold ${isQuizCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                      {isQuizCorrect ? 'Chính xác' : `Chưa chính xác. Đáp án: ${currentVocabulary.meaning}`}
                    </p>
                  )}
                </div>
              )}

              <footer className="mt-5 flex items-center justify-between">
                <button
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={currentIndex === 0}
                  onClick={() => moveTo(currentIndex - 1)}
                  type="button"
                >
                  Trước
                </button>
                <button
                  className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={currentIndex >= availableVocabularies.length - 1}
                  onClick={() => moveTo(currentIndex + 1)}
                  type="button"
                >
                  Tiếp theo
                </button>
              </footer>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
