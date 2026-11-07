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

const centeredTitlePattern = /^<p\s+align=["']center["']>\s*(?:<b>|<strong>)?([\s\S]*?)(?:<\/b>|<\/strong>)?\s*<\/p>$/i

// "# TITLE" (or legacy <p align="center"><b>TITLE</b></p>) becomes a centered, bold, uppercase heading.
function getTitleText(paragraph) {
  const trimmed = paragraph.trim()
  if (trimmed.startsWith('# ')) return trimmed.slice(2).trim()
  return trimmed.match(centeredTitlePattern)?.[1]?.trim() ?? null
}

export function textToHtml(value) {
  return String(value || '')
    .split(/\n{2,}/)
    .filter((paragraph) => paragraph.trim())
    .map((paragraph) => {
      const title = getTitleText(paragraph)
      if (title !== null) return `<h2>${formatInlineText(title)}</h2>`
      return `<p>${formatInlineText(paragraph).replace(/\n/g, '<br>')}</p>`
    })
    .join('')
}

// Adds the "Question N." prefix only when the content does not already start with one.
export function questionToHtml(orderIndex, content, label = 'Question') {
  const text = String(content ?? '')
  if (/^[\s*_]*(?:Question|Câu)\s*\d+/i.test(text)) return textToHtml(text)
  return textToHtml(`${label} ${orderIndex}. ${text}`)
}
