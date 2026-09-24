import React from 'react';
import { AlertCircle, LoaderCircle, Send, Target } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { careerService } from '../services/careerService';

const CareerCoach = () => {
  const [searchParams] = useSearchParams();
  const [resumeId, setResumeId] = React.useState(searchParams.get('resumeId') || '');
  const [targetRole, setTargetRole] = React.useState(searchParams.get('targetRole') || '');
  const [question, setQuestion] = React.useState('');
  const [response, setResponse] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const askCoach = async () => {
    if (question.trim().length < 3) return setError('Ask a career question with at least 3 characters.');
    setLoading(true);
    setError('');
    try {
      setResponse(await careerService.askCoach(question, resumeId, targetRole));
      setQuestion('');
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'The career coach could not respond.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="page-wrap"><div className="mb-7"><span className="eyebrow">Career coach</span><h1 className="page-title">Ask about your next move.</h1><p className="muted mt-2">Responses use your stored resume, skills, target role, gaps, and roadmap.</p></div><section className="surface surface-pad mb-5"><div className="flex flex-col gap-3 md:flex-row"><div className="flex items-center gap-2 flex-1"><Target size={17} className="text-[#e26d3d]" /><input className="input flex-1" type="number" value={resumeId} onChange={(event) => setResumeId(event.target.value)} placeholder="Resume ID (optional)" /></div><input className="input flex-1" value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="Target role (optional)" /></div><textarea className="input mt-3 min-h-28 w-full" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a career-related question" /><button className="button button-primary mt-3" onClick={askCoach} disabled={loading}>{loading ? <LoaderCircle className="animate-spin" size={16} /> : <Send size={16} />} Ask coach</button>{error && <p className="flex gap-2 items-center text-sm text-red-700 mt-3"><AlertCircle size={16} />{error}</p>}</section>{response && <section className="surface surface-pad"><div className="flex flex-wrap justify-between gap-3"><span className="section-label">Coach response</span><span className="tag">{response.provider}</span></div><p className="whitespace-pre-wrap text-sm leading-7 mt-5">{response.answer}</p><div className="grid gap-5 md:grid-cols-2 mt-7"><div><span className="section-label">Current skills</span><div className="flex flex-wrap gap-2 mt-3">{response.current_skills.length ? response.current_skills.map((skill) => <span className="tag" key={skill}>{skill}</span>) : <p className="muted text-sm mt-3">No catalogued skills found.</p>}</div></div><div><span className="section-label">Recorded skill gaps</span><div className="flex flex-wrap gap-2 mt-3">{response.missing_skills.length ? response.missing_skills.map((skill) => <span className="tag text-[#b45309] bg-[#fff4d6]" key={skill}>{skill}</span>) : <p className="muted text-sm mt-3">No role-specific gaps recorded.</p>}</div></div></div></section>}</div>;
};

export default CareerCoach;
