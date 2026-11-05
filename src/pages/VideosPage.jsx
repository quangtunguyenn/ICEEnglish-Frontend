import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  getApiErrorMessage,
  getVideoByTitle,
  getLatestHomeworkReview,
  getVideoLearningContent,
  getVideoHomeworkAnswerUrl,
  getVideoHomeworkAnswers,
  getVideoTitles,
  getVideoVocabularies,
} from '../services/api'

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

function getVideoId(video) {
  return video?.videoId || video?.video_id || video?.id
}

function getVideoTitle(video) {
  return typeof video === 'string'
    ? video
    : video?.title || video?.videoTitle || video?.video_title || ''
}

function getHomeworkExamId(homework) {
  return homework?.examId || homework?.exam_id || homework?.id
}

export function VideosPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [titles, setTitles] = useState([])
  const selectedTitle = location.state?.selectedTitle || sessionStorage.getItem('selected-video-title') || ''
  const selectedVideoId = location.state?.videoId || sessionStorage.getItem('selected-video-id') || ''
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

  const activeVideo =
    titles.find((item) => getVideoId(item) === selectedVideoId) ||
    titles.find((item) => getVideoTitle(item) === selectedTitle) ||
    titles[0] ||
    null
  const activeTitle = getVideoTitle(activeVideo)
  const activeVideoId = getVideoId(activeVideo)
  const activeVideoKey = activeVideoId || activeTitle

  useEffect(() => {
    if (!activeVideo) return
    let active = true

    async function loadVideo() {
      let videoRecord = activeVideo
      if (!getVideoId(videoRecord)) {
        videoRecord = await getVideoByTitle(activeTitle)
      }
      if (!videoRecord) throw new Error('Không tìm thấy video đã chọn.')

        const videoId = getVideoId(videoRecord)
        if (!videoId) throw new Error('Video không có videoId hợp lệ.')

        const content = await getVideoLearningContent(videoId)
        if (!active) return

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
  }, [activeVideo, activeVideoKey, activeTitle])
  const currentVideoId = getVideoId(video)
  const homeworkExamId = getHomeworkExamId(homework)
  const homeworkCompletionKey = currentVideoId && homeworkExamId
    ? `video-homework-completed:${currentVideoId}:${homeworkExamId}`
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
    completionToken === 'completed' && !fetchedAnswerForCurrentHomework

  useEffect(() => {
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
  }, [completionToken, currentVideoId, homeworkCompletionKey, homeworkExamId])

  const loadingVideo = Boolean(activeVideoKey) && loadedVideoKey !== activeVideoKey
  const contentLoading = loadingVideo
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

  async function openVocabularyPractice(videoId, title, knownVocabularies = []) {
    if (!videoId || loadingVocabularyPractice) return

    setLoadingVocabularyPractice(true)
    setVocabularyPracticeError('')
    try {
      const lessonVocabularies = knownVocabularies.length
        ? knownVocabularies
        : videoId === currentVideoId && vocabularies.length
          ? vocabularies
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
    if (!homeworkExamId || reviewingHomework) return

    setReviewingHomework(true)
    setHomeworkReviewError('')
    try {
      const review = await getLatestHomeworkReview(homeworkExamId)
      const submissionId = review?.submissionId || review?.submission_id
      if (!submissionId) throw new Error('API review không trả về submissionId.')

      const reviewResult = {
        ...review,
        examId: review.examId || review.exam_id || homeworkExamId,
        examTitle: review.examTitle || review.exam_title || homework.title,
      }
      sessionStorage.setItem(`exam-result:${submissionId}`, JSON.stringify(reviewResult))
      sessionStorage.setItem('selected-video-title', videoTitle)
      sessionStorage.setItem('selected-video-id', currentVideoId)
      navigate(`/ket-qua/${submissionId}`, {
        state: { result: reviewResult, returnTo: '/video' },
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
    <div className="mx-auto max-w-7xl px-6 py-8">
      {error && <p className="mb-6 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
      {vocabularyPracticeError && (
        <p className="mb-6 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          {vocabularyPracticeError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="w-full text-center text-2xl font-extrabold text-cyan-900">{videoTitle || 'Tên video bài giảng'}</h1>
          </div>
          {loadingVideo && <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-950 text-sm text-slate-300">Đang tải video...</div>}
          {!loadingVideo && video && embedUrl && (
            <>
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
              <div className="mt-8 space-y-8">
                <section className="border-t border-slate-100 pt-6" id="document">
                  <h2 className="text-xl font-extrabold text-slate-900">Tài liệu</h2>
                  <p className="mt-2 text-sm text-slate-500">Tài liệu bổ trợ cho bài học này.</p>
                  {documentUrl ? (
                    <a className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700" download href={documentUrl} rel="noreferrer" target="_blank">
                      Tải tài liệu
                    </a>
                  ) : <p className="mt-4 text-sm text-slate-500">{contentLoading ? 'Đang tải tài liệu...' : 'Chưa có tài liệu.'}</p>}
                </section>
                <section className="border-t border-slate-100 pt-6" id="vocabulary">
                  <h2 className="text-xl font-extrabold text-slate-900">Từ vựng</h2>
                  <button
                    className="mt-4 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loadingVocabularyPractice || contentLoading}
                    onClick={() => openVocabularyPractice(currentVideoId, videoTitle, vocabularies)}
                    type="button"
                  >
                    {loadingVocabularyPractice ? 'Đang tải từ vựng...' : 'Luyện tập từ vựng bài học này'}
                  </button>
                  {vocabularies.length > 0 ? (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-lg text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Từ vựng</th><th className="px-4 py-3">Nghĩa</th><th className="px-4 py-3">Ví dụ</th></tr></thead>
                        <tbody>{vocabularies.map((item, index) => <tr className="border-t border-slate-100" key={item.id || index}><td className="px-4 py-3 font-bold text-cyan-700">{item.word || item.term || item.vocabulary || '—'}</td><td className="px-4 py-3">{item.meaning || item.definition || item.translation || '—'}</td><td className="px-4 py-3 text-slate-500">{item.example || item.exampleSentence || '—'}</td></tr>)}</tbody>
                      </table>
                    </div>
                  ) : <p className="mt-4 text-sm text-slate-500">{contentLoading ? 'Đang tải từ vựng...' : 'Chưa có từ vựng.'}</p>}
                </section>
                <section className="border-t border-slate-100 pt-6" id="homework">
                  <h2 className="text-xl font-extrabold text-slate-900">Bài tập về nhà</h2>
                  {homework ? (
                    <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50 p-6">
                      <p className="text-sm text-slate-600">Hoàn thành bài tập theo giao diện luyện đề và thi thử.</p>
                      <button
                        className="mt-5 rounded-lg bg-cyan-500 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-400"
                        onClick={() => {
                          sessionStorage.setItem('selected-video-title', videoTitle)
                          navigate(`/video/${encodeURIComponent(getVideoId(video))}/homework`, {
                            state: { homework, title: videoTitle },
                          })
                        }}
                        type="button"
                      >
                        Vào làm bài tập về nhà
                      </button>
                      <button
                        className="mt-3 block rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 hover:border-cyan-600 hover:text-cyan-800 disabled:cursor-wait disabled:opacity-50"
                        disabled={reviewingHomework}
                        onClick={reviewLatestHomework}
                        type="button"
                      >
                        {reviewingHomework ? 'Đang tải bài đã làm...' : 'Xem lại bài tập về nhà gần nhất'}
                      </button>
                      {homeworkReviewError && (
                        <p aria-live="polite" className="mt-3 text-sm font-semibold text-red-700">
                          {homeworkReviewError}
                        </p>
                      )}
                      {completionToken && (
                        <div className="mt-4">
                          {loadingHomeworkAnswer && <p className="text-sm text-slate-600">Đang tải liên kết đáp án...</p>}
                          {homeworkAnswerUrl && (
                            <a className="inline-flex rounded-lg bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-700" href={homeworkAnswerUrl} rel="noreferrer" target="_blank">
                              Xem đáp án chi tiết
                            </a>
                          )}
                          {homeworkAnswerError && <p className="text-sm font-semibold text-red-700">{homeworkAnswerError}</p>}
                        </div>
                      )}
                    </div>
                  ) : <p className="mt-4 text-sm text-slate-500">{contentLoading ? 'Đang tải bài tập...' : 'Chưa có bài tập.'}</p>}
                </section>
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

        <aside className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-6">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-extrabold text-slate-900">Nội dung bài học</h2>
            <p className="mt-1 text-xs text-slate-500">{titles.length} video bài giảng</p>
          </div>
          {loadingTitles && <p className="p-5 text-sm text-slate-500">Đang tải danh sách...</p>}
          {!loadingTitles && titles.length === 0 && (
            <p className="p-5 text-sm text-slate-500">Chưa có video nào.</p>
          )}
          <div className="max-h-96 overflow-y-auto p-2">
            {titles.map((item, index) => {
              const title = getVideoTitle(item)
              const videoId = getVideoId(item)
              const itemKey = videoId || title

              return (
              <div className={`mb-3 rounded-xl border p-3 ${activeVideoId === videoId ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200'}`} key={itemKey}>
                <button
                  className="w-full text-left text-sm font-extrabold text-red-600"
                  disabled={!videoId || loadingVocabularyPractice}
                  onClick={() => openVocabularyPractice(videoId, title)}
                  type="button"
                >
                  {index + 1}. {title}
                </button>
                {activeVideoId === videoId && (
                  <ul className="mt-2 space-y-1 text-xs font-semibold text-slate-600">
                    <li><button className="hover:text-cyan-700" onClick={() => document.getElementById('document')?.scrollIntoView({ behavior: 'smooth' })} type="button">• File tài liệu</button></li>
                    <li><button className="hover:text-cyan-700" onClick={() => document.getElementById('homework')?.scrollIntoView({ behavior: 'smooth' })} type="button">• Bài tập về nhà</button></li>
                    <li><button className="hover:text-cyan-700" onClick={() => document.getElementById('homework')?.scrollIntoView({ behavior: 'smooth' })} type="button">• File đáp án chi tiết BTVN</button></li>
                    <li><button className="hover:text-cyan-700" onClick={() => document.getElementById('vocabulary')?.scrollIntoView({ behavior: 'smooth' })} type="button">• Từ vựng</button></li>
                  </ul>
                )}
              </div>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}
