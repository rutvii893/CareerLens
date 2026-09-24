import React from 'react';
import { Search, MapPin, ArrowUpRight, AlertCircle, LoaderCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { jobService } from '../services/jobService';

const JobRecommendations = () => {
  const [searchParams] = useSearchParams();
  const [resumeId, setResumeId] = React.useState(searchParams.get('resumeId') || '');
  const [description, setDescription] = React.useState('');
  const [jobs, setJobs] = React.useState([]);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const loadJobs = async () => {
    if (!resumeId) return setError('Enter a resume ID to calculate job matches.');
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

  const analyzeDescription = async () => {
    if (!resumeId || description.trim().length < 20) return setError('Enter a resume ID and a job description of at least 20 characters.');
    setLoading(true);
    setError('');
    try {
      const result = await jobService.analyzeJobMatch(resumeId, description);
      setJobs((current) => [{ ...result, job: { id: 'custom', title: 'Custom job description', company: null, location: null, required_skills: result.matched_skills.concat(result.missing_skills) } }, ...current]);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Job description could not be analyzed.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="page-wrap"><div className="mb-7"><span className="eyebrow">Job matching</span><h1 className="page-title">Roles that fit your direction.</h1><p className="muted mt-2">Compare your resume skills with stored job requirements.</p></div><div className="surface surface-pad mb-5"><div className="flex flex-col gap-3 md:flex-row"><input className="input flex-1" type="number" value={resumeId} onChange={(event) => setResumeId(event.target.value)} placeholder="Resume ID" /><button className="button button-primary" onClick={loadJobs} disabled={loading}>{loading ? <LoaderCircle className="animate-spin" size={16} /> : <Search size={16} />} Load matches</button></div><textarea className="input mt-3 min-h-28 w-full" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Paste a job description to analyze it against this resume" /><button className="button button-quiet mt-3" onClick={analyzeDescription} disabled={loading}>Analyze job description</button>{error && <p className="flex gap-2 items-center text-sm text-red-700 mt-3"><AlertCircle size={16} />{error}</p>}</div>{!jobs.length && !loading ? <div className="surface surface-pad muted text-sm">No job matches yet. Load stored jobs or analyze a job description.</div> : <div className="grid gap-4 lg:grid-cols-2">{jobs.map((item) => <article className="surface surface-pad" key={`${item.job.id}-${item.match_score || 'custom'}`}><div className="flex justify-between gap-3"><div><span className="tag text-[#e26d3d] bg-[#fbe5dc]">{Math.round(item.match_score || 0)}% match</span><h2 className="font-display text-xl font-bold mt-4">{item.job.title}</h2><p className="muted text-sm mt-1">{item.job.company || 'Custom analysis'}</p></div><ArrowUpRight size={18} /></div><div className="flex items-center gap-2 muted text-xs mt-6"><MapPin size={15} />{item.job.location || 'Resume skill comparison'}</div><div className="flex flex-wrap gap-2 mt-5">{(item.matched_skills || item.job.required_skills || []).map((skill) => <span className="tag" key={skill}>{skill}</span>)}</div>{item.missing_skills?.length ? <p className="text-sm text-[#b45309] mt-4">Missing: {item.missing_skills.join(', ')}</p> : null}</article>)}</div>}</div>;
};

export default JobRecommendations;
