import { useCallback, useEffect, useRef, useState } from 'react'

export function useExamTimer(activePartId) {
  const [partTimes, setPartTimes] = useState({})
  const timesRef = useRef({})
  const activePartRef = useRef(activePartId)
  const lastStartedAtRef = useRef(null)

  const flushActivePart = useCallback(() => {
    const partId = activePartRef.current
    const startedAt = lastStartedAtRef.current

    if (!partId || startedAt === null) return

    const elapsedSeconds = Math.floor((performance.now() - startedAt) / 1000)
    if (elapsedSeconds <= 0) return

    timesRef.current[partId] = (timesRef.current[partId] || 0) + elapsedSeconds
    lastStartedAtRef.current = startedAt + elapsedSeconds * 1000
    setPartTimes({ ...timesRef.current })
  }, [])

  useEffect(() => {
    flushActivePart()
    activePartRef.current = activePartId
    lastStartedAtRef.current = activePartId && !document.hidden ? performance.now() : null
  }, [activePartId, flushActivePart])

  useEffect(() => {
    const updateTime = () => {
      if (!document.hidden) flushActivePart()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        flushActivePart()
        lastStartedAtRef.current = null
      } else if (activePartRef.current) {
        lastStartedAtRef.current = performance.now()
      }
    }

    const timerId = window.setInterval(updateTime, 250)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(timerId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      flushActivePart()
    }
  }, [flushActivePart])

  return {
    partTimes,
    getPartTimes: () => {
      flushActivePart()
      return { ...timesRef.current }
    },
  }
}
