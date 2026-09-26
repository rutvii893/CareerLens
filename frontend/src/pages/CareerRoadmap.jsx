import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Compass,
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
import { careerService } from '../services/careerService';
import { userService } from '../services/userService';

const CareerRoadmap = () => {
  const [searchParams] = useSearchParams();
  const [resumeId, setResumeId] = useState(searchParams.get('resumeId') || '');
  const [targetRole, setTargetRole] = useState(searchParams.get('targetRole') || '');
  const [availableRoles, setAvailableRoles] = useState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingPhase, setUpdatingPhase] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Load available roles from API
    careerService.getRoles()
      .then(setAvailableRoles)
      .catch(() => {});

    // Try loading latest roadmap or active resume
    userService.getDashboardMetrics()
      .then((data) => {
        if (data.active_resume_id && !resumeId) {
          setResumeId(String(data.active_resume_id));
        }
        if (data.roadmap_progress?.target_role && !targetRole) {
          setTargetRole(data.roadmap_progress.target_role);
        }
        if (data.roadmap_progress?.id || data.active_resume_id) {
          loadRoadmap(data.active_resume_id);
        }
      })
      .catch(() => {});
  }, []);

  const loadRoadmap = async (rId) => {
    const idToUse = rId || resumeId;
    setLoading(true);
    setError('');
    try {
      const data = await careerService.getRoadmap(idToUse ? Number(idToUse) : null);
      setRoadmap(data);
      if (data.role?.name || data.target_role) {
        setTargetRole(data.role?.name || data.target_role);
      }
    } catch (err) {
      // If 404, it means no roadmap has been generated yet
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
      setError('Please select or enter a target role.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const data = await careerService.createRoadmap(resumeId ? Number(resumeId) : null, targetRole.trim());
      setRoadmap(data);
      setSuccessMsg(`Generated milestone roadmap for ${targetRole.trim()}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to create roadmap:', err);
      setError(err.response?.data?.detail || 'Failed to generate roadmap. Please ensure you have uploaded a resume.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePhaseStatus = async (phaseIdx, currentStatus) => {
    if (!roadmap?.id) return;
    const nextStatus = currentStatus === 'completed' ? 'ready' : 'completed';
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

  const completedCount = roadmap?.completed_phases || (roadmap?.roadmap?.filter(p => p.status === 'completed' || p.status === 'done').length || 0);
  const totalPhases = roadmap?.total_phases || (roadmap?.roadmap?.length || 0);
  const progressPct = totalPhases > 0 ? Math.round((completedCount / totalPhases) * 100) : 0;

  return (
    <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-jakarta text-slate-900 tracking-tight">
            Career Milestone Roadmap
          </h1>
          <p className="text-slate-500 font-inter mt-1">
            Structured step-by-step learning path tailored to close your resume skill gaps.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {/* Target Role & Generator Form */}
      <form onSubmit={handleCreateRoadmap} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#7c3aed]" />
          <h2 className="text-base font-bold font-jakarta text-slate-900">Configure Target Role</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Backend Engineer, Data Scientist, Product Manager"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#7c3aed]"
            />
          </div>

          <div className="md:col-span-3">
            <input
              type="number"
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              placeholder="Resume ID (optional)"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#7c3aed]"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={loading || !targetRole.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-[#7c3aed] to-[#2563eb] hover:opacity-95 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Roadmap
            </button>
          </div>
        </div>

        {/* Quick select buttons */}
        {availableRoles.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Quick roles:</span>
            {availableRoles.slice(0, 5).map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setTargetRole(role.name)}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${
                  targetRole.toLowerCase() === role.name.toLowerCase()
                    ? 'bg-purple-50 text-[#7c3aed] border-purple-200 font-bold'
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
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7c3aed]">Active Learning Plan</span>
                <h2 className="text-2xl font-extrabold font-jakarta text-slate-900 mt-0.5">
                  {roadmap.role?.name || roadmap.target_role || targetRole}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold font-jakarta text-[#7c3aed]">{progressPct}%</span>
                <p className="text-xs text-slate-500 font-medium">
                  {completedCount} of {totalPhases} phases completed
                </p>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#7c3aed] to-[#2563eb] h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {roadmap.missing_skills?.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Skills Addressed in this Plan
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {roadmap.missing_skills.map((skill) => (
                    <span key={skill} className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-lg text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Phases Timeline */}
          <div className="space-y-4">
            {roadmap.roadmap.map((phase, idx) => {
              const isCompleted = phase.status === 'completed' || phase.status === 'done';
              const isUpdating = updatingPhase === idx;

              return (
                <article
                  key={phase.phase || idx}
                  className={`bg-white p-6 rounded-2xl border transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 ${
                    isCompleted ? 'border-emerald-200/80 bg-emerald-50/20' : 'border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <button
                      onClick={() => handleTogglePhaseStatus(idx, phase.status)}
                      disabled={isUpdating}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all font-bold ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      title={isCompleted ? 'Click to mark as incomplete' : 'Click to mark phase as completed'}
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
                          Phase {phase.phase || idx + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isCompleted ? 'Completed' : (phase.status || 'Ready')}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold font-jakarta text-slate-900 mt-1">
                        {phase.title}
                      </h3>

                      {phase.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {phase.skills.map((s) => (
                            <span key={s} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 w-full sm:w-auto text-right">
                    <button
                      onClick={() => handleTogglePhaseStatus(idx, phase.status)}
                      disabled={isUpdating}
                      className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        isCompleted
                          ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
                      }`}
                    >
                      {isCompleted ? 'Mark Incomplete' : 'Complete Phase'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 max-w-lg mx-auto">
            <Compass className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold font-jakarta text-slate-900 mb-1">No roadmap generated yet</h3>
            <p className="text-sm text-slate-500 font-inter mb-6">
              Enter your target career role above to generate a customized, step-by-step milestone learning plan.
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default CareerRoadmap;
