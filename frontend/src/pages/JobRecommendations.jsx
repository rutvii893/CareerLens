import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  ExternalLink, 
  AlertCircle, 
  LoaderCircle, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  Globe, 
  Filter, 
  CheckCircle2, 
  ArrowUpRight,
  Database,
  Layers,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Clock,
  Send,
  Building,
  Check
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { jobService } from '../services/jobService';
import { userService } from '../services/userService';

const COUNTRIES = [
  { code: 'in', label: 'India 🇮🇳' },
  { code: 'us', label: 'United States 🇺🇸' },
  { code: 'gb', label: 'United Kingdom 🇬🇧' },
  { code: 'ca', label: 'Canada 🇨🇦' },
  { code: 'de', label: 'Germany 🇩🇪' },
  { code: 'au', label: 'Australia 🇦🇺' },
  { code: 'sg', label: 'Singapore 🇸🇬' },
];

const STATUS_CONFIG = {
  saved: { label: 'Saved', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
  applied: { label: 'Applied', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  interviewing: { label: 'Interviewing', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  offer: { label: 'Offer Received', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  rejected: { label: 'Archived / Rejected', bg: 'bg-red-50 text-red-700 border-red-200' },
};

const JobRecommendations = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'saved' | 'internal'

  // Live Adzuna Search State
  const [query, setQuery] = useState(searchParams.get('q') || 'Software Engineer');
  const [location, setLocation] = useState(searchParams.get('loc') || '');
  const [country, setCountry] = useState(searchParams.get('country') || 'in');
  const [salaryMin, setSalaryMin] = useState(searchParams.get('min_salary') || '');
  const [personalized, setPersonalized] = useState(true);
  const [page, setPage] = useState(1);
  const [resultsPerPage] = useState(10);

  const [liveData, setLiveData] = useState({
    results: [],
    total_count: 0,
    page: 1,
    total_pages: 1,
    personalized: false,
    user_skills_used: []
  });
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState('');
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Saved Jobs State
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState('');

  // Stored / Internal Matches State
  const [internalResumeId, setInternalResumeId] = useState(searchParams.get('resumeId') || '');
  const [internalJobs, setInternalJobs] = useState([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState('');

  // Initial load
  useEffect(() => {
    fetchLiveJobs(1);
    fetchSavedJobs();
    userService.getDashboardMetrics()
      .then((data) => {
        if (data.active_resume_id && !internalResumeId) {
          setInternalResumeId(String(data.active_resume_id));
        }
      })
      .catch(() => {});
  }, []);

  const fetchLiveJobs = async (targetPage = 1) => {
    setLiveLoading(true);
    setLiveError('');
    try {
      const params = {
        query: query.trim() || undefined,
        location: location.trim() || undefined,
        country: country || 'in',
        page: targetPage,
        results_per_page: resultsPerPage,
        salary_min: salaryMin ? parseInt(salaryMin, 10) : undefined,
        personalized: personalized,
      };
      const data = await jobService.searchLiveJobs(params);
      setLiveData(data);
      setPage(data.page || targetPage);
    } catch (err) {
      console.error('Failed to search Adzuna jobs:', err);
      const detail = err.response?.data?.detail;
      setLiveError(detail || 'Could not load job listings. Please ensure the Adzuna API credentials are configured in backend/.env');
    } finally {
      setLiveLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    setSavedLoading(true);
    setSavedError('');
    try {
      const data = await jobService.getSavedJobs();
      setSavedJobs(data);
      const ids = new Set(data.map(j => j.job_title + j.company));
      setSavedJobIds(ids);
    } catch (err) {
      console.error('Failed to load saved jobs:', err);
      setSavedError(err.response?.data?.detail || 'Could not load saved applications.');
    } finally {
      setSavedLoading(false);
    }
  };

  const handleSaveJob = async (job) => {
    try {
      await jobService.saveJob({
        job_title: job.title,
        company: job.company,
        location: job.location,
        redirect_url: job.redirect_url,
        salary: job.formatted_salary,
        matched_skills: job.matched_skills || [],
        missing_skills: job.missing_skills || [],
        match_score: job.match_score,
        status: 'saved',
      });
      setSavedJobIds(prev => new Set([...prev, job.title + job.company]));
      setSaveSuccessMsg(`Saved "${job.title}" to your application tracker.`);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
      fetchSavedJobs();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save job.');
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await jobService.updateJobStatus(applicationId, newStatus);
      fetchSavedJobs();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleDeleteSavedJob = async (applicationId) => {
    try {
      await jobService.deleteSavedJob(applicationId);
      fetchSavedJobs();
    } catch (err) {
      alert('Failed to remove job.');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLiveJobs(1);
  };

  const loadInternalJobs = async (e) => {
    e?.preventDefault();
    if (!internalResumeId) return setInternalError('Please enter a Resume ID');
    setInternalLoading(true);
    setInternalError('');
    try {
      const data = await jobService.getJobMatches(internalResumeId);
      setInternalJobs(data);
    } catch (err) {
      setInternalError(err.response?.data?.detail || 'Could not load platform matches.');
    } finally {
      setInternalLoading(false);
    }
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
    if (score >= 60) return { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
    if (score >= 40) return { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
    return { bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  };

  return (
    <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-jakarta text-slate-900 tracking-tight">
            Job Recommendations & Search
          </h1>
          <p className="text-slate-500 font-inter mt-1">
            Search live vacancies from Adzuna with real-time CareerLens resume skill match scoring.
          </p>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {saveSuccessMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('live')}
          className={`pb-3 px-4 text-sm font-bold font-jakarta flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'live'
              ? 'border-[#2563eb] text-[#2563eb]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" /> Live Adzuna Jobs ({liveData.total_count ? liveData.total_count.toLocaleString() : 0})
        </button>

        <button
          onClick={() => {
            setActiveTab('saved');
            fetchSavedJobs();
          }}
          className={`pb-3 px-4 text-sm font-bold font-jakarta flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'saved'
              ? 'border-[#2563eb] text-[#2563eb]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bookmark className="w-4 h-4" /> Application Tracker ({savedJobs.length})
        </button>

        <button
          onClick={() => setActiveTab('internal')}
          className={`pb-3 px-4 text-sm font-bold font-jakarta flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'internal'
              ? 'border-[#2563eb] text-[#2563eb]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" /> Benchmark Roles
        </button>
      </div>

      {/* TAB 1: LIVE ADZUNA JOBS */}
      {activeTab === 'live' && (
        <>
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-4 relative">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#2563eb]"
                  placeholder="Job title, skill, or keywords..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="md:col-span-3 relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#2563eb]"
                  placeholder="City, state, or remote..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <select
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#2563eb]"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 relative">
                <DollarSign className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#2563eb]"
                  placeholder="Min salary"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                />
              </div>

              <div className="md:col-span-1">
                <button
                  type="submit"
                  disabled={liveLoading}
                  className="w-full h-full py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center shadow-sm"
                >
                  {liveLoading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : 'Search'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={personalized}
                  onChange={(e) => setPersonalized(e.target.checked)}
                  className="rounded text-[#2563eb] focus:ring-[#2563eb]"
                />
                <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" />
                Personalize matches using my resume and catalogued skills
              </label>

              {liveData.user_skills_used?.length > 0 && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span>Skills matched:</span>
                  <div className="flex flex-wrap gap-1">
                    {liveData.user_skills_used.slice(0, 6).map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-blue-50 text-[#2563eb] rounded-md text-[10px] font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>

          {liveError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <div>
                <strong className="block text-sm font-semibold">Search Notice</strong>
                <p className="text-sm mt-0.5">{liveError}</p>
              </div>
            </div>
          )}

          {liveLoading && (
            <div className="min-h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200">
              <LoaderCircle className="w-8 h-8 animate-spin text-[#2563eb] mb-3" />
              <p className="text-sm font-medium text-slate-600">Querying live job listings from Adzuna...</p>
            </div>
          )}

          {!liveLoading && !liveError && liveData.results?.length > 0 && (
            <div className="space-y-4">
              {liveData.results.map((job) => {
                const badge = getScoreBadge(job.match_score);
                const isSaved = savedJobIds.has(job.title + job.company);
                const isExpanded = expandedJobId === job.id;

                return (
                  <article
                    key={job.id}
                    className="bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-sm transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="text-lg font-bold font-jakarta text-slate-900 leading-snug">
                              {job.title}
                            </h2>
                            <p className="text-sm font-semibold text-slate-600 mt-0.5 flex items-center gap-1.5">
                              <Building className="w-4 h-4 text-slate-400" />
                              {job.company}
                              <span className="text-slate-300">•</span>
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {job.location}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                          {job.formatted_salary && (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-lg font-bold">
                              {job.formatted_salary}
                            </span>
                          )}
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
                            {job.job_type}
                          </span>
                          {job.category && (
                            <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg border border-slate-200/70 font-medium">
                              {job.category}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 mt-3 leading-relaxed">
                          <p>{isExpanded ? job.description : (job.description?.slice(0, 220) + (job.description?.length > 220 ? '...' : ''))}</p>
                          {job.description?.length > 220 && (
                            <button
                              onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                              className="text-xs font-bold text-[#2563eb] hover:underline mt-1"
                            >
                              {isExpanded ? 'Show less' : 'Read more'}
                            </button>
                          )}
                        </div>

                        {(job.matched_skills?.length > 0 || job.missing_skills?.length > 0) && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 text-xs">
                            {job.matched_skills.map((s) => (
                              <span key={s} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {s}
                              </span>
                            ))}
                            {job.missing_skills.map((s) => (
                              <span key={s} className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-medium">
                                + {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Score & Actions */}
                      <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        {personalized && job.match_score > 0 ? (
                          <div className={`px-3.5 py-2 rounded-xl border text-right ${badge.bg}`}>
                            <div className="flex items-center gap-1.5 justify-end">
                              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                              <span className="text-base font-extrabold font-jakarta">{job.match_score}%</span>
                            </div>
                            <span className="text-[10px] block font-semibold uppercase tracking-wider opacity-90">
                              Skill Match
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 font-medium">Adzuna Verified</div>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveJob(job)}
                            disabled={isSaved}
                            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
                              isSaved
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
                            }`}
                          >
                            {isSaved ? <BookmarkCheck className="w-4 h-4 text-emerald-600" /> : <Bookmark className="w-4 h-4" />}
                            {isSaved ? 'Saved' : 'Save Job'}
                          </button>

                          <a
                            href={job.redirect_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            Apply <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!liveLoading && !liveError && liveData.total_pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => fetchLiveJobs(page - 1)}
                disabled={page <= 1 || liveLoading}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <span className="text-xs font-bold text-slate-600">
                Page {page} of {liveData.total_pages}
              </span>

              <button
                onClick={() => fetchLiveJobs(page + 1)}
                disabled={page >= liveData.total_pages || liveLoading}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1 shadow-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* TAB 2: APPLICATION TRACKER */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-jakarta text-slate-900">
              Tracked Job Applications ({savedJobs.length})
            </h2>
            <p className="text-xs text-slate-500">
              Keep track of interview stages, offers, and submitted applications.
            </p>
          </div>

          {savedLoading && (
            <div className="min-h-48 flex items-center justify-center">
              <LoaderCircle className="w-8 h-8 animate-spin text-[#2563eb]" />
            </div>
          )}

          {savedError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm">
              {savedError}
            </div>
          )}

          {!savedLoading && savedJobs.length === 0 && (
            <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8">
              <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">No saved jobs yet</h3>
              <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                Search vacancies on the Live Adzuna tab and click "Save Job" to track your applications here.
              </p>
              <button
                onClick={() => setActiveTab('live')}
                className="px-4 py-2 bg-[#2563eb] text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
              >
                Browse Live Jobs
              </button>
            </div>
          )}

          {!savedLoading && savedJobs.length > 0 && (
            <div className="grid gap-4">
              {savedJobs.map((app) => {
                const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.saved;
                return (
                  <div
                    key={app.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-bold font-jakarta text-slate-900 text-base">{app.job_title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{app.company || 'Direct'}</span>
                        {app.location && <span>• {app.location}</span>}
                        {app.salary && <span>• {app.salary}</span>}
                      </p>
                      {app.match_score > 0 && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md">
                          {Math.round(app.match_score)}% Resume Match
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        className={`text-xs font-bold px-3 py-2 rounded-xl border ${statusCfg.bg} cursor-pointer focus:outline-none`}
                      >
                        <option value="saved">Saved</option>
                        <option value="applied">Applied</option>
                        <option value="interviewing">Interviewing</option>
                        <option value="offer">Offer Received</option>
                        <option value="rejected">Archived</option>
                      </select>

                      {app.redirect_url && (
                        <a
                          href={app.redirect_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200"
                          title="Open application URL"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        onClick={() => handleDeleteSavedJob(app.id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete from tracker"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BENCHMARK ROLES */}
      {activeTab === 'internal' && (
        <div className="space-y-6">
          <form onSubmit={loadInternalJobs} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex gap-3">
            <input
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              type="number"
              value={internalResumeId}
              onChange={(e) => setInternalResumeId(e.target.value)}
              placeholder="Enter your Resume ID to calculate benchmark overlap"
            />
            <button
              className="px-5 py-2.5 bg-[#2563eb] text-white font-semibold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50"
              type="submit"
              disabled={internalLoading}
            >
              {internalLoading ? <LoaderCircle className="animate-spin w-4 h-4" /> : 'Load Matches'}
            </button>
          </form>

          {internalError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm">
              {internalError}
            </div>
          )}

          {!internalJobs.length && !internalLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 text-center py-12 p-6 text-sm text-slate-500">
              No benchmark matches loaded. Enter your analyzed Resume ID above to view platform role benchmarks.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {internalJobs.map((item) => (
                <article key={item.job.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold font-jakarta text-slate-900 text-base">{item.job.title}</h3>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-full">
                        {Math.round(item.match_score)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{item.job.company || 'Standard Role Benchmark'}</p>
                    <p className="text-xs text-slate-600 mt-3 line-clamp-3">{item.job.description}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobRecommendations;
