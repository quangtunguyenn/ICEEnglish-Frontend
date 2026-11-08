function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeVideoVocabulary(item, index = 0) {
  const word = text(item?.word || item?.term || item?.vocabulary)
  return {
    id: String(item?.id || `${word}-${index}`),
    word,
    meaning: text(item?.meaning || item?.definition || item?.translation),
    phonetic: text(item?.phonetic),
    exampleSentence: text(item?.exampleSentence || item?.example),
    exampleSentenceTranslate: text(item?.exampleSentenceTranslate),
  }
}

export function normalizeVideoVocabularies(items) {
  if (!Array.isArray(items)) return []
  return items
    .map(normalizeVideoVocabulary)
    .filter((item) => item.word && item.meaning)
}
