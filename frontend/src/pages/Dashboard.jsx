import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Award,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  HelpCircle,
  LoaderCircle,
  Map,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  UploadCloud,
  Zap,
} from 'lucide-react';
import { userService } from '../services/userService';

const MetricCard = ({ label, value, subtext, icon: Icon, tone, bgTone, isScore = false }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
    <div className="flex items-center justify-between mb-4">
      <span className="text-slate-500 font-inter text-xs font-semibold uppercase tracking-wider">{label}</span>
      <div className={`w-10 h-10 ${bgTone} rounded-xl flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${tone}`} />
      </div>
    </div>
    <div>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-extrabold font-jakarta ${tone}`}>{value}</span>
        {isScore && <span className="text-slate-400 text-sm font-semibold">/100</span>}
      </div>
      {subtext && <p className="text-xs text-slate-500 mt-1 font-inter">{subtext}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userService.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.response?.data?.detail || 'Unable to load your career metrics. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full min-h-[60vh] flex flex-col items-center justify-center">
        <LoaderCircle className="w-10 h-10 animate-spin text-[#2563eb] mb-4" />
        <p className="text-slate-600 font-medium font-inter">Loading your real-time career data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <h3 className="font-semibold font-jakarta">Could not load dashboard</h3>
              <p className="text-sm text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchMetrics}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm shrink-0"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const roadmap = metrics?.roadmap_progress || {};
  const interview = metrics?.interview_performance || {};
  const overview = metrics?.career_readiness_overview || {};
  const hasResume = Boolean(metrics?.active_resume_id);
  const totalSkills = metrics?.total_skills_count || (metrics?.extracted_skills?.length || 0);
  const savedCount = metrics?.saved_jobs_count || 0;
  const applicationsCount = metrics?.applications_count || 0;
  const recentActivity = metrics?.recent_activity || [];

  return (
    <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-jakarta text-slate-900 tracking-tight">
            Career Readiness Dashboard
          </h1>
          <p className="text-slate-500 font-inter mt-1">
            Real-time insights derived from your analyzed resume, skills, roadmap, and applications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all shadow-sm"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/resume"
            className="px-4 py-2.5 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:opacity-95 text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" /> Upload Resume
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Overall Career Readiness"
          value={Math.round(metrics.readiness_score || 0)}
          subtext="Composite score from all activities"
          icon={Target}
          tone="text-[#2563eb]"
          bgTone="bg-blue-50"
          isScore={true}
        />
        <MetricCard
          label="Resume ATS Score"
          value={hasResume ? Math.round(metrics.recent_ats_score || 0) : '—'}
          subtext={hasResume ? (metrics.active_resume_filename || 'Active resume analyzed') : 'No resume uploaded'}
          icon={FileText}
          tone="text-[#7c3aed]"
          bgTone="bg-purple-50"
          isScore={hasResume}
        />
        <MetricCard
          label="Total Detected Skills"
          value={totalSkills}
          subtext={`${metrics.extracted_skills?.length || 0} catalogued skills`}
          icon={Sparkles}
          tone="text-[#e26d3d]"
          bgTone="bg-orange-50"
        />
        <MetricCard
          label="Tracked Applications"
          value={applicationsCount + savedCount}
          subtext={`${savedCount} saved, ${applicationsCount} active`}
          icon={BriefcaseBusiness}
          tone="text-[#16a34a]"
          bgTone="bg-emerald-50"
        />
      </div>

      {/* Quick Action Banner if New User */}
      {!hasResume && (
        <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-transparent border border-blue-200/80 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#2563eb] text-white flex items-center justify-center shrink-0 shadow-md">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-jakarta text-lg">Get started with CareerLens</h3>
              <p className="text-slate-600 text-sm mt-0.5 max-w-xl">
                Upload your resume to unlock accurate ATS scoring, automated skill extraction, tailored Adzuna job recommendations, and custom roadmap generation.
              </p>
            </div>
          </div>
          <Link
            to="/resume"
            className="px-5 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm shrink-0 flex items-center gap-2"
          >
            Upload Resume <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Resume & Skills */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold font-jakarta text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2563eb]" /> Resume Quality & Suggestions
              </h2>
              {hasResume && (
                <Link to={`/resume/analysis?resumeId=${metrics.active_resume_id}`} className="text-xs font-semibold text-[#2563eb] hover:underline">
                  View full report
                </Link>
              )}
            </div>

            {hasResume ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">ATS Keyword Score</span>
                  <span className="text-sm font-bold text-slate-900">{Math.round(metrics.recent_ats_score || 0)}%</span>
                </div>

                {metrics.resume_improvement?.length > 0 ? (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Key Improvements</span>
                    <ul className="space-y-2.5">
                      {metrics.resume_improvement.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-[#e26d3d] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Your resume passed all core ATS structure checks.</p>
                )}
              </div>
            ) : (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">No resume uploaded yet</p>
                <Link to="/resume" className="text-xs font-bold text-[#2563eb] mt-1 inline-block hover:underline">
                  Upload PDF or DOCX &rarr;
                </Link>
              </div>
            )}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Extracted Skills</span>
              <Link to="/skills" className="text-xs font-semibold text-[#2563eb] hover:underline">
                Manage skills
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {metrics.extracted_skills?.length > 0 ? (
                metrics.extracted_skills.slice(0, 8).map((skill) => (
                  <span key={skill} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400">No skills detected yet.</p>
              )}
            </div>
          </div>
        </section>

        {/* Column 2: Career Roadmap Progress */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold font-jakarta text-slate-900 flex items-center gap-2">
                <Map className="w-5 h-5 text-[#7c3aed]" /> Career Roadmap
              </h2>
              <Link to="/roadmap" className="text-xs font-semibold text-[#7c3aed] hover:underline">
                Open Roadmap
              </Link>
            </div>

            {roadmap.target_role ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">{roadmap.target_role}</span>
                  <span className="text-sm font-extrabold text-[#7c3aed]">{Math.round(roadmap.percentage || 0)}%</span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#7c3aed] to-[#2563eb] h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${roadmap.percentage || 0}%` }}
                  />
                </div>

                <p className="text-xs text-slate-500 font-inter">
                  Completed {roadmap.completed_phases || 0} of {roadmap.total_phases || 0} planned learning milestones.
                </p>

                {metrics.career_skill_gap?.length > 0 && (
                  <div className="mt-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Priority Skills to Learn</span>
                    <div className="flex flex-wrap gap-1.5">
                      {metrics.career_skill_gap.slice(0, 5).map((skill) => (
                        <span key={skill} className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-lg text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Compass className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">No target roadmap active</p>
                <Link to="/roadmap" className="text-xs font-bold text-[#7c3aed] mt-1 inline-block hover:underline">
                  Generate milestone plan &rarr;
                </Link>
              </div>
            )}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Career Coach Assistant</span>
              <Link to="/coach" className="text-xs font-bold text-[#e26d3d] hover:underline flex items-center gap-1">
                Ask Coach &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* Column 3: Interview Performance & Practice */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold font-jakarta text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#e26d3d]" /> Interview Intelligence
              </h2>
              <Link to="/interview" className="text-xs font-semibold text-[#e26d3d] hover:underline">
                Practice now
              </Link>
            </div>

            {interview.session_count > 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-orange-50/60 border border-orange-100 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Average Evaluation Score</p>
                    <p className="text-2xl font-extrabold font-jakarta text-[#e26d3d] mt-0.5">
                      {Math.round(interview.average_score || 0)}
                      <span className="text-xs text-slate-400 font-semibold">/100</span>
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-white text-slate-700 rounded-lg text-xs font-bold shadow-sm">
                    {interview.session_count} {interview.session_count === 1 ? 'Session' : 'Sessions'}
                  </span>
                </div>

                {metrics.recent_interviews?.length > 0 && (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Recent Sessions</span>
                    <div className="space-y-2">
                      {metrics.recent_interviews.slice(0, 3).map((sess) => (
                        <div key={sess.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs">
                          <span className="font-semibold text-slate-800 truncate max-w-[140px]">{sess.target_role || 'General'}</span>
                          <span className="font-bold text-emerald-600">{sess.score ? `${Math.round(sess.score)}/100` : 'In Progress'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">No interview sessions yet</p>
                <Link to="/interview" className="text-xs font-bold text-[#e26d3d] mt-1 inline-block hover:underline">
                  Start mock practice &rarr;
                </Link>
              </div>
            )}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <Link
              to="/interview"
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-200"
            >
              Start New Mock Interview
            </Link>
          </div>
        </section>
      </div>

      {/* Bottom Section: Recommended Jobs & Recent Real Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Jobs */}
        <section className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold font-jakarta text-slate-900 flex items-center gap-2">
                <BriefcaseBusiness className="w-5 h-5 text-[#16a34a]" /> Job Matches & Recommendations
              </h2>
              <p className="text-xs text-slate-500 font-inter mt-0.5">
                Matched against your extracted resume skills and target preferences.
              </p>
            </div>
            <Link to="/jobs" className="text-xs font-semibold text-[#16a34a] hover:underline flex items-center gap-1">
              Search Adzuna live &rarr;
            </Link>
          </div>

          {metrics.recommended_jobs?.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {metrics.recommended_jobs.map((job) => (
                <div key={job.id} className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{job.title}</h3>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full shrink-0">
                        {Math.round(job.match_score)}% match
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{job.company || 'Direct employer'}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link to="/jobs" className="text-xs font-semibold text-[#2563eb] hover:underline">
                      View details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <BriefcaseBusiness className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">No matched jobs stored yet</p>
              <p className="text-xs text-slate-500 mt-0.5 mb-3">Explore thousands of live vacancies on our Adzuna search engine.</p>
              <Link to="/jobs" className="px-4 py-2 bg-[#16a34a] text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-all inline-flex items-center gap-1.5 shadow-sm">
                Search Live Jobs
              </Link>
            </div>
          )}
        </section>

        {/* Real Activity Timeline */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h2 className="text-base font-bold font-jakarta text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" /> Recent Activity
          </h2>

          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((act, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {act.type === 'resume_analysis' && <FileText className="w-3.5 h-3.5 text-[#2563eb]" />}
                    {act.type === 'job_application' && <Bookmark className="w-3.5 h-3.5 text-[#16a34a]" />}
                    {act.type === 'interview' && <MessageSquare className="w-3.5 h-3.5 text-[#e26d3d]" />}
                  </div>
                  <div className="flex-1">
                    <Link to={act.link || '#'} className="font-semibold text-slate-800 hover:text-[#2563eb] line-clamp-1">
                      {act.title}
                    </Link>
                    <p className="text-slate-500 mt-0.5">{act.details}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent activity recorded. Take an action to see your timeline build.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
