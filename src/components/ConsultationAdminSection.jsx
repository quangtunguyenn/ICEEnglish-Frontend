import { useEffect, useState } from 'react'
import { getApiErrorMessage, getConsultationRequests, updateConsultationStatus } from '../services/api'

const button = 'rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50'
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm'

function requestError(error, fallback) {
  if (error.response?.status === 401) return 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.'
  if (error.response?.status === 403) return 'Bạn không có quyền truy cập yêu cầu tư vấn.'
  return getApiErrorMessage(error, fallback)
}

export function ConsultationAdminSection() {
  const [filters, setFilters] = useState({ status: '', date: '' })
  const [query, setQuery] = useState({ status: '', date: '' })
  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let active = true
    const params = Object.fromEntries(Object.entries(query).filter(([, value]) => value))
    getConsultationRequests(params)
      .then((result) => { if (active) setRows(result) })
      .catch((err) => { if (active) { setRows(null); setError(requestError(err, 'Không thể tải danh sách tư vấn.')) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query, refresh])

  function reload() {
    setRows(null)
    setError('')
    setLoading(true)
    setRefresh((value) => value + 1)
  }

  function applyFilters(event) {
    event.preventDefault()
    setRows(null)
    setError('')
    setNotice('')
    setLoading(true)
    setQuery({ ...filters })
  }

  async function changeStatus(row) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await updateConsultationStatus(row.id, row.status === 'DONE' ? 'NOT_DONE' : 'DONE')
      setNotice('Đã cập nhật trạng thái yêu cầu.')
      reload()
    } catch (err) {
      setError(requestError(err, 'Không thể cập nhật trạng thái. Vui lòng thử lại.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <header className="mb-6 border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-700"></p>
        <h1 className="mt-2 text-2xl font-black">Yêu cầu tư vấn</h1>
        <p className="mt-2 text-sm text-slate-600">Lọc theo trạng thái và ngày gửi theo giờ Việt Nam.</p>
      </header>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>}
      {notice && <p className="mb-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{notice}</p>}
      <form className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-5" onSubmit={applyFilters}>
        <label className="grid gap-2 text-sm font-bold">Trạng thái
          <select className={field} disabled={busy} onChange={(event) => setFilters({ ...filters, status: event.target.value })} value={filters.status}>
            <option value="">Tất cả</option>
            <option value="NOT_DONE">Chưa xử lý</option>
            <option value="DONE">Đã xử lý</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold">Ngày gửi
          <input className={field} disabled={busy} onChange={(event) => setFilters({ ...filters, date: event.target.value })} type="date" value={filters.date} />
        </label>
        <button className={button} disabled={busy} type="submit">Lọc</button>
      </form>
      {loading && <p className="mt-4 text-sm text-slate-500" role="status">Đang tải danh sách...</p>}
      {!loading && !rows && <button className="mt-4 font-bold text-cyan-700 underline" onClick={reload} type="button">Tải lại danh sách</button>}
      {!loading && rows && (
        <div className="mt-4 overflow-x-auto rounded-xl bg-white">
          {rows.length === 0 ? <p className="p-5 text-sm text-slate-500">Không có yêu cầu tư vấn phù hợp.</p> : (
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600"><tr>
                <th className="p-3">Học sinh</th><th className="p-3">Năm sinh</th><th className="p-3">Điểm mục tiêu</th><th className="p-3">Số điện thoại</th><th className="p-3">Ngày gửi (VN)</th><th className="p-3">Trạng thái</th><th className="p-3">Thao tác</th>
              </tr></thead>
              <tbody>{rows.map((row) => (
                <tr className="border-t border-slate-100" key={row.id}>
                  <td className="p-3">{row.studentFullname}</td><td className="p-3">{row.bod}</td><td className="p-3">{row.targetGrade}</td><td className="p-3">{row.phoneNumberRequest}</td><td className="p-3">{row.dateRequest?.replace('T', ' ')}</td>
                  <td className="p-3">{row.status === 'DONE' ? 'Đã xử lý' : row.status === 'NOT_DONE' ? 'Chưa xử lý' : row.status}</td>
                  <td className="p-3"><button className={button} disabled={busy || !['DONE', 'NOT_DONE'].includes(row.status)} onClick={() => changeStatus(row)} type="button">{row.status === 'DONE' ? 'Đánh dấu chưa xử lý' : 'Đánh dấu đã xử lý'}</button></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}
    </section>
  )
}
