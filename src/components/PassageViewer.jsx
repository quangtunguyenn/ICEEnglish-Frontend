import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import { flip, offset, shift, useFloating } from '@floating-ui/react'
import { EditorContent, useEditor } from '@tiptap/react'
import { useCallback, useRef, useState } from 'react'
import { formatInlineText, textToHtml } from '../utils/textFormatting'

export function HighlightableContent({
  content,
  className = '',
  allowHighlight = true,
  savedContent,
  onContentChange,
}) {
  const [contextMenu, setContextMenu] = useState(false)
  const selectionRef = useRef(null)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Highlight.configure({ multicolor: true }),
      Underline,
    ],
    content: savedContent || content,
    editable: false,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      onContentChange?.(currentEditor.getJSON())
    },
  })
  const { refs, floatingStyles } = useFloating({
    open: contextMenu,
    placement: 'bottom-start',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  })
  const setFloatingRef = useCallback((node) => refs.setFloating(node), [refs])

  function closeContextMenu() {
    setContextMenu(false)
    selectionRef.current = null
  }

  function restoreSelection() {
    if (!editor || !selectionRef.current) return false
    editor.commands.setTextSelection(selectionRef.current)
    return true
  }

  function highlightSelection(color) {
    if (restoreSelection()) editor.chain().setHighlight({ color }).run()
    closeContextMenu()
  }

  function clearHighlight() {
    if (restoreSelection()) editor.chain().unsetHighlight().run()
    closeContextMenu()
  }

  function handleContextMenu(event) {
    if (!allowHighlight || !editor) return
    const selection = editor.state.selection
    if (selection.empty) return

    event.preventDefault()
    selectionRef.current = { from: selection.from, to: selection.to }
    refs.setPositionReference({
      getBoundingClientRect: () => ({
        top: event.clientY,
        bottom: event.clientY,
        left: event.clientX,
        right: event.clientX,
        width: 0,
        height: 0,
        x: event.clientX,
        y: event.clientY,
        toJSON: () => {},
      }),
    })
    setContextMenu(true)
  }

  return (
    <div
      className={className}
      onContextMenu={handleContextMenu}
      onClick={(event) => {
        if (!event.target.closest('[data-highlight-menu]')) closeContextMenu()
      }}
    >
      <EditorContent className="exam-passage-editor" editor={editor} />
      {contextMenu && allowHighlight && (
        <div
          className="fixed z-50 min-w-44 rounded border border-slate-200 bg-white p-1 text-xs shadow-lg"
          data-highlight-menu
          ref={setFloatingRef}
          style={floatingStyles}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b border-slate-100 px-3 py-2 font-semibold text-slate-600">
            Chọn màu highlight
          </div>
          <div className="flex gap-2 px-3 py-2">
            {[
              ['#86efac', 'xanh lá'],
              ['#f9a8d4', 'hồng'],
              ['#fde68a', 'vàng'],
            ].map(([color, label]) => (
              <button
                aria-label={`Highlight màu ${label}`}
                className="h-6 w-6 rounded-full border transition hover:scale-110 hover:ring-2 hover:ring-slate-400 hover:ring-offset-1"
                key={color}
                onClick={() => highlightSelection(color)}
                style={{ backgroundColor: color, borderColor: color }}
                title={label}
                type="button"
              />
            ))}
          </div>
          <button className="block w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50" onClick={clearHighlight} type="button">
            Xóa highlight
          </button>
        </div>
      )}
    </div>
  )
}

export function PassageViewer({ text, title, allowHighlight = true, savedContent, onContentChange }) {
  return (
    <article className="relative h-full overflow-y-auto bg-white px-10 py-8">
      {title && (
        <h2
          className="mb-5 text-base font-bold text-slate-900"
          dangerouslySetInnerHTML={{ __html: formatInlineText(title) }}
        />
      )}
      <HighlightableContent
        allowHighlight={allowHighlight}
        className="text-[13px] leading-[1.65] text-slate-700"
        content={textToHtml(text)}
        onContentChange={onContentChange}
        savedContent={savedContent}
      />
    </article>
  )
}
