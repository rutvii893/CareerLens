import React from 'react';
import { AlertCircle, Briefcase, LoaderCircle, MapPin } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { jobService } from '../services/jobService';

const JobRecommendations = () => {
  const [searchParams] = useSearchParams();
  const [resumeId, setResumeId] = React.useState(searchParams.get('resumeId') || '');
  const [jobs, setJobs] = React.useState([]);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const loadJobs = async (event) => {
    event?.preventDefault();
    if (!resumeId) return setError('Enter a resume ID to load job matches.');
    setLoading(true);
    setError('');
    try {
      setJobs(await jobService.getJobMatches(resumeId));
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Job matches could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full"><div className="mb-8"><h1 className="text-3xl font-bold font-jakarta text-[#0f172a] mb-2">Recommended Jobs</h1><p className="text-[#64748b] font-inter">Stored jobs matched against your analyzed resume.</p></div><form className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm mb-8 flex gap-3" onSubmit={loadJobs}><input className="flex-1 px-4 py-3 bg-slate-50 border border-[#e2e8f0] rounded-xl" type="number" value={resumeId} onChange={(event) => setResumeId(event.target.value)} placeholder="Resume ID" /><button className="button button-primary" type="submit" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" size={16} /> : 'Load matches'}</button></form>{error && <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-red-700 flex items-center gap-3 mb-6"><AlertCircle />{error}</div>}{!jobs.length && !loading ? <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm text-sm text-[#64748b]">No matches recorded yet. Store a job description or enter a resume ID to load matches.</div> : <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">{jobs.map((item) => <article key={item.job.id} className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm"><div className="flex justify-between items-start mb-4"><div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center"><Briefcase className="text-[#2563eb] w-6 h-6" /></div><span className="px-3 py-1 bg-green-50 text-[#16a34a] rounded-full text-sm font-semibold">{Math.round(item.match_score)}% Match</span></div><h3 className="text-xl font-bold font-jakarta text-[#0f172a] mb-2">{item.job.title}</h3><p className="text-[#64748b] text-sm">{item.job.company || 'Stored job'}</p><div className="flex items-center gap-2 text-[#64748b] text-sm mt-4"><MapPin className="w-4 h-4" />{item.job.location || 'Location not provided'}</div><div className="flex flex-wrap gap-2 mt-5">{item.matched_skills.map((skill) => <span key={skill} className="px-2.5 py-1 bg-slate-100 text-[#334155] text-xs rounded-md">{skill}</span>)}</div>{item.missing_skills.length ? <p className="text-sm text-[#b45309] mt-5">Missing: {item.missing_skills.join(', ')}</p> : <p className="text-sm text-[#16a34a] mt-5">All detected required skills matched.</p>}</article>)}</div>}</div>;
};

export default JobRecommendations;
