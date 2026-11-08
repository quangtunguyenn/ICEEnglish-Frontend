import { useEffect, useState } from 'react'
import {
  archiveReadingBlog,
  getAdminReadingBlog,
  getAdminReadingBlogs,
  getApiErrorMessage,
  importReadingBlog,
  publishReadingBlog,
  setReadingGuestAccess,
} from '../services/api'

const button = 'rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50'
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm'

function errorMessage(error) {
  const message = getApiErrorMessage(error, 'Thao tác thất bại. Vui lòng thử lại.')
  const details = error.response?.data?.details
  if (!details) return message
  const text = typeof details === 'string' ? details : JSON.stringify(details)
  return `${message} (${text})`
}

export function ReadingAdminSection() {
  const [file, setFile] = useState(null)
  const [fileKey, setFileKey] = useState(0)
  const [filters, setFilters] = useState({ keyword: '', topic: '', contentType: '', status: '' })
  const [query, setQuery] = useState({ page: 0, size: 12 })
  const [page, setPage] = useState(null)
  const [selectedId, setSelectedId] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let active = true
    getAdminReadingBlogs(query)
      .then((result) => {
        if (!Array.isArray(result?.items)) throw new Error('Dữ liệu danh sách quản trị không hợp lệ.')
        if (active) setPage(result)
      })
      .catch((err) => { if (active) { setPage(null); setError(errorMessage(err)) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query, refresh])

  async function loadPreview(id) {
    setBusy(true)
    setError('')
    setNotice('')
    setSelectedId(id)
    setPreview(null)
    try {
      const result = await getAdminReadingBlog(id)
      if (!result?.blog || !Array.isArray(result.questions) || !Array.isArray(result.passageBlocks) || !Array.isArray(result.vocabularies)) throw new Error('Dữ liệu preview không hợp lệ.')
      setPreview(result)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function runAction(action, success) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await action()
      setNotice(success)
      setLoading(true)
      setRefresh((n) => n + 1)
      return { success: true, result }
    } catch (err) {
      setError(errorMessage(err))
      return { success: false }
    } finally {
      setBusy(false)
    }
  }

  async function handleImport(event) {
    event.preventDefault()
    if (!file) { setError('Vui lòng chọn file JSON.'); return }
    const outcome = await runAction(() => importReadingBlog(file), 'Đã import bài đọc ở trạng thái DRAFT.')
    if (outcome.success) {
      setFile(null)
      setFileKey((n) => n + 1)
      setSelectedId(outcome.result.id)
      setPreview(null)
      setQuery({ page: 0, size: 12 })
      setFilters({ keyword: '', topic: '', contentType: '', status: '' })
    }
  }

  async function mutate(action, message) {
    const outcome = await runAction(action, message)
    if (outcome.success) setPreview(null)
  }

  function search(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    setQuery({ page: 0, size: 12, ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim())) })
  }

  return (
    <section>
      <header className="mb-6 border-b border-slate-200 pb-5"><p className="text-xs font-bold uppercase tracking-widest text-cyan-700">ADMIN</p><h1 className="mt-2 text-2xl font-black">Quản lý bài đọc</h1><p className="mt-2 text-sm text-slate-600">Import JSON tạo bản nháp; kiểm tra nội dung trước khi publish.</p></header>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>}
      {notice && <p aria-live="polite" className="mb-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
      <form className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-5" onSubmit={handleImport}>
        <label className="text-sm font-bold">File JSON<input accept=".json,application/json" className="mt-2 block text-sm" key={fileKey} onChange={(e) => setFile(e.target.files?.[0] || null)} type="file" /></label>
        <button className={button} disabled={busy} type="submit">Import bài đọc</button>
      </form>
      <form className="mt-6 flex flex-wrap gap-2" onSubmit={search}>
        <input aria-label="Tìm tiêu đề bài đọc" className={field} maxLength={200} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} placeholder="Tiêu đề" value={filters.keyword} />
        <input aria-label="Slug chủ đề" className={field} onChange={(e) => setFilters({ ...filters, topic: e.target.value })} placeholder="Slug chủ đề" value={filters.topic} />
        <select aria-label="Loại bài" className={field} onChange={(e) => setFilters({ ...filters, contentType: e.target.value })} value={filters.contentType}><option value="">Tất cả loại</option><option value="ARTICLE">Bài báo</option><option value="MAGAZINE">Tạp chí</option><option value="STORY">Câu chuyện</option><option value="PASSAGE">Bài đọc</option></select>
        <select aria-label="Trạng thái" className={field} onChange={(e) => setFilters({ ...filters, status: e.target.value })} value={filters.status}><option value="">Tất cả trạng thái</option><option value="DRAFT">DRAFT</option><option value="PUBLISHED">PUBLISHED</option><option value="ARCHIVED">ARCHIVED</option></select>
        <button className={button} type="submit">Lọc</button>
      </form>
      {loading && <p className="mt-4 text-sm text-slate-500">Đang tải danh sách...</p>}
      {!loading && page && (
        <div className="mt-4 space-y-2">
          {!page.items.length && <p className="text-sm text-slate-500">Không có bài đọc phù hợp.</p>}
          {page.items.map((blog) => <button className={`w-full rounded-lg border p-4 text-left ${selectedId === blog.id ? 'border-cyan-600 bg-cyan-50' : 'border-slate-200 bg-white'}`} disabled={busy} key={blog.id} onClick={() => loadPreview(blog.id)} type="button"><strong>{blog.title}</strong><span className="mt-1 block text-sm text-slate-600">{blog.status} · {blog.guestAccessible ? 'Khách được xem' : 'Khách bị khóa'} · {blog.topic?.name}</span></button>)}
          <div className="flex items-center gap-3 pt-3"><button className={button} disabled={query.page <= 0} onClick={() => { setLoading(true); setQuery({ ...query, page: query.page - 1 }) }} type="button">Trước</button><span className="text-sm">Trang {page.totalPages ? page.page + 1 : 0} / {page.totalPages}</span><button className={button} disabled={query.page + 1 >= page.totalPages} onClick={() => { setLoading(true); setQuery({ ...query, page: query.page + 1 }) }} type="button">Sau</button></div>
        </div>
      )}
      {!loading && !page && <button className="mt-4 font-bold text-cyan-700 underline" onClick={() => { setError(''); setLoading(true); setRefresh((n) => n + 1) }} type="button">Tải lại danh sách</button>}
      {selectedId && !preview && <button className="mt-5 font-bold text-cyan-700 underline" disabled={busy} onClick={() => loadPreview(selectedId)} type="button">Tải preview bài đã chọn</button>}
      {preview && (
        <div className="mt-6 space-y-5 rounded-xl bg-white p-5">
          <header><h2 className="text-xl font-black">{preview.blog.title}</h2><p className="mt-2 text-sm text-slate-600">{preview.blog.status} · Phiên bản {preview.revision} · {preview.blog.guestAccessible ? 'Khách được xem' : 'Khách bị khóa'}</p><p className="mt-2 text-sm">{preview.blog.summary}</p></header>
          <div className="flex flex-wrap gap-2">
            <button className={button} disabled={busy || preview.blog.status === 'PUBLISHED'} onClick={() => mutate(() => publishReadingBlog(selectedId), 'Đã publish bài đọc. Tải lại preview để xem trạng thái mới.')} type="button">Publish</button>
            <button className={button} disabled={busy || preview.blog.status === 'ARCHIVED'} onClick={() => mutate(() => archiveReadingBlog(selectedId), 'Đã archive bài đọc. Tải lại preview để xem trạng thái mới.')} type="button">Archive</button>
            <button className={button} disabled={busy} onClick={() => mutate(() => setReadingGuestAccess(selectedId, !preview.blog.guestAccessible), 'Đã cập nhật quyền khách. Tải lại preview để xem trạng thái mới.')} type="button">{preview.blog.guestAccessible ? 'Khóa khách' : 'Cho phép khách'}</button>
          </div>
          <div><h3 className="font-bold">Nội dung và bản dịch</h3>{preview.passageBlocks.map((block) => <div className="mt-3 rounded-lg bg-slate-50 p-3" key={block.id}><p className="whitespace-pre-wrap">{block.id}: {block.text}</p>{block.translation && <p className="mt-2 whitespace-pre-wrap text-slate-600">{block.translation}</p>}</div>)}</div>
          <div><h3 className="font-bold">Từ vựng</h3>{preview.vocabularies.map((word) => <p className="mt-2 text-sm" key={word.id}>{word.word} {word.phonetic} — {word.meaning}{word.exampleSentence ? ` · ${word.exampleSentence}` : ''}{word.exampleTranslation ? ` · ${word.exampleTranslation}` : ''}</p>)}</div>
          <div><h3 className="font-bold">Câu hỏi và đáp án</h3>{preview.questions.map((question) => <div className="mt-3 rounded-lg bg-slate-50 p-3" key={question.id}><p className="font-bold">{question.orderIndex}. {question.content} · {question.skillType}</p>{question.answers.map((answer) => <p className="mt-2 text-sm" key={answer.id}>{answer.optionKey}. {answer.content}{answer.correct ? ' ✓' : ''}{answer.explanation ? ` — ${answer.explanation}` : ''}</p>)}{question.explanation && <p className="mt-2 text-sm">Giải thích: {question.explanation}</p>}{question.evidenceBlockIds?.length > 0 && <p className="mt-2 text-sm">Bằng chứng: {question.evidenceBlockIds.join(', ')}</p>}</div>)}</div>
          {(preview.sourceName || preview.sourceUrl) && <p className="text-sm text-slate-600">Nguồn: {preview.sourceName} {preview.sourceUrl}</p>}
        </div>
      )}
    </section>
  )
}
