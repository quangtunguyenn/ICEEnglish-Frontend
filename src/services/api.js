import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
})

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
  if (token && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function loginStudent(credentials) {
  const { data } = await api.post('/api/v1/auth/login', credentials, { skipAuth: true })
  const result = data?.data || data?.result || data
  const accessToken = findAccessToken(result)

  if (!accessToken) {
    throw new Error('Backend đăng nhập thành công nhưng không trả về access token.')
  }

  localStorage.setItem('accessToken', accessToken)
  const refreshToken = result?.refreshToken || result?.refresh_token
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken)
  }
  if (result.user || result.student) {
    localStorage.setItem('currentUser', JSON.stringify(result.user || result.student))
  }

  return result
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

function isPublishedExam(exam) {
  if (typeof exam.isPublished === 'boolean') return exam.isPublished
  if (typeof exam.published === 'boolean') return exam.published
  if (exam.status) return ['PUBLISHED', 'PUBLISH'].includes(String(exam.status).toUpperCase())
  return true
}

export async function getGeneralExams() {
  const { data } = await api.get('/api/v1/exams', {
    params: { mode: 'GENERAL_EXAM' },
  })
  return extractExamList(data).filter(isPublishedExam)
}

export async function getMockExams() {
  const { data } = await api.get('/api/v1/exams', {
    params: { mode: 'MOCK' },
  })
  return extractExamList(data).filter(
    (exam) =>
      (!exam.mode || String(exam.mode).toUpperCase() === 'MOCK') && isPublishedExam(exam),
  )
}

export async function getExam(examId) {
  const { data } = await api.get(`/api/v1/exams/${examId}`)
  return data.data || data
}

export async function startExam(examId) {
  const { data } = await api.post(`/api/v1/submissions/start/${examId}`)
  return data.data || data
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

export async function getMockScores() {
  const { data } = await api.get('/api/v1/submissions/mock/scores')
  const result = unwrapApiData(data)
  const nestedResult = unwrapApiData(result)
  if (Array.isArray(nestedResult)) return nestedResult
  return nestedResult?.content || nestedResult?.items || []
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

export async function getVideoByTitle(title) {
  const { data } = await api.get(`/api/v1/videos/title/${encodeURIComponent(title)}`)
  const result = unwrapApiData(data)
  return Array.isArray(result) ? result[0] || null : result
}
