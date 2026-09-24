import React from 'react';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { careerService } from '../services/careerService';

const CareerCoach = () => {
  const [searchParams] = useSearchParams();
  const [resumeId, setResumeId] = React.useState(searchParams.get('resumeId') || '');
  const [roles, setRoles] = React.useState([]);
  const [targetRole, setTargetRole] = React.useState('');
  const [analysis, setAnalysis] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    careerService.getRoles().then((availableRoles) => {
      setRoles(availableRoles);
      setTargetRole(availableRoles[0]?.name || '');
    }).catch((requestError) => setError(requestError.response?.data?.detail || 'Career roles could not be loaded.')).finally(() => setLoading(false));
  }, []);

  const analyze = async () => {
    if (!resumeId || !targetRole) return setError('Enter a resume ID and select a target role.');
    setLoading(true);
    setError('');
    try {
      setAnalysis(await careerService.analyzeSkillGap(resumeId, targetRole));
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Skill gap analysis could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="page-wrap"><div className="mb-7"><span className="eyebrow">Career intelligence</span><h1 className="page-title">Choose the skills you want next.</h1><p className="muted mt-2">Compare your resume with a target role and turn the gaps into a plan.</p></div><section className="surface surface-pad"><div className="flex flex-col gap-3 md:flex-row"><input className="input flex-1" type="number" value={resumeId} onChange={(event) => setResumeId(event.target.value)} placeholder="Resume ID" /><select className="input flex-1" value={targetRole} onChange={(event) => setTargetRole(event.target.value)}><option value="">Select target role</option>{roles.map((role) => <option value={role.name} key={role.id}>{role.name}</option>)}</select><button className="button button-primary" onClick={analyze} disabled={loading}>{loading ? <LoaderCircle className="animate-spin" size={16} /> : 'Analyze gap'}</button></div>{error && <p className="flex gap-2 items-center text-sm text-red-700 mt-3"><AlertCircle size={16} />{error}</p>}</section>{analysis && <div className="grid gap-5 lg:grid-cols-2 mt-5"><section className="surface surface-pad"><span className="section-label">Current skills</span><div className="flex flex-wrap gap-2 mt-5">{analysis.current_skills.map((skill) => <span className="tag" key={skill}>{skill}</span>)}</div></section><section className="surface surface-pad"><span className="section-label">Skill gaps</span><div className="flex flex-wrap gap-2 mt-5">{analysis.missing_skills.length ? analysis.missing_skills.map((skill) => <span className="tag text-[#b45309] bg-[#fff4d6]" key={skill}>{skill}</span>) : <p className="muted text-sm">No required skills are missing for this role.</p>}</div><button className="button button-quiet mt-6" onClick={() => window.location.assign(`/career/roadmap?resumeId=${resumeId}&targetRole=${encodeURIComponent(targetRole)}`)}>Build roadmap</button></section></div>}</div>;
};

export default CareerCoach;
