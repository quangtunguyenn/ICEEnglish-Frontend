export function getVideoTitle(video) {
  return typeof video === 'string'
    ? video
    : video?.title || video?.videoTitle || video?.video_title || ''
}

export function getVideoId(video) {
  return video?.videoId || video?.video_id || video?.id
}

export function getSelectedVideo(titles, selectedVideoId, selectedTitle) {
  const matchingId = selectedVideoId && titles.find(
    (item) => String(getVideoId(item)) === String(selectedVideoId),
  )
  if (matchingId) return matchingId

  const matchingTitle = selectedTitle && titles.find((item) => {
    const itemId = getVideoId(item)
    return getVideoTitle(item) === selectedTitle &&
      (!selectedVideoId || !itemId || String(itemId) === String(selectedVideoId))
  })
  if (matchingTitle) return matchingTitle
  if (selectedVideoId) return { videoId: selectedVideoId, title: selectedTitle }
  return titles[0] || null
}

const titleCollator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' })

function positionParts(video) {
  const position = typeof video === 'string' ? '' : video?.position
  if (position === null || position === undefined || position === '') return null
  const parts = String(position).split('.').map(Number)
  return parts.every(Number.isInteger) ? parts : null
}

// So sánh từng phần nguyên của position (1.9 < 1.10); video chưa có position xếp cuối, theo tên.
export function sortVideoTitles(titles) {
  return [...titles].sort((first, second) => {
    const a = positionParts(first)
    const b = positionParts(second)
    if (a && b) {
      for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
        const diff = (a[i] ?? -1) - (b[i] ?? -1)
        if (diff) return diff
      }
    } else if (a || b) {
      return a ? -1 : 1
    }
    return titleCollator.compare(getVideoTitle(first), getVideoTitle(second))
  })
}
