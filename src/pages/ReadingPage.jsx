import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useGuestMode } from '../hooks/useGuestMode'
import {
  answerReadingQuestion,
  getApiErrorMessage,
  getReadingBlog,
  getReadingBlogs,
  getReadingTopics,
  getReadingVocabularies,
} from '../services/api'

const skills = {
  SKIMMING: 'Đọc lướt · Ý chính',
  SCANNING: 'Đọc quét · Tìm thông tin',
  INFERENCE: 'Suy luận',
  VOCABULARY_IN_CONTEXT: 'Từ vựng trong ngữ cảnh',
  REFERENCE: 'Từ thay thế',
}

const button = 'rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50'
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800'

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

  function changePage(page) {
    setLoading(true)
    setError('')
    setQuery({ ...query, page })
  }

  function openBlog(blog) {
    const path = `/doc-hieu/${encodeURIComponent(blog.id)}`
    if (guest && !blog.accessible) navigate('/dang-nhap', { state: { from: { pathname: path } } })
    else navigate(path)
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-sm font-bold uppercase tracking-widest text-cyan-700">Reading library</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Thư viện đọc hiểu</h1>
        <p className="mt-2 text-slate-600">Khám phá bài đọc và rèn kỹ năng tìm ý chính, tìm thông tin và suy luận.</p>
      </header>
      <form className="mt-6 flex flex-wrap gap-3" onSubmit={search}>
        <input aria-label="Tìm tiêu đề" className={`${field} min-w-48 flex-1`} maxLength={200} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} placeholder="Tìm theo tiêu đề" value={filters.keyword} />
        <select aria-label="Chủ đề" className={field} onChange={(e) => setFilters({ ...filters, topic: e.target.value })} value={filters.topic}>
          <option value="">Tất cả chủ đề</option>
          {topics.map((topic) => <option key={topic.slug} value={topic.slug}>{topic.name}</option>)}
        </select>
        <select aria-label="Loại bài" className={field} onChange={(e) => setFilters({ ...filters, contentType: e.target.value })} value={filters.contentType}>
          <option value="">Tất cả loại bài</option><option value="ARTICLE">Bài báo</option><option value="MAGAZINE">Tạp chí</option><option value="STORY">Câu chuyện</option><option value="PASSAGE">Bài đọc</option>
        </select>
        <button className={button} type="submit">Tìm kiếm</button>
      </form>
      {loading && <p className="mt-8 text-slate-500">Đang tải bài đọc...</p>}
      {error && <div className="mt-8 text-red-700" role="alert"><p>{error}</p><button className="mt-2 underline" onClick={() => { setError(''); setLoading(true); setRetry((n) => n + 1) }} type="button">Thử lại</button></div>}
      {!loading && !error && result && (
        <>
          {result.items.length === 0 && <p className="mt-8 text-slate-500">Không có bài đọc phù hợp.</p>}
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.items.map((blog) => (
              <button className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-cyan-500 focus-visible:outline-2 focus-visible:outline-cyan-600" key={blog.id} onClick={() => openBlog(blog)} type="button">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">{blog.topic?.name} · {blog.difficulty}</span>
                <h2 className="mt-3 text-xl font-extrabold text-slate-900">{blog.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{blog.summary}</p>
                <p className="mt-4 text-sm font-bold text-slate-500">{blog.estimatedReadingMinutes ? `${blog.estimatedReadingMinutes} phút đọc · ` : ''}{guest && !blog.accessible ? '🔒 Đăng nhập' : 'Đọc bài →'}</p>
              </button>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-4">
            <button className={button} disabled={query.page <= 0} onClick={() => changePage(query.page - 1)} type="button">Trang trước</button>
            <span className="text-sm text-slate-600">Trang {result.totalPages ? result.page + 1 : 0} / {result.totalPages}</span>
            <button className={button} disabled={query.page + 1 >= result.totalPages} onClick={() => changePage(query.page + 1)} type="button">Trang sau</button>
          </div>
        </>
      )}
    </main>
  )
}

export function ReadingDetailPage() {
  const { blogId } = useParams()
  const guest = useGuestMode()
  return <ReadingDetail key={`${guest}-${blogId}`} blogId={blogId} guest={guest} />
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
  const generation = useRef(0)

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

  const correct = Object.values(feedback).filter((item) => item.isCorrect).length
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link className="font-bold text-cyan-700" to="/doc-hieu">← Thư viện đọc hiểu</Link>
      {loading && <p className="mt-6 text-slate-500">Đang tải bài đọc...</p>}
      {error && <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700" role="alert"><p>{error}</p><button className="mt-2 font-bold underline" onClick={reloadArticle} type="button">Tải lại</button></div>}
      {data && (
        <>
          <header className="mt-6 border-b border-slate-200 pb-6">
            <p className="text-sm font-bold text-cyan-700">{data.blog.topic?.name} {data.blog.estimatedReadingMinutes ? `· ${data.blog.estimatedReadingMinutes} phút đọc` : ''}</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">{data.blog.title}</h1>
            <p className="mt-3 text-slate-600">{data.blog.summary}</p>
            <div className="mt-5 flex flex-wrap gap-3"><a className={button} href="#cau-hoi">Luyện câu hỏi</a><Link className="rounded-lg border border-cyan-600 px-4 py-2.5 text-sm font-bold text-cyan-800" to={`/doc-hieu/${encodeURIComponent(blogId)}/tu-vung`}>Từ vựng cho bài đọc này</Link></div>
          </header>
          <article aria-label="Bài đọc" className="space-y-5 py-8">
            {data.passageBlocks.map((block, index) => (
              <section className="scroll-mt-6 rounded-xl border border-slate-200 bg-white p-5" id={`passage-${block.id}`} key={block.id} tabIndex={-1}>
                <p className="whitespace-pre-wrap text-lg leading-8 text-slate-800">{block.text}</p>
                {block.translation && <><button aria-expanded={Boolean(translations[block.id])} className="mt-3 text-sm font-bold text-cyan-700" onClick={() => setTranslations((current) => ({ ...current, [block.id]: !current[block.id] }))} type="button">{translations[block.id] ? 'Ẩn' : 'Xem'} bản dịch đoạn {index + 1}</button>{translations[block.id] && <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">{block.translation}</p>}</>}
              </section>
            ))}
            {data.sourceName && <p className="text-sm text-slate-500">Nguồn: {data.sourceName}</p>}
          </article>
          <section id="cau-hoi">
            <h2 className="text-2xl font-extrabold">Luyện tập câu hỏi</h2>
            <p className="mt-2 text-sm text-slate-600">Đúng {correct}/{data.questions.length} câu theo lựa chọn gần nhất. Bạn có thể thử lại; kết quả không được lưu.</p>
            {data.questions.map((question, index) => {
              const result = feedback[question.id]
              return (
                <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5" key={question.id}>
                  <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">{skills[question.skillType] || question.skillType}</p>
                  <h3 className="mt-2 font-bold text-slate-900">Câu {index + 1}. {question.content}</h3>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {question.answers.map((option) => <button aria-pressed={result?.selectedOption === option.optionKey} className={`rounded-lg border px-4 py-3 text-left text-sm hover:border-cyan-500 disabled:opacity-60 ${result?.selectedOption === option.optionKey ? 'border-cyan-600 bg-cyan-50' : 'border-slate-200'}`} disabled={Boolean(pending[question.id]) || Boolean(error)} key={option.id} onClick={() => answer(question.id, option.optionKey)} type="button"><strong>{option.optionKey}.</strong> {option.content}</button>)}
                  </div>
                  {pending[question.id] && <p className="mt-3 text-sm text-slate-500">Đang kiểm tra...</p>}
                  {questionErrors[question.id] && <p className="mt-3 text-sm text-red-700" role="alert">{questionErrors[question.id]}</p>}
                  {result && <div aria-live="polite" className="mt-4 rounded-lg bg-slate-50 p-4 text-sm"><p className={`font-bold ${result.isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>{result.isCorrect ? 'Chính xác!' : 'Chưa chính xác. Bạn có thể chọn lại.'}</p>{result.optionExplanation && <p className="mt-2">{result.optionExplanation}</p>}{result.questionExplanation && <p className="mt-2">{result.questionExplanation}</p>}<div className="mt-2 flex flex-wrap gap-3">{result.evidenceBlockIds?.map((id) => <a className="font-bold text-cyan-700 underline" href={`#passage-${encodeURIComponent(id)}`} key={id}>Xem đoạn {id}</a>)}</div></div>}
                </section>
              )
            })}
          </section>
        </>
      )}
    </main>
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
  const [index, setIndex] = useState(0)
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

  const word = words?.[index]
  function move(next) { setIndex(next); setFlipped(false) }
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link className="font-bold text-cyan-700" to={`/doc-hieu/${encodeURIComponent(blogId)}`}>← Quay lại bài đọc</Link>
      <h1 className="mt-6 text-3xl font-black">Từ vựng cho bài đọc này</h1>
      {!words && !error && <p className="mt-6 text-slate-500">Đang tải từ vựng...</p>}
      {error && <div className="mt-6 text-red-700" role="alert"><p>{error}</p><button className="mt-2 underline" onClick={() => { setError(''); setWords(null); setRetry((n) => n + 1) }} type="button">Thử lại</button></div>}
      {words && !words.length && <p className="mt-6 text-slate-500">Bài đọc này chưa có từ vựng.</p>}
      {word && <section className="mt-6"><p className="text-sm text-slate-500">Thẻ {index + 1} / {words.length} · Bấm thẻ để lật</p><button aria-label={flipped ? 'Hiện từ tiếng Anh' : 'Hiện nghĩa tiếng Việt'} className="mt-3 grid min-h-64 w-full place-content-center rounded-xl bg-slate-900 p-8 text-center text-white" onClick={() => setFlipped(!flipped)} type="button"><span className="text-3xl font-black">{flipped ? word.meaning : word.word}</span>{!flipped && word.phonetic && <span className="mt-3">{word.phonetic}</span>}</button>{word.exampleSentence && <p className="mt-4 text-slate-700">{word.exampleSentence}</p>}{word.exampleTranslation && <p className="mt-1 text-slate-500">{word.exampleTranslation}</p>}<div className="mt-5 flex justify-between"><button className={button} disabled={index === 0} onClick={() => move(index - 1)} type="button">Trước</button><button className={button} disabled={index >= words.length - 1} onClick={() => move(index + 1)} type="button">Tiếp theo</button></div></section>}
    </main>
  )
}
