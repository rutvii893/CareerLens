import React from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, MessageSquare, PlayCircle, Target } from 'lucide-react';
import { interviewService } from '../services/interviewService';

const InterviewPrep = () => {
  const [resumeId, setResumeId] = React.useState('');
  const [targetRole, setTargetRole] = React.useState('');
  const [session, setSession] = React.useState(null);
  const [answer, setAnswer] = React.useState('');
  const [evaluation, setEvaluation] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const startSession = async () => {
    if (!resumeId || targetRole.trim().length < 2) return setError('Enter a resume ID and target role.');
    setLoading(true);
    setError('');
    try {
      setSession(await interviewService.startSession(resumeId, targetRole));
      setEvaluation(null);
      setAnswer('');
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Interview session could not be started.');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = session?.questions?.find((question) => !session.feedback?.some((item) => item.question_id === question.id));

  const submitAnswer = async () => {
    if (!currentQuestion || !answer.trim()) return setError('Write an answer before submitting.');
    setLoading(true);
    setError('');
    try {
      const result = await interviewService.evaluateAnswer(session.id, currentQuestion.id, answer);
      setEvaluation(result);
      setSession(await interviewService.getSession(session.id));
      setAnswer('');
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Answer evaluation failed.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="page-wrap"><div className="mb-7"><span className="eyebrow">Interview intelligence</span><h1 className="page-title">Practice with structured feedback.</h1><p className="muted mt-2">Questions are based on your resume and target role. Answers are scored for relevance, completeness, and concrete evidence.</p></div><section className="surface surface-pad mb-5"><div className="flex flex-col gap-3 md:flex-row"><div className="flex items-center gap-2 flex-1"><Target size={17} className="text-[#e26d3d]" /><input className="input flex-1" type="number" value={resumeId} onChange={(event) => setResumeId(event.target.value)} placeholder="Resume ID" /></div><input className="input flex-1" value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="Target role" /><button className="button button-primary" onClick={startSession} disabled={loading}>{loading ? <LoaderCircle className="animate-spin" size={16} /> : <PlayCircle size={16} />} Start session</button></div>{error && <p className="flex gap-2 items-center text-sm text-red-700 mt-3"><AlertCircle size={16} />{error}</p>}</section>{session && <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><section className="surface surface-pad"><div className="flex items-center gap-2"><MessageSquare size={18} className="text-[#e26d3d]" /><span className="section-label">{session.target_role} interview</span></div>{currentQuestion ? <><span className="tag mt-5 inline-flex">{currentQuestion.category}</span><h2 className="font-display text-2xl font-bold mt-4">{currentQuestion.prompt}</h2><textarea className="input min-h-40 w-full mt-5" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Write your answer" /><button className="button button-primary mt-4" onClick={submitAnswer} disabled={loading}>{loading ? <LoaderCircle className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Submit answer</button></> : <div className="muted text-sm mt-6">This interview is complete.</div>}</section><section className="surface surface-pad"><span className="section-label">Session score</span><div className="font-display text-5xl font-bold mt-4">{Math.round(session.score || 0)}<span className="text-xl text-slate-400">/100</span></div>{evaluation && <div className="mt-7"><span className="section-label">Latest feedback</span><p className="text-sm font-bold mt-4">Score: {evaluation.score}/100</p><ul className="grid gap-2 mt-3 text-sm">{evaluation.strengths.map((item) => <li key={item} className="text-green-700">+ {item}</li>)}{evaluation.missing_points.map((item) => <li key={item} className="text-amber-700">Add: {item}</li>)}{evaluation.improvement_feedback.map((item) => <li key={item} className="text-slate-700">{item}</li>)}</ul></div>}</section></div>}</div>;
};

export default InterviewPrep;
