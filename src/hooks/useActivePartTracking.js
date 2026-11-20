import { useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '../services/api'

export function useActivePartTracking(partId, sendActivePart) {
  const [error, setError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const [retry, setRetry] = useState(0)
  const queue = useRef(Promise.resolve())
  const mounted = useRef(false)
  const lastRetry = useRef(0)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (!partId) return
    const isRetry = retry !== lastRetry.current
    lastRetry.current = retry
    queue.current = queue.current.then(async () => {
      if (!mounted.current) return
      try {
        await sendActivePart(partId)
        if (mounted.current && isRetry) {
          setError('')
          setUnavailable(false)
        }
      } catch (requestError) {
        if (mounted.current) {
          setError(getApiErrorMessage(requestError, 'Không thể ghi nhận phần đang làm. Vui lòng thử lại.'))
          setUnavailable(requestError?.response?.status >= 500)
        }
      }
    })
  }, [partId, retry, sendActivePart])

  return {
    trackingError: error,
    trackingUnavailable: unavailable,
    retryTracking: () => setRetry((value) => value + 1),
  }
}
