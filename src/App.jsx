import { useLayoutEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { HomePage } from './pages/HomePage'
import { MasterclassPage } from './pages/MasterclassPage'
import { AboutPage } from './pages/AboutPage'
import { HonorsPage } from './pages/HonorsPage'
import { LoginPage } from './pages/LoginPage'
import { MockExamPage } from './pages/MockExamPage'
import { MockExamEntrance } from './pages/MockExamEntrance'
import { PracticePage } from './pages/PracticePage'
import { PracticeHistoryPage } from './pages/PracticeHistoryPage'
import { PracticeReviewPage } from './pages/PracticeReviewPage'
import { ExamTakePage } from './pages/ExamTakePage'
import { GuestExamTakePage } from './pages/GuestExamTakePage'
import { ExamResultPage } from './pages/ExamResultPage'
import { VocabularyPage } from './pages/VocabularyPage'
import { VideosPage } from './pages/VideosPage'
import { HomeworkPage } from './pages/HomeworkPage'
import { AdminPage } from './pages/AdminPage'
import { TeacherPage } from './pages/TeacherPage'
import { ReadingListPage, ReadingDetailPage, ReadingVocabularyPage } from './pages/ReadingPage'
import { useGuestMode } from './hooks/useGuestMode'

function App() {
  return (
    <BrowserRouter>
      <RouteScroll />
      <Routes>
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/quan-tri" element={<AdminPage />} />
        <Route path="/giao-vien" element={<TeacherPage />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/khoa-hoc/ice-masterclass" element={<MasterclassPage />} />
          <Route path="/ve-chung-toi" element={<AboutPage />} />
          <Route path="/vinh-danh" element={<HonorsPage />} />
          <Route path="/luyen-de" element={<PracticePage />} />
          <Route path="/luyen-de/:examId" element={<ExamEntryPage />} />
          <Route path="/luyen-de/:examId/lich-su" element={<StudentOnlyPage><PracticeHistoryPage /></StudentOnlyPage>} />
          <Route path="/luyen-de/bai-lam/:submissionId" element={<StudentOnlyPage><PracticeReviewPage /></StudentOnlyPage>} />
          <Route path="/ket-qua/:submissionId" element={<ExamResultPage />} />
          <Route path="/thi-thu" element={<MockExamPage />} />
          <Route path="/thi-thu/:examId" element={<ExamEntryPage />} />
          <Route path="/thi-thu/:examId/vao-phong" element={<MockExamEntrance />} />
          <Route path="/video" element={<VideosPage />} />
          <Route path="/video/:videoId/homework" element={<HomeworkPage />} />
          <Route path="/tu-vung" element={<VocabularyPage />} />
          <Route path="/doc-hieu" element={<ReadingListPage />} />
          <Route path="/doc-hieu/:blogId" element={<ReadingDetailPage />} />
          <Route path="/doc-hieu/:blogId/tu-vung" element={<ReadingVocabularyPage />} />
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

function RouteScroll() {
  const { pathname, hash } = useLocation()

  useLayoutEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1))
      if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}

function ExamEntryPage() {
  const { examId } = useParams()
  const isGuest = useGuestMode()
  return isGuest ? <GuestExamTakePage key={examId} /> : <ExamTakePage />
}

function StudentOnlyPage({ children }) {
  const location = useLocation()
  const isGuest = useGuestMode()
  return isGuest
    ? <Navigate replace to="/dang-nhap" state={{ from: { pathname: location.pathname, search: location.search } }} />
    : children
}

export default App
