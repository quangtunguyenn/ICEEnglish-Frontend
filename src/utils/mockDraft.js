function mockDraftKey(accountId, examId) {
  if (!accountId || !examId) throw new Error('Không xác định được tài khoản hoặc đề thi.')
  return `iceenglish:mock-draft:${encodeURIComponent(String(accountId))}:${encodeURIComponent(String(examId))}`
}

export function readMockDraft(storage, accountId, examId) {
  const raw = storage.getItem(mockDraftKey(accountId, examId))
  if (raw === null) return null

  let draft
  try {
    draft = JSON.parse(raw)
  } catch {
    throw new Error('Bản lưu thi thử trên máy không hợp lệ. Không thể khôi phục lượt thi.')
  }
  if (
    draft?.version !== 1 ||
    draft.accountId !== String(accountId) ||
    draft.examId !== String(examId) ||
    !draft.submissionId ||
    !Number.isFinite(draft.deadline) ||
    draft.deadline <= 0 ||
    !draft.answers ||
    typeof draft.answers !== 'object' ||
    Array.isArray(draft.answers) ||
    Object.values(draft.answers).some((answer) => !['A', 'B', 'C', 'D'].includes(answer)) ||
    !draft.partTimes ||
    typeof draft.partTimes !== 'object' ||
    Array.isArray(draft.partTimes) ||
    Object.values(draft.partTimes).some((seconds) => !Number.isFinite(seconds) || seconds < 0)
  ) {
    throw new Error('Bản lưu thi thử trên máy không hợp lệ. Không thể khôi phục lượt thi.')
  }
  return draft
}

export function writeMockDraft(storage, draft) {
  storage.setItem(mockDraftKey(draft.accountId, draft.examId), JSON.stringify(draft))
}

export function removeMockDraft(storage, accountId, examId) {
  storage.removeItem(mockDraftKey(accountId, examId))
}
