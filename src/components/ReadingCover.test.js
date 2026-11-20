import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server
let ReadingCover

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ ReadingCover } = await server.ssrLoadModule('/src/components/ReadingCover.jsx'))
})

after(async () => {
  await server?.close()
})

test('displays the API cover URL as a decorative lazy-loaded image', () => {
  const html = renderToStaticMarkup(createElement(ReadingCover, {
    url: '  https://example.com/reading.jpg  ',
    className: 'h-44',
  }))
  assert.match(html, /src="https:\/\/example\.com\/reading\.jpg"/)
  assert.match(html, /alt=""/)
  assert.match(html, /loading="lazy"/)
  assert.match(html, /h-44/)
})

test('does not render a cover when the API provides no image', () => {
  for (const url of [null, '', '  ']) {
    assert.equal(renderToStaticMarkup(createElement(ReadingCover, { url })), '')
  }
})
