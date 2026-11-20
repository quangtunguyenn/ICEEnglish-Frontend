import './FavoriteToast.css'

const COPY = {
  added: { verb: 'Đã thêm', preposition: 'vào' },
  removed: { verb: 'Đã xóa', preposition: 'khỏi' },
}

/**
 * notification: { id, word, variant?: 'added' | 'removed' }
 *   → "Đã thêm “provide” vào danh sách flashcard yêu thích"
 *   → "Đã xóa “provide” khỏi danh sách flashcard yêu thích"
 * Vẫn hỗ trợ { id, message } cho các chỗ dùng cũ.
 * Parent chịu trách nhiệm unmount sau ~2400ms (khớp --toast-duration).
 */
export function FavoriteToast({ notification }) {
  const variant = notification?.variant ?? 'added'
  const copy = COPY[variant] ?? COPY.added

  return (
    // Live region luôn có trong DOM để screen reader đọc được toast mới.
    <div className="favorite-toast-region" role="status" aria-live="polite" aria-atomic="true">
      {notification && (
        <div key={notification.id} className="favorite-toast" data-variant={variant}>
          <span className="favorite-toast__icon" aria-hidden="true">
            <img alt="" className="favorite-toast__logo" src="/ice_english_emblem_vector.svg" />
          </span>

          <p className="favorite-toast__text">
            {notification.word ? (
              <>
                {copy.verb}{' '}
                <strong className="favorite-toast__word">“{notification.word}”</strong>{' '}
                {copy.preposition} danh sách flashcard yêu thích
              </>
            ) : (
              notification.message
            )}
          </p>

          <span className="favorite-toast__progress" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}