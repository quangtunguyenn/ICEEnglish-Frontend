import { useRef, useState } from 'react'

export function PassageViewer({ text, title, allowHighlight = true }) {
  const passageRef = useRef(null)
  const [contextMenu, setContextMenu] = useState(null)

  function highlightSelection() {
    const selection = window.getSelection()
    const passage = passageRef.current
    if (!selection || !passage || !selection.rangeCount || !selection.toString().trim()) {
      return
    }

    const range = selection.getRangeAt(0)
    if (!passage.contains(range.commonAncestorContainer)) return

    if (CSS.highlights) {
      const highlights = CSS.highlights.get('exam-highlight') || new Highlight()
      highlights.add(new Highlight(range.cloneRange()))
      CSS.highlights.set('exam-highlight', highlights)
    }

    selection.removeAllRanges()
    setContextMenu(null)
  }

  function clearHighlights() {
    if (CSS.highlights) CSS.highlights.delete('exam-highlight')
    setContextMenu(null)
  }

  function handleContextMenu(event) {
    if (!allowHighlight) return
    event.preventDefault()
    setContextMenu({ x: event.clientX, y: event.clientY })
  }

  return (
    <article className="relative h-full overflow-y-auto bg-white px-10 py-8" onClick={() => setContextMenu(null)} onContextMenu={handleContextMenu}>
      <div
        className="whitespace-pre-wrap text-[13px] leading-[1.65] text-slate-700"
        ref={passageRef}
      >
        {title && <h2 className="mb-5 text-base font-bold text-slate-900">{title}</h2>}
        {text || 'Part này không có đoạn văn. Hãy xem câu hỏi ở bên phải.'}
      </div>
      {contextMenu && allowHighlight && (
        <div
          className="fixed z-50 min-w-44 rounded border border-slate-200 bg-white p-1 text-xs shadow-lg"
          onClick={(event) => event.stopPropagation()}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button className="block w-full rounded px-3 py-2 text-left hover:bg-slate-100" onClick={highlightSelection} type="button">
            Highlight đoạn chọn
          </button>
          <button className="block w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50" onClick={clearHighlights} type="button">
            Xóa highlight
          </button>
        </div>
      )}
    </article>
  )
}
