import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  HelpCircle,
  History,
  Layers,
  Lightbulb,
  LoaderCircle,
  MessageSquare,
  PlayCircle,
  RefreshCw,
  Sparkles,
  Target,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { interviewService } from '../services/interviewService';
import { userService } from '../services/userService';

const InterviewPrep = () => {
  const [searchParams] = useSearchParams();
  const [resumeId, setResumeId] = useState(searchParams.get('resumeId') || '');
  const [targetRole, setTargetRole] = useState(searchParams.get('targetRole') || '');
  const [interviewType, setInterviewType] = useState('Mixed');
  const [activeTab, setActiveTab] = useState('practice'); // 'practice' | 'history'

  const [session, setSession] = useState(null);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    userService.getDashboardMetrics()
      .then((data) => {
        if (data.active_resume_id && !resumeId) {
          setResumeId(String(data.active_resume_id));
        }
        if (data.roadmap_progress?.target_role && !targetRole) {
          setTargetRole(data.roadmap_progress.target_role);
        }
      })
      .catch(() => {});

    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await interviewService.getSessions();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load past sessions:', err);
    }
  };

  const handleStartSession = async (e) => {
    e?.preventDefault();
    if (!targetRole.trim() || targetRole.trim().length < 2) {
      setError('Please enter a target role to practice.');
      return;
    }

    setLoading(true);
    setError('');
    setEvaluation(null);
    setAnswer('');
    try {
      const newSession = await interviewService.startSession(
        resumeId ? Number(resumeId) : null,
        targetRole.trim(),
        interviewType
      );
      setSession(newSession);
      fetchHistory();
    } catch (err) {
      console.error('Failed to start interview:', err);
      setError(err.response?.data?.detail || 'Failed to start interview session.');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = session?.questions?.find(
    (q) => !session.feedback?.some((item) => item.question_id === q.id)
  );

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !answer.trim()) {
      setError('Please type an answer before submitting.');
      return;
    }

    setEvaluating(true);
    setError('');
    try {
      const result = await interviewService.evaluateAnswer(session.id, currentQuestion.id, answer.trim());
      setEvaluation(result);
      const updatedSession = await interviewService.getSession(session.id);
      setSession(updatedSession);
      setAnswer('');
      fetchHistory();
    } catch (err) {
      console.error('Evaluation failed:', err);
      setError(err.response?.data?.detail || 'Answer evaluation failed.');
    } finally {
      setEvaluating(false);
    }
  };

  const totalQuestions = session?.questions?.length || 0;
  const answeredCount = session?.feedback?.length || 0;
  const isComplete = totalQuestions > 0 && answeredCount === totalQuestions;

  return (
    <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-jakarta text-slate-900 tracking-tight">
            Interview Preparation & AI Scoring
          </h1>
          <p className="text-slate-500 font-inter mt-1">
            Simulate real technical and behavioral interview questions tailored to your skills.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('practice')}
          className={`pb-3 px-4 text-sm font-bold font-jakarta flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'practice'
              ? 'border-[#2563eb] text-[#2563eb]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Live Practice
        </button>

        <button
          onClick={() => {
            setActiveTab('history');
            fetchHistory();
          }}
          className={`pb-3 px-4 text-sm font-bold font-jakarta flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-[#2563eb] text-[#2563eb]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" /> Past Sessions ({history.length})
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {/* PRACTICE TAB */}
      {activeTab === 'practice' && (
        <div className="space-y-6">
          {/* Start Session Setup Form */}
          <form onSubmit={handleStartSession} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-[#e26d3d]" />
              <h2 className="text-base font-bold font-jakarta text-slate-900">Configure Mock Interview</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5">
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="Target role (e.g. Senior React Developer)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#e26d3d]"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#e26d3d]"
                >
                  <option value="Mixed">Mixed (Technical + Behavioral)</option>
                  <option value="Technical">Technical Only</option>
                  <option value="Behavioral">Behavioral Only</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <input
                  type="number"
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                  placeholder="Resume ID"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#e26d3d]"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading || !targetRole.trim()}
                  className="w-full py-2.5 bg-[#e26d3d] hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                  Start
                </button>
              </div>
            </div>
          </form>

          {/* Active Interview Workspace */}
          {session && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Question & Answer Area */}
              <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#e26d3d]">
                      {session.target_role} Mock Session
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Progress: {answeredCount} of {totalQuestions} questions answered
                    </p>
                  </div>
                  {session.score !== null && (
                    <span className="px-3 py-1 bg-orange-50 text-[#e26d3d] border border-orange-200 font-bold text-xs rounded-full">
                      Avg Score: {Math.round(session.score)}/100
                    </span>
                  )}
                </div>

                {currentQuestion ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-bold uppercase tracking-wider">
                        {currentQuestion.category}
                      </span>
                      <span className="text-xs text-slate-400">Question {currentQuestion.id} of {totalQuestions}</span>
                    </div>

                    <h2 className="text-xl font-bold font-jakarta text-slate-900 leading-snug">
                      {currentQuestion.prompt}
                    </h2>

                    {currentQuestion.expected_points?.length > 0 && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-600 block mb-1">
                          Key Evaluation Criteria:
                        </span>
                        <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                          {currentQuestion.expected_points.map((pt, idx) => (
                            <li key={idx}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        Your Detailed Response:
                      </label>
                      <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Write a structured response explaining the situation, technical decisions, trade-offs, and tangible results..."
                        rows={6}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#e26d3d] focus:bg-white transition-all leading-relaxed"
                      />
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Tip: Concrete metrics and architecture specifics score higher.</span>
                        <span>{answer.split(/\s+/).filter(Boolean).length} words</span>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmitAnswer}
                      disabled={evaluating || !answer.trim()}
                      className="w-full py-3 bg-[#e26d3d] hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {evaluating ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Submit for Evaluation
                    </button>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
                    <h2 className="text-xl font-bold font-jakarta text-slate-900">
                      Interview Complete!
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 mb-6">
                      You answered all {totalQuestions} questions with an overall score of {Math.round(session.score || 0)}/100.
                    </p>
                    <button
                      onClick={handleStartSession}
                      className="px-6 py-2.5 bg-[#e26d3d] text-white rounded-xl text-xs font-bold hover:bg-orange-600"
                    >
                      Start Another Session
                    </button>
                  </div>
                )}
              </div>

              {/* Instant Evaluation Feedback Panel */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                  <h3 className="text-sm font-bold font-jakarta text-slate-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#e26d3d]" /> Live Answer Feedback
                  </h3>

                  {evaluation ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">Question Score</span>
                        <span className="text-xl font-extrabold font-jakarta text-[#e26d3d]">
                          {Math.round(evaluation.score)}<span className="text-xs text-slate-400">/100</span>
                        </span>
                      </div>

                      {evaluation.strengths?.length > 0 && (
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1.5">
                            Strengths Identified
                          </span>
                          <ul className="space-y-1">
                            {evaluation.strengths.map((s, idx) => (
                              <li key={idx} className="text-xs text-emerald-800 flex items-start gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {evaluation.missing_points?.length > 0 && (
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block mb-1.5">
                            Missing Key Points
                          </span>
                          <ul className="space-y-1">
                            {evaluation.missing_points.map((m, idx) => (
                              <li key={idx} className="text-xs text-amber-800 flex items-start gap-1.5">
                                <XCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <span>{m}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {evaluation.improvement_feedback?.length > 0 && (
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                            Improvement Suggestions
                          </span>
                          <ul className="space-y-1">
                            {evaluation.improvement_feedback.map((imp, idx) => (
                              <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                                <Lightbulb className="w-3.5 h-3.5 text-[#e26d3d] shrink-0 mt-0.5" />
                                <span>{imp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Submit an answer to receive instant scoring and feedback.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-jakarta text-slate-900">
              Completed & In-Progress Sessions ({history.length})
            </h2>
          </div>

          {history.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {history.map((sess) => (
                <div key={sess.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold font-jakarta text-slate-900 text-base">{sess.target_role || 'General Interview'}</h3>
                      <span className="px-2.5 py-0.5 bg-orange-50 text-[#e26d3d] font-bold text-xs rounded-full">
                        {sess.score !== null ? `${Math.round(sess.score)}/100` : 'In Progress'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {sess.answers?.length || 0} of {sess.questions?.length || 0} questions answered
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {sess.created_at ? new Date(sess.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                    <button
                      onClick={() => {
                        setSession(sess);
                        setActiveTab('practice');
                      }}
                      className="font-bold text-[#e26d3d] hover:underline"
                    >
                      Resume session &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800">No past sessions recorded</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">Start your first practice session on the Live Practice tab.</p>
              <button
                onClick={() => setActiveTab('practice')}
                className="px-4 py-2 bg-[#e26d3d] text-white rounded-xl text-xs font-semibold hover:bg-orange-600"
              >
                Start Practice
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterviewPrep;
