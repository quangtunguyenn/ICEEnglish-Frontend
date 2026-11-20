import { useEffect, useMemo, useRef, useState } from 'react'
import { deleteAdminVideo, getApiErrorMessage, getGuestVideos, setVideoGuestAccess, setVideoPosition } from '../services/api'
import { sortVideoTitles } from '../utils/videoTitles'

const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm'
const POSITION_PATTERN = /^\d+(\.\d+)?$/

function videoKey(video) {
  return video.videoId ?? video.id
}

export function VideoGuestAccessSection({ onVideosChanged }) {
  const [videos, setVideos] = useState([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [copiedId, setCopiedId] = useState('')
  const [drafts, setDrafts] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const deletingRef = useRef(false)
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (deleteTarget && !dialog.open) dialog.showModal()
    if (!deleteTarget && dialog.open) dialog.close()
  }, [deleteTarget])

  async function copyId(id) {
    try {
      await navigator.clipboard.writeText(id)
      setCopiedId(id)
      setTimeout(() => setCopiedId(''), 1500)
    } catch {
      setError('Không sao chép được ID. Hãy bôi đen và sao chép thủ công.')
    }
  }

  useEffect(() => {
    let active = true
    getGuestVideos()
      .then((list) => { if (active) setVideos(sortVideoTitles(list)) })
      .catch((err) => { if (active) setError(getApiErrorMessage(err, 'Không tải được danh sách video.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    const term = keyword.trim().toLowerCase()
    return term ? videos.filter((video) => String(video.title || '').toLowerCase().includes(term)) : videos
  }, [videos, keyword])

  async function savePosition(video) {
    const id = videoKey(video)
    const draft = (drafts[id] ?? video.position ?? '').trim()
    if (draft === (video.position ?? '')) return
    if (draft && !POSITION_PATTERN.test(draft)) {
      setError('Vị trí không hợp lệ. Ví dụ: 1, 1.1, 2.10.')
      return
    }
    setBusyId(id)
    setError('')
    setNotice('')
    try {
      await setVideoPosition(id, draft)
      setVideos((current) => sortVideoTitles(current.map((item) => (
        videoKey(item) === id ? { ...item, position: draft || null } : item
      ))))
      setDrafts((current) => { const { [id]: _removed, ...rest } = current; return rest })
      setNotice(draft ? `Đã đặt vị trí ${draft}.` : 'Đã bỏ vị trí của video.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không cập nhật được vị trí video.'))
    } finally {
      setBusyId('')
    }
  }

  async function toggle(video) {
    const id = videoKey(video)
    const next = !(video.accessible !== false)
    setBusyId(id)
    setError('')
    setNotice('')
    try {
      await setVideoGuestAccess(id, next)
      setVideos((current) => current.map((item) => (videoKey(item) === id ? { ...item, accessible: next } : item)))
      setNotice(next ? 'Đã cho phép khách xem video này.' : 'Đã khóa video này với khách.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không cập nhật được quyền truy cập của khách.'))
    } finally {
      setBusyId('')
    }
  }

  async function refreshAfterDelete() {
    const [videoResult, examResult] = await Promise.allSettled([
      getGuestVideos(),
      onVideosChanged(),
    ])
    if (videoResult.status === 'fulfilled') setVideos(sortVideoTitles(videoResult.value))
    const errors = []
    if (videoResult.status === 'rejected') errors.push(`Không tải lại được danh sách video: ${getApiErrorMessage(videoResult.reason)}`)
    if (examResult.status === 'rejected') errors.push(`Không tải lại được danh sách đề: ${getApiErrorMessage(examResult.reason)}`)
    return errors.join(' ')
  }

  async function confirmDelete() {
    if (!deleteTarget || deletingRef.current) return
    const id = videoKey(deleteTarget)
    deletingRef.current = true
    setDeleting(true)
    setDeleteError('')
    setError('')
    setNotice('')
    try {
      await deleteAdminVideo(id)
      setDeleteTarget(null)
      setVideos((current) => current.filter((video) => videoKey(video) !== id))
      setDrafts((current) => { const { [id]: _removed, ...rest } = current; return rest })
      setNotice('Đã xóa video và dữ liệu liên quan.')
      const refreshError = await refreshAfterDelete()
      if (refreshError) setError(refreshError)
    } catch (err) {
      if (err.response?.status === 404) {
        setDeleteTarget(null)
        const refreshError = await refreshAfterDelete()
        setError(`Không tìm thấy video; có thể video đã bị xóa.${refreshError ? ` ${refreshError}` : ''}`)
      } else if (err.response?.status === 401) {
        setDeleteError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      } else if (err.response?.status === 403) {
        setDeleteError('Bạn không có quyền xóa video.')
      } else {
        setDeleteError(getApiErrorMessage(err, 'Không thể xóa video. Vui lòng thử lại.'))
      }
    } finally {
      deletingRef.current = false
      setDeleting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Danh sách video &amp; quyền cho khách</h2>
      <p className="mt-1 text-sm text-slate-500">Xem toàn bộ ID và tên video ({videos.length} video). Nhập vị trí (1, 1.1, 2.10…) rồi nhấn Enter để lưu; để trống để bỏ vị trí. Bật công tắc để khách xem thử video (kèm homework, từ vựng) không cần đăng nhập; video tắt chỉ hiện tên và yêu cầu đăng ký tư vấn.</p>
      <input
        aria-label="Tìm video"
        className={`${field} mt-4`}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="Tìm theo tên video"
        value={keyword}
      />
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      {notice && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">{notice}</p>}
      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Không có video phù hợp.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {filtered.map((video) => {
            const id = videoKey(video)
            const on = video.accessible !== false
            return (
              <li className="flex items-center gap-3 py-3" key={id}>
                <input
                  aria-label={`Vị trí: ${video.title}`}
                  className="w-16 shrink-0 rounded-lg border border-slate-300 px-2 py-1.5 text-center text-sm font-semibold tabular-nums"
                  disabled={busyId === id}
                  onBlur={() => savePosition(video)}
                  onChange={(event) => setDrafts((current) => ({ ...current, [id]: event.target.value }))}
                  onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }}
                  placeholder="1.1"
                  value={drafts[id] ?? video.position ?? ''}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{video.title}</p>
                  <div className="flex items-center gap-2">
                    <code className="truncate font-mono text-[11px] text-slate-500">{id}</code>
                    <button
                      className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                      onClick={() => copyId(id)}
                      type="button"
                    >
                      {copiedId === id ? 'Đã chép' : 'Sao chép ID'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">{on ? 'Khách được xem' : 'Chỉ dành cho học viên'}</p>
                </div>
                <button
                  aria-checked={on}
                  aria-label={`Cho khách xem: ${video.title}`}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${on ? 'bg-emerald-600' : 'bg-slate-300'}`}
                  disabled={busyId === id}
                  onClick={() => toggle(video)}
                  role="switch"
                  type="button"
                >
                  <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
                </button>
                <button
                  aria-label={`Xóa video: ${video.title}`}
                  className="shrink-0 rounded-lg px-2 py-1.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-40"
                  disabled={!id || Boolean(busyId) || deleting}
                  onClick={() => { setDeleteError(''); setDeleteTarget(video) }}
                  type="button"
                >
                  Xóa
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <dialog
        aria-labelledby="delete-video-title"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-2xl backdrop:bg-slate-900/50"
        onCancel={(event) => { event.preventDefault(); if (!deleting) setDeleteTarget(null) }}
        ref={dialogRef}
      >
        <h3 className="text-lg font-extrabold" id="delete-video-title">Xóa vĩnh viễn video?</h3>
        <p className="mt-2 break-words text-sm font-semibold">{deleteTarget?.title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">Video, từ vựng, đề liên kết, lượt làm homework, câu trả lời và log thời gian liên quan sẽ bị xóa vĩnh viễn. Không thể hoàn tác. File media và tài liệu ở dịch vụ bên ngoài không bị xóa.</p>
        {deleteError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{deleteError}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-50" disabled={deleting} onClick={() => setDeleteTarget(null)} type="button">Hủy</button>
          <button className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={deleting} onClick={confirmDelete} type="button">{deleting ? 'Đang xóa…' : 'Xóa vĩnh viễn'}</button>
        </div>
      </dialog>
    </section>
  )
}
