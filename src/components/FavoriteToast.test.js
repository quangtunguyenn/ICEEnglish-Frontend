import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server
let FavoriteToast

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;({ FavoriteToast } = await server.ssrLoadModule('/src/components/FavoriteToast.jsx'))
})

after(async () => {
  await server?.close()
})

test('describes the word and action for favorite vocabulary notifications', () => {
  for (const [variant, verb, preposition] of [
    ['added', 'Đã thêm', 'vào'],
    ['removed', 'Đã xóa', 'khỏi'],
  ]) {
    const html = renderToStaticMarkup(createElement(FavoriteToast, {
      notification: { id: 1, word: 'provide', variant },
    }))
    assert.match(html, new RegExp(`${verb} .*“provide”.* ${preposition} danh sách flashcard yêu thích`))
    assert.match(html, new RegExp(`data-variant="${variant}"`))
    assert.match(html, /class="favorite-toast__logo" src="\/ice_english_emblem_vector\.svg"/)
  }
})
