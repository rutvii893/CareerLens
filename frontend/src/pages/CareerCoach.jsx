import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Compass,
  FileText,
  HelpCircle,
  Lightbulb,
  LoaderCircle,
  Send,
  Sparkles,
  Target,
  User,
  Zap,
} from 'lucide-react';
import { careerService } from '../services/careerService';
import { userService } from '../services/userService';

const SUGGESTED_PROMPTS = [
  'What are the most critical skills I need to learn next for my target role?',
  'How can I improve my resume ATS score based on my detected skills?',
  'What real-world portfolio projects would best demonstrate my current skill set?',
  'What behavioral interview topics should I prepare for in tech interviews?',
  'How should I prepare for system design questions given my experience?',
];

const CareerCoach = () => {
  const [searchParams] = useSearchParams();
  const [resumeId, setResumeId] = useState(searchParams.get('resumeId') || '');
  const [targetRole, setTargetRole] = useState(searchParams.get('targetRole') || '');
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const messagesEndRef = useRef(null);

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

    userService.getProfile()
      .then(setUserProfile)
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const handleAsk = async (promptText) => {
    const q = promptText || question;
    if (!q.trim() || q.trim().length < 3) {
      setError('Please enter a question with at least 3 characters.');
      return;
    }

    const userMessage = { sender: 'user', text: q, timestamp: new Date() };
    setChatHistory((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);
    setError('');

    try {
      const result = await careerService.askCoach(q, resumeId ? Number(resumeId) : null, targetRole || undefined);
      const coachMessage = {
        sender: 'coach',
        text: result.answer,
        provider: result.provider,
        currentSkills: result.current_skills || [],
        missingSkills: result.missing_skills || [],
        targetRole: result.target_role,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, coachMessage]);
    } catch (err) {
      console.error('Coach request failed:', err);
      const detail = err.response?.data?.detail || 'Career Coach could not respond. Please try again.';
      setError(detail);
      const errorMessage = {
        sender: 'coach',
        text: `Error: ${detail}`,
        isError: true,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1100px] mx-auto w-full space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 bg-orange-50 text-[#e26d3d] border border-orange-200/60 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> AI Career Coach
          </span>
        </div>
        <h1 className="text-3xl font-extrabold font-jakarta text-slate-900 tracking-tight">
          Personalized Career Guidance
        </h1>
        <p className="text-slate-500 font-inter mt-1">
          Ask questions about skill development, resume optimization, interview prep, and career transitions.
        </p>
      </div>

      {/* Context Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 shrink-0">
          <Target className="w-4 h-4 text-[#2563eb]" /> Context Settings:
        </div>
        <div className="flex flex-1 flex-col sm:flex-row gap-2 w-full">
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Target role (e.g. Full Stack Engineer)"
            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2563eb]"
          />
          <input
            type="number"
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
            placeholder="Resume ID (optional)"
            className="sm:w-36 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2563eb]"
          />
        </div>
      </div>

      {/* Suggested Prompts if chat is empty */}
      {chatHistory.length === 0 && (
        <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 p-6 rounded-2xl border border-blue-200/80 shadow-sm">
          <h2 className="text-sm font-bold font-jakarta text-slate-900 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#2563eb]" /> Suggested Questions
          </h2>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(prompt)}
                className="text-left text-xs px-3.5 py-2 bg-white hover:bg-blue-50 text-slate-700 hover:text-[#2563eb] border border-blue-100 rounded-xl font-medium transition-all shadow-2xs"
              >
                &ldquo;{prompt}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm min-h-[380px] max-h-[550px] overflow-y-auto p-6 space-y-5">
        {chatHistory.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
            <Bot className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-600">How can I help with your career journey today?</p>
            <p className="text-xs text-slate-400 mt-1">Ask a question below or choose one of the suggested prompts.</p>
          </div>
        ) : (
          chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'coach' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563eb] to-[#7c3aed] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#2563eb] text-white rounded-br-sm'
                    : msg.isError
                    ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-sm'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-sm'
                }`}
              >
                {msg.sender === 'coach' && !msg.isError && (
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/60 text-xs">
                    <span className="font-bold text-slate-700">CareerLens Coach</span>
                    <span className="px-2 py-0.5 bg-white text-slate-500 rounded text-[10px] font-semibold border border-slate-200 uppercase tracking-wider">
                      {msg.provider === 'gemini' ? 'Gemini AI' : 'Career Intelligence'}
                    </span>
                  </div>
                )}

                <div className="whitespace-pre-wrap font-inter">{msg.text}</div>

                {msg.missingSkills?.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-xs">
                    <span className="font-bold text-amber-800 block mb-1">Relevant Skill Gaps:</span>
                    <div className="flex flex-wrap gap-1">
                      {msg.missingSkills.map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200 text-[10px] font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3 items-center text-slate-500 text-xs font-medium">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl">
              <LoaderCircle className="w-4 h-4 animate-spin text-[#2563eb]" />
              <span>Analyzing resume skills and formulating career recommendations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {/* Question Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your skills, roadmap, resume, or career strategy..."
          disabled={loading}
          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#2563eb] shadow-sm disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="px-6 py-3 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:opacity-95 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 shrink-0"
        >
          {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Ask Coach
        </button>
      </form>
    </div>
  );
};

export default CareerCoach;
