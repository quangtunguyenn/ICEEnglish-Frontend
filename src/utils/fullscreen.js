export async function exitFullscreenIfNeeded() {
  if (typeof document === 'undefined' || !document.fullscreenElement) return
  await document.exitFullscreen()
}
