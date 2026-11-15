import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { scrollCurrentPageLinkToTop } from './navigationScroll.js'

const originalWindow = globalThis.window

after(() => {
  if (originalWindow === undefined) delete globalThis.window
  else globalThis.window = originalWindow
})

test('selecting the current navigation page returns to the top', () => {
  let position
  globalThis.window = {
    location: { origin: 'https://example.test', pathname: '/video' },
    scrollTo: (options) => { position = options },
  }
  const link = {
    origin: 'https://example.test',
    pathname: '/video',
    hash: '',
    hasAttribute: () => false,
  }
  scrollCurrentPageLinkToTop({ button: 0, target: { closest: () => link } })
  assert.deepEqual(position, { top: 0, left: 0, behavior: 'instant' })
})

test('section links, external links and modified clicks do not reset the page', () => {
  let calls = 0
  globalThis.window = {
    location: { origin: 'https://example.test', pathname: '/' },
    scrollTo: () => { calls += 1 },
  }
  const link = {
    origin: 'https://example.test',
    pathname: '/',
    hash: '#lo-trinh',
    hasAttribute: () => false,
  }
  const event = { button: 0, target: { closest: () => link } }
  scrollCurrentPageLinkToTop(event)
  link.hash = ''
  link.origin = 'https://external.test'
  scrollCurrentPageLinkToTop(event)
  link.origin = 'https://example.test'
  scrollCurrentPageLinkToTop({ ...event, ctrlKey: true })
  assert.equal(calls, 0)
})
