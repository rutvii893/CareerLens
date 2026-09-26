import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Code2,
  Database,
  Layers,
  LoaderCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
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
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const fetchSkills = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userService.getSkills();
      setSkillsData(data);
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

  const handleAddSkill = async (e) => {
    e?.preventDefault();
    if (!newSkill.trim()) return;

    setAdding(true);
    setError('');
    setActionMessage('');
    try {
      const updated = await userService.addCustomSkill(newSkill.trim());
      setSkillsData(updated);
      setNewSkill('');
      setActionMessage(`Added "${newSkill.trim()}" to your profile skills.`);
      setTimeout(() => setActionMessage(''), 3500);
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
      const updated = await userService.deleteCustomSkill(skillName);
      setSkillsData(updated);
      setActionMessage(`Removed "${skillName}".`);
      setTimeout(() => setActionMessage(''), 3500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove skill.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full min-h-[60vh] flex flex-col items-center justify-center">
        <LoaderCircle className="w-10 h-10 animate-spin text-[#2563eb] mb-4" />
        <p className="text-slate-600 font-medium font-inter">Loading your catalogued skills...</p>
      </div>
    );
  }

  const allSkills = skillsData?.all_skills || [];
  const categorized = skillsData?.categorized_skills || {};
  const targetRole = skillsData?.target_role;
  const roleMatching = skillsData?.role_matching_skills || [];
  const roleMissing = skillsData?.role_missing_skills || [];
  const roleReadiness = skillsData?.role_readiness_score || 0;
  const hasExtracted = (skillsData?.extracted_skills?.length || 0) > 0;

  return (
    <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-jakarta text-slate-900 tracking-tight">
            My Skills & Competencies
          </h1>
          <p className="text-slate-500 font-inter mt-1">
            Comprehensive skill profile extracted from your latest resume and manual additions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSkills}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all shadow-sm"
            title="Refresh skills"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/resume"
            className="px-4 py-2.5 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" /> Re-scan Resume
          </Link>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {actionMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {/* Target Role Competency Gap Card */}
      {targetRole && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2563eb] text-white flex items-center justify-center font-bold">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Target Role Match</span>
                <h3 className="text-xl font-bold font-jakarta text-slate-900">{targetRole}</h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-[#2563eb] font-jakarta">{roleReadiness}%</span>
              <p className="text-xs text-slate-500 font-medium">Skill coverage</p>
            </div>
          </div>

          <div className="w-full bg-blue-200/60 rounded-full h-2.5 mb-5 overflow-hidden">
            <div className="bg-[#2563eb] h-2.5 rounded-full transition-all duration-500" style={{ width: `${roleReadiness}%` }} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-white/90 p-3.5 rounded-xl border border-blue-100">
              <span className="font-bold text-emerald-700 flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-4 h-4" /> Matching Competencies ({roleMatching.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {roleMatching.length > 0 ? (
                  roleMatching.map((s) => (
                    <span key={s} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md font-medium border border-emerald-200/60">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">None detected for this target role yet.</span>
                )}
              </div>
            </div>

            <div className="bg-white/90 p-3.5 rounded-xl border border-blue-100">
              <span className="font-bold text-amber-700 flex items-center gap-1.5 mb-2">
                <XCircle className="w-4 h-4" /> Role Skill Gaps to Learn ({roleMissing.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {roleMissing.length > 0 ? (
                  roleMissing.map((s) => (
                    <span key={s} className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md font-medium border border-amber-200/60">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">No skill gaps recorded for this role.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Skill Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h2 className="text-base font-bold font-jakarta text-slate-900 mb-2">Add Custom Skill</h2>
        <p className="text-xs text-slate-500 font-inter mb-4">
          Manually add specialized tools, frameworks, or domain knowledge to your profile.
        </p>
        <form onSubmit={handleAddSkill} className="flex gap-3 max-w-md">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="e.g. GraphQL, Kubernetes, Tableau"
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={adding || !newSkill.trim()}
            className="px-5 py-2.5 bg-[#2563eb] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 shadow-sm shrink-0"
          >
            {adding ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </form>
      </div>

      {/* Categorized Skills Breakdown */}
      {allSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(categorized).map(([category, list]) => {
            const IconComponent = CATEGORY_ICONS[category] || Sparkles;
            return (
              <div key={category} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold font-jakarta text-slate-900 text-sm flex items-center gap-2">
                      <IconComponent className="w-4 h-4 text-[#2563eb]" /> {category}
                    </h3>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-full">
                      {list.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {list.map((skill) => {
                      const isCustom = skillsData?.custom_skills?.includes(skill);
                      return (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/70 rounded-xl text-xs font-semibold transition-all group"
                        >
                          {skill}
                          {isCustom && (
                            <button
                              onClick={() => handleDeleteSkill(skill)}
                              className="text-slate-400 hover:text-red-600 transition-colors"
                              title={`Remove custom skill ${skill}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-blue-50 text-[#2563eb] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold font-jakarta text-slate-900 mb-1">No skills catalogued yet</h3>
          <p className="text-sm text-slate-500 font-inter mb-6">
            Upload your resume or add your skills manually above to start receiving tailored job matches and interview questions.
          </p>
          <Link
            to="/resume"
            className="px-6 py-3 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" /> Upload Resume
          </Link>
        </div>
      )}
    </div>
  );
};

export default SkillsDashboard;
