// Maps a question's original number (orderIndex) to the number shown for this attempt.
export function buildNumberMap(questions) {
  const map = new Map()
  questions.forEach((question) => {
    const original = Number(question.orderIndex)
    const display = Number(question.displayNumber)
    if (Number.isFinite(original) && Number.isFinite(display) && original !== display) {
      map.set(original, display)
    }
  })
  return map
}

// Rewrites numbers written in exam content so they follow the displayed question numbers:
// {{q:13}} placeholders, a leading "Question 13"/"Câu 13", blanks like "(13)" and "Questions 13-17".
// Only numbers belonging to the given part's questions are touched.
export function renumberText(text, map) {
  if (typeof text !== 'string' || !text || !map.size) return text
  const mapped = (value) => map.get(Number(value)) ?? value

  return text
    .replace(/\{\{q:(\d+)\}\}/g, (_, number) => mapped(number))
    .replace(/^([\s*_]*(?:Question|Câu)\s+)(\d+)/i, (_, prefix, number) => `${prefix}${mapped(number)}`)
    .replace(/(Questions?\s+)(\d+)(\s*[-–]\s*)(\d+)/gi, (_, prefix, from, dash, to) => `${prefix}${mapped(from)}${dash}${mapped(to)}`)
    .replace(/\((\d+)\)/g, (match, number) => (map.has(Number(number)) ? `(${mapped(number)})` : match))
}

export function renumberPart(part, questions) {
  const map = buildNumberMap(questions)
  return {
    map,
    partName: renumberText(part.partName, map),
    passageText: renumberText(part.passageText, map),
  }
}

// Fills displayNumber (running 1..N in the order returned) when the backend did not provide it,
// then rewrites part and question text to match.
export function applyDisplayNumbers(parts) {
  let counter = 0
  return (parts || []).map((part) => {
    const questions = (part.questions || []).map((question) => {
      counter += 1
      return { ...question, displayNumber: question.displayNumber ?? counter }
    })
    const { map, partName, passageText } = renumberPart(part, questions)
    return {
      ...part,
      partName,
      passageText,
      questions: questions.map((question) => ({
        ...question,
        content: renumberText(question.content, map),
        explanation: renumberText(question.explanation, map),
      })),
    }
  })
}
