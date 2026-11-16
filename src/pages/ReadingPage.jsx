import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BrandPageIntro } from '../components/PageIntro'
import { useGuestMode } from '../hooks/useGuestMode'
import { updatePageSeo } from '../utils/seo'
import {
  answerReadingQuestion,
  getApiErrorMessage,
  getReadingBlog,
  getReadingBlogs,
  getReadingTopics,
  getReadingVocabularies,
} from '../services/api'

/* ICE English: ice-navy (xanh navy) + ice-gold (vàng) xuyên suốt cả 3 trang. */

const skills = {
  SKIMMING: 'Đọc lướt · Ý chính',
  SCANNING: 'Đọc quét · Tìm thông tin',
  INFERENCE: 'Suy luận',
  VOCABULARY_IN_CONTEXT: 'Từ vựng trong ngữ cảnh',
  REFERENCE: 'Từ thay thế',
}

const KEYFRAMES = `
@keyframes rd-in-next{from{opacity:0;transform:translateX(32px) scale(.97)}to{opacity:1;transform:none}}
@keyframes rd-in-prev{from{opacity:0;transform:translateX(-32px) scale(.97)}to{opacity:1;transform:none}}
.rd-enter-next{animation:rd-in-next .38s cubic-bezier(.2,.8,.2,1)}
.rd-enter-prev{animation:rd-in-prev .38s cubic-bezier(.2,.8,.2,1)}
@media (prefers-reduced-motion:reduce){.rd-enter-next,.rd-enter-prev{animation:none}}
`

const ICONS = {
  back: 'M10 19l-7-7m0 0l7-7m-7 7h18',
  search: 'M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z',
  list: 'M4 6h16M4 12h16M4 18h7',
  close: 'M6 18L18 6M6 6l12 12',
  check: 'M5 13l4 4L19 7',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  arrow: 'M13 7l5 5m0 0l-5 5m5-5H6',
  prev: 'M15 19l-7-7 7-7',
  next: 'M9 5l7 7-7 7',
  first: 'M11 19l-7-7 7-7m8 14l-7-7 7-7',
  reset: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  shuffle: 'M4 4l5 5m11 11l-5-5m5 0v5h-5M4 20L20 4m0 0h-5m5 0v5',
  flip: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  speaker: 'M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z',
  book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  translate: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129',
  quiz: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
}

function Icon({ name, className = 'h-5 w-5', strokeWidth = 2 }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} viewBox="0 0 24 24">
      <path d={ICONS[name]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice-gold focus-visible:ring-offset-2'
const btnPrimary = `inline-flex items-center justify-center gap-2 rounded-xl bg-ice-navy px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-ice-navy/90 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`
const btnGold = `inline-flex items-center justify-center gap-2 rounded-xl bg-ice-gold px-5 py-3 text-sm font-bold text-ice-navy shadow-sm transition hover:bg-ice-gold-300 ${focusRing}`
const btnOutline = `inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-ice-navy transition hover:border-ice-gold hover:bg-ice-gold/10 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`
const fieldClass = 'rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-ice-gold focus:ring-4 focus:ring-ice-gold/20'

const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches
const scrollBehavior = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth')

function useSidePanel(storageKey) {
  const [open, setOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved !== null && isDesktop()) return saved === '1'
    } catch {
      /* localStorage không khả dụng */
    }
    return isDesktop()
  })

  function toggle() {
    const next = !open
    setOpen(next)
    if (isDesktop()) {
      try {
        localStorage.setItem(storageKey, next ? '1' : '0')
      } catch {
        /* bỏ qua */
      }
    }
  }

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isDesktop()) setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return { open, setOpen, toggle }
}

function Chip({ children, tone = 'navy' }) {
  const tones = {
    navy: 'bg-ice-navy/5 text-ice-navy',
    gold: 'bg-ice-gold/15 text-ice-gold-700',
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-emerald-50 text-emerald-700',
  }
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}

function ErrorBanner({ message, action, onAction }) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700" role="alert">
      <Icon className="mt-0.5 h-5 w-5 shrink-0" name="warning" />
      <div>
        <p className="font-medium">{message}</p>
        <button className="mt-2 text-sm font-bold underline" onClick={onAction} type="button">{action}</button>
      </div>
    </div>
  )
}

/* ═══════════════════════ Trang 1: Thư viện đọc hiểu ═══════════════════════ */

export function ReadingListPage() {
  const guest = useGuestMode()
  return <ReadingList key={String(guest)} guest={guest} />
}

