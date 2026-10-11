import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  FileCheck,
  FilePlus2,
  FileText,
  HelpCircle,
  Layers,
  Lightbulb,
  LoaderCircle,
  Map,
  MessageSquare,
  Plus,
  RefreshCw,
  Sliders,
  Sparkles,
  Target,
  TrendingUp,
  UploadCloud,
  UserCheck
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { userService } from '../services/userService';
import CareerEvidenceMap from '../components/common/CareerEvidenceMap';

const Dashboard = () => {
  const { user, targetRole, updateTargetGoal } = useUser();
  const [metrics, setMetrics] = useState(null);
  const [skillsData, setSkillsData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingGoal, setEditingGoal] = useState(false);
  const [targetRoleInput, setTargetRoleInput] = useState(targetRole || 'Full Stack Engineer');
  const [savingGoal, setSavingGoal] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [metricsRes, skillsRes] = await Promise.allSettled([
        userService.getDashboardMetrics(),
        userService.getSkills(),
      ]);

      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value);
        if (metricsRes.value.target_role) {
          setTargetRoleInput(metricsRes.value.target_role);
        }
      } else {
        throw metricsRes.reason;
      }

      if (skillsRes.status === 'fulfilled') {
        setSkillsData(skillsRes.value);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.response?.data?.detail || 'Unable to load your live career intelligence data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [targetRole]);

  const handleSaveGoal = async (e) => {
    e?.preventDefault();
    if (!targetRoleInput.trim()) return;
    setSavingGoal(true);
    try {
      await updateTargetGoal(targetRoleInput.trim());
      setEditingGoal(false);
    } catch (err) {
      console.error('Failed to update target goal:', err);
    } finally {
      setSavingGoal(false);
    }
  };

  // Determine Next Best Move based on authentic user state
  const getNextBestMove = () => {
    const hasResume = Boolean(metrics?.active_resume_id);
    const skillGap = Math.round(metrics?.overall_skill_gap || 0);
    const roadmapDone = Boolean(metrics?.roadmap_progress?.percentage > 0);
    const recentAts = metrics?.recent_ats_score;

    if (!hasResume) {
      return {
        tag: 'Essential First Step',
        title: 'Upload your current resume for baseline ATS screening',
        description: 'CareerLens needs your resume text to extract verified skills, calculate real gaps against job descriptions, and benchmark your ATS score.',
        actionLabel: 'Upload Resume',
        actionLink: '/resume',
        icon: UploadCloud,
        badgeType: 'badge-blue',
      };
    }

    if (recentAts !== null && recentAts < 65) {
      return {
        tag: 'Resume Optimization Needed',
        title: `Your resume ATS score is ${Math.round(recentAts)}/100`,
        description: `Improve keyword density and formatting with the Resume Generator or review missing keywords identified in your ATS scan.`,
        actionLabel: 'Build ATS-Optimized Resume',
        actionLink: '/resume-generator',
        icon: FilePlus2,
        badgeType: 'badge-amber',
      };
    }

    if (skillGap > 25) {
      return {
        tag: 'Skill Gap Prioritization',
        title: `Close your ${skillGap}% requirement gap for ${targetRole || 'your goal'}`,
        description: `Review the recommended milestones in your learning roadmap to start learning missing technologies like ${metrics?.missing_skills?.slice(0, 2).join(', ') || 'essential frameworks'}.`,
        actionLabel: 'Start Roadmap Tasks',
        actionLink: `/career/roadmap?targetRole=${encodeURIComponent(targetRole || '')}`,
        icon: Map,
        badgeType: 'badge-violet',
      };
    }

    return {
      tag: 'Interview Readiness',
      title: 'Practice role-specific mock interview questions',
      description: 'Your verified skills and target role match closely. Prepare for behavioral and technical interviews with AI-evaluated responses.',
      actionLabel: 'Launch Mock Interview',
      actionLink: `/interview?targetRole=${encodeURIComponent(targetRole || '')}`,
      icon: MessageSquare,
      badgeType: 'badge-blue',
    };
  };

  if (loading) {
    return (
      <div className="page-container min-h-[60vh] flex flex-col items-center justify-center">
        <LoaderCircle className="w-9 h-9 animate-spin text-[#3B82F6] mb-3" />
        <p className="text-sm font-medium text-slate-500 font-inter">Loading your personal career workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="card-base p-6 border-red-200 bg-red-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-red-900 font-jakarta">Could not load career workspace</h3>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button onClick={fetchDashboardData} className="btn-secondary text-xs shrink-0">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const nextMove = getNextBestMove();
  const NextMoveIcon = nextMove.icon;
  const hasResume = Boolean(metrics?.active_resume_id);
  const readinessScore = Math.round(metrics?.readiness_score || 0);
  const atsScore = metrics?.recent_ats_score !== null ? Math.round(metrics?.recent_ats_score) : null;
  const skillGap = Math.round(metrics?.overall_skill_gap || 0);
  const roadmapPct = Math.round(metrics?.roadmap_progress?.percentage || 0);
  const recommendedJobs = metrics?.recommended_jobs || [];

  return (
    <div className="page-container space-y-6">
      {/* 1. Workspace Header & Human Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-neutral text-[11px]">Personal Career Workspace</span>
            <span className="text-xs text-slate-400">• Updated live</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-jakarta text-slate-900 tracking-tight">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-inter mt-1 max-w-2xl">
            Targeting <span className="font-semibold text-slate-800">{targetRole || 'Software Engineer'}</span>. Here is where you stand and what moves the needle today.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={fetchDashboardData}
            className="btn-secondary text-xs"
            title="Refresh career metrics"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setEditingGoal(!editingGoal)}
            className="btn-secondary text-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Target Role</span>
          </button>
          <Link to="/resume" className="btn-primary text-xs">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{hasResume ? 'Replace Resume' : 'Upload Resume'}</span>
          </Link>
        </div>
      </div>

      {/* Target Goal Inline Form */}
      {editingGoal && (
        <form onSubmit={handleSaveGoal} className="card-base p-4 sm:p-5 bg-gradient-to-r from-blue-50/40 via-white to-violet-50/20 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Career Role</label>
              <input
                type="text"
                value={targetRoleInput}
                onChange={(e) => setTargetRoleInput(e.target.value)}
                placeholder="e.g. Full Stack Engineer, Cloud Architect, Data Scientist"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 sm:self-end">
              <button
                type="submit"
                disabled={savingGoal}
                className="btn-primary text-xs flex-1 sm:flex-initial"
              >
                {savingGoal ? 'Saving...' : 'Save Target Goal'}
              </button>
              <button
                type="button"
                onClick={() => setEditingGoal(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 2. Top Overview: "Your Next Best Move" Hero + Key Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Prominent Next Best Move Hero (7 cols) */}
        <div className="lg:col-span-7 card-base p-6 sm:p-7 bg-gradient-to-br from-white via-blue-50/30 to-violet-50/30 border-blue-200/80 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={nextMove.badgeType}>{nextMove.tag}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Your Next Best Move</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold font-jakarta text-slate-900 leading-snug">
              {nextMove.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-inter max-w-xl">
              {nextMove.description}
            </p>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3">
            <Link to={nextMove.actionLink} className="btn-primary text-xs">
              <NextMoveIcon className="w-4 h-4" />
              <span>{nextMove.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
            <span className="text-[11px] text-slate-400">
              Evaluated against requirements for <strong className="text-slate-700 font-semibold">{targetRole}</strong>
            </span>
          </div>
        </div>

        {/* 4 Compact Status Metrics (5 cols) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
          {/* Readiness Score */}
          <div className="card-base p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Readiness</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Target className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold font-jakarta text-slate-900">
                {readinessScore}%
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Role Competency</span>
            </div>
          </div>

          {/* ATS Score */}
          <div className="card-base p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Resume ATS</span>
              <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                <FileCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold font-jakarta text-slate-900">
                {atsScore !== null ? `${atsScore}` : '—'}
                {atsScore !== null && <span className="text-xs font-semibold text-slate-400">/100</span>}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {hasResume ? 'Latest scan score' : 'No resume uploaded'}
              </span>
            </div>
          </div>

          {/* Skill Gap */}
          <div className="card-base p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Skill Gap</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold font-jakarta text-slate-900">
                {skillGap}%
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Unmet prerequisites</span>
            </div>
          </div>

          {/* Roadmap Completion */}
          <div className="card-base p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Roadmap</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Map className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold font-jakarta text-slate-900">
                {roadmapPct}%
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Milestones achieved</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SIGNATURE FEATURE: Career Evidence Map */}
      <CareerEvidenceMap
        skillsData={skillsData}
        metrics={metrics}
        targetRole={targetRole}
      />

      {/* 4. Bottom Grid: Real Activity Timeline & Live Target Job Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Compact Career Progress Timeline (5 cols) */}
        <div className="lg:col-span-5 card-base p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-jakarta text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Career Progress Timeline</span>
              </h3>
              <span className="text-[11px] text-slate-400">Milestone log</span>
            </div>

            <div className="space-y-4">
              {/* Event 1: Resume */}
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  hasResume ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                }`}>
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {hasResume ? 'Resume Verified' : 'Resume Pending'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {hasResume ? (metrics?.active_resume_uploaded_at ? new Date(metrics.active_resume_uploaded_at).toLocaleDateString() : 'Active') : 'Action needed'}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5 font-inter">
                    {hasResume
                      ? `Parsed ${metrics?.active_resume_filename || 'active resume'} with ${metrics?.extracted_skills?.length || 0} extracted skills.`
                      : 'Upload a resume to automatically calculate keyword match.'}
                  </p>
                </div>
              </div>

              {/* Event 2: Target Role */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Career Goal Set</span>
                    <span className="text-[10px] text-slate-400">Synced</span>
                  </div>
                  <p className="text-slate-500 mt-0.5 font-inter">
                    Active goal calibrated for <strong className="font-semibold text-slate-700">{targetRole}</strong>.
                  </p>
                </div>
              </div>

              {/* Event 3: Roadmap Progress */}
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  roadmapPct > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Map className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Learning Roadmap</span>
                    <span className="text-[10px] text-slate-400">{roadmapPct}% Complete</span>
                  </div>
                  <p className="text-slate-500 mt-0.5 font-inter">
                    {roadmapPct > 0
                      ? 'Milestone tasks completed and synced to your proficiency score.'
                      : 'Tasks ready for completion to reduce your skill gap.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link to="/career/roadmap" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
              <span>View Roadmap Details</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Live Target Job Recommendations (7 cols) */}
        <div className="lg:col-span-7 card-base p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold font-jakarta text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Target Role Recommendations</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Positions matched against your skill proficiency for {targetRole}
                </p>
              </div>
              <Link to="/jobs" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <span>All Jobs</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {recommendedJobs.length > 0 ? (
              <div className="space-y-2.5">
                {recommendedJobs.slice(0, 3).map((job, idx) => (
                  <div
                    key={job.id || idx}
                    className="p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 font-jakarta truncate">
                          {job.title}
                        </h4>
                        {job.match_score && (
                          <span className="badge-blue text-[10px] shrink-0">
                            {Math.round(job.match_score)}% match
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {job.company} • {job.location || 'Remote/Hybrid'}
                      </p>
                    </div>

                    <Link
                      to={`/jobs?q=${encodeURIComponent(job.title)}`}
                      className="btn-secondary text-[11px] shrink-0 py-1.5 px-2.5"
                    >
                      Inspect
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
                <p className="text-xs text-slate-500 font-inter">
                  No matching jobs cached yet for {targetRole}.
                </p>
                <Link to={`/jobs?q=${encodeURIComponent(targetRole)}`} className="btn-secondary text-xs inline-flex">
                  Explore Live Adzuna Job Matching
                </Link>
              </div>
            )}
          </div>

          {/* Useful Workspace Shortcuts */}
          <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Shortcuts:</span>
            <Link to="/skills" className="badge-neutral hover:bg-slate-100 transition-colors">
              Skills Dashboard
            </Link>
            <Link to="/resume-generator" className="badge-neutral hover:bg-slate-100 transition-colors">
              Resume Generator
            </Link>
            <Link to="/career" className="badge-neutral hover:bg-slate-100 transition-colors">
              AI Career Coach
            </Link>
            <Link to="/interview" className="badge-neutral hover:bg-slate-100 transition-colors">
              Interview Prep
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
