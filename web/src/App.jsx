import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import PageTopbar from './components/PageTopbar'
import Dashboard from './screens/Dashboard'
import ExamBlueprint from './screens/ExamBlueprint'
import StudyPlan from './screens/StudyPlan'
import Courses from './screens/Courses'
import Projects from './screens/Projects'
import DomainDeepDive from './screens/DomainDeepDive'
import KeyConcepts from './screens/KeyConcepts'
import ExamDayChecklist from './screens/ExamDayChecklist'
import Profile from './screens/Profile'
import MobileDownload from './screens/MobileDownload'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div
        className={`sidebar-backdrop${sidebarOpen ? ' is-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <main className="app-main">
        <PageTopbar onMenuClick={() => setSidebarOpen(true)} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/blueprint" element={<ExamBlueprint />} />
          <Route path="/plan" element={<StudyPlan />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/domain/:id" element={<DomainDeepDive />} />
          <Route path="/concepts" element={<KeyConcepts />} />
          <Route path="/exam-day" element={<ExamDayChecklist />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/mobile" element={<MobileDownload />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
