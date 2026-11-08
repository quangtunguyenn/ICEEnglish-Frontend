import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MockExamPage } from './pages/MockExamPage'
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
import { useGuestMode } from './hooks/useGuestMode'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/quan-tri" element={<AdminPage />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/luyen-de" element={<PracticePage />} />
          <Route path="/luyen-de/:examId" element={<ExamEntryPage />} />
          <Route path="/luyen-de/:examId/lich-su" element={<StudentOnlyPage><PracticeHistoryPage /></StudentOnlyPage>} />
          <Route path="/luyen-de/bai-lam/:submissionId" element={<StudentOnlyPage><PracticeReviewPage /></StudentOnlyPage>} />
          <Route path="/ket-qua/:submissionId" element={<ExamResultPage />} />
          <Route path="/thi-thu" element={<MockExamPage />} />
          <Route path="/thi-thu/:examId" element={<ExamEntryPage />} />
          <Route path="/video" element={<VideosPage />} />
          <Route path="/video/:videoId/homework" element={<HomeworkPage />} />
          <Route path="/tu-vung" element={<VocabularyPage />} />
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  )
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
