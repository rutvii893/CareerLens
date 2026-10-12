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

  const [isNearBottom, setIsNearBottom] = useState(true);
  const scrollAreaRef = useRef(null);

  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    setIsNearBottom(scrollHeight - scrollTop - clientHeight < 80);
  };

  useEffect(() => {
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, loading, isNearBottom]);

  const handleAsk = async (promptText) => {
    const q = promptText || question;
    if (!q.trim() || q.trim().length < 3 || loading) {
      if (!q.trim() || q.trim().length < 3) {
        setError('Please enter a question with at least 3 characters.');
      }
      return;
    }

    const userMessage = { sender: 'user', text: q.trim(), timestamp: new Date() };
    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setQuestion('');
    setLoading(true);
    setError('');

    try {
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
        text: `Unable to complete request at this time.\n\n*Error*: ${detail}`,
        isError: true,
        canRetry: true,
        failedPrompt: q.trim(),
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
    <div className="flex flex-col h-[calc(100vh-5.5rem)] max-w-5xl mx-auto w-full p-3 sm:p-5 space-y-3.5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI Career Coach
            </span>
            <span className="text-xs text-slate-400">• Role-calibrated mentorship</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-jakarta text-slate-900 tracking-tight">
            Personalized Career Guidance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-inter mt-0.5">
            Targeting <span className="font-semibold text-slate-800">{targetRole || 'your target role'}</span> with verified competencies and milestone insights.
          </p>
        </div>

        {chatHistory.length > 0 && (
          <button
            onClick={handleClearChat}
            disabled={loading}
            className="self-start sm:self-auto px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" /> Clear Chat
          </button>
        )}
      </div>

      {/* Target Role & Resume Context Bar */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 shrink-0">
          <Target className="w-4 h-4 text-blue-600" /> Active Context:
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
            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
          <input
            type="number"
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
            placeholder="Resume ID (optional)"
            className="sm:w-36 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Main Chat Box Container */}
      <div className="flex-1 min-h-0 bg-white rounded-3xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden">
        {/* Messages Scroll Area */}
        <div
          ref={scrollAreaRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4"
        >
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold font-jakarta text-slate-800">
                How can I assist your career progression today?
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Get specific advice on architectural interview topics, resume phrasing, job qualifications, or skill gaps for <span className="font-semibold text-slate-700">{targetRole || 'your chosen path'}</span>.
              </p>

              {/* Prompt Suggestions */}
              <div className="mt-6 w-full max-w-xl space-y-2 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-blue-600" /> Suggested Inquiries:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAsk(prompt)}
                      className="p-3 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-200 text-left text-xs font-medium text-slate-700 hover:text-blue-700 rounded-xl transition-all shadow-2xs cursor-pointer"
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
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs shadow-2xs'
                      : msg.isError
                      ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-xs'
                      : 'bg-slate-50/90 text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  {msg.sender === 'coach' && !msg.isError && (
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/60 text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Career Coach
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

                  {msg.isError && msg.canRetry && (
                    <div className="mt-3 pt-2 border-t border-red-200 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleAsk(msg.failedPrompt)}
                        disabled={loading}
                        className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry Prompt
                      </button>
                    </div>
                  )}

                  {msg.missingSkills?.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-xs">
                      <span className="font-bold text-slate-700 block mb-1">Identified Competency Gaps:</span>
                      <div className="flex flex-wrap gap-1">
                        {msg.missingSkills.map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded-md border border-blue-200 text-[10px] font-semibold">
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
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 animate-pulse border border-blue-100">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl shadow-2xs">
                <LoaderCircle className="w-4 h-4 animate-spin text-blue-600" />
                <span>Formulating personalized career response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="mx-4 sm:mx-6 mb-2 bg-red-50 border border-red-200 text-red-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800 font-bold text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Composer Input Area */}
        <div className="p-3 sm:p-4 bg-slate-50/80 border-t border-slate-200/80 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-end gap-2.5"
          >
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                rows={1}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about system design, job fit, skill gaps, or interview strategy..."
                disabled={loading}
                className="w-full pl-4 pr-3 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs disabled:opacity-60 transition-all resize-none max-h-32 leading-relaxed"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-4 sm:px-5 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-2xs flex items-center gap-2 shrink-0 cursor-pointer h-[42px] sm:h-[46px]"
            >
              {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="hidden sm:inline">Ask Coach</span>
            </button>
          </form>
          <div className="mt-1.5 px-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>Press Enter to send • Shift+Enter for new line</span>
            <span>Target Role: <strong className="text-slate-600 font-semibold">{targetRole || 'Not Selected'}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerCoach;

