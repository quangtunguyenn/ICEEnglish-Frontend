export function VocabularyFlashcard({ vocabulary, isFlipped, onFlip }) {
  return (
    <button
      aria-label={`${isFlipped ? vocabulary.meaning : vocabulary.word}. ${vocabulary.phonetic || ''} ${(isFlipped ? vocabulary.exampleSentenceTranslate : vocabulary.exampleSentence) || ''}. ${isFlipped ? 'Hiện từ tiếng Anh' : 'Hiện nghĩa tiếng Việt'}`}
      aria-pressed={isFlipped}
      className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm outline-none transition hover:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-600"
      onClick={onFlip}
      type="button"
    >
      <span
        className="grid min-h-80 transition-transform duration-500 motion-reduce:transition-none"
        style={{ transform: `rotateY(${isFlipped ? 180 : 0}deg)`, transformStyle: 'preserve-3d' }}
      >
        {[
          { label: 'English', value: vocabulary.word, example: vocabulary.exampleSentence, flipped: false },
          { label: 'Tiếng Việt', value: vocabulary.meaning, example: vocabulary.exampleSentenceTranslate, flipped: true },
        ].map((face) => (
          <span
            aria-hidden={isFlipped !== face.flipped}
            className={`col-start-1 row-start-1 flex max-h-120 min-h-80 flex-col items-center gap-4 overflow-y-auto rounded-lg px-6 py-10 text-center text-white ${face.flipped ? 'bg-emerald-700' : 'bg-slate-950'}`}
            key={face.label}
            style={{ backfaceVisibility: 'hidden', transform: face.flipped ? 'rotateY(180deg)' : undefined }}
          >
            <span className="mt-auto text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">{face.label}</span>
            <span className="wrap-break-word text-3xl font-extrabold sm:text-4xl">{face.value}</span>
            {vocabulary.phonetic && <span className="wrap-break-word text-base text-cyan-100">{vocabulary.phonetic}</span>}
            {face.example && <span className="whitespace-pre-wrap wrap-break-word text-base leading-7">{face.example}</span>}
            <span aria-hidden="true" className="mb-auto" />
          </span>
        ))}
      </span>
    </button>
  )
}
