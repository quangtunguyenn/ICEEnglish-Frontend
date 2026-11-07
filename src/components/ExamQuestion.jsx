import { HighlightableContent } from './PassageViewer'
import { formatInlineText, questionToHtml } from '../utils/textFormatting'

const options = ['A', 'B', 'C', 'D']

export function ExamQuestion({
  question,
  answer,
  marked,
  onAnswer,
  onToggleMark,
  questionRef,
  highlightedContent,
  onContentChange,
  allowHighlight = true,
  disabled = false,
}) {
  return (
    <article className="border-b border-slate-200 px-5 py-5 last:border-0" ref={questionRef}>
      <div className="flex items-start justify-between gap-3">
        <HighlightableContent
          allowHighlight={allowHighlight}
          className="min-w-0 text-[13px] font-semibold leading-6 text-slate-800"
          content={questionToHtml(question.displayNumber ?? question.orderIndex, question.content)}
          onContentChange={(content) => onContentChange(content, 'stem')}
          savedContent={highlightedContent?.stem}
        />
        <button
          aria-label={`Đánh dấu câu ${question.displayNumber ?? question.orderIndex}`}
          className={`shrink-0 text-xl ${marked ? 'text-orange-500' : 'text-slate-400 hover:text-slate-700'}`}
          onClick={() => onToggleMark(question.id)}
          disabled={disabled}
          type="button"
        >
          ⚑
        </button>
      </div>
      <div className="mt-3 grid gap-2">
        {options.map((option) => (
          <label
            className={`flex cursor-pointer items-start gap-2 rounded-md px-1 py-1 text-[13px] transition ${
              answer === option
                ? 'font-semibold text-blue-800'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            key={option}
          >
            <input
              checked={answer === option}
              disabled={disabled}
              className="mt-0.5 h-3.5 w-3.5 accent-blue-700"
              name={question.id}
              onChange={() => onAnswer(question.id, option)}
              type="radio"
              value={option}
            />
            <HighlightableContent
              allowHighlight={allowHighlight}
              className="min-w-0 text-[13px]"
              content={`<p><strong>${option}.</strong> ${formatInlineText(question[`opt${option}`])}</p>`}
              onContentChange={(content) => onContentChange(content, option)}
              savedContent={highlightedContent?.[option]}
            />
          </label>
        ))}
      </div>
    </article>
  )
}
