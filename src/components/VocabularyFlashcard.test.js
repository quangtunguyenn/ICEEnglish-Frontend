import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { normalizeVideoVocabularies } from '../utils/videoVocabulary.js'

let server
let VocabularyFlashcard

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ VocabularyFlashcard } = await server.ssrLoadModule('/src/components/VocabularyFlashcard.jsx'))
})

after(async () => {
  await server?.close()
})

test('preserves new fields and handles old or null optional values', () => {
  const items = normalizeVideoVocabularies([
    { id: '1', word: 'garden', meaning: 'khu vườn', phonetic: '/ˈɡɑːr.dən/', exampleSentence: 'In the garden.', exampleSentenceTranslate: 'Trong vườn.' },
    { id: '2', word: 'boil', meaning: 'sôi', phonetic: null, exampleSentence: null, exampleSentenceTranslate: null },
    { term: 'knock', definition: 'gõ cửa', example: 'Knock on the door.' },
  ])
  assert.deepEqual(items[0], { id: '1', word: 'garden', meaning: 'khu vườn', phonetic: '/ˈɡɑːr.dən/', exampleSentence: 'In the garden.', exampleSentenceTranslate: 'Trong vườn.' })
  assert.equal(items[1].phonetic, '')
  assert.equal(items[1].exampleSentence, '')
  assert.equal(items[1].exampleSentenceTranslate, '')
  assert.equal(items[2].exampleSentence, 'Knock on the door.')
})

test('each flashcard face shows the appropriate example and accessible label', () => {
  const vocabulary = normalizeVideoVocabularies([{ word: 'garden', meaning: 'khu vườn', phonetic: '/garden/', exampleSentence: 'In the garden.', exampleSentenceTranslate: 'Trong vườn.' }])[0]
  for (const isFlipped of [false, true]) {
    const html = renderToStaticMarkup(createElement(VocabularyFlashcard, { vocabulary, isFlipped, onFlip: () => {} }))
    const faces = [...html.matchAll(/<span aria-hidden="(true|false)"[^>]*>([\s\S]*?)<\/span><\/span>/g)]
    assert.equal(faces.length, 2)
    assert.match(faces[0][2], /garden/)
    assert.match(faces[1][2], /khu vườn/)
    assert.match(faces[0][2], /\/garden\//)
    assert.match(faces[1][2], /\/garden\//)
    assert.match(faces[0][2], /In the garden\./)
    assert.doesNotMatch(faces[0][2], /Trong vườn/)
    assert.match(faces[1][2], /Trong vườn/)
    assert.doesNotMatch(faces[1][2], /In the garden\./)
    const label = html.match(/aria-label="([^"]*)"/)[1]
    assert.match(label, isFlipped ? /Trong vườn/ : /In the garden\./)
    assert.doesNotMatch(label, isFlipped ? /In the garden\./ : /Trong vườn/)
    assert.equal(faces[0][1], String(isFlipped))
    assert.equal(faces[1][1], String(!isFlipped))
  }
})

test('missing translation does not show the English example on the Vietnamese face', () => {
  const vocabulary = normalizeVideoVocabularies([{ word: 'garden', meaning: 'khu vườn', exampleSentence: 'In the garden.', exampleSentenceTranslate: null }])[0]
  const html = renderToStaticMarkup(createElement(VocabularyFlashcard, { vocabulary, isFlipped: true, onFlip: () => {} }))
  const faces = [...html.matchAll(/<span aria-hidden="(true|false)"[^>]*>([\s\S]*?)<\/span><\/span>/g)]
  assert.equal(faces.length, 2)
  assert.match(faces[0][2], /In the garden\./)
  assert.doesNotMatch(faces[1][2], /In the garden\.|null|undefined/)
  assert.doesNotMatch(html.match(/aria-label="([^"]*)"/)[1], /In the garden\.|null|undefined/)
})

test('old flashcard does not render missing optional fields as null', () => {
  const vocabulary = normalizeVideoVocabularies([{ word: 'boil', meaning: 'sôi' }])[0]
  const html = renderToStaticMarkup(createElement(VocabularyFlashcard, { vocabulary, isFlipped: false, onFlip: () => {} }))
  assert.match(html, /boil/)
  assert.match(html, /sôi/)
  assert.doesNotMatch(html, />null</)
  assert.doesNotMatch(html, />undefined</)
})
