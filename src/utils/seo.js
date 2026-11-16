const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://iceenglish.vn').replace(/\/+$/, '')
const SITE_NAME = 'ICE English'
const DEFAULT_DESCRIPTION =
  'ICE English đồng hành cùng học sinh ôn thi tiếng Anh THPTQG qua bài giảng, luyện đề, từ vựng, đọc hiểu và phòng thi ảo.'
const SOCIAL_IMAGE = `${SITE_URL}/ice-learning-hero.png`

const publicPages = {
  '/': {
    title: 'Ôn thi tiếng Anh THPTQG 2027 | ICE English',
    description:
      'Ôn thi tiếng Anh THPTQG cùng ICE English: học bài giảng, luyện từ vựng và đọc hiểu, làm đề và trải nghiệm phòng thi ảo.',
  },
  '/ve-chung-toi': {
    title: 'Về ICE English | Đồng hành ôn thi tiếng Anh THPTQG',
    description:
      'Tìm hiểu ICE English và hành trình đồng hành cùng học sinh xây nền kiến thức, sự tự tin và tâm thế vững vàng trước kỳ thi THPTQG.',
  },
  '/khoa-hoc/ice-masterclass': {
    title: 'ICE Masterclass | Khóa học ôn thi tiếng Anh THPTQG',
    description:
      'Khám phá ICE Masterclass: lộ trình học, luyện đề, chữa đề và theo dõi tiến bộ cho kỳ thi tiếng Anh THPTQG.',
  },
  '/vinh-danh': {
    title: 'Vinh danh học sinh ICE English | Hành trình tiến bộ',
    description:
      'Cùng ICE English ghi nhận những nỗ lực, dấu mốc và bước tiến của học sinh trong hành trình học tập và ôn thi.',
  },
  '/thi-thu': {
    title: 'Thi thử tiếng Anh THPTQG online | ICE English',
    description:
      'Làm quen cấu trúc và thao tác phòng thi với các đề thi thử tiếng Anh THPTQG trên ICE English.',
  },
  '/video': {
    title: 'Bài giảng tiếng Anh online | ICE English',
    description:
      'Học tiếng Anh qua bài giảng video, củng cố kiến thức và ôn tập theo các chuyên đề trên ICE English.',
  },
  '/tu-vung': {
    title: 'Học từ vựng tiếng Anh với flashcard | ICE English',
    description:
      'Luyện từ vựng tiếng Anh theo chủ đề với flashcard, phát âm, nghĩa và ví dụ trong ngữ cảnh.',
  },
  '/doc-hieu': {
    title: 'Luyện đọc hiểu tiếng Anh | Thư viện ICE English',
    description:
      'Khám phá thư viện bài đọc tiếng Anh, luyện kỹ năng đọc hiểu và học từ vựng trong ngữ cảnh cùng ICE English.',
  },
}

const privateRoutePatterns = [
  /^\/dang-nhap(?:\/|$)/,
  /^\/quan-tri(?:\/|$)/,
  /^\/giao-vien(?:\/|$)/,
  /^\/luyen-de(?:\/|$)/,
  /^\/ket-qua(?:\/|$)/,
  /^\/thi-thu\/.+/,
  /^\/video\/.+\/homework$/,
  /^\/doc-hieu\/.+\/tu-vung$/,
]

export function getRouteSeo(pathname) {
  if (publicPages[pathname]) {
    return { ...publicPages[pathname], indexable: true, type: 'website' }
  }

  if (/^\/doc-hieu\/[^/]+$/.test(pathname)) {
    return {
      title: 'Bài đọc tiếng Anh | ICE English',
      description: 'Đọc bài, luyện câu hỏi và học từ vựng tiếng Anh cùng ICE English.',
      indexable: false,
      type: 'article',
    }
  }

  if (privateRoutePatterns.some((pattern) => pattern.test(pathname))) {
    return {
      title: 'ICE English',
      description: DEFAULT_DESCRIPTION,
      indexable: false,
      type: 'website',
    }
  }

  return {
    title: 'ICE English',
    description: DEFAULT_DESCRIPTION,
    indexable: false,
    type: 'website',
  }
}

function setMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setCanonical(url, indexable) {
  let element = document.head.querySelector('link[rel="canonical"]')
  if (!indexable) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }
  element.setAttribute('href', url)
}

function setStructuredData(url, title, description, indexable) {
  const id = 'ice-english-structured-data'
  let script = document.getElementById(id)
  if (!indexable) {
    script?.remove()
    return
  }
  if (!script) {
    script = document.createElement('script')
    script.id = id
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: 'vi-VN',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: title,
        description,
        inLanguage: 'vi-VN',
        isPartOf: { '@id': `${SITE_URL}/#website` },
      },
    ],
  })
}

export function updatePageSeo(pathname, metadata) {
  const title = metadata.title || 'ICE English'
  const description = metadata.description || DEFAULT_DESCRIPTION
  const indexable = Boolean(metadata.indexable)
  const url = new URL(pathname, `${SITE_URL}/`).toString()

  document.title = title
  setMeta('name', 'description', description)
  setMeta(
    'name',
    'robots',
    indexable ? 'index,follow,max-image-preview:large' : 'noindex,nofollow',
  )
  setMeta('property', 'og:type', metadata.type || 'website')
  setMeta('property', 'og:locale', 'vi_VN')
  setMeta('property', 'og:site_name', SITE_NAME)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:url', url)
  setMeta('property', 'og:image', SOCIAL_IMAGE)
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', description)
  setMeta('name', 'twitter:image', SOCIAL_IMAGE)
  setCanonical(url, indexable)
  setStructuredData(url, title, description, indexable)
}

export { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL }
