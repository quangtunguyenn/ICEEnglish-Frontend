export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function formatInlineText(value) {
  let html = escapeHtml(value)
    .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, '<u>$1</u>')
    .replace(/\*\*\*([\s\S]*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')

  return html
}

export function textToHtml(value) {
  return String(value || '')
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${formatInlineText(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')
}
