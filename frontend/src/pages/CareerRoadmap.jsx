import React from 'react';
import { Check, Circle, Flag, ArrowRight, AlertCircle, LoaderCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { careerService } from '../services/careerService';

const CareerRoadmap = () => {
  const [searchParams] = useSearchParams();
  const [resumeId, setResumeId] = React.useState(searchParams.get('resumeId') || '');
  const [targetRole, setTargetRole] = React.useState(searchParams.get('targetRole') || '');
  const [roadmap, setRoadmap] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const loadRoadmap = async () => {
    if (!resumeId) return setError('Enter a resume ID to load a roadmap.');
    setLoading(true);
    setError('');
    try {
      setRoadmap(await careerService.getRoadmap(resumeId));
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Roadmap could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const createRoadmap = async () => {
    if (!resumeId || !targetRole) return setError('Enter a resume ID and target role.');
    setLoading(true);
    setError('');
    try {
      setRoadmap(await careerService.createRoadmap(resumeId, targetRole));
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Roadmap could not be created.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="page-wrap"><div className="mb-7"><span className="eyebrow">Career roadmap</span><h1 className="page-title">A plan built from your skill gaps.</h1><p className="muted mt-2">Generate and revisit the roadmap stored for your target role.</p></div><section className="surface surface-pad mb-5"><div className="flex flex-col gap-3 md:flex-row"><input className="input flex-1" type="number" value={resumeId} onChange={(event) => setResumeId(event.target.value)} placeholder="Resume ID" /><input className="input flex-1" value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="Target role" /><button className="button button-primary" onClick={createRoadmap} disabled={loading}>{loading ? <LoaderCircle className="animate-spin" size={16} /> : <ArrowRight size={16} />} Create roadmap</button><button className="button button-quiet" onClick={loadRoadmap} disabled={loading}>Load saved</button></div>{error && <p className="flex gap-2 items-center text-sm text-red-700 mt-3"><AlertCircle size={16} />{error}</p>}</section>{roadmap && <><div className="surface surface-pad mb-5"><span className="section-label">{roadmap.role?.name || targetRole}</span><div className="flex flex-wrap gap-2 mt-4">{roadmap.missing_skills.map((skill) => <span className="tag text-[#b45309] bg-[#fff4d6]" key={skill}>{skill}</span>)}</div></div><div className="grid gap-4">{roadmap.roadmap.map((phase) => <article className="surface surface-pad flex gap-5" key={phase.phase}><div className="grid place-items-center shrink-0 w-11 h-11 rounded-xl bg-[#eef2f7] text-slate-500">{phase.status === 'ready' ? <Check size={20} /> : <Circle size={19} />}</div><div className="flex-1"><div className="flex flex-wrap justify-between gap-2"><div><span className="eyebrow">Phase {phase.phase}</span><h2 className="font-display text-xl font-bold mt-1">{phase.title}</h2></div><span className="tag">{phase.status}</span></div><div className="flex flex-wrap gap-2 mt-4">{phase.skills.map((skill) => <span className="tag" key={skill}>{skill}</span>)}</div><div className="flex items-center gap-2 mt-5 text-xs font-bold text-[#e26d3d]"><Flag size={14} /> {phase.status === 'ready' ? 'Ready to begin' : 'Up next'}</div></div></article>)}</div></>}</div>;
};

export default CareerRoadmap;
