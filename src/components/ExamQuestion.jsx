const options = ['A', 'B', 'C', 'D']

export function ExamQuestion({ question, answer, marked, onAnswer, onToggleMark }) {
  return (
    <article className="border-b border-slate-200 px-5 py-5 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold leading-6 text-slate-800">
          <span className="mr-1">Question {question.orderIndex}.</span>
          {question.content}
        </p>
        <button
          aria-label={`Đánh dấu câu ${question.orderIndex}`}
          className={`shrink-0 text-xl ${marked ? 'text-red-600' : 'text-slate-400 hover:text-slate-700'}`}
          onClick={() => onToggleMark(question.id)}
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
              className="mt-0.5 h-3.5 w-3.5 accent-blue-700"
              name={question.id}
              onChange={() => onAnswer(question.id, option)}
              type="radio"
              value={option}
            />
            <span>
              <strong className="mr-1">{option}.</strong>
              {question[`opt${option}`]}
            </span>
          </label>
        ))}
      </div>
    </article>
  )
}
