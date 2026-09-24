import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, FileSearch, LoaderCircle } from 'lucide-react';
import { resumeService } from '../services/resumeService';

const ResumeAnalysis = () => {
  const [searchParams] = useSearchParams();
  const [analysis, setAnalysis] = React.useState(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const resumeId = searchParams.get('resumeId');
    if (!resumeId) return;
    resumeService.getAnalysis(resumeId).then(setAnalysis).catch((requestError) => setError(requestError.response?.data?.detail || 'Analysis could not be loaded.'));
  }, [searchParams]);

  if (error) return <div className="page-wrap"><div className="surface surface-pad flex gap-3 text-red-700"><AlertCircle />{error}</div></div>;
  if (!analysis) return <div className="page-wrap"><div className="surface surface-pad min-h-48 grid place-items-center text-center"><LoaderCircle className="animate-spin text-[#e26d3d]" /><p className="muted text-sm mt-3">{searchParams.get('resumeId') ? 'Loading your analysis...' : 'Upload a resume to see its analysis.'}</p></div></div>;

  return (
    <div className="page-wrap"><div className="mb-8"><span className="eyebrow">Resume intelligence</span><h1 className="page-title">Your resume, decoded.</h1><p className="muted mt-2">Actionable signals from the file you uploaded.</p></div><div className="grid gap-5 lg:grid-cols-[.75fr_1.25fr] mb-5"><section className="surface surface-pad"><span className="section-label">ATS score</span><div className="font-display text-6xl font-bold mt-5 text-[#132d5c]">{Math.round(analysis.overall_score)}<span className="text-2xl text-slate-400">/100</span></div><div className="progress-track mt-5"><div className="progress-fill" style={{ width: `${analysis.overall_score}%` }} /></div><p className="muted text-sm mt-4">Keyword coverage: <strong className="text-[#14213d]">{Math.round(analysis.keyword_score)}%</strong></p></section><section className="surface surface-pad"><div className="flex items-center gap-2"><FileSearch size={18} className="text-[#e26d3d]" /><span className="section-label">Detected skills</span></div><div className="flex flex-wrap gap-2 mt-5">{analysis.extracted_skills.length ? analysis.extracted_skills.map((skill) => <span className="tag" key={skill}>{skill}</span>) : <p className="muted text-sm">No catalogued skills were detected.</p>}</div></section></div><div className="grid gap-5 lg:grid-cols-2"><section className="surface surface-pad"><span className="section-label">Sections to strengthen</span><div className="grid gap-3 mt-5">{analysis.missing_keywords.length ? analysis.missing_keywords.map((keyword) => <div className="flex gap-3 items-center text-sm" key={keyword}><AlertCircle size={17} className="text-[#e26d3d]" />Add a clear {keyword} section</div>) : <div className="flex gap-3 items-center text-sm"><CheckCircle2 size={17} className="text-green-600" />Core resume sections detected</div>}</div></section><section className="surface surface-pad"><span className="section-label">Actionable suggestions</span><div className="grid gap-3 mt-5">{analysis.recommendations.map((recommendation) => <div className="flex gap-3 items-start text-sm" key={recommendation}><CheckCircle2 size={17} className="mt-0.5 text-[#e26d3d]" />{recommendation}</div>)}</div></section></div></div>
  );
};

export default ResumeAnalysis;
