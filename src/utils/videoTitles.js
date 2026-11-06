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

export function sortVideoTitles(titles) {
  return [...titles].sort((first, second) =>
    titleCollator.compare(getVideoTitle(first), getVideoTitle(second)),
  )
}
