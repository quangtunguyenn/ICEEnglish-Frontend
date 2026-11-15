import assert from 'node:assert/strict'
import { test } from 'node:test'
import { exitFullscreenIfNeeded } from './fullscreen.js'

test('exits fullscreen when an element is fullscreen', async () => {
  const originalDocument = globalThis.document
  let exited = false
  globalThis.document = {
    fullscreenElement: {},
    exitFullscreen: async () => { exited = true },
  }

  try {
    await exitFullscreenIfNeeded()
    assert.equal(exited, true)
  } finally {
    if (originalDocument === undefined) delete globalThis.document
    else globalThis.document = originalDocument
  }
})

test('does nothing when the document is not fullscreen', async () => {
  const originalDocument = globalThis.document
  let exitCalled = false
  globalThis.document = {
    fullscreenElement: null,
    exitFullscreen: async () => { exitCalled = true },
  }

  try {
    await exitFullscreenIfNeeded()
    assert.equal(exitCalled, false)
  } finally {
    if (originalDocument === undefined) delete globalThis.document
    else globalThis.document = originalDocument
  }
})

