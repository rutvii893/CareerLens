import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SkillsDashboard from './pages/SkillsDashboard';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import ResumeAnalysis from './pages/ResumeAnalysis';
import JobRecommendations from './pages/JobRecommendations';
import CareerCoach from './pages/CareerCoach';
import CareerRoadmap from './pages/CareerRoadmap';
import InterviewPrep from './pages/InterviewPrep';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout hideSidebar isLanding><Home /></Layout>} />
        <Route path="/login" element={<Layout hideSidebar><Login /></Layout>} />
        <Route path="/register" element={<Layout hideSidebar><Register /></Layout>} />

        {/* Student Routes */}
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/skills" element={<Layout><SkillsDashboard /></Layout>} />
        <Route path="/resume" element={<Layout><ResumeAnalyzer /></Layout>} />
        <Route path="/resume/analysis" element={<Layout><ResumeAnalysis /></Layout>} />
        <Route path="/jobs" element={<Layout><JobRecommendations /></Layout>} />
        <Route path="/career" element={<Layout><CareerCoach /></Layout>} />
        <Route path="/career/roadmap" element={<Layout><CareerRoadmap /></Layout>} />
        <Route path="/interview" element={<Layout><InterviewPrep /></Layout>} />
        <Route path="/profile" element={<Layout><Profile /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
