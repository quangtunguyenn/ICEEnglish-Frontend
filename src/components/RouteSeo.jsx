import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getRouteSeo, updatePageSeo } from '../utils/seo'

export function RouteSeo() {
  const { pathname } = useLocation()

  useEffect(() => {
    updatePageSeo(pathname, getRouteSeo(pathname))
  }, [pathname])

  return null
}
