import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage, getGeneralExams, getGuestExams, getMockExams } from "../services/api";

export const PAGE_SIZE = 12;
const SEARCH_DELAY_MS = 300;

function foldText(text) {
  return String(text || "")
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

export function paginateGuestExams(exams, keyword, page, getTitle) {
  const needle = foldText(keyword.trim());
  const matched = needle ? exams.filter((exam) => foldText(getTitle(exam)).includes(needle)) : exams;
  const filtered = [
    ...matched.filter((exam) => exam.accessible !== false),
    ...matched.filter((exam) => exam.accessible === false),
  ];
  return {
    items: filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / PAGE_SIZE),
  };
}

export function useExamPagination({ guest, mode, getTitle, errorMessage }) {
  const [pageState, setPageState] = useState({ guest, page: 0 });
  const page = pageState.guest === guest ? pageState.page : 0;
  const [keywordInput, setKeywordInput] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [retry, setRetry] = useState(0);
  const [loaded, setLoaded] = useState(null);
  const keyword = keywordInput.trim();
  const waitingForSearch = !guest && keyword !== debouncedKeyword;
  const requestKey = guest
    ? `guest:${mode}:${retry}`
    : JSON.stringify([mode, page, debouncedKeyword, retry]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    setPageState({ guest, page: 0 });
  }, [guest]);

  useEffect(() => {
    if (!guest) return undefined;
    let active = true;
    getGuestExams(mode)
      .then((items) => {
        if (active) setLoaded({ key: requestKey, data: items });
      })
      .catch((error) => {
        if (active) setLoaded({ key: requestKey, error: getApiErrorMessage(error, errorMessage) });
      });
    return () => { active = false; };
  }, [guest, mode, retry, errorMessage, requestKey]);

  useEffect(() => {
    if (guest || waitingForSearch) return undefined;
    let active = true;
    const loadPage = mode === "MOCK" ? getMockExams : getGeneralExams;
    loadPage({ page, size: PAGE_SIZE, keyword: debouncedKeyword })
      .then((data) => {
        if (data.items.length > PAGE_SIZE) {
          throw new Error(`Hệ thống trả về dữ liệu chưa đúng. Vui lòng tải lại trang.`);
        }
        if (active) setLoaded({ key: requestKey, data, keyword: debouncedKeyword });
      })
      .catch((error) => {
        if (active) setLoaded({ key: requestKey, error: getApiErrorMessage(error, errorMessage) });
      });
    return () => { active = false; };
  }, [guest, mode, page, debouncedKeyword, retry, errorMessage, requestKey, waitingForSearch]);

  const current = !waitingForSearch && loaded?.key === requestKey ? loaded : null;
  const guestPage = useMemo(
    () => guest && current?.data ? paginateGuestExams(current.data, keyword, page, getTitle) : null,
    [guest, current, keyword, page, getTitle],
  );
  const result = guest ? guestPage : current?.data;
  const totalPages = result?.totalPages ?? (
    !guest && !waitingForSearch && loaded?.keyword === debouncedKeyword ? loaded.data?.totalPages : 0
  ) ?? 0;

  return {
    exams: result?.items ?? [],
    totalElements: result?.totalElements ?? 0,
    totalPages,
    loading: !current,
    error: current?.error ?? "",
    page,
    setPage: (nextPage) => setPageState({ guest, page: nextPage }),
    keyword,
    keywordInput,
    setKeywordInput: (value) => {
      setPageState({ guest, page: 0 });
      setKeywordInput(value);
    },
    retry: () => setRetry((currentRetry) => currentRetry + 1),
  };
}
