import assert from 'node:assert/strict'
import test from 'node:test'
import { getSelectedVideo, getVideoTitle, sortVideoTitles } from './videoTitles.js'

test('sorts numbered lesson titles naturally without mutating the response', () => {
  const titles = [
    { videoId: 23, title: 'Chuyên đề 23' },
    { videoId: 10, videoTitle: 'Chuyên đề 10' },
    'Chuyên đề 2',
    { videoId: 1, video_title: 'Chuyên đề 1' },
  ]

  assert.deepEqual(sortVideoTitles(titles).map(getVideoTitle), [
    'Chuyên đề 1',
    'Chuyên đề 2',
    'Chuyên đề 10',
    'Chuyên đề 23',
  ])
  assert.equal(getVideoTitle(titles[0]), 'Chuyên đề 23')
})

test('orders all 23 lesson numbers from 1 to 23', () => {
  const titles = Array.from({ length: 23 }, (_, index) => `Chuyên đề ${23 - index}`)
  const expected = Array.from({ length: 23 }, (_, index) => `Chuyên đề ${index + 1}`)

  assert.deepEqual(sortVideoTitles(titles), expected)
})

test('orders lesson objects with descriptions and preserves access flags and original order', () => {
  const titles = Array.from({ length: 23 }, (_, index) => {
    const number = 23 - index
    return {
      videoId: `video-${number}`,
      title: `CHUYÊN ĐỀ ${number} - Nội dung bài học`,
      accessible: number === 7,
    }
  })

  const sorted = sortVideoTitles(titles)
  assert.deepEqual(sorted.map((video) => video.videoId),
    Array.from({ length: 23 }, (_, index) => `video-${index + 1}`))
  assert.equal(sorted[6].accessible, true)
  assert.equal(titles[0].videoId, 'video-23')
})

test('selects the requested ID without falling back to an unrelated video', () => {
  const titles = [{ videoId: 1, title: 'Chuyên đề 1' }, { videoId: 2, title: 'Chuyên đề 2' }]

  assert.equal(getSelectedVideo(titles, '2', ''), titles[1])
  assert.deepEqual(getSelectedVideo(titles, '3', 'Chuyên đề 1'), {
    videoId: '3',
    title: 'Chuyên đề 1',
  })
  assert.equal(getSelectedVideo(['Chuyên đề 2'], '2', 'Chuyên đề 2'), 'Chuyên đề 2')
  assert.equal(getSelectedVideo(titles, '', ''), titles[0])
})
