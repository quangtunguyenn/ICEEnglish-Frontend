import { useEffect, useState } from 'react'
import { isGuestUser } from '../services/api'

export function useGuestMode() {
  const [isGuest, setIsGuest] = useState(isGuestUser)

  useEffect(() => {
    function syncAuthState() {
      setIsGuest(isGuestUser())
    }

    window.addEventListener('iceenglish:auth-change', syncAuthState)
    window.addEventListener('storage', syncAuthState)
    return () => {
      window.removeEventListener('iceenglish:auth-change', syncAuthState)
      window.removeEventListener('storage', syncAuthState)
    }
  }, [])

  return isGuest
}
