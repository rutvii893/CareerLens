import React from 'react';
import { FileUp, CheckCircle2, ArrowRight, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { resumeService } from '../services/resumeService';

const ResumeAnalyzer = () => {
  const navigate = useNavigate();
  const [file, setFile] = React.useState(null);
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState('');

  const upload = async () => {
    if (!file) return;
    setStatus('Analyzing your resume...');
    setError('');
    try {
      const result = await resumeService.uploadResume(file);
      navigate(`/resume/analysis?resumeId=${result.id}`);
    } catch (uploadError) {
      setStatus('');
      setError(uploadError.response?.data?.detail || 'We could not analyze that file. Please try again.');
    }
  };

  return (
    <div className="page-wrap"><div className="mb-8"><span className="eyebrow">Resume workspace</span><h1 className="page-title">Make your experience easier to find.</h1><p className="muted mt-2 max-w-2xl">Upload your latest resume to review structure, keywords, and the story your experience tells.</p></div><div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]"><section className="surface surface-pad"><div className="dropzone"><div className="grid place-items-center gap-3"><div className="grid place-items-center w-14 h-14 rounded-2xl bg-[#fbe5dc] text-[#e26d3d]"><FileUp size={25} /></div><div><h2 className="font-display text-xl font-bold">{file ? file.name : 'Choose your resume'}</h2><p className="muted text-sm mt-1">PDF or DOCX, up to 10 MB</p></div><input id="resume-file" className="hidden" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setFile(event.target.files?.[0] || null)} /><label className="button button-quiet mt-2 cursor-pointer" htmlFor="resume-file">Browse files <FileText size={16} /></label><button className="button button-primary mt-1" type="button" disabled={!file || Boolean(status)} onClick={upload}>{status || 'Upload and analyze'} <ArrowRight size={16} /></button>{error && <p className="text-xs font-bold text-red-600">{error}</p>}<p className="muted text-xs">Your file stays private to your workspace.</p></div></div></section><section className="surface surface-pad"><span className="section-label">What we check</span><div className="grid gap-4 mt-5">{['Clear impact and outcomes','Role-relevant keywords','Readable structure','Missing skills to strengthen'].map((item) => <div className="flex items-center gap-3 text-sm" key={item}><CheckCircle2 size={18} className="text-[#e26d3d]" />{item}</div>)}</div><Link to="/resume/analysis" className="button button-quiet mt-7 w-full">Open latest analysis <FileText size={16} /></Link></section></div></div>
  );
};

export default ResumeAnalyzer;
