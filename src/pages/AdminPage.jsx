import { useEffect, useId, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  archiveExam,
  createStudent,
  getAdminExams,
  getApiErrorMessage,
  getAuthProfile,
  getExamAnswersRevealed,
  getExamPreview,
  importExam,
  logout,
  publishExam,
  toggleExamAnswersRevealed,
  uploadLearningBundle,
} from '../services/api'
import { ReadingAdminSection } from '../components/ReadingAdminSection'
import { ConsultationAdminSection } from '../components/ConsultationAdminSection'
import { StudentAdminList } from '../components/StudentAdminList'
import { formatInlineText, questionToHtml, textToHtml } from '../utils/textFormatting'
import { getUserRoles } from '../utils/authRoles'

/* ────────────────────────────────────────────────────────────────────────────
 * Constants & helpers
 * ────────────────────────────────────────────────────────────────────────── */

const EXAM_MODES = ['GENERAL_EXAM', 'MOCK', 'HOMEWORK']
const FILE_ACCEPT = 'application/json,.json,text/plain,.txt'

const navigation = [
  { id: 'overview', label: 'Tổng quan', icon: 'dashboard', description: 'Lối tắt đến các công cụ quản trị.' },
  { id: 'bundle', label: 'Nội dung bài học', icon: 'layers', description: 'Tạo video, homework và từ vựng trong một lần tải lên.' },
  { id: 'exams', label: 'Quản lý đề thi', icon: 'fileText', description: 'Import, preview, publish hoặc archive đề thi.' },
  { id: 'students', label: 'Tài khoản học sinh', icon: 'users', adminOnly: true, description: 'Tạo tài khoản và quản lý trạng thái học sinh.' },
  { id: 'reading', label: 'Quản lý bài đọc', icon: 'book', adminOnly: true, description: 'Quản lý nội dung bài đọc.' },
  { id: 'consultations', label: 'Yêu cầu tư vấn', icon: 'message', description: 'Theo dõi các yêu cầu tư vấn.' },
]

const examWorkflow = [
  { title: 'Import', text: 'Tải file JSON lên, đề được lưu ở trạng thái DRAFT.' },
  { title: 'Preview', text: 'Rà soát nội dung, đáp án và lời giải.' },
  { title: 'Publish', text: 'Mở đề để học sinh truy cập.' },
]

const emptyStudent = {
  username: '', password: '', fullName: '', studentIrn: '', passwordMock: '', dob: '', gender: '',
}

const inputClass =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-[#102b5c] focus:ring-4 focus:ring-[#102b5c]/10'

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102b5c]'

function readStoredProfile() {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || 'null')
  } catch {
    return null
  }
}

function getExamId(exam) {
  return exam?.id || exam?.examId || exam?.exam_id || ''
}

function getExamTitle(exam) {
  return exam?.title || exam?.examTitle || 'Đề chưa có tiêu đề'
}

async function fetchAllExams() {
  const groups = await Promise.all(EXAM_MODES.map((mode) => getAdminExams(mode).catch(() => [])))
  const uniqueExams = new Map()
  groups.flat().forEach((exam) => {
    const id = getExamId(exam)
    if (id) uniqueExams.set(id, exam)
  })
  return [...uniqueExams.values()]
}

function getInitials(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return 'S'
  return words.slice(-2).map((word) => word[0]).join('').toUpperCase()
}

function formatBytes(bytes) {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/* ────────────────────────────────────────────────────────────────────────────
 * Primitives: icons, buttons, badges, fields
 * ────────────────────────────────────────────────────────────────────────── */

const iconPaths = {
  dashboard: <><rect height="9" rx="1.5" width="7" x="3" y="3" /><rect height="5" rx="1.5" width="7" x="14" y="3" /><rect height="9" rx="1.5" width="7" x="14" y="12" /><rect height="5" rx="1.5" width="7" x="3" y="16" /></>,
  layers: <><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" /><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" /><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" /></>,
  fileText: <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  book: <><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></>,
  message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  menu: <><path d="M4 12h16" /><path d="M4 6h16" /><path d="M4 18h16" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  checkCircle: <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>,
  alert: <><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></>,
  eye: <><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><path d="m2 2 20 20" /></>,
  copy: <><rect height="14" rx="2" width="14" x="8" y="8" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>,
  archive: <><rect height="5" rx="1" width="20" x="2" y="3" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></>,
  external: <><path d="M7 7h10v10" /><path d="M7 17 17 7" /></>,
  send: <><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" /><path d="m21.854 2.147-10.94 10.939" /></>,
}

function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
      {iconPaths[name]}
    </svg>
  )
}

function Spinner() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  )
}

const buttonStyles = {
  primary: 'bg-[#102b5c] text-white shadow-sm hover:bg-[#0b1f44]',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
  success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
  dangerSolid: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
}

function Button({ children, className = '', icon, loading = false, type = 'button', variant = 'primary', ...props }) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${focusRing} ${buttonStyles[variant]} ${className}`}
      type={type}
      {...props}
    >
      {loading ? <Spinner /> : icon && <Icon className="h-4 w-4" name={icon} />}
      {children}
    </button>
  )
}

function Badge({ children, className = '', tone = 'bg-slate-100 text-slate-700 ring-slate-500/15' }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone} ${className}`}>
      {children}
    </span>
  )
}

