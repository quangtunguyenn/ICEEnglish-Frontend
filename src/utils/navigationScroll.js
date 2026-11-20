export function scrollCurrentPageLinkToTop(event) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) return

  const link = event.target.closest('a[href]')
  if (
    !link ||
    link.target === '_blank' ||
    link.hasAttribute('download') ||
    link.origin !== window.location.origin ||
    link.pathname !== window.location.pathname ||
    link.hash
  ) return

  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
}

export function scrollExamQuestionIntoView(question) {
  const container = question?.parentElement
  if (!container) return
  const top = question.getBoundingClientRect().top - container.getBoundingClientRect().top +
    container.scrollTop - container.clientTop
  container.scrollTo({ top, behavior: 'smooth' })
}
