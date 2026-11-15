import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  getApiErrorMessage,
  getVideoByTitle,
  getLatestHomeworkReview,
  getGuestVideoLearningContent,
  getGuestVideos,
  getGuestVideoVocabularies,
  getVideoLearningContent,
  getVideoHomeworkAnswerUrl,
  getVideoHomeworkAnswers,
  getVideoTitles,
  getVideoVocabularies,
} from '../services/api'
import { useGuestMode } from '../hooks/useGuestMode'
import { getSelectedVideo, getVideoId, getVideoTitle, sortVideoTitles } from '../utils/videoTitles'

/* Thương hiệu ICE English: xanh navy (ice-navy) và vàng hổ phách (amber), lấy từ logo. */

const SIDEBAR_KEY = 'video-sidebar-open'
const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

function readSidebarPreference() {
  try {
    const saved = localStorage.getItem(SIDEBAR_KEY)
    if (saved !== null && isDesktop()) return saved === '1'
  } catch {
    /* localStorage không khả dụng */
  }
  return isDesktop()
}

const ICONS = {
  list: 'M4 6h16M4 12h16M4 18h7',
  close: 'M6 18L18 6M6 6l12 12',
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  doc: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  homework: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  check: 'M5 13l4 4L19 7',
  prev: 'M15 19l-7-7 7-7',
  next: 'M9 5l7 7-7 7',
  download: 'M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4',
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
const btnPrimary = `inline-flex items-center justify-center gap-2 rounded-xl bg-ice-navy px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-ice-navy/90 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`
const btnGold = `inline-flex items-center justify-center gap-2 rounded-xl bg-ice-gold px-5 py-3 text-sm font-bold text-ice-navy shadow-sm transition hover:bg-ice-gold-300 ${focusRing}`
const btnOutline = `inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-ice-navy transition hover:border-ice-navy/40 hover:bg-ice-navy/5 disabled:cursor-wait disabled:opacity-50 ${focusRing}`

function getYoutubeEmbedUrl(videoUrl) {
  const value = String(videoUrl || '').trim()
  if (!value) return ''

  if (/^[a-zA-Z0-9_-]{6,}$/.test(value)) {
    return `https://www.youtube.com/embed/${value}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&cc_load_policy=0&fs=1`
  }

  try {
    const url = new URL(value)
    const hostname = url.hostname.replace(/^www\./, '').toLowerCase()
    let videoId = ''

    if (hostname === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0]
    } else if (hostname === 'youtube.com' || hostname === 'youtube-nocookie.com') {
      if (url.pathname.startsWith('/embed/') || url.pathname.startsWith('/shorts/')) {
        videoId = url.pathname.split('/').filter(Boolean)[1]
      } else {
        videoId = url.searchParams.get('v') || ''
      }
    }

    if (!videoId || !/^[a-zA-Z0-9_-]{6,}$/.test(videoId)) return ''
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&cc_load_policy=0&fs=1`
  } catch {
    return ''
  }
}

function getHomeworkExamId(homework) {
  return homework?.examId || homework?.exam_id || homework?.id
}

function SectionCard({ id, icon, title, badge, children }) {
  return (
    <section className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-sm sm:p-6" id={id}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ice-navy/5 text-ice-navy">
          <Icon name={icon} />
        </span>
        <h2 className="text-lg font-extrabold text-ice-navy">{title}</h2>
        {badge}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

const Chip = ({ children, tone = 'slate' }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone === 'gold' ? 'bg-ice-gold-100 text-ice-gold-800' : tone === 'green' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
    {children}
  </span>
)

export function VideosPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const guest = useGuestMode()
  const [titles, setTitles] = useState([])
  const requestedVideoId = new URLSearchParams(location.search).get('videoId')
  const hasLocationSelection = Boolean(requestedVideoId || location.state?.selectedTitle || location.state?.videoId)
  const selectedTitle = hasLocationSelection
    ? location.state?.selectedTitle || ''
    : sessionStorage.getItem('selected-video-title') || ''
  const selectedVideoId = hasLocationSelection
    ? requestedVideoId || location.state?.videoId || ''
    : sessionStorage.getItem('selected-video-id') || ''
  const [video, setVideo] = useState(null)
  const [loadingTitles, setLoadingTitles] = useState(true)
  const [loadedVideoKey, setLoadedVideoKey] = useState('')
  const [error, setError] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')
  const [homework, setHomework] = useState(null)
  const [vocabularies, setVocabularies] = useState([])
  const [fetchedAnswer, setFetchedAnswer] = useState({ key: '', url: '', error: '' })
  const [loadingVocabularyPractice, setLoadingVocabularyPractice] = useState(false)
  const [vocabularyPracticeError, setVocabularyPracticeError] = useState('')
  const [reviewingHomework, setReviewingHomework] = useState(false)
  const [homeworkReviewError, setHomeworkReviewError] = useState('')
  const [latestReview, setLatestReview] = useState({ key: '', review: null })
  const [sidebarOpen, setSidebarOpen] = useState(readSidebarPreference)

  useEffect(() => {
    const request = guest ? getGuestVideos() : getVideoTitles()
    request
      .then((items) => {
        setTitles(sortVideoTitles(items))
      })
      .catch((requestError) =>
        setError(getApiErrorMessage(requestError, 'Không thể tải danh sách video.')),
      )
      .finally(() => setLoadingTitles(false))
  }, [guest])

  const activeVideo = useMemo(
    () => getSelectedVideo(titles, selectedVideoId, selectedTitle),
    [selectedTitle, selectedVideoId, titles],
  )
  const activeTitle = getVideoTitle(activeVideo)
  const activeVideoKey = getVideoId(activeVideo) || activeTitle
  const inaccessibleVideo = guest && activeVideo && activeVideo.accessible !== true

  useEffect(() => {
    if (!activeVideo || inaccessibleVideo) return
    let active = true

    async function loadVideo() {
      let videoRecord = activeVideo
      if (!getVideoId(videoRecord)) {
        videoRecord = await getVideoByTitle(activeTitle)
      }
      if (!videoRecord) throw new Error('Không tìm thấy video đã chọn.')

      const videoId = getVideoId(videoRecord)
      if (!videoId) throw new Error('Video không có videoId hợp lệ.')
      if (selectedVideoId && String(videoId) !== String(selectedVideoId)) {
        throw new Error('Video tìm được không khớp với video đã chọn.')
      }

      const content = guest
        ? await getGuestVideoLearningContent(videoId)
        : await getVideoLearningContent(videoId)
      if (!active) return

      sessionStorage.setItem('selected-video-id', videoId)
      if (activeTitle) sessionStorage.setItem('selected-video-title', activeTitle)
      else sessionStorage.removeItem('selected-video-title')
      setVideo({ ...videoRecord, ...content })
      setLoadedVideoKey(activeVideoKey)
      setDocumentUrl(
        content.documentUrl || content.document_url || videoRecord.documentUrl || videoRecord.document_url || '',
      )
      setHomework(content.homework || null)
      setVocabularies(Array.isArray(content.vocabularies) ? content.vocabularies : [])
    }

    loadVideo().catch((requestError) => {
      if (!active) return
      setVideo(null)
      setLoadedVideoKey(activeVideoKey)
      setError(getApiErrorMessage(requestError, 'Không thể tải nội dung bài học.'))
    })
    return () => {
      active = false
    }
  }, [activeVideo, activeVideoKey, activeTitle, selectedVideoId, guest, inaccessibleVideo])

  const displayedVideo = inaccessibleVideo ? null : video
  const currentVideoId = getVideoId(displayedVideo)
  const homeworkExamId = getHomeworkExamId(homework)
  const homeworkCompletionKey = currentVideoId && homeworkExamId
    ? `video-homework-completed:${guest ? 'guest:' : ''}${currentVideoId}:${homeworkExamId}`
    : ''
  const completionToken = homeworkCompletionKey
    ? sessionStorage.getItem(homeworkCompletionKey)
    : null
  const cachedAnswerUrl = completionToken && completionToken !== 'completed'
    ? completionToken
    : ''
  const fetchedAnswerForCurrentHomework =
    fetchedAnswer.key === homeworkCompletionKey ? fetchedAnswer : null
  const homeworkAnswerUrl = cachedAnswerUrl || fetchedAnswerForCurrentHomework?.url || ''
  const homeworkAnswerError = fetchedAnswerForCurrentHomework?.error || ''
  const loadingHomeworkAnswer =
    !guest && completionToken === 'completed' && !fetchedAnswerForCurrentHomework

  useEffect(() => {
    if (guest) return
    if (!currentVideoId || !homeworkExamId || completionToken !== 'completed') return

    let active = true
    getVideoHomeworkAnswers(homeworkExamId)
      .then((response) => {
        const answerUrl = getVideoHomeworkAnswerUrl(response)
        if (!answerUrl) throw new Error('API không trả về answer_url.')
        const completionKey = `video-homework-completed:${currentVideoId}:${homeworkExamId}`
        sessionStorage.setItem(completionKey, answerUrl)
        if (active) setFetchedAnswer({ key: completionKey, url: answerUrl, error: '' })
      })
      .catch((requestError) => {
        if (active) {
          setFetchedAnswer({
            key: homeworkCompletionKey,
            url: '',
            error: getApiErrorMessage(requestError, 'Không thể tải đáp án chi tiết.'),
          })
        }
      })
    return () => {
      active = false
    }
  }, [completionToken, currentVideoId, guest, homeworkCompletionKey, homeworkExamId])

  /* Kiểm tra học sinh đã nộp bài tập chưa: chỉ khi có bài nộp mới hiện nút "Xem lại". */
  const reviewKey = !guest && homeworkExamId ? String(homeworkExamId) : ''
  useEffect(() => {
    if (!reviewKey) return
    let active = true
    getLatestHomeworkReview(homeworkExamId)
      .then((review) => {
        const hasSubmission = Boolean(review?.submissionId || review?.submission_id)
        if (active) setLatestReview({ key: reviewKey, review: hasSubmission ? review : null })
      })
      .catch(() => {
        if (active) setLatestReview({ key: reviewKey, review: null })
      })
    return () => {
      active = false
    }
  }, [reviewKey, homeworkExamId])

  const prefetchedReview = latestReview.key === reviewKey ? latestReview.review : null
  const hasDoneHomework = !guest && Boolean(prefetchedReview || completionToken)

  const loadingVideo = Boolean(activeVideoKey) && !inaccessibleVideo && loadedVideoKey !== activeVideoKey
  const contentLoading = loadingVideo
  const embedUrl = useMemo(
    () =>
      getYoutubeEmbedUrl(
        displayedVideo?.videoUrl ||
          displayedVideo?.video_url ||
          displayedVideo?.url ||
          displayedVideo?.embedUrl ||
          displayedVideo?.embed_url,
      ),
    [displayedVideo],
  )
  const videoTitle = loadingVideo ? activeTitle : displayedVideo?.title || activeTitle
  const activeIndex = activeVideo ? titles.indexOf(activeVideo) : -1
  const prevItem = activeIndex > 0 ? titles[activeIndex - 1] : null
  const nextItem = activeIndex >= 0 && activeIndex < titles.length - 1 ? titles[activeIndex + 1] : null

  useEffect(() => {
    if (!sidebarOpen) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isDesktop()) setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sidebarOpen])

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

  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    if (!isDesktop()) setSidebarOpen(false)
  }

  function selectVideo(item) {
    const title = getVideoTitle(item)
    const videoId = getVideoId(item)
    if (guest && item.accessible !== true) {
      navigate('/dang-nhap', {
        state: { from: { pathname: '/video', search: videoId ? `?videoId=${encodeURIComponent(videoId)}` : '' } },
      })
      return
    }
    sessionStorage.setItem('selected-video-title', title)
    if (videoId) {
      sessionStorage.setItem('selected-video-id', videoId)
    } else {
      sessionStorage.removeItem('selected-video-id')
    }
    setError('')
    setVocabularyPracticeError('')
    setHomeworkReviewError('')
    if (!isDesktop()) setSidebarOpen(false)
    navigate('/video', { replace: true, state: { selectedTitle: title, videoId } })
  }

  async function openVocabularyPractice(videoId, title, knownVocabularies = []) {
    if (!videoId || loadingVocabularyPractice) return

    setLoadingVocabularyPractice(true)
    setVocabularyPracticeError('')
    try {
      const lessonVocabularies = knownVocabularies.length
        ? knownVocabularies
        : videoId === currentVideoId && vocabularies.length
          ? vocabularies
          : guest
            ? await getGuestVideoVocabularies(videoId)
            : await getVideoVocabularies(videoId)
      if (!lessonVocabularies.length) {
        setVocabularyPracticeError('Bài học này chưa có từ vựng để luyện tập.')
        return
      }

      sessionStorage.setItem('selected-video-title', title)
      sessionStorage.setItem('selected-video-id', videoId)
      navigate('/tu-vung', {
        state: { title, videoId, vocabularies: lessonVocabularies },
      })
    } catch (requestError) {
      setVocabularyPracticeError(
        getApiErrorMessage(requestError, 'Không thể tải từ vựng của bài học.'),
      )
    } finally {
      setLoadingVocabularyPractice(false)
    }
  }

  async function reviewLatestHomework() {
    if (guest || !homeworkExamId || reviewingHomework) return

    setReviewingHomework(true)
    setHomeworkReviewError('')
    try {
      const review = prefetchedReview || (await getLatestHomeworkReview(homeworkExamId))
      const submissionId = review?.submissionId || review?.submission_id
      if (!submissionId) throw new Error('API review không trả về submissionId.')

      const reviewResult = {
        ...review,
        examId: review.examId || review.exam_id || homeworkExamId,
        examTitle: review.examTitle || review.exam_title || homework.title,
        resultMode: 'homework',
      }
      sessionStorage.setItem(`exam-result:${submissionId}`, JSON.stringify(reviewResult))
      sessionStorage.setItem('selected-video-title', videoTitle)
      sessionStorage.setItem('selected-video-id', currentVideoId)
      navigate(`/ket-qua/${submissionId}`, {
        state: { result: reviewResult, returnTo: '/video', hideVideos: true },
      })
    } catch (requestError) {
      setHomeworkReviewError(
        getApiErrorMessage(requestError, 'Không thể tải bài tập đã làm gần nhất.'),
      )
    } finally {
      setReviewingHomework(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-6 sm:px-6 lg:py-8">
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
          <Icon className="mt-0.5 h-5 w-5 shrink-0" name="warning" />
          {error}
        </div>
      )}
      {vocabularyPracticeError && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800" role="alert">
          <Icon className="mt-0.5 h-5 w-5 shrink-0" name="warning" />
          {vocabularyPracticeError}
        </div>
      )}

      <div className="flex items-start gap-6">
        {/* ───────── Nội dung chính ───────── */}
        <div className="min-w-0 flex-1">
          <header className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="min-w-0 border-l-4 border-ice-gold pl-4">
              <p className="text-sm font-semibold text-slate-500">Video bài giảng</p>
              <h1 className="mt-0.5 text-2xl font-extrabold leading-tight text-ice-navy sm:text-3xl">
                {videoTitle || 'Chọn một bài giảng để bắt đầu'}
              </h1>
              {displayedVideo && !loadingVideo && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeIndex >= 0 && <Chip>Bài {activeIndex + 1}/{titles.length}</Chip>}
                  {documentUrl && <Chip>Có tài liệu</Chip>}
                  {vocabularies.length > 0 && <Chip>{vocabularies.length} từ vựng</Chip>}
                  {homework && <Chip tone={hasDoneHomework ? 'green' : 'gold'}>{hasDoneHomework ? 'Đã làm bài tập' : 'Có bài tập về nhà'}</Chip>}
                </div>
              )}
            </div>
            <button
              aria-controls="lesson-sidebar"
              aria-expanded={sidebarOpen}
              className={`hidden shrink-0 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-ice-navy shadow-sm transition hover:border-ice-navy/30 hover:bg-ice-navy/5 lg:inline-flex ${focusRing}`}
              onClick={toggleSidebar}
              type="button"
            >
              <Icon name="list" />
              <span>{sidebarOpen ? 'Ẩn danh sách' : 'Danh sách bài'}</span>
            </button>
          </header>

          {loadingVideo && (
            <div className="flex aspect-video animate-pulse items-center justify-center rounded-2xl bg-ice-navy text-sm font-medium text-white/70">
              Đang tải video...
            </div>
          )}

          {!loadingVideo && displayedVideo && embedUrl && (
            <>
              <div
                className="exam-video-frame relative select-none overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-ice-navy/10"
                onContextMenu={(event) => event.preventDefault()}
                onDragStart={(event) => event.preventDefault()}
              >
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  className="aspect-video w-full"
                  referrerPolicy="strict-origin-when-cross-origin"
                  src={embedUrl}
                  title={videoTitle}
                  allowFullScreen
                  draggable="false"
                />
                <span aria-hidden="true" className="exam-video-shield exam-video-shield--top" />
                <span aria-hidden="true" className="exam-video-shield exam-video-shield--logo" />
              </div>

              {(prevItem || nextItem) && (
                <nav aria-label="Chuyển bài học" className="mt-4 grid grid-cols-2 gap-3">
                  {prevItem ? (
                    <button className={`group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-ice-navy/30 hover:bg-ice-navy/5 ${focusRing}`} onClick={() => selectVideo(prevItem)} type="button">
                      <Icon className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-ice-navy" name="prev" />
                      <span className="min-w-0">
                        <span className="block text-xs text-slate-500">Bài trước</span>
                        <span className="block truncate text-sm font-bold text-ice-navy">{getVideoTitle(prevItem)}</span>
                      </span>
                    </button>
                  ) : <span />}
                  {nextItem ? (
                    <button className={`group flex items-center justify-end gap-3 rounded-xl border border-slate-200 bg-white p-3 text-right transition hover:border-ice-navy/30 hover:bg-ice-navy/5 ${focusRing}`} onClick={() => selectVideo(nextItem)} type="button">
                      <span className="min-w-0">
                        <span className="block text-xs text-slate-500">Bài tiếp theo</span>
                        <span className="block truncate text-sm font-bold text-ice-navy">{getVideoTitle(nextItem)}</span>
                      </span>
                      <Icon className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-ice-navy" name="next" />
                    </button>
                  ) : <span />}
                </nav>
              )}

              <div className="mt-6 space-y-5">
                <SectionCard icon="doc" id="document" title="Tài liệu">
                  <p className="text-sm text-slate-500">Tài liệu bổ trợ cho bài học này.</p>
                  {documentUrl ? (
                    <a className={`${btnPrimary} mt-4`} download href={documentUrl} rel="noreferrer" target="_blank">
                      <Icon className="h-4 w-4" name="download" />
                      Tải tài liệu
                    </a>
                  ) : <p className="mt-4 text-sm text-slate-500">{contentLoading ? 'Đang tải tài liệu...' : 'Chưa có tài liệu.'}</p>}
                </SectionCard>

                <SectionCard
                  badge={hasDoneHomework && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <Icon className="h-3.5 w-3.5" name="check" strokeWidth={3} />
                      Đã hoàn thành
                    </span>
                  )}
                  icon="homework"
                  id="homework"
                  title="Bài tập về nhà"
                >
                  {homework ? (
                  <div className="mt-6 flex flex-col gap-4">
  {/* KHU VỰC NÚT HÀNH ĐỘNG CHÍNH VÀ PHỤ */}
  <div className="flex flex-wrap items-center gap-4">
    
    {/* Nút 1: Vào làm bài tập (Nổi bật nhất, Call-to-Action chính) */}
    <button
      className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-3.5 text-[15px] font-bold text-slate-900 shadow-[0_8px_20px_-6px_rgba(245,158,11,0.5)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_25px_-6px_rgba(245,158,11,0.65)] active:translate-y-0 active:scale-[0.98]"
      onClick={() => {
        sessionStorage.setItem("selected-video-title", videoTitle);
        sessionStorage.setItem("selected-video-id", currentVideoId);
        navigate(
          `/video/${encodeURIComponent(getVideoId(displayedVideo))}/homework`,
          { state: { homework, title: videoTitle } }
        );
      }}
      type="button"
    >
      <span className="relative z-10 flex items-center gap-2">
        Vào làm bài tập về nhà
        <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </span>
      {/* Hiệu ứng vệt sáng lướt qua */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full" />
    </button>

    {/* Nút 2: Xem lại bài tập (Glassmorphism tinh tế) */}
    {hasDoneHomework && (
      <button
        className="group inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/60 px-6 py-3.5 text-[15px] font-bold text-slate-700 shadow-sm backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-900 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
        disabled={reviewingHomework}
        onClick={reviewLatestHomework}
        type="button"
      >
        {reviewingHomework ? (
          <>
            <svg className="h-4 w-4 animate-spin text-slate-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Đang tải bài làm...</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Xem lại bài gần nhất</span>
          </>
        )}
      </button>
    )}
  </div>

  {/* Lỗi tải bài làm */}
  {homeworkReviewError && (
    <div className="flex w-fit items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 border border-red-100">
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p aria-live="polite">{homeworkReviewError}</p>
    </div>
  )}

  {/* KHU VỰC ĐÁP ÁN CHI TIẾT (Hiển thị tách biệt) */}
  {completionToken && (
    <div className="mt-2 flex flex-col items-start gap-3 border-t border-slate-100 pt-5">
      {loadingHomeworkAnswer && (
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <span className="flex h-2 w-2">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-slate-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-slate-500"></span>
          </span>
          Đang tải liên kết đáp án...
        </div>
      )}
      
      {homeworkAnswerUrl && (
        <a
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-[14px] font-bold tracking-wide text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_8px_20px_-6px_rgba(15,23,42,0.5)] active:translate-y-0 active:scale-[0.98]"
          href={homeworkAnswerUrl}
          rel="noreferrer"
          target="_blank"
        >
          <svg className="h-4 w-4 text-emerald-400 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Xem đáp án chi tiết
        </a>
      )}

      {homeworkAnswerError && (
        <p className="text-sm font-medium text-red-600">
          * {homeworkAnswerError}
        </p>
      )}
    </div>
  )}
</div>
                  ) : <p className="text-sm text-slate-500">{contentLoading ? 'Đang tải bài tập...' : 'Chưa có bài tập.'}</p>}
                </SectionCard>

                <SectionCard
                  badge={vocabularies.length > 0 && <Chip tone="gold">{vocabularies.length} từ</Chip>}
                  icon="book"
                  id="vocabulary"
                  title="Từ vựng"
                >
                  <button
                    className={btnGold}
                    disabled={loadingVocabularyPractice || contentLoading}
                    onClick={() => openVocabularyPractice(currentVideoId, videoTitle, vocabularies)}
                    type="button"
                  >
                    {loadingVocabularyPractice ? 'Đang tải từ vựng...' : 'Luyện tập từ vựng bài học này'}
                  </button>
                  {vocabularies.length > 0 ? (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-lg text-left text-sm">
                        <thead className="bg-ice-navy text-xs font-semibold text-white [&_th]:text-white">
                          <tr>
                            <th className="px-4 py-3">Từ vựng</th>
                            <th className="px-4 py-3">Phiên âm</th>
                            <th className="px-4 py-3">Nghĩa</th>
                            <th className="px-4 py-3">Ví dụ</th>
                            <th className="px-4 py-3">Dịch ví dụ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {vocabularies.map((item, index) => (
                            <tr className="odd:bg-white even:bg-slate-50/60" key={item.id || index}>
                              <td className="px-4 py-3 font-bold text-ice-navy">{item.word || item.term || item.vocabulary || '—'}</td>
                              <td className="px-4 py-3 text-slate-500">{item.phonetic || '—'}</td>
                              <td className="px-4 py-3">{item.meaning || item.definition || item.translation || '—'}</td>
                              <td className="whitespace-pre-wrap px-4 py-3 text-slate-500">{item.exampleSentence || item.example || '—'}</td>
                              <td className="whitespace-pre-wrap px-4 py-3 text-slate-500">{item.exampleSentenceTranslate || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="mt-4 text-sm text-slate-500">{contentLoading ? 'Đang tải từ vựng...' : 'Chưa có từ vựng.'}</p>}
                </SectionCard>
              </div>
            </>
          )}

          {!loadingVideo && displayedVideo && !embedUrl && (
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              Video này chưa có định dạng YouTube hợp lệ để phát.
            </p>
          )}

          {!loadingVideo && !displayedVideo && !error && (
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500">
              {guest && activeVideo && activeVideo.accessible !== true ? (
                <div className="text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ice-navy/5 text-ice-navy">
                    <Icon className="h-6 w-6" name="lock" />
                  </span>
                  <p className="mt-3 font-semibold text-ice-navy">Chuyên đề này yêu cầu đăng nhập.</p>
                  <button className={`${btnGold} mt-4`} onClick={() => selectVideo(activeVideo)} type="button">Đăng nhập để học</button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-semibold text-ice-navy">Chưa chọn bài giảng</p>
                  <button className={`${btnPrimary} mt-4`} onClick={() => setSidebarOpen(true)} type="button">Mở danh sách bài học</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ───────── Sidebar trượt ra/vào ───────── */}
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
          aria-label="Nội dung bài học"
          className={`fixed bottom-0 right-0 top-0 z-[70] flex w-80 max-w-[88vw] flex-col overflow-hidden bg-white shadow-2xl transition-[translate,width,margin,opacity,visibility] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none lg:sticky lg:bottom-auto lg:right-auto lg:top-6 lg:z-auto lg:max-w-none lg:shrink-0 lg:rounded-2xl lg:border lg:border-slate-200 lg:shadow-sm lg:duration-300 ${
            sidebarOpen ? 'visible translate-x-0 lg:w-80' : 'invisible translate-x-full lg:-ml-6 lg:w-0 lg:translate-x-0 lg:border-transparent lg:opacity-0'
          }`}
          id="lesson-sidebar"
          inert={!sidebarOpen}
        >
          <div className="flex min-h-0 w-full flex-1 flex-col lg:w-80 lg:flex-none">
            <div className="flex items-center justify-between gap-3 border-b-4 border-ice-gold bg-ice-navy px-5 py-4 text-white">
              <div>
                <h2 className="font-extrabold text-white">Nội dung bài học</h2>
                <p className="mt-0.5 text-xs text-white/70">{titles.length} video bài giảng</p>
              </div>
              <button
                aria-controls="lesson-sidebar"
                aria-label="Đóng danh sách bài học"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice-gold"
                onClick={toggleSidebar}
                type="button"
              >
                <Icon name="close" />
              </button>
            </div>

            {loadingTitles && (
              <div aria-hidden="true" className="animate-pulse space-y-3 p-4">
                {[0, 1, 2, 3].map((i) => <div className="h-12 rounded-xl bg-slate-100" key={i} />)}
              </div>
            )}
            {!loadingTitles && titles.length === 0 && <p className="p-5 text-sm text-slate-500">Chưa có video nào.</p>}

            <ul className="flex-1 space-y-1.5 overflow-y-auto p-3 lg:max-h-[calc(100vh-11rem)] lg:flex-none">
              {titles.map((item, index) => {
                const title = getVideoTitle(item)
                const videoId = getVideoId(item)
                const locked = guest && item.accessible !== true
                const isActive = activeVideo === item

                return (
                  <li key={videoId || title}>
                    <button
                      aria-current={isActive ? 'true' : undefined}
                      className={`relative flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${isActive ? 'bg-ice-navy/5 ring-1 ring-ice-navy/15' : 'hover:bg-slate-50'} ${focusRing}`}
                      onClick={() => selectVideo(item)}
                      type="button"
                    >
                      {isActive && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-full bg-ice-gold" />}
                      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isActive ? 'bg-ice-navy text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {index + 1}
                      </span>
                      <span className={`flex-1 text-sm font-semibold ${locked ? 'text-slate-400' : isActive ? 'text-ice-navy' : 'text-slate-700'}`}>{title}</span>
                      {locked && (
                        <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-400">
                          <Icon className="h-3.5 w-3.5" name="lock" />
                          Đăng nhập
                        </span>
                      )}
                    </button>
                    {isActive && !locked && (
                      <ul className="mb-1 ml-9 mt-1 space-y-0.5 border-l border-slate-200 pl-3 text-xs font-semibold text-slate-500">
                        {[['document', 'File tài liệu'], ['homework', 'Bài tập về nhà'], ['homework', 'File đáp án chi tiết BTVN'], ['vocabulary', 'Từ vựng']].map(([id, label]) => (
                          <li key={label}>
                            <button className="w-full rounded-md px-2 py-1.5 text-left transition hover:bg-ice-navy/5 hover:text-ice-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice-navy/40" onClick={() => scrollToSection(id)} type="button">
                              {label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </aside>

        {!sidebarOpen && (
          <button
            aria-controls="lesson-sidebar"
            aria-expanded="false"
            className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 inline-flex items-center gap-2 rounded-full bg-ice-navy py-3 pl-4 pr-3 text-sm font-bold text-white shadow-lg ring-2 ring-ice-gold transition hover:bg-ice-navy/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ice-gold-300 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            type="button"
          >
            <Icon className="h-5 w-5 text-ice-gold" name="list" />
            <span className="text-white">Danh sách bài học</span>
            {titles.length > 0 && (
              <span className="rounded-full bg-ice-gold px-2 py-0.5 text-xs font-extrabold text-ice-navy">{titles.length}</span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}