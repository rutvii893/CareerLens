import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import { UserProvider } from './context/UserContext';

// Pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SkillsDashboard = lazy(() => import('./pages/SkillsDashboard'));
const ResumeAnalyzer = lazy(() => import('./pages/ResumeAnalyzer'));
const ResumeGenerator = lazy(() => import('./pages/ResumeGenerator'));
const ResumeAnalysis = lazy(() => import('./pages/ResumeAnalysis'));
const JobRecommendations = lazy(() => import('./pages/JobRecommendations'));
const CareerCoach = lazy(() => import('./pages/CareerCoach'));
const CareerRoadmap = lazy(() => import('./pages/CareerRoadmap'));
const InterviewPrep = lazy(() => import('./pages/InterviewPrep'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Router>
      <UserProvider>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading CareerLens...</div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout hideSidebar isLanding><Home /></Layout>} />
            <Route path="/login" element={<Layout hideSidebar><Login /></Layout>} />
            <Route path="/register" element={<Layout hideSidebar><Register /></Layout>} />

            {/* Student & Authenticated Routes */}
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/skills" element={<Layout><SkillsDashboard /></Layout>} />
            <Route path="/resume" element={<Layout><ResumeAnalyzer /></Layout>} />
            <Route path="/resume-generator" element={<Layout><ResumeGenerator /></Layout>} />
            <Route path="/resume/analysis" element={<Layout><ResumeAnalysis /></Layout>} />
            <Route path="/jobs" element={<Layout><JobRecommendations /></Layout>} />
            <Route path="/career" element={<Layout><CareerCoach /></Layout>} />
            <Route path="/coach" element={<Layout><CareerCoach /></Layout>} />
            <Route path="/career/roadmap" element={<Layout><CareerRoadmap /></Layout>} />
            <Route path="/roadmap" element={<Layout><CareerRoadmap /></Layout>} />
            <Route path="/interview" element={<Layout><InterviewPrep /></Layout>} />
            <Route path="/profile" element={<Layout><Profile /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </UserProvider>
    </Router>
  );
}

export default App;
