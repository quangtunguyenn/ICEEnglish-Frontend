import axios from 'axios'
import { formatPracticeSubmissionDate } from '../utils/practiceHistory'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : 'http://localhost:8080'),
  headers: { 'Content-Type': 'application/json' },
})

function notifyAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('iceenglish:auth-change'))
  }
}

export function logout() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('currentUser')
  notifyAuthChange()
}

function findAccessToken(value, allowString = true) {
  if (typeof value === 'string') {
    const token = value.replace(/^Bearer\s+/i, '').trim()
    return allowString && token ? token : null
  }

  if (!value || typeof value !== 'object') return null

  const tokenKeys = ['accessToken', 'access_token', 'token', 'jwt', 'idToken']
  for (const key of tokenKeys) {
    const token = findAccessToken(value[key], true)
    if (token) return token
  }

  for (const nestedValue of Object.values(value)) {
    const token = findAccessToken(nestedValue, false)
    if (token) return token
  }

  return null
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (config.skipAuth) {
    if (typeof config.headers?.delete === 'function') config.headers.delete('Authorization')
    else if (config.headers) delete config.headers.Authorization
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = [
      error.response?.data?.message,
      error.response?.data?.error,
    ].filter(Boolean).join(' ').toLocaleLowerCase()
    const invalidAuthentication =
      (status === 401 || status === 403) &&
      /(token|user\s*\/\s*role|user or role)/i.test(message) &&
      /(thiếu|sai|hết hạn|không hợp lệ|invalid|expired|missing|unauthorized)/i.test(message)

    const token = localStorage.getItem('accessToken')
    if (invalidAuthentication && token && !error.config?.skipAuth &&
        error.config?.headers?.Authorization === `Bearer ${token}`) {
      logout()
    }

    return Promise.reject(error)
  },
)

export async function loginStudent(credentials) {
  const { data } = await api.post('/api/v1/auth/login', credentials, { skipAuth: true })
  const result = data?.data || data?.result || data
  const accessToken = findAccessToken(result)

  if (!accessToken) {
    throw new Error('Backend đăng nhập thành công nhưng không trả về access token.')
  }

  localStorage.removeItem('currentUser')
  localStorage.setItem('accessToken', accessToken)
  const refreshToken = result?.refreshToken || result?.refresh_token
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken)
  }
  if (result.user || result.student) {
    localStorage.setItem('currentUser', JSON.stringify(result.user || result.student))
  }
  notifyAuthChange()

  return result
}

export async function getAuthProfile() {
  const { data } = await api.get('/api/v1/auth/profile')
  const profile = data?.data || data?.result || data
  localStorage.setItem('currentUser', JSON.stringify(profile))
  return profile
}

export async function createStudent(payload) {
  const { data } = await api.post('/api/v1/auth/students', payload)
  return data?.data || data?.result || data
}

