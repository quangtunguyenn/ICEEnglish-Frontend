import { useState } from 'react'

export function ReadingCover({ url, className = '' }) {
  const [failedUrl, setFailedUrl] = useState('')
  const src = typeof url === 'string' ? url.trim() : ''
  if (!src) return null

  return (
    <span className={`flex items-center justify-center overflow-hidden bg-slate-100 ${className}`}>
      {failedUrl === src ? (
        <span className="px-4 text-center text-sm text-slate-500">Không thể tải ảnh bìa</span>
      ) : (
        <img alt="" className="h-full w-full object-cover" decoding="async" loading="lazy" onError={() => setFailedUrl(src)} src={src} />
      )}
    </span>
  )
}