const statusTone = {
  PUBLISHED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  DRAFT: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  ARCHIVED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,43,92,0.04)] ${className}`}>
      {children}
    </div>
  )
}

function PageHeader({ badge, description, title }) {
  return (
    <header className="mb-7">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-manrope text-2xl font-extrabold tracking-tight text-[#102b5c] sm:text-[1.75rem]">{title}</h1>
        {badge && <Badge tone="bg-amber-50 text-amber-800 ring-amber-600/25">{badge}</Badge>}
      </div>
      {description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
    </header>
  )
}

function FormField({ autoComplete, hint, label, maxLength, name, onChange, required, type = 'text', value }) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <div>
      <label className="text-sm font-semibold text-slate-700" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true" className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="relative mt-1.5">
        <input
          autoComplete={autoComplete}
          className={`${inputClass} ${isPassword ? 'pr-11' : ''}`}
          id={id}
          maxLength={maxLength}
          name={name}
          onChange={onChange}
          required={required}
          type={isPassword && visible ? 'text' : type}
          value={value}
        />
        {isPassword && (
          <button
            aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className={`absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 ${focusRing}`}
            onClick={() => setVisible((current) => !current)}
            type="button"
          >
            <Icon className="h-4 w-4" name={visible ? 'eyeOff' : 'eye'} />
          </button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

function FileDropzone({ disabled, file, id, onChange }) {
  const [dragging, setDragging] = useState(false)

  function pick(files) {
    const picked = files?.[0]
    if (picked) onChange(picked)
  }

  return (
    <div>
      <label
        className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition focus-within:ring-4 focus-within:ring-[#102b5c]/15 ${
          dragging
            ? 'border-dashed border-[#102b5c] bg-[#102b5c]/[0.04]'
            : file
              ? 'border-emerald-300 bg-emerald-50/60'
              : 'border-dashed border-slate-300 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-50'
        } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        htmlFor={id}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          if (!disabled) pick(event.dataTransfer.files)
        }}
      >
        <input
          accept={FILE_ACCEPT}
          className="sr-only"
          disabled={disabled}
          id={id}
          onChange={(event) => {
            pick(event.target.files)
            event.target.value = ''
          }}
          type="file"
        />
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${file ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-[#102b5c] shadow-sm ring-1 ring-slate-200'}`}>
          <Icon name={file ? 'fileText' : 'upload'} />
        </span>
        <span className="min-w-0 flex-1">
          {file ? (
            <>
              <span className="block truncate text-sm font-semibold text-slate-900">{file.name}</span>
              <span className="block text-xs text-slate-500">{formatBytes(file.size)} · Nhấn để chọn tệp khác</span>
            </>
          ) : (
            <>
              <span className="block text-sm font-semibold text-slate-800">Kéo thả file JSON vào đây</span>
              <span className="block text-xs text-slate-500">hoặc nhấn để chọn từ máy (.json, .txt)</span>
            </>
          )}
        </span>
      </label>
      {file && !disabled && (
        <button
          className={`mt-2 inline-flex items-center gap-1.5 rounded-md text-xs font-semibold text-slate-500 hover:text-red-600 ${focusRing}`}
          onClick={() => onChange(null)}
          type="button"
        >
          <Icon className="h-3.5 w-3.5" name="x" /> Bỏ chọn tệp
        </button>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
 * Feedback: toasts & confirm dialog
 * ────────────────────────────────────────────────────────────────────────── */

function Toast({ children, onDismiss, tone }) {
  const isError = tone === 'error'
  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white p-3.5 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.35)] ${isError ? 'border-red-200' : 'border-emerald-200'}`}
      role={isError ? 'alert' : 'status'}
    >
      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${isError ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
        <Icon className="h-4 w-4" name={isError ? 'alert' : 'check'} />
      </span>
      <p className="min-w-0 flex-1 text-sm font-medium leading-6 text-slate-800">{children}</p>
      <button
        aria-label="Đóng thông báo"
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 ${focusRing}`}
        onClick={onDismiss}
        type="button"
      >
        <Icon className="h-4 w-4" name="x" />
      </button>
    </div>
  )
}

function Toasts({ error, notice, onDismissError, onDismissNotice }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-20 sm:items-end sm:px-0">
      {error && <Toast onDismiss={onDismissError} tone="error">{error}</Toast>}
      {notice && <Toast onDismiss={onDismissNotice} tone="success">{notice}</Toast>}
    </div>
  )
}

