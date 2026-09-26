import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Award,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  ExternalLink,
  FileCheck,
  FileText,
  HelpCircle,
  Layers,
  Lightbulb,
  Map,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Sliders,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UploadCloud,
  User,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-react';

const SERVICES = [
  { id: 'career_overview', label: 'Career Overview', icon: Target, badge: 'Summary', color: 'from-blue-600 to-indigo-600', textTone: 'text-blue-600', bgTone: 'bg-blue-50' },
  { id: 'resume_intelligence', label: 'Resume Intelligence', icon: FileText, badge: 'ATS Audit', color: 'from-purple-600 to-indigo-600', textTone: 'text-purple-600', bgTone: 'bg-purple-50' },
  { id: 'skills_gaps', label: 'Skills & Skill Gaps', icon: Sparkles, badge: 'Competency', color: 'from-amber-500 to-orange-600', textTone: 'text-amber-600', bgTone: 'bg-amber-50' },
  { id: 'job_intelligence', label: 'Job Intelligence', icon: BriefcaseBusiness, badge: 'Adzuna Live', color: 'from-emerald-600 to-teal-600', textTone: 'text-emerald-600', bgTone: 'bg-emerald-50' },
  { id: 'interview_prep', label: 'Interview Preparation', icon: MessageSquare, badge: 'AI Mock', color: 'from-rose-500 to-pink-600', textTone: 'text-rose-600', bgTone: 'bg-rose-50' },
  { id: 'career_roadmap', label: 'Career Roadmap', icon: Map, badge: 'Milestones', color: 'from-cyan-600 to-blue-600', textTone: 'text-cyan-600', bgTone: 'bg-cyan-50' },
];

