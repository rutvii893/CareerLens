import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Code2,
  Database,
  Filter,
  Layers,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  UploadCloud,
  Wrench,
  XCircle,
} from 'lucide-react';
import { userService } from '../services/userService';

const CATEGORY_ICONS = {
  'Programming Languages': Code2,
  'Frameworks & Libraries': Layers,
  'Cloud & Databases': Database,
  'Tools & Methodologies': Wrench,
  'Other': Sparkles,
};

const SkillsDashboard = () => {
  const [skillsData, setSkillsData] = useState(null);
  const [newSkill, setNewSkill] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Programming Languages');
  const [newSkillProficiency, setNewSkillProficiency] = useState(70);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, improve, meets
  const [editingGoal, setEditingGoal] = useState(false);

  const [targetRoleInput, setTargetRoleInput] = useState('');
  const [targetScoreInput, setTargetScoreInput] = useState(80);

  const [activeSkillModal, setActiveSkillModal] = useState(null); // for editing proficiency

  const fetchSkills = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userService.getSkills();
      setSkillsData(data);
      setTargetRoleInput(data.target_role || 'Full Stack Engineer');
      setTargetScoreInput(data.target_score || 80);
    } catch (err) {
      console.error('Failed to load skills:', err);
      setError(err.response?.data?.detail || 'Unable to load skills. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleSaveTargetGoal = async (e) => {
    e?.preventDefault();
    if (!targetRoleInput.trim()) return;
    setSavingTarget(true);
    setError('');
    try {
      await userService.updateTargetGoal(targetRoleInput.trim(), Number(targetScoreInput));
      setActionMessage(`Updated target role to "${targetRoleInput.trim()}" at ${targetScoreInput}% target benchmark.`);
      setEditingGoal(false);
      await fetchSkills();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update target career goal.');
    } finally {
      setSavingTarget(false);
    }
  };

  const handleAddSkill = async (e) => {
    e?.preventDefault();
    if (!newSkill.trim()) return;

    setAdding(true);
    setError('');
    setActionMessage('');
    try {
      const trimmed = newSkill.trim();
      await userService.addCustomSkill(trimmed);
      if (newSkillProficiency > 0) {
        await userService.updateSkillAssessment(trimmed, Number(newSkillProficiency), newSkillCategory);
      }
      setNewSkill('');
      setActionMessage(`Added "${trimmed}" (${newSkillProficiency}% proficiency) to your profile.`);
      await fetchSkills();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add custom skill.');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteSkill = async (skillName) => {
    setError('');
    setActionMessage('');
    try {
      await userService.deleteCustomSkill(skillName);
      setActionMessage(`Removed "${skillName}".`);
      await fetchSkills();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove skill.');
    }
  };

  const handleUpdateProficiency = async (skillName, newProf) => {
    try {
      await userService.updateSkillAssessment(skillName, Number(newProf));
      setActionMessage(`Updated ${skillName} proficiency to ${newProf}%.`);
      setActiveSkillModal(null);
      await fetchSkills();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update proficiency.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-[1360px] mx-auto w-full min-h-[60vh] flex flex-col items-center justify-center">
        <LoaderCircle className="w-10 h-10 animate-spin text-[#2563eb] mb-4" />
        <p className="text-slate-600 font-medium font-inter">Loading your live competency profile...</p>
      </div>
    );
  }

  const allSkills = skillsData?.all_skills || [];
  const categorized = skillsData?.categorized_skills || {};
  const targetRole = skillsData?.target_role || 'Full Stack Engineer';
  const targetScore = skillsData?.target_score || 80;
  const overallSkillGap = skillsData?.overall_skill_gap_percentage || 0;
  const skillsToImprove = skillsData?.skills_to_improve || [];
  const skillsMeetingTarget = skillsData?.skills_meeting_target || [];
  const assessments = skillsData?.assessments || {};

  // Build full skill objects with gap calculations
  const enrichedSkills = allSkills.map((skillName) => {
    const currentProf = assessments[skillName]?.current_proficiency ?? 50;
    const isCustom = skillsData?.custom_skills?.includes(skillName);
    const gap = targetScore > 0 ? Math.max(0, Math.round(((targetScore - currentProf) / targetScore) * 100)) : 0;
    const meets = currentProf >= targetScore;
    return {
      name: skillName,
      current: currentProf,
      target: targetScore,
      gap,
      meets,
      isCustom,
      category: assessments[skillName]?.category || 'General',
    };
  });

  // Filter skills based on query and status filter
  const filteredSkills = enrichedSkills.filter((s) => {
    const matchesQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesQuery) return false;
    if (activeFilter === 'improve') return !s.meets;
    if (activeFilter === 'meets') return s.meets;
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-[1360px] mx-auto w-full space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-jakarta text-slate-900 tracking-tight">
            My Skills & Competencies
          </h1>
          <p className="text-slate-500 font-inter mt-1">
            Real-time skill telemetry, target proficiency benchmarking, and mathematical gap calculations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSkills}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all shadow-sm text-xs font-semibold flex items-center gap-1.5"
            title="Refresh skills"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Link
            to="/resume"
            className="px-4 py-2.5 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" /> Re-scan Resume
          </Link>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {actionMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {/* Target Goal & Overall Skill Gap Metrics Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Target Role Benchmark</span>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-[10px] font-bold">
                  Active
                </span>
              </div>
              <h2 className="text-2xl font-bold font-jakarta text-white mt-1">
                {targetRole}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl font-inter">
                Formula: <code className="text-blue-300 font-mono">Skill Gap % = max(0, Target - Current) / Target × 100</code>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="text-center px-3">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Overall Skill Gap</span>
              <span className="text-2xl font-extrabold text-amber-400 font-jakarta">
                {Math.round(overallSkillGap)}%
              </span>
            </div>

            <div className="h-8 w-px bg-white/15 hidden sm:block" />

            <div className="text-center px-3">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Target Score</span>
              <span className="text-2xl font-extrabold text-blue-400 font-jakarta">
                {targetScore}%
              </span>
            </div>

            <div className="h-8 w-px bg-white/15 hidden sm:block" />

            <div className="text-center px-3">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Meeting Target</span>
              <span className="text-2xl font-extrabold text-emerald-400 font-jakarta">
                {skillsMeetingTarget.length} / {allSkills.length}
              </span>
            </div>

            <button
              onClick={() => setEditingGoal(!editingGoal)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/15 flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              {editingGoal ? 'Close' : 'Adjust Role & Target'}
            </button>
          </div>
        </div>

        {/* Inline Target Role Adjustment Form */}
        {editingGoal && (
          <form onSubmit={handleSaveTargetGoal} className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-12 gap-3 animate-fadeIn">
            <div className="sm:col-span-6">
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Target Role</label>
              <input
                type="text"
                value={targetRoleInput}
                onChange={(e) => setTargetRoleInput(e.target.value)}
                placeholder="e.g. Backend Engineer, Frontend Engineer"
                className="w-full px-3.5 py-2 bg-white/10 border border-white/20 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Target Score (0–100%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={targetScoreInput}
                onChange={(e) => setTargetScoreInput(e.target.value)}
                className="w-full px-3.5 py-2 bg-white/10 border border-white/20 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="sm:col-span-3 flex items-end">
              <button
                type="submit"
                disabled={savingTarget}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                {savingTarget ? 'Saving...' : 'Save & Recalculate'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Add Custom Skill & Search / Filter Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Add Skill Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
          <h2 className="text-sm font-bold font-jakarta text-slate-900 mb-1">Add & Assess Custom Skill</h2>
          <p className="text-xs text-slate-500 font-inter mb-4">
            Add specialized competencies with a verified proficiency assessment.
          </p>
          <form onSubmit={handleAddSkill} className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Skill Name</label>
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g. Docker, Redis, Next.js"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Category</label>
                <select
                  value={newSkillCategory}
                  onChange={(e) => setNewSkillCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2563eb]"
                >
                  <option value="Programming Languages">Languages</option>
                  <option value="Frameworks & Libraries">Frameworks</option>
                  <option value="Cloud & Databases">Cloud / DB</option>
                  <option value="Tools & Methodologies">Tools / DevOps</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Current Proficiency ({newSkillProficiency}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newSkillProficiency}
                  onChange={(e) => setNewSkillProficiency(Number(e.target.value))}
                  className="w-full accent-blue-600 mt-2"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={adding || !newSkill.trim()}
              className="w-full py-2.5 bg-[#2563eb] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm mt-2"
            >
              {adding ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Competency
            </button>
          </form>
        </div>

        {/* Right: Search & Quick Filters */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold font-jakarta text-slate-900 mb-1">Search & Filter Catalog</h2>
            <p className="text-xs text-slate-500 font-inter mb-4">
              Explore your verified skill inventory and target benchmark gaps.
            </p>

            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills (e.g. Python, React, SQL)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Skills ({allSkills.length})
            </button>
            <button
              onClick={() => setActiveFilter('improve')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeFilter === 'improve'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" /> Skills to Improve ({skillsToImprove.length})
            </button>
            <button
              onClick={() => setActiveFilter('meets')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeFilter === 'meets'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Meets Target ({skillsMeetingTarget.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Skills List Cards */}
      {filteredSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((s) => (
            <div
              key={s.name}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                s.meets
                  ? 'bg-white border-emerald-100 hover:border-emerald-300'
                  : 'bg-white border-amber-100 hover:border-amber-300'
              } shadow-sm`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-sm font-bold font-jakarta text-slate-900 flex items-center gap-1.5">
                      {s.name}
                      {s.isCustom && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold">
                          Custom
                        </span>
                      )}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-inter">{s.category}</span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.meets
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {s.meets ? 'Meets Target' : `${s.gap}% Gap`}
                  </span>
                </div>

                {/* Proficiency Visual Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Current: <strong className="text-slate-800">{s.current}%</strong></span>
                    <span className="text-slate-500 font-medium">Target: <strong className="text-blue-600">{s.target}%</strong></span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        s.meets ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, s.current)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => setActiveSkillModal(s)}
                  className="font-bold text-[#2563eb] hover:underline flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" /> Adjust Score
                </button>

                {s.isCustom && (
                  <button
                    onClick={() => handleDeleteSkill(s.name)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                    title={`Delete custom skill ${s.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm p-8 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-blue-50 text-[#2563eb] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold font-jakarta text-slate-900 mb-1">No matching skills found</h3>
          <p className="text-xs text-slate-500 font-inter mb-6">
            Upload your resume or add custom competencies with the form above.
          </p>
          <Link
            to="/resume"
            className="px-5 py-2.5 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-xl font-semibold text-xs shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" /> Upload Resume
          </Link>
        </div>
      )}

      {/* Adjust Proficiency Modal */}
      {activeSkillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold font-jakarta text-base text-slate-900">
                Adjust Proficiency: {activeSkillModal.name}
              </h3>
              <button
                onClick={() => setActiveSkillModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4 font-inter">
              Update your self-assessed competency score (0–100%). Skill gaps and roadmap recommendations will recalculate automatically.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Proficiency Score</span>
                  <span className="text-[#2563eb] text-sm">{activeSkillModal.current}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={activeSkillModal.current}
                  onChange={(e) =>
                    setActiveSkillModal({
                      ...activeSkillModal,
                      current: Number(e.target.value),
                    })
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSkillModal(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateProficiency(activeSkillModal.name, activeSkillModal.current)
                  }
                  className="flex-1 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Save Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsDashboard;

