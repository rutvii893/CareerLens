import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  FileSearch,
  FileText,
  Layers,
  Lightbulb,
  LoaderCircle,
  Percent,
  Search,
  Sparkles,
  Target,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { resumeService } from '../services/resumeService';
import { jobService } from '../services/jobService';

const ResumeAnalysis = () => {
  const [searchParams] = useSearchParams();
  const [resumeId, setResumeId] = useState(searchParams.get('resumeId') || '');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Job Description Matcher State
  const [jobDescription, setJobDescription] = useState('');
  const [jobMatchResult, setJobMatchResult] = useState(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingError, setMatchingError] = useState('');

  useEffect(() => {
    const id = searchParams.get('resumeId');
    if (id) {
      setResumeId(id);
      loadAnalysis(id);
    }
  }, [searchParams]);

  const loadAnalysis = async (idToLoad) => {
    const targetId = idToLoad || resumeId;
    if (!targetId) return;

    setLoading(true);
    setError('');
    try {
      const data = await resumeService.getAnalysis(targetId);
      setAnalysis(data);
    } catch (err) {
      console.error('Failed to load resume analysis:', err);
      setError(err.response?.data?.detail || 'Resume analysis could not be retrieved.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeJobMatch = async (e) => {
    e?.preventDefault();
    if (!jobDescription.trim() || jobDescription.trim().length < 20) {
      setMatchingError('Please paste a job description with at least 20 characters.');
      return;
    }

    setMatchingLoading(true);
    setMatchingError('');
    try {
      const result = await jobService.analyzeJobMatch(Number(resumeId), jobDescription.trim());
      setJobMatchResult(result);
    } catch (err) {
      console.error('Job match analysis failed:', err);
      setMatchingError(err.response?.data?.detail || 'Failed to analyze job match.');
    } finally {
      setMatchingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full min-h-[60vh] flex flex-col items-center justify-center">
        <LoaderCircle className="w-10 h-10 animate-spin text-[#2563eb] mb-4" />
        <p className="text-slate-600 font-medium font-inter">Running resume intelligence and ATS evaluation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold font-jakarta text-base">Analysis Unavailable</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <Link to="/resume" className="inline-block mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold">
              Upload a new resume &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full">
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto shadow-sm">
          <FileSearch className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold font-jakarta text-slate-900 mb-2">No Analysis Selected</h2>
          <p className="text-sm text-slate-500 font-inter mb-6">
            Upload a resume in PDF or DOCX format to receive instant ATS evaluation and actionable improvement advice.
          </p>
          <Link
            to="/resume"
            className="px-6 py-3 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-xl font-semibold text-sm shadow-md inline-flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" /> Upload Resume
          </Link>
        </div>
      </div>
    );
  }

  const sections = analysis.section_analysis || {};
  const sectionList = ['summary', 'experience', 'education', 'skills', 'projects'];

  return (
    <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 bg-purple-50 text-[#7c3aed] border border-purple-200/60 rounded-md text-xs font-bold uppercase tracking-wider">
            Resume Intelligence
          </span>
          <h1 className="text-3xl font-extrabold font-jakarta text-slate-900 tracking-tight mt-1">
            Resume Audit & ATS Diagnostics
          </h1>
          <p className="text-slate-500 font-inter mt-1">
            Transparent breakdown of resume structure, keyword coverage, detected skills, and job match compatibility.
          </p>
        </div>

        <Link
          to="/resume"
          className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-sm flex items-center gap-2 shrink-0"
        >
          <UploadCloud className="w-4 h-4" /> Upload Different Resume
        </Link>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Structural ATS Score */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              General Resume Score
            </span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-extrabold font-jakarta text-[#2563eb]">
                {Math.round(analysis.overall_score || 0)}
              </span>
              <span className="text-slate-400 font-semibold">/100</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Based on section completeness, content density, and formatting.
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
            <div
              className="bg-[#2563eb] h-2 rounded-full"
              style={{ width: `${analysis.overall_score || 0}%` }}
            />
          </div>
        </div>

        {/* Keyword Coverage */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Core Section Keyword Coverage
            </span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-extrabold font-jakarta text-[#7c3aed]">
                {Math.round(analysis.keyword_score || 0)}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Standard ATS section headers detected in document.
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
            <div
              className="bg-[#7c3aed] h-2 rounded-full"
              style={{ width: `${analysis.keyword_score || 0}%` }}
            />
          </div>
        </div>

        {/* Extracted Skills Count */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Detected Skills
            </span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-extrabold font-jakarta text-[#e26d3d]">
                {analysis.extracted_skills?.length || 0}
              </span>
              <span className="text-slate-400 font-semibold text-xs">skills catalogued</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verified against technical, framework, and tooling taxonomies.
            </p>
          </div>
          <Link to="/skills" className="text-xs font-bold text-[#e26d3d] hover:underline mt-4 inline-block">
            View on skills dashboard &rarr;
          </Link>
        </div>
      </div>

      {/* Main Analysis Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sections and Extracted Skills */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section Diagnostic Checklist */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-base font-bold font-jakarta text-slate-900 mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#2563eb]" /> Resume Section Audit
            </h2>

            <div className="space-y-3">
              {sectionList.map((secKey) => {
                const isPresent = sections[secKey]?.present ?? !analysis.missing_keywords?.map(k => k.toLowerCase()).includes(secKey);
                return (
                  <div
                    key={secKey}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      {isPresent ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <span className="text-sm font-bold text-slate-800 capitalize">{secKey} Section</span>
                        <p className="text-xs text-slate-500">
                          {isPresent
                            ? 'Detected with standard header terminology'
                            : 'Missing or uses non-standard header naming'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                        isPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isPresent ? 'Passed' : 'Needs Header'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detected Skills Cloud */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-base font-bold font-jakarta text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#e26d3d]" /> Detected Skills ({analysis.extracted_skills?.length || 0})
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              These terms were extracted directly from your resume text and are used to match live vacancies.
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.extracted_skills?.length > 0 ? (
                analysis.extracted_skills.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200/60"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">No catalogued skills detected.</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Recommendations */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-base font-bold font-jakarta text-slate-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-[#7c3aed]" /> Actionable Suggestions
            </h2>

            {analysis.recommendations?.length > 0 ? (
              <div className="space-y-3">
                {analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3.5 bg-purple-50/50 border border-purple-100 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#7c3aed] shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">{rec}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Your resume satisfies all core scanner recommendations.</p>
            )}
          </div>
        </div>
      </div>

      {/* JOB-SPECIFIC ATS MATCHER SECTION */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-[#2563eb]" />
            <h2 className="text-lg font-bold font-jakarta text-slate-900">
              Job-Specific ATS Match Calculator
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Compare this resume directly against a specific job description to identify matching competencies, missing requirements, and a dedicated role match percentage.
          </p>
        </div>

        <form onSubmit={handleAnalyzeJobMatch} className="space-y-3">
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here (requirements, responsibilities, required tech stack)..."
            rows={5}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2563eb] leading-relaxed"
          />

          {matchingError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              {matchingError}
            </div>
          )}

          <button
            type="submit"
            disabled={matchingLoading || !jobDescription.trim()}
            className="px-6 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {matchingLoading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Calculate Job-Specific ATS Match
          </button>
        </form>

        {jobMatchResult && (
          <div className="mt-6 p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Job Match Score</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-extrabold font-jakarta text-[#2563eb]">
                    {Math.round(jobMatchResult.match_score)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 max-w-sm">
                Calculated using exact skill keyword overlap and semantic contextual similarity.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-emerald-700 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4" /> Matched Skills ({jobMatchResult.matched_skills?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {jobMatchResult.matched_skills?.length > 0 ? (
                    jobMatchResult.matched_skills.map((s) => (
                      <span key={s} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md font-medium border border-emerald-200">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">No overlapping skills detected.</span>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-amber-700 flex items-center gap-1.5 mb-2">
                  <XCircle className="w-4 h-4" /> Missing Job Requirements ({jobMatchResult.missing_skills?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {jobMatchResult.missing_skills?.length > 0 ? (
                    jobMatchResult.missing_skills.map((s) => (
                      <span key={s} className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md font-medium border border-amber-200">
                        + {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">No missing requirement keywords detected.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeAnalysis;
