import { useEffect, useState } from 'react'
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
  publishExam,
  toggleExamAnswersRevealed,
  uploadLearningBundle,
} from '../services/api'

const navigation = [
  { id: 'overview', label: 'Tổng quan', icon: '01' },
  { id: 'bundle', label: 'Nội dung bài học', icon: '02' },
  { id: 'exams', label: 'Quản lý đề thi', icon: '03' },
  { id: 'students', label: 'Tài khoản học sinh', icon: '04', adminOnly: true },
]

function readStoredProfile() {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || 'null')
  } catch {
    return null
  }
}

function getRoles(profile) {
  return [profile?.role, ...(Array.isArray(profile?.authorities) ? profile.authorities : [])]
    .map((role) => String(role || '').toUpperCase().replace(/^ROLE_/, ''))
    .filter(Boolean)
}

function isStaff(profile) {
  const roles = getRoles(profile)
  return roles.includes('ADMIN') || roles.includes('TEACHER')
}

function getExamId(exam) {
  return exam?.id || exam?.examId || exam?.exam_id || ''
}

function getExamTitle(exam) {
  return exam?.title || exam?.examTitle || 'Đề chưa có tiêu đề'
}

export function AdminPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(readStoredProfile)
  const [access, setAccess] = useState(() =>
    localStorage.getItem('accessToken') ? 'checking' : 'unauthorized',
  )
  const [section, setSection] = useState('overview')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [bundleFile, setBundleFile] = useState(null)
  const [examFile, setExamFile] = useState(null)
  const [examType, setExamType] = useState('GENERAL_EXAM')
  const [student, setStudent] = useState({ username: '', password: '', fullName: '' })
  const [exams, setExams] = useState([])
  const [examsLoading, setExamsLoading] = useState(false)
  const [examId, setExamId] = useState('')
  const [preview, setPreview] = useState(null)
  const [answersRevealed, setAnswersRevealed] = useState(null)

  useEffect(() => {
    let active = true
    const token = localStorage.getItem('accessToken')
    if (!token) return () => { active = false }

    getAuthProfile()
      .then((currentProfile) => {
        if (!active) return
        setProfile(currentProfile)
        setAccess(isStaff(currentProfile) ? 'authorized' : 'unauthorized')
      })
      .catch(() => {
        if (active) setAccess('unauthorized')
      })

    return () => { active = false }
  }, [])

  useEffect(() => {
    if (access !== 'authorized') return
    let active = true
    Promise.all(['GENERAL_EXAM', 'MOCK', 'HOMEWORK'].map((mode) =>
      getAdminExams(mode).catch(() => []),
    ))
      .then((groups) => {
        if (!active) return
        const uniqueExams = new Map()
        groups.flat().forEach((exam) => {
          const id = getExamId(exam)
          if (id) uniqueExams.set(id, exam)
        })
        setExams([...uniqueExams.values()])
      })
      .finally(() => {
        if (active) setExamsLoading(false)
      })
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
        if (active) setAnswersRevealed({ examId, revealed: null })
      })
    return () => { active = false }
  }, [access, examId])
  const currentAnswerStatus = answersRevealed?.examId === examId
    ? answersRevealed.revealed
    : null

  async function runAction(action, successMessage) {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const result = await action()
      if (successMessage) setNotice(successMessage)
      return result
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Thao tác thất bại. Vui lòng thử lại.'))
      return null
    } finally {
      setBusy(false)
    }
  }

  async function handleBundleSubmit(event) {
    event.preventDefault()
    if (!bundleFile) {
      setError('Vui lòng chọn file JSON learning bundle.')
      return
    }
    const result = await runAction(
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
    const result = await runAction(() => getExamPreview(examId), 'Đã tải bản preview.')
    if (result) setPreview(result)
  }

  async function handlePublish() {
    const result = await runAction(() => publishExam(examId), 'Đề đã được publish.')
    if (result !== null) refreshExamList()
  }

  async function handleArchive() {
    const result = await runAction(() => archiveExam(examId), 'Đề đã được archive.')
    if (result !== null) refreshExamList()
  }

  async function handleToggleAnswers() {
    const result = await runAction(() => toggleExamAnswersRevealed(examId))
    if (result === null) return
    const status = result?.is_answers_revealed ?? result?.isAnswersRevealed
    if (typeof status === 'boolean') {
      setAnswersRevealed(status)
      setNotice(status ? 'Đã công bố đáp án.' : 'Đã ẩn đáp án.')
      return
    }
    try {
      const revealed = await getExamAnswersRevealed(examId)
      setAnswersRevealed(revealed)
      setNotice(revealed ? 'Đã công bố đáp án.' : 'Đã ẩn đáp án.')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể xác minh trạng thái đáp án.'))
    }
  }

  async function handleCreateStudent(event) {
    event.preventDefault()
    const result = await runAction(
      () => createStudent(student),
      `Đã tạo tài khoản ${student.username}.`,
    )
    if (result) setStudent({ username: '', password: '', fullName: '' })
  }

  async function refreshExamList() {
    const groups = await Promise.all(['GENERAL_EXAM', 'MOCK', 'HOMEWORK'].map((mode) =>
      getAdminExams(mode).catch(() => []),
    ))
    const uniqueExams = new Map()
    groups.flat().forEach((exam) => {
      const id = getExamId(exam)
      if (id) uniqueExams.set(id, exam)
    })
    setExams([...uniqueExams.values()])
  }

  function signOut() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('currentUser')
    navigate('/dang-nhap', { replace: true })
  }

  if (access === 'checking') {
    return <main className="p-16 text-center text-slate-500">Đang xác minh quyền truy cập...</main>
  }
  if (access === 'unauthorized') {
    return <Navigate replace to={localStorage.getItem('accessToken') ? '/' : '/dang-nhap'} />
  }

  const isAdmin = getRoles(profile).includes('ADMIN')
  const visibleNavigation = navigation.filter((item) => !item.adminOnly || isAdmin)
  const activeSection = visibleNavigation.some((item) => item.id === section) ? section : 'overview'

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
        <Link className="text-lg font-black text-slate-950" to="/quan-tri">
          ICE<span className="text-cyan-600">English</span><span className="ml-3 text-xs font-bold uppercase tracking-widest text-slate-400">Staff</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm font-semibold text-slate-600 sm:inline">
            {profile?.fullName || profile?.username || 'Staff'} · {isAdmin ? 'ADMIN' : 'TEACHER'}
          </span>
          <button className="text-sm font-bold text-slate-600 hover:text-red-700" onClick={signOut} type="button">
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-360 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8">
        <aside>
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Quản trị nội dung</p>
          <nav aria-label="Điều hướng quản trị" className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
            {visibleNavigation.map((item) => (
              <button
                aria-current={activeSection === item.id ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-bold transition lg:w-full ${activeSection === item.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white hover:text-slate-950'}`}
                key={item.id}
                onClick={() => setSection(item.id)}
                type="button"
              >
                <span className="font-mono text-xs opacity-60">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <Link className="mt-6 hidden px-3 text-xs font-semibold text-slate-500 hover:text-cyan-700 lg:inline-block" to="/">
            ← Về giao diện học sinh
          </Link>
        </aside>

        <main className="min-w-0">
          {error && <p aria-live="polite" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
          {notice && <p aria-live="polite" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{notice}</p>}
          {activeSection === 'overview' && (
            <OverviewSection
              examsCount={exams.length}
              isAdmin={isAdmin}
              onNavigate={setSection}
              profile={profile}
            />
          )}
          {activeSection === 'bundle' && (
            <BundleSection
              busy={busy}
              file={bundleFile}
              onFileChange={setBundleFile}
              onSubmit={handleBundleSubmit}
            />
          )}
          {activeSection === 'exams' && (
            <ExamsSection
              answersRevealed={currentAnswerStatus}
              busy={busy}
              examFile={examFile}
              examId={examId}
              examType={examType}
              exams={exams}
              examsLoading={examsLoading}
              onArchive={handleArchive}
              onExamFileChange={setExamFile}
              onExamIdChange={(value) => { setExamId(value); setPreview(null) }}
              onExamTypeChange={setExamType}
              onImport={handleExamImport}
              onPreview={handlePreview}
              onPublish={handlePublish}
              onSelectExam={(exam) => { setExamId(getExamId(exam)); setPreview(null) }}
              onToggleAnswers={handleToggleAnswers}
              preview={preview}
            />
          )}
          {activeSection === 'students' && isAdmin && (
            <StudentsSection
              busy={busy}
              onChange={setStudent}
              onSubmit={handleCreateStudent}
              student={student}
            />
          )}
        </main>
      </div>
    </div>
  )
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <header className="mb-6 border-b border-slate-200 pb-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">{eyebrow}</p>
      <h1 className="mt-2 text-2xl font-black text-slate-950">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}
    </header>
  )
}

function OverviewSection({ examsCount, isAdmin, onNavigate, profile }) {
  return (
    <>
      <SectionHeading
        description="Quản lý nội dung học tập, đề thi và trạng thái công bố từ một nơi."
        eyebrow="Bảng điều khiển"
        title={`Xin chào, ${profile?.fullName || profile?.username || 'Staff'}`}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <OverviewAction count="JSON" label="Tạo video, homework và từ vựng" onClick={() => onNavigate('bundle')} title="Learning bundle" />
        <OverviewAction count={examsCount} label="Đề đã publish được tải" onClick={() => onNavigate('exams')} title="Đề thi" />
        {isAdmin && <OverviewAction count="ADMIN" label="Tạo tài khoản học sinh" onClick={() => onNavigate('students')} title="Tài khoản" />}
      </div>
      <section className="mt-6 border-t border-slate-200 pt-5">
        <h2 className="font-extrabold text-slate-900">Quy trình đề thi</h2>
        <p className="mt-2 text-sm text-slate-600">Import đề ở trạng thái DRAFT, preview để rà soát, sau đó publish để học sinh truy cập.</p>
        <button className="mt-4 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-800" onClick={() => onNavigate('exams')} type="button">
          Mở quản lý đề
        </button>
      </section>
    </>
  )
}

function OverviewAction({ count, label, onClick, title }) {
  return (
    <button className="min-h-36 border-b border-slate-200 bg-white p-5 text-left transition hover:border-cyan-500" onClick={onClick} type="button">
      <span className="text-xs font-bold uppercase tracking-widest text-cyan-700">{count}</span>
      <span className="mt-4 block text-lg font-extrabold text-slate-900">{title}</span>
      <span className="mt-1 block text-sm text-slate-500">{label}</span>
    </button>
  )
}

function BundleSection({ busy, file, onFileChange, onSubmit }) {
  return (
    <>
      <SectionHeading
        description="Tạo video, homework và từ vựng trong một lần tải lên."
        eyebrow="Nội dung bài học"
        title="Tải learning bundle"
      />
      <form className="max-w-3xl space-y-5" onSubmit={onSubmit}>
        <label className="block text-sm font-bold text-slate-700" htmlFor="learning-bundle-file">File JSON</label>
        <input
          accept="application/json,.json,text/plain,.txt"
          className="block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-cyan-50 file:px-3 file:py-2 file:font-bold file:text-cyan-800"
          id="learning-bundle-file"
          onChange={(event) => onFileChange(event.target.files?.[0] || null)}
          required
          type="file"
        />
        {file && <p className="text-sm text-slate-500">Đã chọn: {file.name}</p>}
        <button className="rounded-lg bg-cyan-700 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-800 disabled:opacity-50" disabled={busy || !file} type="submit">
          {busy ? 'Đang tải lên...' : 'Tạo nội dung bài học'}
        </button>
      </form>
    </>
  )
}

function StudentsSection({ busy, onChange, onSubmit, student }) {
  function updateField(event) {
    const { name, value } = event.target
    onChange((current) => ({ ...current, [name]: value }))
  }

  return (
    <>
      <SectionHeading
        description="Tạo tài khoản đăng nhập cho học sinh."
        eyebrow="Chỉ dành cho ADMIN"
        title="Tạo tài khoản học sinh"
      />
      <form className="max-w-xl space-y-4" onSubmit={onSubmit}>
        <FormField autoComplete="username" label="Tên đăng nhập" name="username" onChange={updateField} required value={student.username} />
        <FormField autoComplete="name" label="Họ và tên" name="fullName" onChange={updateField} required value={student.fullName} />
        <FormField autoComplete="new-password" label="Mật khẩu tạm thời" name="password" onChange={updateField} required type="password" value={student.password} />
        <button className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50" disabled={busy} type="submit">
          {busy ? 'Đang tạo...' : 'Tạo tài khoản'}
        </button>
      </form>
    </>
  )
}

function FormField({ autoComplete, label, name, onChange, required, type = 'text', value }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <input
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
        name={name}
        onChange={onChange}
        required={required}
        type={type}
        value={value}
      />
    </label>
  )
}

function ExamsSection({
  answersRevealed,
  busy,
  examFile,
  examId,
  examType,
  exams,
  examsLoading,
  onArchive,
  onExamFileChange,
  onExamIdChange,
  onExamTypeChange,
  onImport,
  onPreview,
  onPublish,
  onSelectExam,
  onToggleAnswers,
  preview,
}) {
  return (
    <>
      <SectionHeading
        description="Import, preview, publish hoặc archive đề. Trạng thái đáp án có thể được bật/tắt riêng."
        eyebrow="Đề thi"
        title="Quản lý đề thi"
      />
      <form className="grid gap-3 border-b border-slate-200 pb-6 sm:grid-cols-[10rem_minmax(0,1fr)_auto]" onSubmit={onImport}>
        <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" onChange={(event) => onExamTypeChange(event.target.value)} value={examType}>
          <option value="GENERAL_EXAM">GENERAL_EXAM</option>
          <option value="MOCK">MOCK</option>
        </select>
        <input accept="application/json,.json,text/plain,.txt" className="min-w-0 rounded-lg border border-slate-300 bg-white p-2 text-sm" onChange={(event) => onExamFileChange(event.target.files?.[0] || null)} required type="file" />
        <button className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-800 disabled:opacity-50" disabled={busy || !examFile} type="submit">
          {busy ? 'Đang import...' : 'Import đề'}
        </button>
      </form>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(16rem,0.72fr)_minmax(0,1.5fr)]">
        <section>
          <h2 className="font-extrabold text-slate-900">Đề đã publish</h2>
          {examsLoading && <p className="mt-3 text-sm text-slate-500">Đang tải danh sách...</p>}
          {!examsLoading && !exams.length && <p className="mt-3 text-sm text-slate-500">Chưa có đề publish trong danh sách.</p>}
          <div className="mt-3 max-h-136 space-y-1 overflow-y-auto">
            {exams.map((exam) => {
              const id = getExamId(exam)
              return (
                <button
                  className={`w-full rounded-lg border-l-4 px-3 py-3 text-left ${examId === id ? 'border-cyan-600 bg-white' : 'border-transparent hover:bg-white'}`}
                  key={id}
                  onClick={() => onSelectExam(exam)}
                  type="button"
                >
                  <span className="block text-sm font-bold text-slate-800">{getExamTitle(exam)}</span>
                  <span className="mt-1 block break-all font-mono text-[11px] text-slate-500">{id}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="min-w-0">
          <label className="block text-sm font-bold text-slate-700">
            Exam ID
            <input className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm" onChange={(event) => onExamIdChange(event.target.value)} value={examId} />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 disabled:opacity-40" disabled={busy || !examId} onClick={onPreview} type="button">Preview</button>
            <button className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-40" disabled={busy || !examId} onClick={onPublish} type="button">Publish</button>
            <button className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-bold text-red-700 disabled:opacity-40" disabled={busy || !examId} onClick={onArchive} type="button">Archive</button>
            <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 disabled:opacity-40" disabled={busy || !examId || answersRevealed === null} onClick={onToggleAnswers} type="button">
              {answersRevealed ? 'Ẩn đáp án' : 'Công bố đáp án'}
            </button>
          </div>
          {examId && answersRevealed === null && <p className="mt-2 text-xs text-slate-500">Đang kiểm tra trạng thái đáp án...</p>}
          {typeof answersRevealed === 'boolean' && <p className="mt-2 text-xs font-semibold text-slate-600">Trạng thái đáp án: {answersRevealed ? 'Đã công bố' : 'Chưa công bố'}</p>}
          {preview && <ExamPreview preview={preview} />}
        </section>
      </div>
    </>
  )
}

function ExamPreview({ preview }) {
  const exam = preview.exam || preview
  const parts = preview.parts || exam.parts || []

  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <h2 className="text-lg font-extrabold text-slate-900">{getExamTitle(exam)}</h2>
      <p className="mt-1 text-xs text-slate-500">Preview dành cho staff, bao gồm đáp án và lời giải.</p>
      <div className="mt-4 space-y-5">
        {parts.map((part, partIndex) => (
          <section className="border-t border-slate-200 pt-4" key={part.id || part.partId || partIndex}>
            <h3 className="font-bold text-slate-800">{part.partName || part.part_name || `Part ${partIndex + 1}`}</h3>
            <div className="mt-3 space-y-3">
              {(part.questions || []).map((question, questionIndex) => (
                <article className="rounded-lg bg-white p-4" key={question.id || question.questionId || questionIndex}>
                  <p className="text-sm font-semibold text-slate-800">{question.orderIndex || question.order_index || questionIndex + 1}. {question.content}</p>
                  <p className="mt-2 text-sm font-bold text-emerald-700">Đáp án: {question.correctOpt || question.correctOption || question.correct_option || '—'}</p>
                  {question.explanation && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{question.explanation}</p>}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}