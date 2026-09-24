import React from 'react';
import { AlertCircle, LoaderCircle, Sparkles } from 'lucide-react';
import { userService } from '../services/userService';

const SkillsDashboard = () => {
  const [metrics, setMetrics] = React.useState(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    userService.getDashboardMetrics().then(setMetrics).catch((requestError) => setError(requestError.response?.data?.detail || 'Skills could not be loaded.'));
  }, []);

  if (error) return <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full"><div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-red-700 flex items-center gap-3"><AlertCircle />{error}</div></div>;
  if (!metrics) return <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full min-h-64 grid place-items-center"><LoaderCircle className="animate-spin text-[#2563eb]" /></div>;

  return <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full"><div className="mb-8"><h1 className="text-3xl font-bold font-jakarta text-[#0f172a] mb-2">My Skills</h1><p className="text-[#64748b] font-inter">Skills detected from your latest stored resume analysis.</p></div><section className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm"><div className="flex items-center gap-2 mb-6"><Sparkles className="text-[#e26d3d]" /><h2 className="text-lg font-bold font-jakarta text-[#0f172a]">Detected skills</h2></div>{metrics.extracted_skills.length ? <div className="flex flex-wrap gap-3">{metrics.extracted_skills.map((skill) => <span className="px-4 py-2 bg-slate-100 rounded-full text-sm font-medium" key={skill}>{skill}</span>)}</div> : <p className="text-sm text-[#64748b]">Upload and analyze a resume to populate your skills.</p>}</section></div>;
};

export default SkillsDashboard;
