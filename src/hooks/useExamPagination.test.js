import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let vite;
let paginateGuestExams;
const getTitle = (exam) => exam.title;

before(async () => {
  vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
  ({ paginateGuestExams } = await vite.ssrLoadModule("/src/hooks/useExamPagination.js"));
});

after(async () => {
  await vite?.close();
});

test("guest exams are split into pages of at most 12", () => {
  for (const [count, expectedPages] of [[0, 0], [12, 1], [13, 2], [45, 4]]) {
    const exams = Array.from({ length: count }, (_, index) => ({ title: `Đề ${index + 1}` }));
    const first = paginateGuestExams(exams, "", 0, getTitle);
    assert.equal(first.totalElements, count);
    assert.equal(first.totalPages, expectedPages);
    assert.equal(first.items.length, Math.min(count, 12));
    if (expectedPages > 1) {
      const last = paginateGuestExams(exams, "", expectedPages - 1, getTitle);
      assert.deepEqual(last.items, exams.slice((expectedPages - 1) * 12));
    }
  }
});

test("guest search filters the full list without Vietnamese accents before pagination", () => {
  const exams = Array.from({ length: 45 }, (_, index) => ({ title: `Đề số ${index + 1}` }));
  const result = paginateGuestExams(exams, "  DE SO 45  ", 0, getTitle);
  assert.equal(result.totalElements, 1);
  assert.equal(result.totalPages, 1);
  assert.deepEqual(result.items, [exams[44]]);
});
