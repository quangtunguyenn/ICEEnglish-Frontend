import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MockExamPage } from './pages/MockExamPage'
import { PracticePage } from './pages/PracticePage'
import { ExamTakePage } from './pages/ExamTakePage'
import { ExamResultPage } from './pages/ExamResultPage'
import { VocabularyPage } from './pages/VocabularyPage'
import { VideosPage } from './pages/VideosPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/luyen-de" element={<PracticePage />} />
          <Route path="/luyen-de/:examId" element={<ExamTakePage />} />
          <Route path="/ket-qua/:submissionId" element={<ExamResultPage />} />
          <Route path="/thi-thu" element={<MockExamPage />} />
          <Route path="/thi-thu/:examId" element={<ExamTakePage />} />
          <Route path="/video" element={<VideosPage />} />
          <Route path="/tu-vung" element={<VocabularyPage />} />
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