function ConfirmDialog({ busy, confirmLabel, description, examId, examTitle, onCancel, onConfirm, open, title, tone }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const isDanger = tone === 'danger'

  return (
    <dialog
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-[2px]"
      onCancel={(event) => { event.preventDefault(); onCancel() }}
      onClick={(event) => { if (event.target === ref.current) onCancel() }}
      ref={ref}
    >
      <div className="p-6">
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${isDanger ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
          <Icon name={isDanger ? 'archive' : 'send'} />
        </span>
        <h2 className="mt-4 text-lg font-extrabold text-slate-900">{title}</h2>
        <p className="mt-1.5 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 ring-1 ring-inset ring-slate-200">
          <p className="line-clamp-2 text-sm font-semibold text-slate-800">{examTitle}</p>
          <p className="mt-0.5 break-all font-mono text-[11px] text-slate-500">{examId}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/60 px-6 py-4">
        <Button onClick={onCancel} variant="secondary">Huỷ</Button>
        <Button disabled={busy} onClick={onConfirm} variant={isDanger ? 'dangerSolid' : 'success'}>{confirmLabel}</Button>
      </div>
    </dialog>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
 * Page shell
 * ────────────────────────────────────────────────────────────────────────── */

export function AdminPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(readStoredProfile)
  const [access, setAccess] = useState(() =>
    localStorage.getItem('accessToken') ? 'checking' : 'unauthorized',
  )
  const [section, setSection] = useState('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyKey, setBusyKey] = useState('')
  const [bundleFile, setBundleFile] = useState(null)
  const [examFile, setExamFile] = useState(null)
  const [examType, setExamType] = useState('GENERAL_EXAM')
  const [student, setStudent] = useState(emptyStudent)
  const [exams, setExams] = useState([])
  const [examsLoading, setExamsLoading] = useState(true)
  const [examId, setExamId] = useState('')
  const [preview, setPreview] = useState(null)
  const [answersRevealed, setAnswersRevealed] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const busy = busyKey !== ''

  useEffect(() => {
    let active = true
    const token = localStorage.getItem('accessToken')
    if (!token) return () => { active = false }

    getAuthProfile()
      .then((currentProfile) => {
        if (!active) return
        setProfile(currentProfile)
        const roles = getUserRoles(currentProfile)
        setAccess(roles.includes('ADMIN') || roles.includes('TEACHER') ? 'authorized' : 'unauthorized')
      })
      .catch(() => {
        if (active) setAccess('unauthorized')
      })

    return () => { active = false }
  }, [])

  useEffect(() => {
    if (access !== 'authorized') return
    let active = true
    fetchAllExams()
      .then((list) => { if (active) setExams(list) })
      .finally(() => { if (active) setExamsLoading(false) })
    return () => { active = false }
  }, [access])

  useEffect(() => {
    if (!examId || access !== 'authorized') return
    let active = true
    getExamAnswersRevealed(examId)
      .then((revealed) => {
        if (active) setAnswersRevealed({ examId, revealed })
      })
      .catch(() => {
        if (active) setAnswersRevealed({ examId, revealed: 'error' })
      })
    return () => { active = false }
  }, [access, examId])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 4500)
    return () => clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!menuOpen) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  // null = đang tải · true/false = đã có · 'error' = không xác định được
  const currentAnswerStatus = answersRevealed?.examId === examId ? answersRevealed.revealed : null
  const selectedExam = exams.find((exam) => getExamId(exam) === examId) || null

  async function runAction(key, action, successMessage) {
    setError('')
    setNotice('')
    setBusyKey(key)
    try {
      const result = await action()
      if (successMessage) setNotice(successMessage)
      return result
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Thao tác thất bại. Vui lòng thử lại.'))
      return null
    } finally {
      setBusyKey('')
    }
  }

  async function refreshExamList() {
    setExams(await fetchAllExams())
  }

  function changeSection(id) {
    setSection(id)
    setMenuOpen(false)
    setError('')
    setNotice('')
    window.scrollTo({ top: 0 })
  }

  async function handleBundleSubmit(event) {
    event.preventDefault()
    if (!bundleFile) {
      setError('Vui lòng chọn file JSON learning bundle.')
      return
    }
    const result = await runAction(
      'bundle',
      () => uploadLearningBundle(bundleFile),
      'Đã tạo nội dung bài học thành công.',
    )
    if (result) setBundleFile(null)
  }

  async function handleExamImport(event) {
    event.preventDefault()
    if (!examFile) {
      setError('Vui lòng chọn file JSON đề thi.')
      return
    }
    const result = await runAction(
      'import',
      () => importExam(examFile, examType),
      'Đã import đề ở trạng thái DRAFT.',
    )
    if (result) {
      const importedId = getExamId(result)
      setExamFile(null)
      setPreview(null)
      if (importedId) setExamId(importedId)
    }
  }

  async function handlePreview() {
    const result = await runAction('preview', () => getExamPreview(examId), 'Đã tải bản preview.')
    if (result) setPreview(result)
  }

  async function handlePublish() {
    const result = await runAction('publish', () => publishExam(examId), 'Đề đã được publish.')
    if (result !== null) refreshExamList()
  }

  async function handleArchive() {
    const result = await runAction('archive', () => archiveExam(examId), 'Đề đã được archive.')
    if (result !== null) refreshExamList()
  }

  async function runConfirmed() {
    const kind = confirmAction
    setConfirmAction(null)
    if (kind === 'publish') await handlePublish()
    if (kind === 'archive') await handleArchive()
  }

  async function handleToggleAnswers() {
    const result = await runAction('toggle', () => toggleExamAnswersRevealed(examId))
    if (result === null) return
    const status = result?.is_answers_revealed ?? result?.isAnswersRevealed
    if (typeof status === 'boolean') {
      setAnswersRevealed({ examId, revealed: status })
      setNotice(status ? 'Đã công bố đáp án.' : 'Đã ẩn đáp án.')
      return
    }
    try {
      const revealed = await getExamAnswersRevealed(examId)
      setAnswersRevealed({ examId, revealed })
      setNotice(revealed ? 'Đã công bố đáp án.' : 'Đã ẩn đáp án.')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể xác minh trạng thái đáp án.'))
    }
  }

  async function handleCopyId() {
    try {
      await navigator.clipboard.writeText(examId)
      setError('')
      setNotice('Đã sao chép Exam ID.')
    } catch {
      setError('Không thể sao chép. Hãy chọn Exam ID và sao chép thủ công.')
    }
  }

  async function handleCreateStudent(event) {
    event.preventDefault()
    const { studentIrn, passwordMock, dob, gender, ...requiredFields } = student
    const payload = {
      ...requiredFields,
      ...(studentIrn.trim() && { studentIrn: studentIrn.trim() }),
      ...(passwordMock && { passwordMock }),
      ...(dob && { dob: dob.split('-').reverse().join('/') }),
      ...(gender && { gender }),
    }
    const result = await runAction(
      'student',
      () => createStudent(payload),
      `Đã tạo tài khoản ${student.username}.`,
    )
    if (result) setStudent(emptyStudent)
    return Boolean(result)
  }

  function signOut() {
    try {
      logout()
      navigate('/dang-nhap', { replace: true })
    } catch {
      setError('Không thể đăng xuất. Vui lòng kiểm tra quyền lưu trữ của trình duyệt và thử lại.')
    }
  }

  if (access === 'checking') {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f6f9] px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm" role="status">
          <span className="text-[#102b5c]"><Spinner /></span>
          Đang xác minh quyền truy cập…
        </div>
      </main>
    )
  }
  if (access === 'unauthorized') {
    const destination = getUserRoles(profile).includes('TEACHER') ? '/giao-vien' : '/'
    return <Navigate replace to={localStorage.getItem('accessToken') ? destination : '/dang-nhap'} />
  }

  const isAdmin = getUserRoles(profile).includes('ADMIN')
  const visibleNavigation = navigation.filter((item) => !item.adminOnly || isAdmin)
  const activeSection = visibleNavigation.some((item) => item.id === section) ? section : 'overview'
  const activeItem = visibleNavigation.find((item) => item.id === activeSection)
  const displayName = profile?.fullName || profile?.username || 'Staff'

  const confirmCopy = confirmAction === 'archive'
    ? {
        title: 'Archive đề thi này?',
        description: 'Đề sẽ chuyển sang trạng thái ARCHIVED và học sinh không còn truy cập được.',
        confirmLabel: 'Archive đề',
        tone: 'danger',
      }
    : {
        title: 'Publish đề thi này?',
        description: 'Học sinh có thể truy cập đề ngay sau khi publish. Hãy chắc chắn bạn đã preview đề.',
        confirmLabel: 'Publish đề',
        tone: 'success',
      }

  return (
    <div className="min-h-screen bg-[#f5f6f9] font-manrope text-slate-900 antialiased">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg"
        href="#main-content"
      >
        Bỏ qua điều hướng
      </a>

      {menuOpen && (
        <button
          aria-label="Đóng menu"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col border-r border-slate-200 bg-white transition-[transform,visibility] duration-300 motion-reduce:transition-none lg:visible lg:translate-x-0 ${menuOpen ? 'visible translate-x-0 shadow-2xl' : 'invisible -translate-x-full'}`}
        id="admin-sidebar"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
          <Link aria-label="ICE English — trang quản trị" className={`rounded-lg ${focusRing}`} onClick={() => changeSection('overview')} to="/quan-tri">
            <img alt="" aria-hidden="true" className="h-10 w-auto object-contain" src="/logo.png" />
          </Link>
          <button
            aria-label="Đóng menu"
            className={`grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden ${focusRing}`}
            onClick={() => setMenuOpen(false)}
            type="button"
          >
            <Icon name="x" />
          </button>
        </div>

        <nav aria-label="Điều hướng quản trị" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleNavigation.map((item) => {
            const active = activeSection === item.id
            return (
              <button
                aria-current={active ? 'page' : undefined}
                className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${focusRing} ${active ? 'bg-[#102b5c]/[0.07] text-[#102b5c]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                key={item.id}
                onClick={() => changeSection(item.id)}
                type="button"
              >
                {active && <span aria-hidden="true" className="absolute -left-3 bottom-2 top-2 w-1 rounded-r-full bg-ice-gold" />}
                <Icon className={`h-[1.15rem] w-[1.15rem] ${active ? 'text-[#102b5c]' : 'text-slate-400'}`} name={item.icon} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="shrink-0 border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#102b5c] text-sm font-bold text-ice-gold">
              {getInitials(displayName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
              <p className="text-xs text-slate-500">{isAdmin ? 'Quản trị viên' : 'Giáo viên'}</p>
            </div>
            <button
              aria-label="Đăng xuất"
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 ${focusRing}`}
              onClick={signOut}
              title="Đăng xuất"
              type="button"
            >
              <Icon className="h-[1.15rem] w-[1.15rem]" name="logout" />
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="lg:pl-[17rem]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-[#f5f6f9]/85 px-4 backdrop-blur sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-controls="admin-sidebar"
              aria-expanded={menuOpen}
              aria-label="Mở menu"
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white text-slate-700 lg:hidden ${focusRing}`}
              onClick={() => setMenuOpen(true)}
              type="button"
            >
              <Icon name="menu" />
            </button>
            <nav aria-label="Vị trí hiện tại" className="flex min-w-0 items-center gap-1.5 text-sm">
              <span className="hidden text-slate-500 sm:inline">Quản trị</span>
              <Icon className="hidden h-3.5 w-3.5 text-slate-300 sm:block" name="chevron" />
              <span className="truncate font-semibold text-slate-800">{activeItem?.label}</span>
            </nav>
          </div>
          <Link
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-[#102b5c] ${focusRing}`}
            to="/"
          >
            Giao diện học sinh
            <Icon className="h-4 w-4" name="external" />
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-8 lg:py-10" id="main-content">
          {activeSection === 'overview' && (
            <OverviewSection
              displayName={displayName}
              examsCount={exams.length}
              examsLoading={examsLoading}
              items={visibleNavigation.filter((item) => item.id !== 'overview')}
              onNavigate={changeSection}
            />
          )}
          {activeSection === 'bundle' && (
            <BundleSection
              busy={busy}
              file={bundleFile}
              loading={busyKey === 'bundle'}
              onFileChange={setBundleFile}
              onSubmit={handleBundleSubmit}
            />
          )}
          {activeSection === 'exams' && (
            <ExamsSection
              answersRevealed={currentAnswerStatus}
              busy={busy}
              busyKey={busyKey}
              examFile={examFile}
              examId={examId}
              examType={examType}
              exams={exams}
              examsLoading={examsLoading}
              onArchive={() => setConfirmAction('archive')}
              onClosePreview={() => setPreview(null)}
              onCopyId={handleCopyId}
              onExamFileChange={setExamFile}
              onExamIdChange={(value) => { setExamId(value); setPreview(null) }}
              onExamTypeChange={setExamType}
              onImport={handleExamImport}
              onPreview={handlePreview}
              onPublish={() => setConfirmAction('publish')}
              onSelectExam={(exam) => { setExamId(getExamId(exam)); setPreview(null) }}
              onToggleAnswers={handleToggleAnswers}
              preview={preview}
              selectedExam={selectedExam}
            />
          )}
          {activeSection === 'reading' && isAdmin && <ReadingAdminSection />}
          {activeSection === 'consultations' && <ConsultationAdminSection />}
          {activeSection === 'students' && isAdmin && (
            <StudentsSection
              loading={busyKey === 'student'}
              busy={busy}
              onChange={setStudent}
              onSubmit={handleCreateStudent}
              student={student}
            />
          )}
        </main>
      </div>

      <Toasts
        error={error}
        notice={notice}
        onDismissError={() => setError('')}
        onDismissNotice={() => setNotice('')}
      />

      <ConfirmDialog
        busy={busy}
        confirmLabel={confirmCopy.confirmLabel}
        description={confirmCopy.description}
        examId={examId}
        examTitle={selectedExam ? getExamTitle(selectedExam) : 'Đề chưa có trong danh sách'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={runConfirmed}
        open={confirmAction !== null}
        title={confirmCopy.title}
        tone={confirmCopy.tone}
      />
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
 * Overview
 * ────────────────────────────────────────────────────────────────────────── */

function OverviewSection({ displayName, examsCount, examsLoading, items, onNavigate }) {
  return (
    <>
      <PageHeader
        description="Quản lý nội dung học tập, đề thi và trạng thái công bố từ một nơi."
        title={`Xin chào, ${displayName}`}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <Card className="overflow-hidden">
          <h2 className="border-b border-slate-100 px-5 py-4 text-sm font-bold text-slate-900">Công cụ quản trị</h2>
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  className={`group flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50 focus-visible:-outline-offset-2 ${focusRing}`}
                  onClick={() => onNavigate(item.id)}
                  type="button"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#102b5c]/[0.06] text-[#102b5c] transition group-hover:bg-[#102b5c] group-hover:text-white">
                    <Icon name={item.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold text-slate-900">{item.label}</span>
                    <span className="mt-0.5 block text-sm leading-5 text-slate-500">{item.description}</span>
                  </span>
                  {item.id === 'exams' && !examsLoading && (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{examsCount} đề</span>
                  )}
                  <Icon className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500 motion-reduce:transition-none" name="chevron" />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <section className="relative isolate overflow-hidden rounded-2xl bg-[#0b1f44] p-6 text-white shadow-[0_20px_50px_-30px_rgba(7,21,46,0.8)]">
          <img alt="" aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-8 -z-10 w-56 opacity-[0.07] brightness-0 invert" src="/ice_english_emblem_vector.svg" />
          <h2 className="font-manrope text-lg font-extrabold">Quy trình đề thi</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">Từ bản nháp đến lớp học trong ba bước.</p>
          <ol className="mt-5">
            {examWorkflow.map((step, index) => (
              <li
                className={`relative pb-6 pl-11 last:pb-0 ${index < examWorkflow.length - 1 ? 'before:absolute before:left-[0.9rem] before:top-9 before:h-[calc(100%-2rem)] before:w-px before:bg-white/15' : ''}`}
                key={step.title}
              >
                <span className="absolute left-0 top-0 grid h-[1.9rem] w-[1.9rem] place-items-center rounded-full bg-ice-gold text-xs font-extrabold text-[#0b1f44]">{index + 1}</span>
                <p className="pt-0.5 text-sm font-bold">{step.title}</p>
                <p className="mt-0.5 text-sm leading-5 text-slate-300">{step.text}</p>
              </li>
            ))}
          </ol>
          <button
            className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-ice-gold px-4 text-sm font-extrabold text-[#0b1f44] transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={() => onNavigate('exams')}
            type="button"
          >
            Mở quản lý đề
            <Icon className="h-4 w-4" name="chevron" />
          </button>
        </section>
      </div>
    </>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
 * Learning bundle
 * ────────────────────────────────────────────────────────────────────────── */

function BundleSection({ busy, file, loading, onFileChange, onSubmit }) {
  return (
    <>
      <PageHeader
        description="Tạo video, homework và từ vựng trong một lần tải lên."
        title="Tải learning bundle"
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="p-6">
          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700" id="bundle-file-label">File JSON</p>
              <FileDropzone disabled={busy} file={file} id="learning-bundle-file" onChange={onFileChange} />
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-5">
              <Button disabled={busy || !file} icon="upload" loading={loading} type="submit">
                {loading ? 'Đang tải lên…' : 'Tạo nội dung bài học'}
              </Button>
            </div>
          </form>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-900">Một lần tải lên tạo ra</h2>
          <ul className="mt-3 space-y-2.5">
            {['Video bài học', 'Homework', 'Từ vựng'].map((text) => (
              <li className="flex items-center gap-2.5 text-sm text-slate-600" key={text}>
                <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Icon className="h-3 w-3" name="check" /></span>
                {text}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
 * Students
 * ────────────────────────────────────────────────────────────────────────── */

function StudentsSection({ busy, loading, onChange, onSubmit, student }) {
  const [created, setCreated] = useState(0)
  const genderId = useId()

  function updateField(event) {
    const { name, value } = event.target
    onChange((current) => ({ ...current, [name]: value }))
  }

  async function submitStudent(event) {
    if (await onSubmit(event)) setCreated((value) => value + 1)
  }

  return (
    <>
      <PageHeader
        badge="Chỉ dành cho ADMIN"
        description="Xem, tìm kiếm và quản lý trạng thái tài khoản học sinh."
        title="Tài khoản học sinh"
      />
      <StudentAdminList created={created} />

      <Card className="mt-8">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-extrabold text-slate-900">Tạo tài khoản học sinh</h2>
          <p className="mt-0.5 text-sm text-slate-500">Các trường có dấu * là bắt buộc.</p>
        </div>
        <form onSubmit={submitStudent}>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <FormField autoComplete="username" label="Tên đăng nhập" name="username" onChange={updateField} required value={student.username} />
            <FormField autoComplete="name" label="Họ và tên" name="fullName" onChange={updateField} required value={student.fullName} />
            <div className="sm:col-span-2">
              <FormField autoComplete="new-password" label="Mật khẩu tạm thời" name="password" onChange={updateField} required type="password" value={student.password} />
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/50 p-6">
            <h3 className="text-sm font-bold text-slate-800">Thông tin thi thử <span className="font-medium text-slate-500">(không bắt buộc)</span></h3>
            <p className="mt-0.5 text-sm text-slate-500">Mật khẩu luyện tập độc lập với mật khẩu đăng nhập tài khoản.</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <FormField label="Mã IRN học sinh" maxLength={50} name="studentIrn" onChange={updateField} value={student.studentIrn} />
              <FormField autoComplete="off" label="Mật khẩu luyện tập" maxLength={100} name="passwordMock" onChange={updateField} value={student.passwordMock} />
              <FormField label="Ngày sinh" name="dob" onChange={updateField} type="date" value={student.dob} />
              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor={genderId}>Giới tính</label>
                <select className={`${inputClass} mt-1.5`} id={genderId} name="gender" onChange={updateField} value={student.gender}>
                  <option value="">Chưa chọn</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
            <Button disabled={busy} onClick={() => onChange(emptyStudent)} variant="ghost">Xoá nhập</Button>
            <Button disabled={busy} loading={loading} type="submit">{loading ? 'Đang tạo…' : 'Tạo tài khoản'}</Button>
          </div>
        </form>
      </Card>
    </>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
 * Exams
 * ────────────────────────────────────────────────────────────────────────── */

function ExamsSection({
  answersRevealed,
  busy,
  busyKey,
  examFile,
  examId,
  examType,
  exams,
  examsLoading,
  onArchive,
  onClosePreview,
  onCopyId,
  onExamFileChange,
  onExamIdChange,
  onExamTypeChange,
  onImport,
  onPreview,
  onPublish,
  onSelectExam,
  onToggleAnswers,
  preview,
  selectedExam,
}) {
  const [query, setQuery] = useState('')
  const previewRef = useRef(null)
  const normalizedQuery = query.trim().toLowerCase()
  const filteredExams = normalizedQuery
    ? exams.filter((exam) => `${getExamTitle(exam)} ${getExamId(exam)}`.toLowerCase().includes(normalizedQuery))
    : exams
  const answersKnown = typeof answersRevealed === 'boolean'

  useEffect(() => {
    if (!preview) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    previewRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }, [preview])

  return (
    <>
      <PageHeader
        description="Import, preview, publish hoặc archive đề. Trạng thái đáp án có thể được bật/tắt riêng."
        title="Quản lý đề thi"
      />

      {/* Import */}
      <Card className="p-5 sm:p-6">
        <form className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] lg:items-end" onSubmit={onImport}>
          <div>
            <p className="text-sm font-semibold text-slate-700" id="exam-type-label">Loại đề</p>
            <div aria-labelledby="exam-type-label" className="mt-1.5 inline-flex rounded-xl bg-slate-100 p-1" role="radiogroup">
              {['GENERAL_EXAM', 'MOCK'].map((type) => (
                <button
                  aria-checked={examType === type}
                  className={`h-9 rounded-lg px-3.5 text-xs font-bold transition ${focusRing} ${examType === type ? 'bg-white text-[#102b5c] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  key={type}
                  onClick={() => onExamTypeChange(type)}
                  role="radio"
                  type="button"
                >
                  {type}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">Đề được import ở trạng thái DRAFT.</p>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-slate-700">File JSON đề thi</p>
            <FileDropzone disabled={busy} file={examFile} id="exam-import-file" onChange={onExamFileChange} />
          </div>
          <Button disabled={busy || !examFile} icon="upload" loading={busyKey === 'import'} type="submit">
            {busyKey === 'import' ? 'Đang import…' : 'Import đề'}
          </Button>
        </form>
      </Card>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[21rem_minmax(0,1fr)]">
        {/* Exam list */}
        <Card className="overflow-hidden xl:sticky xl:top-24">
          <div className="border-b border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Đề đã publish</h2>
              {!examsLoading && <Badge>{exams.length}</Badge>}
            </div>
            <div className="relative mt-3">
              <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" name="search" />
              <input
                aria-label="Tìm đề theo tên hoặc ID"
                className={`${inputClass} h-10 pl-9`}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên hoặc ID"
                type="search"
                value={query}
              />
            </div>
          </div>
          <div className="max-h-[32rem] overflow-y-auto p-2">
            {examsLoading && (
              <div aria-busy="true" className="space-y-1 p-1" role="status">
                <span className="sr-only">Đang tải danh sách…</span>
                {[0, 1, 2, 3].map((item) => (
                  <div className="animate-pulse rounded-xl px-3 py-3 motion-reduce:animate-none" key={item}>
                    <div className="h-3.5 w-4/5 rounded bg-slate-200" />
                    <div className="mt-2 h-2.5 w-3/5 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            )}
            {!examsLoading && !exams.length && (
              <p className="px-3 py-8 text-center text-sm text-slate-500">Chưa có đề publish trong danh sách.</p>
            )}
            {!examsLoading && exams.length > 0 && !filteredExams.length && (
              <p className="px-3 py-8 text-center text-sm text-slate-500">Không tìm thấy đề phù hợp.</p>
            )}
            <ul className="space-y-0.5">
              {filteredExams.map((exam) => {
                const id = getExamId(exam)
                const selected = examId === id
                return (
                  <li key={id}>
                    <button
                      aria-pressed={selected}
                      className={`relative w-full rounded-xl px-3 py-2.5 text-left transition ${focusRing} ${selected ? 'bg-[#102b5c]/[0.07]' : 'hover:bg-slate-50'}`}
                      onClick={() => onSelectExam(exam)}
                      type="button"
                    >
                      {selected && <span aria-hidden="true" className="absolute bottom-2.5 left-0 top-2.5 w-1 rounded-r-full bg-ice-gold" />}
                      <span className={`line-clamp-2 block text-sm font-semibold ${selected ? 'text-[#102b5c]' : 'text-slate-800'}`}>{getExamTitle(exam)}</span>
                      <span className="mt-0.5 block truncate font-mono text-[11px] text-slate-400">{id}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </Card>

        {/* Workspace */}
        <div className="min-w-0 space-y-6">
          <Card className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="line-clamp-2 text-lg font-extrabold text-[#102b5c]">
                  {examId ? (selectedExam ? getExamTitle(selectedExam) : 'Đề chưa có trong danh sách') : 'Chọn một đề để bắt đầu'}
                </h2>
                {!examId && (
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Chọn đề ở danh sách bên cạnh, hoặc dán Exam ID của đề vừa import để preview và publish.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="exam-id-input">Exam ID</label>
              <div className="relative mt-1.5">
                <input
                  className={`${inputClass} pr-11 font-mono text-[13px]`}
                  id="exam-id-input"
                  onChange={(event) => onExamIdChange(event.target.value)}
                  placeholder="Dán Exam ID tại đây"
                  spellCheck={false}
                  value={examId}
                />
                <button
                  aria-label="Sao chép Exam ID"
                  className={`absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 ${focusRing}`}
                  disabled={!examId}
                  onClick={onCopyId}
                  title="Sao chép Exam ID"
                  type="button"
                >
                  <Icon className="h-4 w-4" name="copy" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button disabled={busy || !examId} icon="eye" loading={busyKey === 'preview'} onClick={onPreview} variant="secondary">Preview</Button>
              <Button disabled={busy || !examId} icon="send" loading={busyKey === 'publish'} onClick={onPublish} variant="success">Publish</Button>
              <span className="hidden flex-1 sm:block" />
              <Button disabled={busy || !examId} icon="archive" loading={busyKey === 'archive'} onClick={onArchive} variant="danger">Archive</Button>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3.5 ring-1 ring-inset ring-slate-200">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800" id="answers-switch-label">Công bố đáp án</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500" role="status">
                  {!examId && 'Chọn một đề để bật hoặc tắt.'}
                  {examId && answersRevealed === null && 'Đang kiểm tra trạng thái đáp án…'}
                  {examId && answersRevealed === 'error' && 'Không xác định được trạng thái đáp án.'}
                  {examId && answersKnown && (answersRevealed ? 'Học sinh đang xem được đáp án.' : 'Đáp án đang được ẩn với học sinh.')}
                </p>
              </div>
              <button
                aria-checked={answersKnown ? answersRevealed : false}
                aria-labelledby="answers-switch-label"
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${focusRing} ${answersRevealed === true ? 'bg-emerald-600' : 'bg-slate-300'}`}
                disabled={busy || !examId || !answersKnown}
                onClick={onToggleAnswers}
                role="switch"
                type="button"
              >
                <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${answersRevealed === true ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </Card>

          {preview && (
            <div ref={previewRef} className="scroll-mt-24">
              <ExamPreview onClose={onClosePreview} preview={preview} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ────────────────────────────────────────────────────────────────────────────
 * Exam preview
 * ────────────────────────────────────────────────────────────────────────── */

const previewOptions = ['A', 'B', 'C', 'D']

function Rich({ className = '', html }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

function ExamPreview({ onClose, preview }) {
  const exam = preview.exam || preview
  const parts = [...(preview.parts || exam.parts || [])].sort(
    (first, second) => (first.orderIndex ?? 0) - (second.orderIndex ?? 0),
  )
  const questionTotal = parts.reduce((sum, part) => sum + (part.questions || []).length, 0)
  const duration = exam.durationMinutes ?? exam.duration_minutes

  return (
    <Card className="overflow-hidden">
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-slate-900">{getExamTitle(exam)}</h2>
          <p className="mt-1 text-sm text-slate-500">Bản preview cho staff: đầy đủ đề theo thứ tự gốc, kèm đáp án và lời giải.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge>{parts.length} part</Badge>
            <Badge>{questionTotal} câu</Badge>
            {duration > 0 && <Badge>{duration} phút</Badge>}
            {exam.examType && <Badge>{exam.examType}</Badge>}
            {exam.status && <Badge tone={statusTone[exam.status] || undefined}>{exam.status}</Badge>}
            <Badge>{exam.shuffleParts ? 'Trộn part: bật' : 'Trộn part: tắt'}</Badge>
          </div>
        </div>
        <Button className="shrink-0" icon="x" onClick={onClose} variant="ghost">Đóng</Button>
      </header>

      <div className="space-y-4 bg-slate-50/60 p-4 sm:p-6">
        {parts.map((part, partIndex) => {
          const questions = part.questions || []
          return (
            <details className="group overflow-hidden rounded-xl border border-slate-200 bg-white" key={part.id || part.partId || partIndex} open>
              <summary className={`flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1.5 bg-white px-4 py-3.5 hover:bg-slate-50 focus-visible:-outline-offset-2 [&::-webkit-details-marker]:hidden ${focusRing}`}>
                <Icon className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90 motion-reduce:transition-none" name="chevron" />
                <h3 className="font-bold text-slate-900">{part.partName || part.part_name || `Part ${partIndex + 1}`}</h3>
                {part.partType && <Badge tone="bg-cyan-50 text-cyan-800 ring-cyan-600/20">{part.partType}</Badge>}
                {part.fixedPosition && <Badge tone="bg-amber-50 text-amber-800 ring-amber-600/25">Cố định vị trí</Badge>}
                {part.shuffleGroup && <Badge tone="bg-violet-50 text-violet-800 ring-violet-600/20">Nhóm: {part.shuffleGroup}</Badge>}
                <span className="ml-auto text-xs font-semibold text-slate-500">{questions.length} câu</span>
              </summary>

              {part.passageText && (
                <div className={`max-h-96 overflow-y-auto border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5 ${part.translate ? 'grid gap-5 lg:grid-cols-2' : ''}`}>
                  <Rich
                    className="text-[13.5px] leading-7 text-slate-700 [&_h2]:mb-3 [&_h2]:text-center [&_h2]:font-bold [&_h2]:uppercase [&_p]:mb-3"
                    html={textToHtml(part.passageText)}
                  />
                  {part.translate && (
                    <Rich
                      className="text-[13.5px] leading-7 text-slate-500 lg:border-l lg:border-slate-200 lg:pl-5 [&_p]:mb-3"
                      html={textToHtml(part.translate)}
                    />
                  )}
                </div>
              )}

              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {questions.map((question, questionIndex) => {
                  const correct = question.correctOpt || question.correctOption || question.correct_option
                  const number = question.orderIndex || question.order_index || questionIndex + 1
                  const videoId = question.relatedVideoId || question.related_video_id
                  return (
                    <article className="p-4 sm:p-5" key={question.id || question.questionId || questionIndex}>
                      <Rich className="text-sm font-semibold leading-6 text-slate-900 [&_p]:mb-2" html={questionToHtml(number, question.content)} />
                      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {previewOptions.map((key) => {
                          const text = question[`opt${key}`]
                          if (text == null || text === '') return null
                          const isCorrect = correct === key
                          return (
                            <li
                              className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-[13px] leading-5 ${isCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-200 text-slate-700'}`}
                              key={key}
                            >
                              <span className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{key}</span>
                              <span className={`min-w-0 flex-1 ${isCorrect ? 'font-semibold' : ''}`} dangerouslySetInnerHTML={{ __html: formatInlineText(text) }} />
                              {isCorrect && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" name="checkCircle" />}
                            </li>
                          )
                        })}
                      </ul>
                      {!correct && (
                        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600">
                          <Icon className="h-4 w-4" name="alert" /> Chưa có đáp án đúng.
                        </p>
                      )}
                      {question.explanation && (
                        <div className="mt-3 rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
                          <p className="text-xs font-bold text-slate-500">Lời giải</p>
                          <Rich
                            className="mt-1 text-[13px] leading-6 text-slate-600"
                            html={formatInlineText(question.explanation).replace(/\n/g, '<br>')}
                          />
                        </div>
                      )}
                      {videoId && <p className="mt-3 break-all font-mono text-[11px] text-slate-500">Video ôn tập: {videoId}</p>}
                    </article>
                  )
                })}
              </div>
            </details>
          )
        })}
      </div>
    </Card>
  )
}