export async function uploadLearningBundle(file) {
  const payload = new FormData()
  payload.append('file', file)
  const { data } = await api.post('/api/v1/videos/learning-bundle', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data?.data || data?.result || data
}

export async function importExam(file, examType) {
  const payload = new FormData()
  payload.append('file', file)
  const { data } = await api.post('/api/v1/exams/import', payload, {
    params: { examType },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data?.data || data?.result || data
}

export async function getAdminExams(mode) {
  const { data } = await api.get('/api/v1/exams', { params: mode ? { mode } : {} })
  return extractExamList(data)
}

export async function getMockExamList({ page = 0, size = 20, keyword = '' } = {}) {
  const params = { page, size }
  if (keyword) params.keyword = keyword
  const { data } = await api.get('/api/v1/admin/mock-exams', { params })
  return data
}

export async function getMockExamOverview(examId) {
  const { data } = await api.get(`/api/v1/admin/mock-exams/${examId}/stats/overview`)
  return data
}

export async function getMockExamQuestionStats(examId) {
  const { data } = await api.get(`/api/v1/admin/mock-exams/${examId}/stats/questions`)
  return data
}

export async function getMockExamTop(examId, limit = 10) {
  const { data } = await api.get(`/api/v1/admin/mock-exams/${examId}/stats/top`, { params: { limit } })
  return data
}

export async function getExamPreview(examId) {
  const { data } = await api.get(`/api/v1/exams/${examId}/preview`)
  return data?.data || data?.result || data
}

export async function publishExam(examId) {
  await api.patch(`/api/v1/exams/${examId}/publish`)
}

export async function archiveExam(examId) {
  await api.patch(`/api/v1/exams/${examId}/archive`)
}

export async function toggleExamAnswersRevealed(examId) {
  const { data } = await api.patch(`/api/v1/exams/${examId}/answers-revealed`)
  return data?.data || data?.result || data
}

export function getApiErrorMessage(error, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.') {
  if (!axios.isAxiosError(error)) return error.message || fallback
  return error.response?.data?.message || error.response?.data?.error || fallback
}

function extractExamList(data) {
  const candidates = [
    data,
    data?.data,
    data?.result,
    data?.content,
    data?.data?.content,
    data?.data?.items,
    data?.result?.content,
    data?.result?.items,
    data?.items,
  ]

  return candidates.find(Array.isArray) || []
}

function normalizePage(data, fallbackPage, fallbackSize) {
  const result = unwrapApiData(data)
  if (Array.isArray(result)) {
    return { items: result, page: 0, size: result.length, totalElements: result.length, totalPages: result.length ? 1 : 0 }
  }
  const items = result?.items || result?.content || []
  return {
    items,
    page: result?.page ?? fallbackPage,
    size: result?.size ?? fallbackSize,
    totalElements: result?.totalElements ?? items.length,
    totalPages: result?.totalPages ?? (items.length ? 1 : 0),
  }
}

export async function getGeneralExams({ page = 0, size = 12, keyword = '' } = {}) {
  const params = { mode: 'GENERAL_EXAM', page, size, sort: 'createdAt,desc' }
  if (keyword) params.keyword = keyword
  const { data } = await api.get('/api/v1/exams', { params })
  return normalizePage(data, page, size)
}

export async function getMockExams({ page = 0, size = 12, keyword = '', status = '' } = {}) {
  const params = { mode: 'MOCK', page, size, sort: 'createdAt,desc' }
  if (keyword) params.keyword = keyword
  if (status) params.status = status
  const { data } = await api.get('/api/v1/exams', { params })
  return normalizePage(data, page, size)
}

export function isGuestUser() {
  return typeof localStorage !== 'undefined' && !localStorage.getItem('accessToken')
}

function readingBase(guest) {
  return guest ? '/api/v1/guest/reading-blogs' : '/api/v1/reading-blogs'
}

export async function getReadingBlogs(guest, params = {}) {
  const { data } = await api.get(readingBase(guest), { params, skipAuth: guest })
  return data
}

export async function getReadingTopics(guest) {
  const { data } = await api.get(`${readingBase(guest)}/topics`, { skipAuth: guest })
  return data
}

export async function getReadingBlog(guest, id) {
  const { data } = await api.get(`${readingBase(guest)}/${encodeURIComponent(id)}`, { skipAuth: guest })
  return data
}

export async function getReadingVocabularies(guest, id) {
  const { data } = await api.get(`${readingBase(guest)}/${encodeURIComponent(id)}/vocabularies`, { skipAuth: guest })
  return data
}

export async function answerReadingQuestion(guest, blogId, questionId, payload) {
  const { data } = await api.post(
    `${readingBase(guest)}/${encodeURIComponent(blogId)}/questions/${encodeURIComponent(questionId)}/answer`,
    payload,
    { skipAuth: guest },
  )
  return data
}

export async function getAdminReadingBlogs(params = {}) {
  const { data } = await api.get('/api/v1/admin/reading-blogs', { params })
  return data
}

export async function getAdminReadingBlog(id) {
  const { data } = await api.get(`/api/v1/admin/reading-blogs/${encodeURIComponent(id)}`)
  return data
}

export async function importReadingBlog(file) {
  const payload = new FormData()
  payload.append('file', file)
  const { data } = await api.post('/api/v1/admin/reading-blogs/import', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function publishReadingBlog(id) {
  await api.patch(`/api/v1/admin/reading-blogs/${encodeURIComponent(id)}/publish`)
}

export async function archiveReadingBlog(id) {
  await api.patch(`/api/v1/admin/reading-blogs/${encodeURIComponent(id)}/archive`)
}

export async function setReadingGuestAccess(id, guestAccessible) {
  await api.put(`/api/v1/admin/reading-blogs/${encodeURIComponent(id)}/guest-access`, { guestAccessible })
}

function guestAttemptConfig(submissionId) {
  return {
    skipAuth: true,
    headers: submissionId ? { 'X-Guest-Attempt': submissionId } : {},
  }
}

export async function getGuestExams(mode) {
  const { data } = await api.get('/api/v1/guest/exams', {
    params: { mode },
    skipAuth: true,
  })
  return extractExamList(data)
}

export async function startGuestExam(examId, submissionId) {
  const { data } = await api.post(
    `/api/v1/guest/exams/${encodeURIComponent(examId)}/start`,
    null,
    guestAttemptConfig(submissionId),
  )
  return unwrapApiData(data)
}

export async function getGuestExam(examId, submissionId) {
  const { data } = await api.get(
    `/api/v1/guest/exams/${encodeURIComponent(examId)}`,
    guestAttemptConfig(submissionId),
  )
  return unwrapApiData(data)
}

export async function setGuestExamActivePart(examId, partId, submissionId) {
  await api.put(
    `/api/v1/guest/exams/${encodeURIComponent(examId)}/parts/${encodeURIComponent(partId)}/time`,
    null,
    guestAttemptConfig(submissionId),
  )
}

export async function getGuestExamPartLogs(examId, submissionId) {
  const { data } = await api.get(
    `/api/v1/guest/exams/${encodeURIComponent(examId)}/part-logs`,
    guestAttemptConfig(submissionId),
  )
  return unwrapApiData(data)
}

export async function submitGuestExam(examId, submissionId, payload) {
  const { data } = await api.post(
    `/api/v1/guest/exams/${encodeURIComponent(examId)}/submit`,
    payload,
    guestAttemptConfig(submissionId),
  )
  return unwrapApiData(data)
}

export async function getGuestExamAnswerUrl(examId, submissionId) {
  const { data } = await api.get(
    `/api/v1/guest/exams/${encodeURIComponent(examId)}/answer-url`,
    guestAttemptConfig(submissionId),
  )
  return unwrapApiData(data)
}

export async function getExam(examId, submissionId) {
  const { data } = await api.get(`/api/v1/exams/${examId}`, {
    params: submissionId ? { submissionId } : {},
  })
  return data.data || data
}

export async function getExamAnswersRevealed(examId) {
  const { data } = await api.get(`/api/v1/exams/${examId}/answers-revealed`)
  const result = unwrapApiData(data)
  const revealFlag = Object.entries(result || {}).find(([key]) => {
    const normalizedKey = key.toLowerCase().replaceAll('_', '')
    return normalizedKey === 'isanswersrevealed' || normalizedKey === 'isanswerrevealed'
  })?.[1]
  return revealFlag === true
}

export async function startExam(examId) {
  const { data } = await api.post(`/api/v1/submissions/start/${examId}`)
  return data.data || data
}

export async function setActivePart(submissionId, partId) {
  await api.put(`/api/v1/submissions/${submissionId}/parts/${partId}/time`)
}

export async function startVideoHomework(videoId) {
  const { data } = await api.post(`/api/v1/submissions/homework/start/${videoId}`)
  return unwrapApiData(data)
}

export async function submitExam(payload) {
  const { data } = await api.post('/api/v1/submissions/submit', payload)
  return data.data || data
}

function unwrapApiData(data) {
  return data?.data ?? data?.result ?? data
}

export async function getLatestPracticeScore(examId) {
  const { data } = await api.get(`/api/v1/submissions/practice/${examId}/latest-score`)
  const result = unwrapApiData(data)
  return result && typeof result === 'object' ? result : null
}

export async function getLatestPracticeReview(examId) {
  const { data } = await api.get(`/api/v1/submissions/practice/${examId}/latest-review`)
  return unwrapApiData(data)
}

export async function getPracticeHistory(examId, page = 0, size = 20) {
  const { data } = await api.get(`/api/v1/submissions/practice/${encodeURIComponent(examId)}/history`, {
    params: { page, size },
  })
  const result = unwrapApiData(data)
  if (
    !result || String(result.examId) !== String(examId) || !Array.isArray(result.items) ||
    !Number.isInteger(result.page) || result.page !== page ||
    !Number.isInteger(result.totalPages) || result.totalPages < 0 ||
    !Number.isInteger(result.totalElements) || result.totalElements < 0 ||
    result.items.some((item) => !item?.submissionId || !item.submittedAt)
  ) {
    throw new Error('Dữ liệu lịch sử bài làm không hợp lệ.')
  }
  result.items.forEach((item) => formatPracticeSubmissionDate(item.submittedAt))
  return result
}

export async function getPracticeSubmissionReview(submissionId) {
  const { data } = await api.get(`/api/v1/submissions/practice/${encodeURIComponent(submissionId)}/review`)
  const result = unwrapApiData(data)
  if (
    !result || String(result.submissionId) !== String(submissionId) ||
    !result.examId || !Array.isArray(result.details)
  ) {
    throw new Error('Dữ liệu chi tiết bài làm không hợp lệ.')
  }
  formatPracticeSubmissionDate(result.submittedAt)
  return result
}

export async function getLatestHomeworkReview(examId) {
  const { data } = await api.get(`/api/v1/submissions/homework/${examId}/latest-review`)
  return unwrapApiData(data)
}

export async function getMockScores() {
  const { data } = await api.get('/api/v1/submissions/mock/scores', {
    params: { page: 0, size: 100, sort: 'submittedAt,desc' },
  })
  return normalizePage(data, 0, 100).items
}

export async function getMockReview(examId) {
  const { data } = await api.get(`/api/v1/submissions/mock/${examId}/review`)
  return unwrapApiData(data)
}

export async function getSubmissionPartLogs(submissionId) {
  const { data } = await api.get(`/api/v1/submissions/${submissionId}/part-logs`)
  const result = data?.data || data?.result || data

  if (Array.isArray(result)) return result
  return result?.partTimeLogs || result?.partLogs || result?.content || []
}

export async function getVideoTitles() {
  const { data } = await api.get('/api/v1/videos/titles')
  const result = unwrapApiData(data)
  return Array.isArray(result) ? result : result?.items || result?.content || []
}

export async function getGuestVideos() {
  const { data } = await api.get('/api/v1/guest/videos', { skipAuth: true })
  return extractExamList(data)
}

export async function getGuestVideoLearningContent(videoId) {
  const { data } = await api.get(
    `/api/v1/guest/videos/${encodeURIComponent(videoId)}/learning-content`,
    { skipAuth: true },
  )
  return unwrapApiData(data)
}

export async function getGuestVideoVocabularies(videoId) {
  const { data } = await api.get(
    `/api/v1/guest/videos/${encodeURIComponent(videoId)}/vocabularies`,
    { skipAuth: true },
  )
  const result = unwrapApiData(data)
  return Array.isArray(result) ? result : result?.items || result?.content || []
}

export async function startGuestHomework(videoId, submissionId) {
  const { data } = await api.post(
    `/api/v1/guest/videos/${encodeURIComponent(videoId)}/homework/start`,
    null,
    guestAttemptConfig(submissionId),
  )
  return unwrapApiData(data)
}

export async function submitGuestHomework(videoId, submissionId, payload) {
  const { data } = await api.post(
    `/api/v1/guest/videos/${encodeURIComponent(videoId)}/homework/submit`,
    payload,
    guestAttemptConfig(submissionId),
  )
  return unwrapApiData(data)
}

export async function getGuestHomeworkAnswers(videoId, submissionId) {
  const { data } = await api.get(
    `/api/v1/guest/videos/${encodeURIComponent(videoId)}/homework/answers`,
    guestAttemptConfig(submissionId),
  )
  return unwrapApiData(data)
}

export async function getVideoByTitle(title) {
  const { data } = await api.get('/api/v1/videos', { params: { title } })
  const candidates = [
    data,
    data?.data,
    data?.result,
    data?.content,
    data?.items,
    data?.data?.content,
    data?.data?.items,
    data?.result?.content,
    data?.result?.items,
  ]
  const videos = candidates.find(Array.isArray) || []
  const normalizedTitle = String(title).trim().toLocaleLowerCase()

  return videos.find((video) =>
    [video?.title, video?.videoTitle, video?.video_title]
      .some((videoTitle) => String(videoTitle || '').trim().toLocaleLowerCase() === normalizedTitle),
  ) || null
}

export async function getVideoLearningContent(videoId) {
  const { data } = await api.get(`/api/v1/videos/${videoId}/learning-content`)
  return unwrapApiData(data)
}

export async function getVideoDocument(videoId) {
  const { data } = await api.get(`/api/v1/videos/${videoId}/document`)
  return unwrapApiData(data)
}

export async function getVideoHomework(videoId) {
  const { data } = await api.get(`/api/v1/videos/${videoId}/homework`)
  return unwrapApiData(data)
}

export async function getVideoHomeworkAnswers(examId) {
  const { data } = await api.get(`/api/v1/submissions/exams/${examId}/answer-url`)
  return unwrapApiData(data)
}

export function getVideoHomeworkAnswerUrl(response) {
  if (typeof response === 'string') return response

  const candidates = [
    response,
    response?.data,
    response?.result,
    response?.answers,
    response?.data?.data,
    response?.result?.data,
  ]
  const answer = candidates.find((candidate) =>
    typeof candidate?.answer_url === 'string' ||
    typeof candidate?.answerUrl === 'string' ||
    typeof candidate?.answers_url === 'string' ||
    typeof candidate?.answersUrl === 'string',
  )

  return answer?.answer_url || answer?.answerUrl || answer?.answers_url || answer?.answersUrl || ''
}

export async function submitVideoHomework(payload) {
  const { data } = await api.post('/api/v1/submissions/homework/submit', payload)
  return unwrapApiData(data)
}

export async function getVideoVocabularies(videoId) {
  const { data } = await api.get(`/api/v1/videos/${videoId}/vocabularies`)
  const result = unwrapApiData(data)
  return Array.isArray(result) ? result : result?.items || result?.content || []
}
