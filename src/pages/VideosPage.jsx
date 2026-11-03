import { useEffect, useMemo, useState } from 'react'
import { PageIntro } from '../components/PageIntro'
import { getApiErrorMessage, getVideoByTitle, getVideoTitles } from '../services/api'

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

export function VideosPage() {
  const [titles, setTitles] = useState([])
  const [selectedTitle, setSelectedTitle] = useState('')
  const [video, setVideo] = useState(null)
  const [loadingTitles, setLoadingTitles] = useState(true)
  const [loadedTitle, setLoadedTitle] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getVideoTitles()
      .then((items) => {
        setTitles(items)
      })
      .catch((requestError) =>
        setError(getApiErrorMessage(requestError, 'Không thể tải danh sách video.')),
      )
      .finally(() => setLoadingTitles(false))
  }, [])

  const activeTitle = selectedTitle || titles[0] || ''

  useEffect(() => {
    if (!activeTitle) return
    getVideoByTitle(activeTitle)
      .then((result) => {
        setVideo(result)
        setLoadedTitle(activeTitle)
      })
      .catch((requestError) =>
        setError(getApiErrorMessage(requestError, 'Không thể tải video này.')),
      )
  }, [activeTitle])

  const loadingVideo = Boolean(activeTitle) && loadedTitle !== activeTitle
  const embedUrl = useMemo(
    () =>
      getYoutubeEmbedUrl(
        video?.videoUrl ||
          video?.video_url ||
          video?.url ||
          video?.embedUrl ||
          video?.embed_url,
      ),
    [video],
  )
  const videoTitle = video?.title || activeTitle

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <PageIntro
        description="Chọn một bài giảng để bắt đầu học."
        eyebrow="Học qua video"
        title="Video bài giảng"
      />

      {error && <p className="mb-6 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {loadingVideo && <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-950 text-sm text-slate-300">Đang tải video...</div>}
          {!loadingVideo && video && embedUrl && (
            <>
              <h1 className="mb-4 text-2xl font-extrabold text-slate-900">
                {videoTitle}
              </h1>
              <div
                className="exam-video-frame relative overflow-hidden rounded-xl bg-black select-none"
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
            </>
          )}
          {!loadingVideo && video && !embedUrl && (
            <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              Video này chưa có định dạng YouTube hợp lệ để phát.
            </p>
          )}
          {!loadingVideo && !video && !error && (
            <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              Chọn video ở danh sách bên phải.
            </div>
          )}
        </section>

        <aside className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-extrabold text-slate-900">Danh sách video</h2>
            <p className="mt-1 text-xs text-slate-500">{titles.length} video bài giảng</p>
          </div>
          {loadingTitles && <p className="p-5 text-sm text-slate-500">Đang tải danh sách...</p>}
          {!loadingTitles && titles.length === 0 && (
            <p className="p-5 text-sm text-slate-500">Chưa có video nào.</p>
          )}
          <div className="max-h-[32rem] overflow-y-auto p-2">
            {titles.map((title, index) => (
              <button
                className={`w-full rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                  activeTitle === title
                    ? 'bg-cyan-50 text-cyan-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
                key={title}
                onClick={() => {
                  setError('')
                  setSelectedTitle(title)
                }}
                type="button"
              >
                <span className="mr-2 text-xs text-slate-400">{String(index + 1).padStart(2, '0')}</span>
                {title}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
