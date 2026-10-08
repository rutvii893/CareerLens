import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Compass,
  ExternalLink,
  Flag,
  Layers,
  Lightbulb,
  LoaderCircle,
  Map,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  UploadCloud,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { careerService } from '../services/careerService';
import { userService } from '../services/userService';

const CareerRoadmap = () => {
  const [searchParams] = useSearchParams();
  const { targetRole: globalTargetRole, updateTargetGoal } = useUser();
  const [resumeId, setResumeId] = useState(searchParams.get('resumeId') || '');
  const [targetRole, setTargetRole] = useState(searchParams.get('targetRole') || globalTargetRole || '');
  const [availableRoles, setAvailableRoles] = useState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingPhase, setUpdatingPhase] = useState(null);
  const [selectedPhaseIdx, setSelectedPhaseIdx] = useState(0); // Default open Phase 1 details
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (globalTargetRole && (!targetRole || targetRole !== globalTargetRole)) {
      setTargetRole(globalTargetRole);
    }
  }, [globalTargetRole]);

  useEffect(() => {
    // Load available roles from API
    careerService.getRoles()
      .then((roles) => {
        if (Array.isArray(roles)) {
          setAvailableRoles(roles);
        }
      })
      .catch(() => {});

    // Load active dashboard metrics to prefill target role & resume
    userService.getDashboardMetrics()
      .then((data) => {
        if (data.active_resume_id && !resumeId) {
          setResumeId(String(data.active_resume_id));
        }
        loadRoadmap(data.active_resume_id);
      })
      .catch(() => {
        loadRoadmap();
      });
  }, [globalTargetRole]);

  const loadRoadmap = async (rId) => {
    const idToUse = rId || resumeId;
    setLoading(true);
    setError('');
    try {
      const data = await careerService.getRoadmap(idToUse ? Number(idToUse) : null);
      setRoadmap(data);
      if (data.target_role || data.role?.name) {
        setTargetRole(data.target_role || data.role?.name);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.detail || 'Could not load existing roadmap.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoadmap = async (e) => {
    e?.preventDefault();
    if (!targetRole.trim()) {
      setError('Please select or enter a target career role.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await updateTargetGoal(targetRole.trim());
      const data = await careerService.createRoadmap(resumeId ? Number(resumeId) : null, targetRole.trim());
      setRoadmap(data);
      setSuccessMsg(`Generated milestone roadmap for ${targetRole.trim()}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to create roadmap:', err);
      setError(err.response?.data?.detail || 'Failed to generate roadmap. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePhaseStatus = async (phaseIdx, currentStatus) => {
    if (!roadmap?.id) return;
    const nextStatus = currentStatus === 'completed' || currentStatus === 'done' ? 'ready' : 'completed';
    setUpdatingPhase(phaseIdx);
    setError('');
    try {
      const updated = await careerService.updateRoadmapPhase(roadmap.id, phaseIdx, nextStatus);
      setRoadmap(updated);
    } catch (err) {
      console.error('Failed to update phase status:', err);
      setError('Failed to update phase status in database.');
    } finally {
      setUpdatingPhase(null);
    }
  };

  const handleToggleTask = async (phaseIdx, taskId, taskCompleted) => {
    if (!roadmap?.id) return;
    setUpdatingPhase(phaseIdx);
    setError('');
    try {
      const updated = await careerService.updateRoadmapPhase(roadmap.id, phaseIdx, null, taskId, taskCompleted);
      setRoadmap(updated);
    } catch (err) {
      console.error('Failed to update task:', err);
      setError('Failed to update task in database.');
    } finally {
      setUpdatingPhase(null);
    }
  };

  const completedCount = roadmap?.completed_phases || (roadmap?.roadmap?.filter((p) => p.status === 'completed' || p.status === 'done').length || 0);
  const totalPhases = roadmap?.total_phases || (roadmap?.roadmap?.length || 0);
  const progressPct = totalPhases > 0 ? Math.round((completedCount / totalPhases) * 100) : 0;

  return (
    <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-jakarta text-slate-900 tracking-tight">
            Career Milestone Roadmap
          </h1>
          <p className="text-slate-500 font-inter mt-1">
            Structured step-by-step milestone learning plan tailored to close your resume skill gaps.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all shadow-sm text-xs font-semibold flex items-center gap-1.5"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#3B82F6] shrink-0" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {/* Target Role & Generator Form */}
      <form onSubmit={handleCreateRoadmap} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#3B82F6]" />
          <h2 className="text-base font-bold font-jakarta text-[#0F172A]">Target Role & Plan Setup</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Target Career Role</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Backend Engineer, Data Scientist, Full Stack Developer"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#3B82F6] focus:bg-white transition-all"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Resume ID (Optional)</label>
            <input
              type="number"
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              placeholder="Latest resume"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all"
            />
          </div>

          <div className="md:col-span-3 flex items-end">
            <button
              type="submit"
              disabled={loading || !targetRole.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:opacity-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {roadmap ? 'Regenerate Plan' : 'Generate Roadmap'}
            </button>
          </div>
        </div>

        {/* Quick select buttons */}
        {availableRoles.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-semibold">Quick roles:</span>
            {availableRoles.slice(0, 6).map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setTargetRole(role.name)}
                className={`px-3 py-1 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  targetRole.toLowerCase() === role.name.toLowerCase()
                    ? 'bg-blue-50 text-[#2563eb] border-blue-200 font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {role.name}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Roadmap Content */}
      {roadmap && roadmap.roadmap?.length > 0 ? (
        <div className="space-y-6">
          {/* Progress Header Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2563eb]">Active Learning Plan</span>
                <h2 className="text-2xl font-extrabold font-jakarta text-slate-900 mt-0.5">
                  {roadmap.target_role || roadmap.role?.name || targetRole}
                </h2>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-3xl font-extrabold font-jakarta text-[#2563eb]">{progressPct}%</span>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  {completedCount} of {totalPhases} phases completed
                </p>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-4">
              <div
                className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {roadmap.missing_skills?.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Key Skills Targeted ({roadmap.missing_skills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {roadmap.missing_skills.map((skill) => (
                    <span key={skill} className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/70 rounded-lg text-xs font-semibold">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Phases List with Expandable Details */}
          <div className="space-y-4">
            {roadmap.roadmap.map((phase, idx) => {
              const isCompleted = phase.status === 'completed' || phase.status === 'done';
              const isExpanded = selectedPhaseIdx === idx;
              const isUpdating = updatingPhase === idx;

              return (
                <article
                  key={phase.phase || idx}
                  className={`bg-white rounded-3xl border transition-all shadow-sm overflow-hidden ${
                    isCompleted ? 'border-blue-200/90 bg-blue-50/10' : 'border-slate-200/90'
                  }`}
                >
                  <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                    <div className="flex items-start gap-4 flex-1 cursor-pointer" onClick={() => setSelectedPhaseIdx(isExpanded ? null : idx)}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePhaseStatus(idx, phase.status);
                        }}
                        disabled={isUpdating}
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all font-bold cursor-pointer ${
                          isCompleted
                            ? 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white shadow-sm hover:opacity-95'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                        title={isCompleted ? 'Mark phase incomplete' : 'Mark phase complete'}
                      >
                        {isUpdating ? (
                          <LoaderCircle className="w-5 h-5 animate-spin" />
                        ) : isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            PHASE {phase.phase || idx + 1} — {phase.name || 'DEVELOPMENT'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isCompleted
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {isCompleted ? 'Completed' : (phase.status || 'Ready')}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold font-jakarta text-[#0F172A] mt-1 flex items-center gap-2">
                          {phase.title}
                        </h3>

                        {phase.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {phase.skills.map((s) => (
                              <span key={s} className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      <button
                        onClick={() => setSelectedPhaseIdx(isExpanded ? null : idx)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {isExpanded ? 'Hide Details' : 'View Phase Details'}
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Phase Details Section */}
                  {isExpanded && (
                    <div className="p-6 bg-slate-50/70 border-t border-slate-200/80 space-y-6 animate-fadeIn">
                      {/* Overview & Importance */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#3B82F6] mb-1.5 flex items-center gap-1.5">
                            <Compass className="w-4 h-4" /> What this phase means
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-inter">
                            {phase.objective || phase.importance || `Accomplish foundational mastery in ${phase.skills?.join(', ') || 'target topics'} for ${targetRole}.`}
                          </p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#8B5CF6] mb-1.5 flex items-center gap-1.5">
                            <Lightbulb className="w-4 h-4" /> Why this phase matters
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-inter">
                            {phase.importance || `Building fluency in ${phase.skills?.slice(0, 2).join(', ')} directly increases your technical screening pass rate for ${targetRole} opportunities.`}
                          </p>
                        </div>
                      </div>

                      {/* Actionable Tasks List */}
                      {phase.tasks?.length > 0 && (
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-[#3B82F6]" /> Actionable Milestone Tasks ({phase.tasks.filter(t => t.completed).length}/{phase.tasks.length})
                          </h4>
                          <div className="space-y-2">
                            {phase.tasks.map((task) => (
                              <label
                                key={task.task_id || task.title}
                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                                  task.completed ? 'bg-blue-50/50 border-blue-200 text-slate-800' : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200 text-slate-800'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={task.completed || false}
                                  onChange={() => handleToggleTask(idx, task.task_id || task.title, !task.completed)}
                                  className="mt-0.5 rounded text-[#3B82F6] focus:ring-[#3B82F6]"
                                />
                                <span className={`text-xs font-medium flex-1 ${task.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                                  {task.title}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommended Learning Resources */}
                      {phase.resources?.length > 0 && (
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-[#3B82F6]" /> Recommended Learning Resources
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {phase.resources.map((resGroup, rIdx) => (
                              <div key={rIdx} className="space-y-2">
                                {resGroup.youtube && (
                                  <div>
                                    <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block mb-1">YouTube Tutorials</span>
                                    {resGroup.youtube.map((item, i) => (
                                      <a
                                        key={i}
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-semibold text-slate-700 hover:text-[#3B82F6] hover:underline flex items-center gap-1 mb-1"
                                      >
                                        • {item.title} <ExternalLink className="w-3 h-3 text-slate-400" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                                {resGroup.courses && (
                                  <div>
                                    <span className="text-[11px] font-bold text-[#3B82F6] uppercase tracking-wider block mb-1">Courses & Docs</span>
                                    {resGroup.courses.map((item, i) => (
                                      <a
                                        key={i}
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-semibold text-slate-700 hover:text-[#3B82F6] hover:underline flex items-center gap-1 mb-1"
                                      >
                                        • {item.title} <ExternalLink className="w-3 h-3 text-slate-400" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                                {resGroup.practice && (
                                  <div>
                                    <span className="text-[11px] font-bold text-[#8B5CF6] uppercase tracking-wider block mb-1">Practice Platforms</span>
                                    {resGroup.practice.map((item, i) => (
                                      <a
                                        key={i}
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-semibold text-slate-700 hover:text-[#3B82F6] hover:underline flex items-center gap-1 mb-1"
                                      >
                                        • {item.title} <ExternalLink className="w-3 h-3 text-slate-400" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Project Suggestion & Expected Outcome */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {phase.project_suggestion && (
                          <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200/80">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block mb-1">Suggested Project</span>
                            <p className="text-xs text-blue-950 font-medium leading-relaxed">{phase.project_suggestion}</p>
                          </div>
                        )}
                        {phase.expected_outcome && (
                          <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200/80">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 block mb-1">Expected Outcome</span>
                            <p className="text-xs text-purple-950 font-medium leading-relaxed">{phase.expected_outcome}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 max-w-lg mx-auto">
            <Compass className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold font-jakarta text-slate-900 mb-1">Default 4-Phase Roadmap Loaded</h3>
            <p className="text-xs text-slate-500 font-inter mb-6">
              Enter your target career role above to generate a customized, step-by-step milestone learning plan based on real skill gaps.
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default CareerRoadmap;