export const Dashboard14 = ({
  metrics,
  selectedService,
  onSelectService,
  onRefresh,
  onUpdateTargetGoal,
}) => {
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetRoleInput, setTargetRoleInput] = useState(metrics?.target_role || 'Full Stack Engineer');
  const [targetScoreInput, setTargetScoreInput] = useState(metrics?.target_score || 80);
  const [savingGoal, setSavingGoal] = useState(false);

  const currentBreakdown = metrics?.service_breakdowns?.[selectedService] || metrics?.service_breakdowns?.career_overview || {
    title: 'Career Intelligence Board',
    subtitle: 'Track and close your skills and readiness gaps',
    headline_metric: '0%',
    headline_label: 'Readiness',
    chart_title: 'Service Metrics',
    chart_data: [],
    metrics: [],
  };

  const activeServiceObj = SERVICES.find((s) => s.id === selectedService) || SERVICES[0];
  const IconComponent = activeServiceObj.icon;
  const recommendedJobs = metrics?.recommended_jobs || [];

  const handleSaveGoal = async (e) => {
    e?.preventDefault();
    if (!targetRoleInput.trim()) return;
    setSavingGoal(true);
    try {
      if (onUpdateTargetGoal) {
        await onUpdateTargetGoal(targetRoleInput.trim(), Number(targetScoreInput));
      }
      setEditingTarget(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingGoal(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner: Master Service Selector */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-3 sm:p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {SERVICES.map((srv) => {
            const isSelected = selectedService === srv.id;
            const SrvIcon = srv.icon;
            return (
              <button
                key={srv.id}
                onClick={() => onSelectService(srv.id)}
                className={`flex flex-col items-start p-4 rounded-2xl transition-all text-left relative group ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md ring-2 ring-blue-500/20'
                    : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 border border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-white/20 text-white' : `${srv.bgTone} ${srv.textTone}`
                    }`}
                  >
                    <SrvIcon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {srv.badge}
                  </span>
                </div>
                <span className="text-xs font-bold font-jakarta line-clamp-1">{srv.label}</span>
                <span className={`text-[11px] mt-0.5 line-clamp-1 ${isSelected ? 'text-blue-100 font-medium' : 'text-slate-400'}`}>
                  {srv.id === 'career_overview' && `${Math.round(metrics?.readiness_score || 0)}% score`}
                  {srv.id === 'resume_intelligence' && `${Math.round(metrics?.recent_ats_score || 0)}/100 ATS`}
                  {srv.id === 'skills_gaps' && `${Math.round(metrics?.overall_skill_gap || 0)}% gap`}
                  {srv.id === 'job_intelligence' && `${Math.round(metrics?.job_match_percentage || 0)}% match`}
                  {srv.id === 'interview_prep' && `${Math.round(metrics?.interview_performance?.average_score || 0)}% avg`}
                  {srv.id === 'career_roadmap' && `${Math.round(metrics?.roadmap_progress?.percentage || 0)}% done`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Role & Skill Gap Goal Quick-Editor Bar (Light CareerLens Theme) */}
      <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-white border border-blue-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#2563eb] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Target Career Goal</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold">
                  Active Baseline
                </span>
              </div>
              <h2 className="text-2xl font-extrabold font-jakarta text-slate-900 mt-1">
                {metrics?.target_role || 'Full Stack Engineer'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xl font-inter">
                Skill gaps, roadmap milestones, and interview simulations are benchmarked against a target proficiency score of{' '}
                <strong className="text-slate-800 font-semibold">{metrics?.target_score || 80}%</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
            <div className="text-center px-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Overall Skill Gap</span>
              <span className="text-2xl font-extrabold text-amber-600 font-jakarta">
                {Math.round(metrics?.overall_skill_gap || 0)}%
              </span>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            <div className="text-center px-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Target Benchmark</span>
              <span className="text-2xl font-extrabold text-[#2563eb] font-jakarta">
                {Math.round(metrics?.target_score || 80)}%
              </span>
            </div>

            <button
              onClick={() => setEditingTarget(!editingTarget)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              {editingTarget ? 'Close' : 'Adjust Target'}
            </button>
          </div>
        </div>

        {/* Inline Goal Configuration Form */}
        {editingTarget && (
          <form onSubmit={handleSaveGoal} className="mt-6 pt-5 border-t border-blue-100 grid grid-cols-1 sm:grid-cols-12 gap-3 animate-fadeIn">
            <div className="sm:col-span-6">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Role</label>
              <input
                type="text"
                value={targetRoleInput}
                onChange={(e) => setTargetRoleInput(e.target.value)}
                placeholder="e.g. Backend Engineer, Data Scientist"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#2563eb]"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Score (0–100%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={targetScoreInput}
                onChange={(e) => setTargetScoreInput(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#2563eb]"
              />
            </div>
            <div className="sm:col-span-3 flex items-end">
              <button
                type="submit"
                disabled={savingGoal}
                className="w-full py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                {savingGoal ? 'Saving...' : 'Update & Recalculate'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Main Detail Board for Selected Service */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Interactive Chart & Dynamic Service Breakdown */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm">
            {/* Board Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl ${activeServiceObj.bgTone} ${activeServiceObj.textTone} flex items-center justify-center font-bold shadow-xs`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-jakarta text-slate-900">{currentBreakdown.title}</h2>
                  <p className="text-xs text-slate-500 font-inter mt-0.5">{currentBreakdown.subtitle}</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-2xl font-extrabold font-jakarta text-slate-900">
                  {currentBreakdown.headline_metric}
                </span>
                <span className="text-[11px] block font-bold uppercase tracking-wider text-slate-400">
                  {currentBreakdown.headline_label}
                </span>
              </div>
            </div>

            {/* Service-Specific Metrics Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {currentBreakdown.metrics?.map((m, idx) => (
                <div key={idx} className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
                  <span className="text-[11px] font-semibold text-slate-500 block truncate">{m.label}</span>
                  <span className="text-lg font-bold font-jakarta text-slate-900 mt-0.5 block">{m.value}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{m.subtext}</span>
                </div>
              ))}
            </div>

            {/* Visual Chart */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {currentBreakdown.chart_title}
                </h3>
              </div>

              <div className="h-64 w-full">
                {currentBreakdown.chart_data && currentBreakdown.chart_data.length > 0 ? (
                  selectedService === 'skills_gaps' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={currentBreakdown.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-25} textAnchor="end" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value, name) => [`${value}%`, name === 'current' ? 'Current Proficiency' : (name === 'target' ? 'Target Score' : 'Gap')]}
                        />
                        <Bar dataKey="current" fill="#2563eb" radius={[6, 6, 0, 0]} name="Current" />
                        <Bar dataKey="target" fill="#cbd5e1" radius={[6, 6, 0, 0]} name="Target" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : selectedService === 'career_overview' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={currentBreakdown.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value) => [`${value}%`, 'Score']}
                        />
                        <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]}>
                          {currentBreakdown.chart_data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#2563eb', '#16a34a', '#e26d3d', '#7c3aed', '#0284c7'][index % 5]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={currentBreakdown.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Activity className="w-8 h-8 text-slate-300 mb-2" />
                    No sufficient activity data for this service yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Matched Jobs For Target Role & Particular Job Skill Gaps */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold font-jakarta text-slate-900 flex items-center gap-2">
                  <BriefcaseBusiness className="w-5 h-5 text-[#16a34a]" /> Matched Jobs for {metrics?.target_role || 'Target Role'}
                </h3>
                <p className="text-xs text-slate-500 font-inter mt-0.5">
                  Live matched openings displaying matched skills and specific skill gaps for each role.
                </p>
              </div>
              <Link
                to="/jobs"
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all border border-emerald-200 flex items-center gap-1.5 shrink-0"
              >
                Search Adzuna Live <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recommendedJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedJobs.map((job, idx) => (
                  <div
                    key={job.id || idx}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-sm font-jakarta text-slate-900 line-clamp-1">{job.title}</h4>
                          <p className="text-xs text-slate-500 font-medium">{job.company || 'Direct employer'} • {job.location || 'Remote'}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-xs rounded-full shrink-0">
                          {Math.round(job.match_score)}% match
                        </span>
                      </div>

                      {/* Matching Skills */}
                      <div className="mt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1 mb-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Matched Skills ({job.matched_skills?.length || 0})
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {job.matched_skills?.length > 0 ? (
                            job.matched_skills.map((s) => (
                              <span key={s} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200/70 rounded-md text-[10px] font-semibold">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400">None detected</span>
                          )}
                        </div>
                      </div>

                      {/* Particular Job Skill Gaps */}
                      <div className="mt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1 mb-1.5">
                          <XCircle className="w-3 h-3 text-amber-600" /> Job Skill Gaps to Learn ({job.missing_skills?.length || 0})
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {job.missing_skills?.length > 0 ? (
                            job.missing_skills.map((s) => (
                              <span key={s} className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/70 rounded-md text-[10px] font-semibold">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-semibold">No skill gaps for this job!</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      {job.url ? (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-[#2563eb] hover:underline flex items-center gap-1"
                        >
                          Apply on Adzuna <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <Link to="/jobs" className="font-bold text-[#2563eb] hover:underline">
                          View in Job Search &rarr;
                        </Link>
                      )}
                      <Link to="/roadmap" className="font-semibold text-slate-500 hover:text-slate-800 text-[11px]">
                        Add gaps to roadmap
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
                <BriefcaseBusiness className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">No matched jobs catalogued yet</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Run a live search for <strong className="text-slate-700">{metrics?.target_role || 'your target role'}</strong> to analyze skill gaps.
                </p>
                <Link
                  to="/jobs"
                  className="px-5 py-2.5 bg-[#16a34a] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1.5"
                >
                  Search Jobs Now
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Quick Actions & Live Activity Feed */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Action Navigation Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
            <h3 className="text-sm font-bold font-jakarta text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#e26d3d]" /> Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                to="/resume"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-blue-50 text-slate-800 hover:text-[#2563eb] text-xs font-bold transition-all border border-slate-100 group"
              >
                <span className="flex items-center gap-2.5">
                  <UploadCloud className="w-4 h-4 text-[#2563eb]" /> Upload & Scan Resume
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/skills"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-amber-50 text-slate-800 hover:text-amber-700 text-xs font-bold transition-all border border-slate-100 group"
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Manage My Skills & Gap
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/jobs"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 text-xs font-bold transition-all border border-slate-100 group"
              >
                <span className="flex items-center gap-2.5">
                  <BriefcaseBusiness className="w-4 h-4 text-emerald-600" /> Search Adzuna Jobs
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/interview"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-rose-50 text-slate-800 hover:text-rose-700 text-xs font-bold transition-all border border-slate-100 group"
              >
                <span className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-rose-600" /> Mock Interview Prep
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/roadmap"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-purple-50 text-slate-800 hover:text-purple-700 text-xs font-bold transition-all border border-slate-100 group"
              >
                <span className="flex items-center gap-2.5">
                  <Map className="w-4 h-4 text-purple-600" /> View Learning Roadmap
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/coach"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-cyan-50 text-slate-800 hover:text-cyan-700 text-xs font-bold transition-all border border-slate-100 group"
              >
                <span className="flex items-center gap-2.5">
                  <Lightbulb className="w-4 h-4 text-cyan-600" /> Ask AI Career Coach
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Real Activity Timeline */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
            <h3 className="text-sm font-bold font-jakarta text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" /> Recent User Activity
            </h3>

            {metrics?.recent_activity?.length > 0 ? (
              <div className="space-y-3.5">
                {metrics.recent_activity.map((act, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      {act.type === 'resume_analysis' && <FileText className="w-3.5 h-3.5 text-[#2563eb]" />}
                      {act.type === 'job_application' && <Bookmark className="w-3.5 h-3.5 text-[#16a34a]" />}
                      {act.type === 'interview' && <MessageSquare className="w-3.5 h-3.5 text-[#e26d3d]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={act.link || '#'} className="font-semibold text-slate-800 hover:text-[#2563eb] line-clamp-1">
                        {act.title}
                      </Link>
                      <p className="text-slate-500 mt-0.5 truncate">{act.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard14;

