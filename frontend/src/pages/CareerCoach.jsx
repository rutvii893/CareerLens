import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Compass,
  FileText,
  HelpCircle,
  Lightbulb,
  LoaderCircle,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { careerService } from '../services/careerService';
import { userService } from '../services/userService';

const SUGGESTED_PROMPTS = [
  'How should I prepare for system design questions given my background?',
  'Suggest me suitable jobs for my skills.',
  'According to my skills, which job would be more suitable?',
  'What are the most critical skills I need to learn next for my target role?',
  'How can I improve my resume ATS score based on my detected skills?',
];

const MarkdownRenderer = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ node, ...props }) => <h1 className="text-base sm:text-lg font-bold font-jakarta text-slate-900 mt-3 mb-2" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-sm sm:text-base font-bold font-jakarta text-slate-900 mt-3 mb-1.5 pb-1 border-b border-slate-200/60" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-xs sm:text-sm font-semibold font-jakarta text-slate-900 mt-2.5 mb-1" {...props} />,
        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed text-slate-800" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2 space-y-1 text-slate-800" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2 space-y-1 text-slate-800" {...props} />,
        li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
        strong: ({ node, ...props }) => <strong className="font-bold text-slate-900" {...props} />,
        em: ({ node, ...props }) => <em className="italic text-slate-700" {...props} />,
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-[#2563eb] bg-blue-50/50 pl-3 py-1 my-2 italic text-slate-700 rounded-r-md text-xs" {...props} />
        ),
        code: ({ node, inline, className, children, ...props }) => {
          if (inline) {
            return (
              <code className="px-1.5 py-0.5 bg-slate-200/70 text-[#2563eb] font-mono text-[11px] rounded font-semibold" {...props}>
                {children}
              </code>
            );
          }
          return (
            <pre className="p-3 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl my-2 overflow-x-auto">
              <code {...props}>{children}</code>
            </pre>
          );
        },
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-2 rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-xs" {...props} />
          </div>
        ),
        th: ({ node, ...props }) => <th className="px-3 py-1.5 bg-slate-100 font-bold text-left text-slate-700" {...props} />,
        td: ({ node, ...props }) => <td className="px-3 py-1.5 border-t border-slate-100 text-slate-800" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

const CareerCoach = () => {
  const [searchParams] = useSearchParams();
  const { targetRole: globalTargetRole, updateTargetGoal } = useUser();
  const [resumeId, setResumeId] = useState(searchParams.get('resumeId') || '');
  const [targetRole, setTargetRole] = useState(searchParams.get('targetRole') || globalTargetRole || '');
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (globalTargetRole && (!targetRole || targetRole !== globalTargetRole)) {
      setTargetRole(globalTargetRole);
    }
  }, [globalTargetRole]);

  useEffect(() => {
    userService.getDashboardMetrics()
      .then((data) => {
        if (data.active_resume_id && !resumeId) {
          setResumeId(String(data.active_resume_id));
        }
      })
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

    const userMessage = { sender: 'user', text: q.trim(), timestamp: new Date() };
    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setQuestion('');
    setLoading(true);
    setError('');

    try {
      // Send conversation history to preserve memory
      const historyPayload = updatedHistory.slice(-8).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const result = await careerService.askCoach(
        q.trim(),
        resumeId ? Number(resumeId) : null,
        targetRole.trim() || undefined,
        historyPayload
      );

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
        text: `**Career Coach Notice**: Unable to complete request at this time.\n\n*Reason*: ${detail}`,
        isError: true,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setChatHistory([]);
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-[1100px] mx-auto w-full p-4 sm:p-6 space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-orange-50 text-[#e26d3d] border border-orange-200/60 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Career Coach
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-jakarta text-slate-900 tracking-tight">
            Personalized Career Guidance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-inter mt-0.5">
            Contextual career intelligence powered by verified skills, target role benchmarks, and roadmaps.
          </p>
        </div>

        {chatHistory.length > 0 && (
          <button
            onClick={handleClearChat}
            className="self-start sm:self-auto px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Chat
          </button>
        )}
      </div>

      {/* Target Role & Resume Context Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 shrink-0">
          <Target className="w-4 h-4 text-[#2563eb]" /> Active Context:
        </div>
        <div className="flex flex-1 flex-col sm:flex-row gap-2 w-full">
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            onBlur={() => {
              if (targetRole.trim() && targetRole.trim() !== globalTargetRole) {
                updateTargetGoal(targetRole.trim());
              }
            }}
            placeholder="Target role (e.g. Data Engineer, Backend Developer)"
            className="flex-1 px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all"
          />
          <input
            type="number"
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
            placeholder="Resume ID (optional)"
            className="sm:w-36 px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Main Chat Box Container */}
      <div className="flex-1 min-h-0 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center mb-3">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold font-jakarta text-slate-800">
                How can I assist your career navigation today?
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Ask about system design strategy, role suitability comparisons, ATS resume optimization, or next skills to learn for <span className="font-semibold text-slate-700">{targetRole || 'your target role'}</span>.
              </p>

              {/* Prompt Suggestions */}
              <div className="mt-6 w-full max-w-xl space-y-2 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Suggested Inquiries:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAsk(prompt)}
                      className="p-3 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-200 text-left text-xs font-medium text-slate-700 hover:text-[#2563eb] rounded-xl transition-all shadow-2xs cursor-pointer"
                    >
                      &ldquo;{prompt}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                {msg.sender === 'coach' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563eb] to-[#7c3aed] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#2563eb] text-white rounded-br-xs shadow-xs'
                      : msg.isError
                      ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  {msg.sender === 'coach' && !msg.isError && (
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/60 text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" /> CareerLens AI Coach
                      </span>
                      <span className="px-2 py-0.5 bg-white text-slate-500 rounded text-[10px] font-semibold border border-slate-200 uppercase tracking-wider">
                        {msg.provider === 'gemini' ? 'Gemini AI' : 'Career Intelligence'}
                      </span>
                    </div>
                  )}

                  {msg.sender === 'user' ? (
                    <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
                  ) : (
                    <MarkdownRenderer content={msg.text} />
                  )}

                  {msg.missingSkills?.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-xs">
                      <span className="font-bold text-amber-800 block mb-1">Identified Role Skill Gaps:</span>
                      <div className="flex flex-wrap gap-1">
                        {msg.missingSkills.map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md border border-amber-200 text-[10px] font-semibold">
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
            <div className="flex gap-3 items-center text-slate-500 text-xs font-medium animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl shadow-xs">
                <LoaderCircle className="w-4 h-4 animate-spin text-[#2563eb]" />
                <span>Formulating personalized career response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="mx-4 sm:mx-6 mb-2 bg-red-50 border border-red-200 text-red-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            {error}
          </div>
        )}

        {/* Composer Input Area (Always Pinned at Bottom) */}
        <div className="p-3 sm:p-4 bg-slate-50/70 border-t border-slate-200/80 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-2"
          >
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about system design, job fit, skill gaps, or interview strategy..."
                disabled={loading}
                className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2563eb] shadow-xs disabled:opacity-60 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-5 py-3 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:opacity-95 disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
            >
              {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="hidden sm:inline">Ask Coach</span>
            </button>
          </form>
          <div className="mt-1.5 px-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>Press Enter to send • Shift+Enter for multiline</span>
            <span>Target Role: <strong className="text-slate-600 font-semibold">{targetRole || 'Not Selected'}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerCoach;