function ReadingList({ guest }) {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ keyword: '', topic: '', contentType: '' })
  const [query, setQuery] = useState({ page: 0, size: 12 })
  const [result, setResult] = useState(null)
  const [topics, setTopics] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)
  const hasFilters = Object.values(filters).some((value) => value.trim())

  useEffect(() => {
    let active = true
    Promise.all([getReadingBlogs(guest, query), getReadingTopics(guest)])
      .then(([page, topicList]) => {
        if (!Array.isArray(page?.items) || !Array.isArray(topicList)) throw new Error('Dữ liệu danh sách bài đọc không hợp lệ.')
        if (active) { setResult(page); setTopics(topicList) }
      })
      .catch((err) => { if (active) { setResult(null); setError(getApiErrorMessage(err, 'Không thể tải thư viện đọc hiểu.')) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [guest, query, retry])

  function search(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setQuery({ page: 0, size: 12, ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim())) })
  }

  function clearFilters() {
    setFilters({ keyword: '', topic: '', contentType: '' })
    setLoading(true)
    setError('')
    setQuery({ page: 0, size: 12 })
  }

  function changePage(page) {
    setLoading(true)
    setError('')
    setQuery({ ...query, page })
    window.scrollTo({ top: 0, behavior: scrollBehavior() })
  }

  function openBlog(blog) {
    const path = `/doc-hieu/${encodeURIComponent(blog.id)}`
    if (guest && !blog.accessible) navigate('/dang-nhap', { state: { from: { pathname: path } } })
    else navigate(path)
  }

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 sm:py-16">
      <BrandPageIntro
        description="Khám phá bài đọc và rèn kỹ năng tìm ý chính, tìm thông tin và suy luận."
        eyebrow="Học tập"
        logo
        title="THƯ VIỆN ĐỌC HIỂU"
      />

      <form className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" onSubmit={search} role="search">
        <div className="relative min-w-0 flex-[1_1_15rem]">
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" name="search" />
          <input
            aria-label="Tìm tiêu đề"
            className={`${fieldClass} w-full bg-slate-50 py-3 pl-11 pr-4`}
            maxLength={200}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            placeholder="Tìm theo tiêu đề"
            value={filters.keyword}
          />
        </div>
        <select aria-label="Chủ đề" className={`${fieldClass} min-w-0 flex-1 sm:flex-none`} onChange={(e) => setFilters({ ...filters, topic: e.target.value })} value={filters.topic}>
          <option value="">Tất cả chủ đề</option>
          {topics.map((topic) => <option key={topic.slug} value={topic.slug}>{topic.name}</option>)}
        </select>
        <select aria-label="Loại bài" className={`${fieldClass} min-w-0 flex-1 sm:flex-none`} onChange={(e) => setFilters({ ...filters, contentType: e.target.value })} value={filters.contentType}>
          <option value="">Tất cả loại bài</option>
          <option value="ARTICLE">Bài báo</option>
          <option value="MAGAZINE">Tạp chí</option>
          <option value="STORY">Câu chuyện</option>
          <option value="PASSAGE">Bài đọc</option>
        </select>
        <button className={`${btnPrimary} w-full sm:w-auto`} type="submit">Tìm kiếm</button>
        {hasFilters && (
          <button className="w-full rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 transition hover:text-ice-navy sm:w-auto" onClick={clearFilters} type="button">
            Xóa bộ lọc
          </button>
        )}
      </form>

      {loading && (
        <div aria-live="polite" className="mt-10">
          <p className="sr-only">Đang tải bài đọc...</p>
          <div aria-hidden="true" className="grid animate-pulse gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div className="rounded-2xl border border-slate-100 bg-white p-6" key={i}>
                <div className="h-5 w-1/3 rounded-full bg-slate-100" />
                <div className="mt-4 h-6 w-4/5 rounded bg-slate-100" />
                <div className="mt-4 space-y-2"><div className="h-3 rounded bg-slate-100" /><div className="h-3 w-5/6 rounded bg-slate-100" /></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <ErrorBanner action="Thử lại" message={error} onAction={() => { setError(''); setLoading(true); setRetry((n) => n + 1) }} />}

      {!loading && !error && result && (
        <>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-2 border-l-4 border-ice-gold pl-4">
            <div>
              <h2 className="font-gf text-xl font-bold text-ice-navy">Khám phá bài đọc</h2>
              <p className="mt-1 text-sm text-slate-600">Chọn một bài để bắt đầu luyện đọc.</p>
            </div>
            {typeof result.totalElements === 'number' && <p className="text-sm font-medium text-slate-500">{result.totalElements} bài đọc</p>}
          </div>

          {result.items.length === 0 && (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-bold text-ice-navy">Không có bài đọc phù hợp.</p>
              {hasFilters && <button className={`${btnOutline} mt-4`} onClick={clearFilters} type="button">Xóa bộ lọc</button>}
            </div>
          )}

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.items.map((blog) => {
              const locked = guest && !blog.accessible
              return (
                <button
                  className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-ice-gold-300 hover:shadow-[0_16px_35px_-22px_rgba(16,43,92,0.5)] motion-reduce:transition-none ${focusRing}`}
                  key={blog.id}
                  onClick={() => openBlog(blog)}
                  type="button"
                >
                  <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-ice-gold transition-transform duration-300 group-hover:scale-x-100 motion-reduce:transition-none" />
                  <span className="flex flex-wrap gap-2">
                    <Chip>{blog.topic?.name || 'Bài đọc'}</Chip>
                    {blog.difficulty && <Chip tone="gold">{blog.difficulty}</Chip>}
                  </span>
                  <h3 className="mt-4 font-gf text-xl font-bold leading-snug text-ice-navy">{blog.title}</h3>
                  <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{blog.summary}</p>
                  <span className="mt-6 flex w-full flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-sm">
                    <span className="inline-flex items-center gap-1.5 text-slate-500">
                      <Icon className="h-4 w-4" name="clock" />
                      {blog.estimatedReadingMinutes ? `${blog.estimatedReadingMinutes} phút đọc` : 'Bài đọc'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-ice-navy transition-colors group-hover:text-ice-gold-700">
                      {locked ? <><Icon className="h-4 w-4" name="lock" />Đăng nhập</> : <>Đọc bài<Icon className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" name="arrow" /></>}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          {result.totalPages > 1 && (
            <nav aria-label="Phân trang" className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <button className={btnOutline} disabled={query.page <= 0} onClick={() => changePage(query.page - 1)} type="button">
                <Icon className="h-4 w-4" name="prev" />Trang trước
              </button>
              <span className="text-sm font-medium text-slate-600">Trang <b className="text-ice-navy">{result.page + 1}</b> / {result.totalPages}</span>
              <button className={btnOutline} disabled={query.page + 1 >= result.totalPages} onClick={() => changePage(query.page + 1)} type="button">
                Trang sau<Icon className="h-4 w-4" name="next" />
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  )
}

/* ═══════════════════════ Trang 2: Bài đọc + câu hỏi ═══════════════════════ */

export function ReadingDetailPage() {
  const { blogId } = useParams()
  const guest = useGuestMode()
  return <ReadingDetail key={`${guest}-${blogId}`} blogId={blogId} guest={guest} />
}

function ReadingProgressBar() {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      setValue(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-1">
      <div className="h-full bg-ice-gold transition-[width] duration-100 motion-reduce:transition-none" style={{ width: `${value * 100}%` }} />
    </div>
  )
}

function ReadingDetail({ blogId, guest }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const [feedback, setFeedback] = useState({})
  const [pending, setPending] = useState({})
  const [questionErrors, setQuestionErrors] = useState({})
  const [translations, setTranslations] = useState({})
  const [highlightId, setHighlightId] = useState('')
  const generation = useRef(0)
  const highlightTimer = useRef(0)
  const panel = useSidePanel('reading-sidebar-open')

  useEffect(() => {
    if (!data?.blog) return
    const title = `${data.blog.title} | ICE English`
    updatePageSeo(`/doc-hieu/${encodeURIComponent(blogId)}`, {
      title,
      description: data.blog.summary || `Đọc bài ${data.blog.title} và luyện đọc hiểu tiếng Anh cùng ICE English.`,
      indexable: guest,
      type: 'article',
    })
  }, [blogId, data, guest])

  useEffect(() => {
    let active = true
    getReadingBlog(guest, blogId)
      .then((result) => {
        if (!result?.blog || !Array.isArray(result.passageBlocks) || !Array.isArray(result.questions)) throw new Error('Dữ liệu bài đọc không hợp lệ.')
        if (active) setData(result)
      })
      .catch((err) => { if (active) setError(getApiErrorMessage(err, 'Không thể tải bài đọc. Bài có thể không còn được phép truy cập.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false; generation.current += 1 }
  }, [guest, blogId, reload])

  useEffect(() => () => clearTimeout(highlightTimer.current), [])

  async function answer(questionId, option) {
    const requestGeneration = generation.current
    setPending((current) => ({ ...current, [questionId]: true }))
    setQuestionErrors((current) => ({ ...current, [questionId]: '' }))
    try {
      const result = await answerReadingQuestion(guest, blogId, questionId, { revision: data.revision, selectedOption: option })
      if (requestGeneration !== generation.current) return
      setFeedback((current) => ({ ...current, [questionId]: result }))
    } catch (err) {
      if (requestGeneration !== generation.current) return
      if (err.response?.status === 409) {
        generation.current += 1
        setPending({})
        setError('Bài đọc đã thay đổi. Vui lòng tải lại bài để tiếp tục.')
      } else {
        setQuestionErrors((current) => ({ ...current, [questionId]: getApiErrorMessage(err, 'Không thể kiểm tra đáp án. Vui lòng thử lại.') }))
      }
    } finally {
      if (requestGeneration === generation.current) setPending((current) => ({ ...current, [questionId]: false }))
    }
  }

  function reloadArticle() {
    generation.current += 1
    setData(null)
    setLoading(true)
    setError('')
    setFeedback({})
    setPending({})
    setQuestionErrors({})
    setTranslations({})
    setReload((n) => n + 1)
  }

  function focusPassage(id) {
    const element = document.getElementById(`passage-${id}`)
    if (!element) return
    element.scrollIntoView({ behavior: scrollBehavior(), block: 'center' })
    element.focus({ preventScroll: true })
    setHighlightId(id)
    clearTimeout(highlightTimer.current)
    highlightTimer.current = setTimeout(() => setHighlightId(''), 2600)
  }

  function scrollToId(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
    if (!isDesktop()) panel.setOpen(false)
  }

  const total = data?.questions.length || 0
  const answered = Object.keys(feedback).length
  const correct = Object.values(feedback).filter((item) => item.isCorrect).length

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:py-8">
      {data && <ReadingProgressBar />}
      <Link className={`inline-flex items-center gap-2 rounded-md text-sm font-bold text-ice-navy transition hover:text-ice-gold-700 ${focusRing}`} to="/doc-hieu">
        <Icon className="h-4 w-4" name="back" />
        Thư viện đọc hiểu
      </Link>

      {loading && (
        <div aria-live="polite" className="mt-6 animate-pulse space-y-4">
          <p className="sr-only">Đang tải bài đọc...</p>
          <div aria-hidden="true" className="h-40 rounded-2xl bg-white" />
          <div aria-hidden="true" className="h-72 rounded-2xl bg-white" />
        </div>
      )}
      {error && <ErrorBanner action="Tải lại" message={error} onAction={reloadArticle} />}

      {data && (
        <>
          <header className="mt-5 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="min-w-0 flex-1 border-l-4 border-ice-gold pl-4">
              <div className="flex flex-wrap gap-2">
                {data.blog.topic?.name && <Chip>{data.blog.topic.name}</Chip>}
                {data.blog.estimatedReadingMinutes ? <Chip tone="slate"><Icon className="h-3.5 w-3.5" name="clock" />{data.blog.estimatedReadingMinutes} phút đọc</Chip> : null}
              </div>
              <h1 className="mt-3 font-gf text-2xl font-black leading-tight text-ice-navy sm:text-3xl">{data.blog.title}</h1>
              <p className="mt-3 max-w-3xl text-slate-600">{data.blog.summary}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button className={btnPrimary} onClick={() => scrollToId('cau-hoi')} type="button">
                  <Icon className="h-4 w-4" name="quiz" />Luyện câu hỏi
                </button>
                <Link className={btnGold} to={`/doc-hieu/${encodeURIComponent(blogId)}/tu-vung`}>
                  <Icon className="h-4 w-4" name="book" />Từ vựng cho bài đọc này
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <button aria-controls="reading-panel" aria-expanded={panel.open} className={btnOutline} onClick={panel.toggle} type="button">
                <Icon name="list" />
                {panel.open ? 'Ẩn bảng câu hỏi' : 'Bảng câu hỏi'}
              </button>
            </div>
          </header>

          <div className="mt-6 flex items-start gap-6">
            <div className="min-w-0 flex-1 space-y-6">
              <article aria-label="Bài đọc" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8" id="bai-doc">
                <div className="mx-auto max-w-3xl space-y-8">
                  {data.passageBlocks.map((block, index) => (
                    <section
                      className={`-m-3 scroll-mt-24 rounded-2xl p-3 outline-none transition-colors duration-500 ${highlightId === block.id ? 'bg-ice-gold/15 ring-2 ring-ice-gold' : ''}`}
                      id={`passage-${block.id}`}
                      key={block.id}
                      tabIndex={-1}
                    >
                      <div className="flex gap-4">
                        <span aria-hidden="true" className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ice-navy/5 text-xs font-bold tabular-nums text-ice-navy">{index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="whitespace-pre-wrap text-lg leading-8 text-slate-800">{block.text}</p>
                          {block.translation && (
                            <>
                              <button
                                aria-expanded={Boolean(translations[block.id])}
                                className={`mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-ice-navy transition hover:border-ice-gold hover:bg-ice-gold/10 ${focusRing}`}
                                onClick={() => setTranslations((current) => ({ ...current, [block.id]: !current[block.id] }))}
                                type="button"
                              >
                                <Icon className="h-3.5 w-3.5" name="translate" />
                                {translations[block.id] ? 'Ẩn' : 'Xem'} bản dịch đoạn {index + 1}
                              </button>
                              {translations[block.id] && <p className="mt-3 whitespace-pre-wrap rounded-xl border-l-4 border-ice-gold bg-slate-50 p-4 leading-7 text-slate-600">{block.translation}</p>}
                            </>
                          )}
                        </div>
                      </div>
                    </section>
                  ))}
                  {data.sourceName && <p className="border-t border-slate-100 pt-4 text-sm text-slate-500">Nguồn: {data.sourceName}</p>}
                </div>
              </article>

              <section className="scroll-mt-6" id="cau-hoi">
                <div className="border-l-4 border-ice-gold pl-4">
                  <h2 className="font-gf text-2xl font-extrabold text-ice-navy">Luyện tập câu hỏi</h2>
                  <p className="mt-1 text-sm text-slate-600">Đúng {correct}/{total} câu theo lựa chọn gần nhất. Bạn có thể thử lại; kết quả không được lưu.</p>
                </div>
                {data.questions.map((question, index) => {
                  const result = feedback[question.id]
                  return (
                    <section className="mt-5 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" id={`question-${question.id}`} key={question.id}>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ice-navy text-sm font-bold text-white">{index + 1}</span>
                        <Chip tone="gold">{skills[question.skillType] || question.skillType}</Chip>
                      </div>
                      <h3 className="mt-3 font-bold leading-relaxed text-slate-900">Câu {index + 1}. {question.content}</h3>
                      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                        {question.answers.map((option) => {
                          const picked = result?.selectedOption === option.optionKey
                          const tone = picked
                            ? result.isCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-red-400 bg-red-50'
                            : 'border-slate-200 bg-white hover:border-ice-gold hover:bg-ice-gold/10'
                          const badge = picked ? (result.isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white') : 'bg-slate-100 text-slate-500'
                          return (
                            <button
                              aria-pressed={picked}
                              className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm text-slate-800 transition disabled:opacity-60 ${tone} ${focusRing}`}
                              disabled={Boolean(pending[question.id]) || Boolean(error)}
                              key={option.id}
                              onClick={() => answer(question.id, option.optionKey)}
                              type="button"
                            >
                              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${badge}`}>{option.optionKey}</span>
                              <span className="pt-0.5">{option.content}</span>
                            </button>
                          )
                        })}
                      </div>
                      {pending[question.id] && <p className="mt-3 text-sm text-slate-500">Đang kiểm tra...</p>}
                      {questionErrors[question.id] && <p className="mt-3 text-sm text-red-700" role="alert">{questionErrors[question.id]}</p>}
                      {result && (
                        <div aria-live="polite" className={`mt-4 rounded-xl border p-4 text-sm text-slate-700 ${result.isCorrect ? 'border-emerald-200 bg-emerald-50/60' : 'border-red-200 bg-red-50/60'}`}>
                          <p className={`flex items-center gap-2 font-bold ${result.isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                            <Icon className="h-5 w-5" name={result.isCorrect ? 'check' : 'close'} strokeWidth={2.5} />
                            {result.isCorrect ? 'Chính xác!' : 'Chưa chính xác. Bạn có thể chọn lại.'}
                          </p>
                          {result.optionExplanation && <p className="mt-2">{result.optionExplanation}</p>}
                          {result.questionExplanation && <p className="mt-2">{result.questionExplanation}</p>}
                          {result.evidenceBlockIds?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {result.evidenceBlockIds.map((id) => (
                                <button className={`rounded-full bg-white px-3 py-1 text-xs font-bold text-ice-navy ring-1 ring-ice-navy/15 transition hover:bg-ice-gold/15 ${focusRing}`} key={id} onClick={() => focusPassage(id)} type="button">
                                  Xem đoạn {id}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  )
                })}
              </section>
            </div>

            {/* ───────── Bảng câu hỏi (trượt ra/vào) ───────── */}
            <button
              aria-hidden={!panel.open}
              aria-label="Đóng bảng câu hỏi"
              className={`fixed inset-0 z-[60] bg-ice-navy/50 backdrop-blur-[2px] transition-[opacity,visibility] duration-300 motion-reduce:transition-none lg:hidden ${panel.open ? 'visible opacity-100' : 'invisible pointer-events-none opacity-0'}`}
              inert={!panel.open}
              onClick={() => panel.setOpen(false)}
              tabIndex={-1}
              type="button"
            />
            <aside
              aria-hidden={!panel.open}
              aria-label="Bảng câu hỏi"
              className={`fixed bottom-0 right-0 top-0 z-[70] flex w-80 max-w-[88vw] flex-col overflow-hidden bg-white shadow-2xl transition-[translate,width,margin,opacity,visibility] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none lg:sticky lg:bottom-auto lg:right-auto lg:top-6 lg:z-auto lg:max-w-none lg:shrink-0 lg:rounded-2xl lg:border lg:border-slate-200 lg:shadow-sm lg:duration-300 ${
                panel.open ? 'visible translate-x-0 lg:w-72' : 'invisible translate-x-full lg:-ml-6 lg:w-0 lg:translate-x-0 lg:border-transparent lg:opacity-0'
              }`}
              id="reading-panel"
              inert={!panel.open}
            >
              <div className="flex min-h-0 w-full flex-1 flex-col lg:w-72 lg:flex-none">
                <div className="flex items-center justify-between gap-3 border-b-4 border-ice-gold bg-ice-navy px-5 py-4">
                  <div>
                    <h2 className="font-extrabold text-white">Bảng câu hỏi</h2>
                    <p className="mt-0.5 text-xs text-white/70">Đúng {correct}/{total} câu</p>
                  </div>
                  <button aria-label="Ẩn bảng câu hỏi" className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice-gold" onClick={panel.toggle} type="button">
                    <Icon name="close" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-ice-navy">Đã làm {answered}/{total}</span>
                    <span className="tabular-nums text-slate-500">{total ? Math.round((answered / total) * 100) : 0}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-ice-gold transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${total ? (answered / total) * 100 : 0}%` }} />
                  </div>

                  <div className="mt-5 grid grid-cols-5 gap-2">
                    {data.questions.map((question, index) => {
                      const result = feedback[question.id]
                      const tone = !result ? 'border-slate-200 bg-white text-slate-600 hover:border-ice-gold' : result.isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-red-400 bg-red-500 text-white'
                      return (
                        <button aria-label={`Đến câu ${index + 1}${result ? (result.isCorrect ? ', đã đúng' : ', chưa đúng') : ', chưa làm'}`} className={`h-10 rounded-xl border text-sm font-bold tabular-nums transition ${tone} ${focusRing}`} key={question.id} onClick={() => scrollToId(`question-${question.id}`)} type="button">
                          {index + 1}
                        </button>
                      )
                    })}
                  </div>
                  <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Đúng</li>
                    <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Chưa đúng</li>
                    <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-slate-300" />Chưa làm</li>
                  </ul>

                  <div className="mt-6 space-y-2 border-t border-slate-100 pt-5">
                    <button className={`${btnOutline} w-full`} onClick={() => scrollToId('bai-doc')} type="button">Đọc lại bài</button>
                    <Link className={`${btnGold} w-full`} to={`/doc-hieu/${encodeURIComponent(blogId)}/tu-vung`}>
                      <Icon className="h-4 w-4" name="book" />Từ vựng bài đọc
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {!panel.open && (
            <button
              aria-controls="reading-panel"
              aria-expanded="false"
              className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 inline-flex items-center gap-2 rounded-full bg-ice-navy py-3 pl-4 pr-3 text-sm font-bold text-white shadow-lg ring-2 ring-ice-gold transition hover:bg-ice-navy/90 focus-visible:outline-none focus-visible:ring-4 lg:hidden"
              onClick={() => panel.setOpen(true)}
              type="button"
            >
              <Icon className="h-5 w-5 text-ice-gold" name="list" />
              <span className="text-white">Bảng câu hỏi</span>
              <span className="rounded-full bg-ice-gold px-2 py-0.5 text-xs font-extrabold text-ice-navy">{correct}/{total}</span>
            </button>
          )}
        </>
      )}
    </main>
  )
}

/* ═══════════════════════ Trang 3: Từ vựng bài đọc (flashcard 3D) ═══════════════════════ */

function speak(text) {
  if (!text || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

function shuffleIndexes(length) {
  const order = Array.from({ length }, (_, i) => i)
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

/** Thẻ được nhấc lên, lật tung theo một chiều rồi đáp xuống; bóng co lại, ánh sáng quét qua mặt thẻ. */
function Flashcard({ vocabulary, isFlipped, onFlip }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [reduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [angle, setAngle] = useState(isFlipped ? 180 : 0)
  const [wasFlipped, setWasFlipped] = useState(isFlipped)
  const liftRef = useRef(null)
  const groundRef = useRef(null)
  const cardRef = useRef(null)
  const seenAngle = useRef(angle)
  const example = vocabulary.exampleSentence || vocabulary.example
  const exampleTranslation = vocabulary.exampleTranslation || vocabulary.exampleSentenceTranslate
  const face = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }

  if (wasFlipped !== isFlipped) {
    setWasFlipped(isFlipped)
    setAngle((value) => value + 180)
  }

  useEffect(() => {
    if (seenAngle.current === angle) return
    seenAngle.current = angle
    if (reduceMotion) return

    const sign = (angle / 180) % 2 === 0 ? -1 : 1
    const timing = { duration: 900, easing: 'cubic-bezier(.4,0,.2,1)' }
    liftRef.current?.animate(
      [
        { transform: 'translateY(0) scale(1) rotateZ(0deg)' },
        { transform: `translateY(-38px) scale(1.09) rotateZ(${3.2 * sign}deg)`, offset: 0.36 },
        { transform: `translateY(-12px) scale(1.035) rotateZ(${-1.4 * sign}deg)`, offset: 0.72 },
        { transform: 'translateY(0) scale(1) rotateZ(0deg)' },
      ],
      timing,
    )
    groundRef.current?.animate(
      [
        { transform: 'scale(1)', opacity: 0.3 },
        { transform: 'scale(0.72) translateY(14px)', opacity: 0.1, offset: 0.36 },
        { transform: 'scale(1)', opacity: 0.3 },
      ],
      timing,
    )
    cardRef.current?.querySelectorAll('[data-glare]').forEach((glare) =>
      glare.animate(
        [
          { transform: 'translateX(-130%) skewX(-14deg)', opacity: 0 },
          { opacity: 1, offset: 0.35 },
          { transform: 'translateX(430%) skewX(-14deg)', opacity: 0 },
        ],
        { duration: 760, delay: 110, easing: 'ease-in-out' },
      ),
    )
  }, [angle, reduceMotion])

  function handlePointerMove(event) {
    if (reduceMotion || event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    setTilt({
      x: ((event.clientY - rect.top) / rect.height - 0.5) * -8,
      y: ((event.clientX - rect.left) / rect.width - 0.5) * 10,
    })
  }

  return (
    <div className="relative mx-auto mb-10 w-full max-w-2xl">
      <span aria-hidden="true" className="absolute inset-x-6 -bottom-3 top-4 rounded-3xl bg-ice-navy/10" />
      <span aria-hidden="true" className="absolute inset-x-12 -bottom-6 top-8 rounded-3xl bg-ice-navy/5" />
      <span aria-hidden="true" className="absolute inset-x-10 -bottom-7 h-5 rounded-[50%] bg-ice-navy opacity-30 blur-xl" ref={groundRef} />

      <div className="relative" onPointerLeave={() => setTilt({ x: 0, y: 0 })} onPointerMove={handlePointerMove} style={{ perspective: '1400px' }}>
        <div style={{ transformStyle: 'preserve-3d', transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transition: 'transform 180ms ease-out' }}>
          <div className="transition-transform duration-150 ease-out active:scale-[0.97]" ref={liftRef} style={{ transformStyle: 'preserve-3d' }}>
            <div
              aria-label={`Thẻ từ vựng ${vocabulary.word}. Nhấn để lật thẻ.`}
              aria-pressed={isFlipped}
              className="relative block h-72 w-full cursor-pointer select-none rounded-3xl outline-none focus-visible:ring-4 focus-visible:ring-ice-gold sm:h-96"
              onClick={onFlip}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onFlip()
                }
              }}
              ref={cardRef}
              role="button"
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateY(${angle}deg)`,
                transition: reduceMotion ? 'none' : 'transform 900ms cubic-bezier(.3,1.2,.4,1)',
                willChange: 'transform',
              }}
              tabIndex={0}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-ice-navy p-8 text-center text-white shadow-2xl" style={face}>
                <img alt="" aria-hidden="true" className="pointer-events-none absolute bottom-2 right-2 w-8 opacity-20 mix-blend-screen grayscale invert sm:bottom-4 sm:right-4 sm:w-14" src="/ice_english_emblem_vector.svg" />
                <span aria-hidden="true" className="absolute bottom-6 left-5 top-6 w-2.5 rounded-full bg-ice-gold" />
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0" data-glare />
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">Tiếng Anh</span>
                <h3 className="mt-5 max-w-full break-words text-4xl font-extrabold tracking-tight text-white sm:text-6xl">{vocabulary.word}</h3>
                {vocabulary.phonetic && <p className="mt-3 text-lg font-medium text-ice-gold">{vocabulary.phonetic}</p>}
                <p className="absolute bottom-5 inline-flex items-center gap-1.5 text-xs font-medium text-white/60"><Icon className="h-3.5 w-3.5" name="flip" />Chạm hoặc nhấn Space để lật</p>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl ring-1 ring-ice-navy/10" style={{ ...face, transform: 'rotateY(180deg)' }}>
                <img alt="" aria-hidden="true" className="pointer-events-none absolute bottom-2 right-2 w-8 opacity-15 mix-blend-multiply sm:bottom-4 sm:right-4 sm:w-14" src="/ice_english_emblem_vector.svg" />
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-2 bg-ice-gold" />
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-ice-gold/30 to-transparent opacity-0" data-glare />
                <span className="rounded-full bg-ice-gold/15 px-3 py-1 text-xs font-semibold text-ice-gold-700">Nghĩa tiếng Việt</span>
                <h3 className="mt-5 max-w-full break-words text-3xl font-extrabold text-ice-navy sm:text-5xl">{vocabulary.meaning}</h3>
                {(example || exampleTranslation) && (
                  <div className="mt-6 max-h-28 w-full max-w-md overflow-y-auto border-t border-slate-200 pt-4 text-sm">
                    {example && <p className="font-medium italic text-slate-700">{example}</p>}
                    {exampleTranslation && <p className="mt-1 text-slate-500">{exampleTranslation}</p>}
                  </div>
                )}
                <p className="absolute bottom-5 text-xs font-medium text-slate-400">Chạm để lật lại</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        aria-label={`Nghe phát âm từ ${vocabulary.word}`}
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ice-navy shadow-md ring-1 ring-black/5 transition hover:bg-ice-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice-gold"
        onClick={() => speak(vocabulary.word)}
        title="Nghe phát âm"
        type="button"
      >
        <Icon name="speaker" />
      </button>
    </div>
  )
}

export function ReadingVocabularyPage() {
  const { blogId } = useParams()
  const guest = useGuestMode()
  return <ReadingVocabulary key={`${guest}-${blogId}`} blogId={blogId} guest={guest} />
}

function ReadingVocabulary({ blogId, guest }) {
  const [words, setWords] = useState(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [order, setOrder] = useState(null)
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState('next')
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    let active = true
    getReadingVocabularies(guest, blogId)
      .then((items) => {
        if (!Array.isArray(items)) throw new Error('Dữ liệu từ vựng không hợp lệ.')
        if (active) setWords(items)
      })
      .catch((err) => { if (active) setError(getApiErrorMessage(err, 'Không thể tải từ vựng bài đọc.')) })
    return () => { active = false }
  }, [guest, blogId, retry])

  const deck = words && order && order.length === words.length ? order.map((i) => words[i]) : words
  const total = deck?.length || 0
  const current = Math.min(index, Math.max(total - 1, 0))
  const word = deck?.[current]

  function move(next) {
    setDirection(next >= current ? 'next' : 'prev')
    setIndex(next)
    setFlipped(false)
  }
  const shuffleDeck = () => { setOrder(shuffleIndexes(words.length)); setDirection('prev'); setIndex(0); setFlipped(false) }
  const resetDeck = () => { setOrder(null); setDirection('prev'); setIndex(0); setFlipped(false) }

  /* Phím tắt: ← → chuyển thẻ, Home về thẻ đầu, Space lật thẻ */
  useEffect(() => {
    if (!word) return
    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.target.closest?.('input, textarea, select')) return
      const go = (next, dir) => { setDirection(dir); setIndex(next); setFlipped(false) }
      if (event.key === 'ArrowRight' && current < total - 1) go(current + 1, 'next')
      else if (event.key === 'ArrowLeft' && current > 0) go(current - 1, 'prev')
      else if (event.key === 'Home') { event.preventDefault(); go(0, 'prev') }
      else if (event.key === ' ' && !event.target.closest?.('button, a, [role="button"]')) { event.preventDefault(); setFlipped((value) => !value) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [word, current, total])

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-6 lg:py-8">
      <style>{KEYFRAMES}</style>
      <Link className={`inline-flex items-center gap-2 rounded-md text-sm font-bold text-ice-navy transition hover:text-ice-gold-700 ${focusRing}`} to={`/doc-hieu/${encodeURIComponent(blogId)}`}>
        <Icon className="h-4 w-4" name="back" />
        Quay lại bài đọc
      </Link>

      <header className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="border-l-4 border-ice-gold pl-4">
          <h1 className="font-gf text-2xl font-black text-ice-navy sm:text-3xl">Từ vựng cho bài đọc này</h1>
          <p className="mt-1 text-sm text-slate-500">{words ? `${words.length} từ vựng trong bài` : 'Ôn tập các từ khó trong bài đọc.'}</p>
        </div>
      </header>

      {!words && !error && (
        <div aria-live="polite" className="mt-6 animate-pulse">
          <p className="sr-only">Đang tải từ vựng...</p>
          <div aria-hidden="true" className="mx-auto h-72 max-w-2xl rounded-3xl bg-white sm:h-96" />
        </div>
      )}
      {error && <ErrorBanner action="Thử lại" message={error} onAction={() => { setError(''); setWords(null); setOrder(null); setIndex(0); setRetry((n) => n + 1) }} />}
      {words && !words.length && <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center font-semibold text-slate-500">Bài đọc này chưa có từ vựng.</p>}

      {word && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-ice-navy">Thẻ ghi nhớ</p>
            <div className="flex flex-wrap items-center gap-2">
              <button aria-label="Về thẻ đầu tiên" className={btnOutline} disabled={current === 0} onClick={() => move(0)} title="Về thẻ đầu tiên (Home)" type="button">
                <Icon className="h-4 w-4" name="first" /><span className="hidden sm:inline">Thẻ đầu tiên</span>
              </button>
              <button aria-label="Xáo trộn thẻ" className={btnOutline} onClick={shuffleDeck} title="Xáo trộn thứ tự thẻ" type="button">
                <Icon className="h-4 w-4" name="shuffle" /><span className="hidden sm:inline">Xáo thẻ</span>
              </button>
              <button aria-label="Đặt lại" className={btnOutline} onClick={resetDeck} title="Đặt lại thứ tự gốc, về thẻ đầu, mặt trước" type="button">
                <Icon className="h-4 w-4" name="reset" /><span className="hidden sm:inline">Đặt lại</span>
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold tabular-nums text-slate-500">{current + 1} / {total}</span>
              {order && <Chip tone="gold">Đã xáo trộn</Chip>}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-ice-gold transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${((current + 1) / total) * 100}%` }} />
            </div>
          </div>

          <div className="mt-8" key={`${current}-${order ? 'shuffled' : 'ordered'}`}>
            <div className={direction === 'next' ? 'rd-enter-next' : 'rd-enter-prev'}>
              <Flashcard isFlipped={flipped} onFlip={() => setFlipped((value) => !value)} vocabulary={word} />
            </div>
          </div>

          <footer className="mt-6 flex items-center justify-between gap-3">
            <button className={btnOutline} disabled={current === 0} onClick={() => move(current - 1)} type="button">
              <Icon className="h-4 w-4" name="prev" />Trước
            </button>
            <p className="hidden text-center text-xs text-slate-400 md:block">Phím tắt: ← → chuyển thẻ, Space lật thẻ, Home về thẻ đầu</p>
            {current >= total - 1 ? (
              <button className={btnGold} onClick={resetDeck} type="button"><Icon className="h-4 w-4" name="reset" />Học lại từ đầu</button>
            ) : (
              <button className={btnPrimary} onClick={() => move(current + 1)} type="button">Tiếp theo<Icon className="h-4 w-4" name="next" /></button>
            )}
          </footer>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-xs font-semibold text-slate-500">Tất cả từ vựng</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {deck.map((item, itemIndex) => (
                <li key={`${item.id ?? item.word}-${itemIndex}`}>
                  <button
                    aria-current={itemIndex === current ? 'true' : undefined}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${itemIndex === current ? 'border-ice-navy bg-ice-navy text-white' : 'border-slate-200 bg-white text-ice-navy hover:border-ice-gold hover:bg-ice-gold/10'} ${focusRing}`}
                    onClick={() => move(itemIndex)}
                    type="button"
                  >
                    {item.word}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  )
}