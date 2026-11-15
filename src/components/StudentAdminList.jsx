import { useEffect, useRef, useState } from 'react'
import { getAdminStudents, getApiErrorMessage, setStudentActive } from '../services/api'

const button = 'rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50'
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal'

function studentError(error, fallback) {
  switch (error.response?.status) {
    case 400: return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra và thử lại.'
    case 401: return 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.'
    case 403: return 'Bạn không có quyền quản lý học sinh.'
    case 404: return 'Không tìm thấy tài khoản học sinh. Vui lòng tải lại danh sách.'
    default: return getApiErrorMessage(error, fallback)
  }
}

export function StudentAdminList({ created }) {
  const [filters, setFilters] = useState({ keyword: '', isActive: '' })
  const [query, setQuery] = useState({ keyword: '', isActive: '' })
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const resultKey = JSON.stringify([query, created, revision])
  const current = result?.key === resultKey ? result : null

  useEffect(() => {
    let active = true
    const params = {}
    if (query.keyword) params.keyword = query.keyword
    if (query.isActive !== '') params.isActive = query.isActive === 'true'
    getAdminStudents(params)
      .then((items) => { if (active) setResult({ key: resultKey, items, error: '' }) })
      .catch((error) => {
        if (active) setResult({ key: resultKey, items: null, error: studentError(error, 'Không thể tải danh sách học sinh.') })
      })
    return () => { active = false }
  }, [query, resultKey])

  function applyFilters(event) {
    event.preventDefault()
    setActionError('')
    setNotice('')
    setQuery({ keyword: filters.keyword.trim(), isActive: filters.isActive })
    setRevision((value) => value + 1)
  }

  async function changeStatus(student) {
    if (busyRef.current) return
    const isActive = !student.isActive
    const action = isActive ? 'kích hoạt lại' : 'vô hiệu hóa'
    if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản ${student.username}?`)) return
    busyRef.current = true
    setBusy(true)
    setActionError('')
    setNotice('')
    try {
      await setStudentActive(student.id, isActive)
      setNotice(`Đã ${action} tài khoản ${student.username}.`)
      setRevision((value) => value + 1)
    } catch (error) {
      setActionError(studentError(error, 'Không thể cập nhật trạng thái. Vui lòng thử lại.'))
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  return (
    <section aria-label="Danh sách học sinh">
      <form className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-5" onSubmit={applyFilters}>
        <label className="grid gap-2 text-sm font-bold">Tìm theo họ tên
          <input className={field} disabled={busy} onChange={(event) => setFilters({ ...filters, keyword: event.target.value })} placeholder="Nhập họ tên học sinh" type="search" value={filters.keyword} />
        </label>
        <label className="grid gap-2 text-sm font-bold">Trạng thái
          <select className={field} disabled={busy} onChange={(event) => setFilters({ ...filters, isActive: event.target.value })} value={filters.isActive}>
            <option value="">Tất cả</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã vô hiệu hóa</option>
          </select>
        </label>
        <button className={button} disabled={busy} type="submit">Tìm và lọc</button>
      </form>
      {(actionError || current?.error) && <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">{actionError || current.error}</p>}
      {notice && <p className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{notice}</p>}
      {!current && <p className="mt-4 text-sm text-slate-500" role="status">Đang tải danh sách học sinh...</p>}
      {current?.error && <button className="mt-4 font-bold text-cyan-700 underline" onClick={() => setRevision((value) => value + 1)} type="button">Tải lại danh sách</button>}
      {current?.items && (
        <div className="mt-4 overflow-x-auto rounded-xl bg-white">
          {current.items.length === 0 ? <p className="p-5 text-sm text-slate-500">Không có học sinh phù hợp.</p> : (
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr>
                <th className="p-3">Học sinh</th><th className="p-3">Tên đăng nhập</th><th className="p-3">Ngày sinh</th><th className="p-3">Giới tính</th><th className="p-3">Thông tin thi thử</th><th className="p-3">Ngày tạo (VN)</th><th className="p-3">Trạng thái</th><th className="p-3">Thao tác</th>
              </tr></thead>
              <tbody>{current.items.map((student) => (
                <tr className="border-t border-slate-100" key={student.id}>
                  <td className="p-3">{student.fullName ?? '—'}</td>
                  <td className="p-3">{student.username}</td>
                  <td className="p-3">{student.dob ?? '—'}</td>
                  <td className="p-3">{({ MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' })[student.gender] ?? '—'}</td>
                  <td className="p-3"><details><summary className="cursor-pointer font-semibold text-cyan-700">Xem thông tin</summary><p className="mt-2">IRN: {student.studentIrn ?? '—'}</p><p className="mt-1">Mật khẩu luyện tập: {student.passwordMock ?? '—'}</p></details></td>
                  <td className="p-3">{student.createdAt?.replace('T', ' ') ?? '—'}</td>
                  <td className="p-3">{student.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}</td>
                  <td className="p-3"><button aria-label={`${student.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'} ${student.username}`} className={button} disabled={busy} onClick={() => changeStatus(student)} type="button">{student.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}</button></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}
    </section>
  )
}
