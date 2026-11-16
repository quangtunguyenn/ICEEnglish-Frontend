import { lazy, Suspense, useLayoutEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { useGuestMode } from './hooks/useGuestMode'
import { RouteSeo } from './components/RouteSeo'

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const MasterclassPage = lazy(() => import('./pages/MasterclassPage').then((module) => ({ default: module.MasterclassPage })))
const AboutPage = lazy(() => import('./pages/AboutPage').then((module) => ({ default: module.AboutPage })))
const HonorsPage = lazy(() => import('./pages/HonorsPage').then((module) => ({ default: module.HonorsPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const MockExamPage = lazy(() => import('./pages/MockExamPage').then((module) => ({ default: module.MockExamPage })))
const MockExamEntrance = lazy(() => import('./pages/MockExamEntrance').then((module) => ({ default: module.MockExamEntrance })))
const PracticePage = lazy(() => import('./pages/PracticePage').then((module) => ({ default: module.PracticePage })))
const PracticeHistoryPage = lazy(() => import('./pages/PracticeHistoryPage').then((module) => ({ default: module.PracticeHistoryPage })))
const PracticeReviewPage = lazy(() => import('./pages/PracticeReviewPage').then((module) => ({ default: module.PracticeReviewPage })))
const MainLayout = lazy(() => import('./layouts/MainLayout').then((module) => ({ default: module.MainLayout })))
const ExamTakePage = lazy(() => import('./pages/ExamTakePage').then((module) => ({ default: module.ExamTakePage })))
const GuestExamTakePage = lazy(() => import('./pages/GuestExamTakePage').then((module) => ({ default: module.GuestExamTakePage })))
const ExamResultPage = lazy(() => import('./pages/ExamResultPage').then((module) => ({ default: module.ExamResultPage })))
const VocabularyPage = lazy(() => import('./pages/VocabularyPage').then((module) => ({ default: module.VocabularyPage })))
const VideosPage = lazy(() => import('./pages/VideosPage').then((module) => ({ default: module.VideosPage })))
const HomeworkPage = lazy(() => import('./pages/HomeworkPage').then((module) => ({ default: module.HomeworkPage })))
const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })))
const TeacherPage = lazy(() => import('./pages/TeacherPage').then((module) => ({ default: module.TeacherPage })))
const ReadingPage = () => import('./pages/ReadingPage')
const ReadingListPage = lazy(() => ReadingPage().then((module) => ({ default: module.ReadingListPage })))
const ReadingDetailPage = lazy(() => ReadingPage().then((module) => ({ default: module.ReadingDetailPage })))
const ReadingVocabularyPage = lazy(() => ReadingPage().then((module) => ({ default: module.ReadingVocabularyPage })))

function App() {
  return (
    <BrowserRouter>
      <RouteSeo />
      <RouteScroll />
      <Routes>
        <Route path="/dang-nhap" element={<Suspense fallback={null}><LoginPage /></Suspense>} />
        <Route path="/quan-tri" element={<Suspense fallback={null}><AdminPage /></Suspense>} />
        <Route path="/giao-vien" element={<Suspense fallback={null}><TeacherPage /></Suspense>} />
        <Route element={<Suspense fallback={null}><MainLayout /></Suspense>}>
          <Route path="/" element={<Suspense fallback={null}><HomePage /></Suspense>} />
          <Route path="/khoa-hoc/ice-masterclass" element={<Suspense fallback={null}><MasterclassPage /></Suspense>} />
          <Route path="/ve-chung-toi" element={<Suspense fallback={null}><AboutPage /></Suspense>} />
          <Route path="/vinh-danh" element={<Suspense fallback={null}><HonorsPage /></Suspense>} />
          <Route path="/luyen-de" element={<Suspense fallback={null}><PracticePage /></Suspense>} />
          <Route path="/luyen-de/:examId" element={<ExamEntryPage />} />
          <Route path="/luyen-de/:examId/lich-su" element={<Suspense fallback={null}><StudentOnlyPage><PracticeHistoryPage /></StudentOnlyPage></Suspense>} />
          <Route path="/luyen-de/bai-lam/:submissionId" element={<Suspense fallback={null}><StudentOnlyPage><PracticeReviewPage /></StudentOnlyPage></Suspense>} />
          <Route path="/ket-qua/:submissionId" element={<Suspense fallback={null}><ExamResultPage /></Suspense>} />
          <Route path="/thi-thu" element={<Suspense fallback={null}><MockExamPage /></Suspense>} />
          <Route path="/thi-thu/:examId" element={<ExamEntryPage />} />
          <Route path="/thi-thu/:examId/vao-phong" element={<Suspense fallback={null}><MockExamEntrance /></Suspense>} />
          <Route path="/video" element={<Suspense fallback={null}><VideosPage /></Suspense>} />
          <Route path="/video/:videoId/homework" element={<Suspense fallback={null}><HomeworkPage /></Suspense>} />
          <Route path="/tu-vung" element={<Suspense fallback={null}><VocabularyPage /></Suspense>} />
          <Route path="/doc-hieu" element={<Suspense fallback={null}><ReadingListPage /></Suspense>} />
          <Route path="/doc-hieu/:blogId" element={<Suspense fallback={null}><ReadingDetailPage /></Suspense>} />
          <Route path="/doc-hieu/:blogId/tu-vung" element={<Suspense fallback={null}><ReadingVocabularyPage /></Suspense>} />
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
  return (
    <Suspense fallback={null}>
      {isGuest ? <GuestExamTakePage key={examId} /> : <ExamTakePage />}
    </Suspense>
  )
}

function StudentOnlyPage({ children }) {
  const location = useLocation()
  const isGuest = useGuestMode()
  return isGuest
    ? <Navigate replace to="/dang-nhap" state={{ from: { pathname: location.pathname, search: location.search } }} />
    : children
}

export default App
