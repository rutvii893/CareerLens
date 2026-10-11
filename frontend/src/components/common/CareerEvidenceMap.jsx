import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  Briefcase,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Target,
  Compass,
  ChevronRight,
  Info,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Career Evidence Map
 * 
 * Signature feature connecting:
 * 1. Skills entered or demonstrated by the user
 * 2. Evidence from resume, projects, and coursework
 * 3. Requirements from the selected target job or role
 * 4. Missing skills or weak evidence gaps
 * 5. Specific recommended actionable next steps
 * 
 * Transparently distinguishes verified evidence (from parsed resume/uploaded artifacts)
 * from self-reported or inferred recommendations.
 */
export const CareerEvidenceMap = ({
  skillsData,
  metrics,
  targetRole = 'Full Stack Engineer',
  className = '',
}) => {
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [evidenceFilter, setEvidenceFilter] = useState('all'); // 'all' | 'verified' | 'unverified' | 'missing'

  // Extract real assessment items or synthesize from metrics/skills
  const assessments = skillsData?.assessments || [];
  const extractedSkills = skillsData?.extracted_skills || metrics?.extracted_skills || [];
  const missingSkills = skillsData?.missing_skills || metrics?.missing_skills || [];
  const roleRequired = skillsData?.required_skills || [];

  // Build a normalized list of evidence items based strictly on real application data
  const mapNodes = React.useMemo(() => {
    if (assessments.length > 0) {
      return assessments.map((item) => {
        const isFromResume = item.source === 'resume' || extractedSkills.some(s => s.toLowerCase() === item.name.toLowerCase());
        const isSelfReported = item.source === 'custom' || item.source === 'assessed';
        const isMissing = item.source === 'missing' || item.status === 'missing' || missingSkills.some(s => s.toLowerCase() === item.name.toLowerCase());
        const isRequired = roleRequired.length === 0 || roleRequired.some(s => s.toLowerCase() === item.name.toLowerCase());

        let evidenceStatus = 'missing';
        if (isFromResume) {
          evidenceStatus = 'verified'; // Found in resume text
        } else if (isSelfReported) {
          evidenceStatus = 'unverified'; // User declared, no resume evidence
        }

        return {
          id: item.name,
          name: item.name,
          category: item.category || 'Competency',
          evidenceStatus,
          score: Math.round(item.current_score || 0),
          gap: Math.round(item.gap_percentage || 0),
          targetScore: Math.round(item.target_score || 80),
          source: item.source,
          isRequired,
          // Transparent evidence details
          evidenceDetail: isFromResume
            ? `Found in your parsed resume (${metrics?.active_resume_filename || 'Uploaded Resume'}). Verified text occurrence in skill profile.`
            : isSelfReported
            ? 'Added as a custom skill profile item. Not yet documented on your uploaded resume.'
            : `Required for ${targetRole}, but not detected in your resume or profile.`,
          actionStep: isMissing
            ? `Create a project showcasing ${item.name} or study the core concept in your Learning Roadmap.`
            : isSelfReported
            ? `Add a bullet point under your experience or project sections explicitly demonstrating how you used ${item.name}.`
            : `Strong evidence. Practice answering technical interview questions on ${item.name} in Mock Interview.`,
          actionLink: isMissing
            ? `/career/roadmap?targetRole=${encodeURIComponent(targetRole)}`
            : isSelfReported
            ? '/resume-generator'
            : `/interview?targetRole=${encodeURIComponent(targetRole)}`,
          actionLabel: isMissing
            ? 'Open in Learning Roadmap'
            : isSelfReported
            ? 'Update Resume with Generator'
            : 'Practice in Mock Interview',
        };
      });
    }

    // Fallback synthesis from metrics data when skills endpoint is still loading or partially filled
    const fallbackList = [];
    extractedSkills.forEach((s) => {
      fallbackList.push({
        id: s,
        name: s,
        category: 'Demonstrated Skill',
        evidenceStatus: 'verified',
        score: 90,
        gap: 0,
        targetScore: 80,
        source: 'resume',
        isRequired: true,
        evidenceDetail: `Verified in active resume (${metrics?.active_resume_filename || 'Uploaded Resume'}).`,
        actionStep: `Solid evidence detected. Reinforce your practical application in your AI Career Coach discussion.`,
        actionLink: '/career',
        actionLabel: 'Discuss with AI Coach',
      });
    });

    missingSkills.forEach((s) => {
      fallbackList.push({
        id: s,
        name: s,
        category: 'Target Role Requirement',
        evidenceStatus: 'missing',
        score: 0,
        gap: 100,
        targetScore: 80,
        source: 'missing',
        isRequired: true,
        evidenceDetail: `Crucial requirement for ${targetRole}, but no mentions were found in your resume or skills list.`,
        actionStep: `Prioritize ${s} in Phase 1 of your tailored career roadmap to close this requirement.`,
        actionLink: `/career/roadmap?targetRole=${encodeURIComponent(targetRole)}`,
        actionLabel: 'View in Learning Roadmap',
      });
    });

    return fallbackList;
  }, [assessments, extractedSkills, missingSkills, roleRequired, metrics, targetRole]);

  // Set default selection to first item if none selected
  const activeSkill = selectedSkill || (mapNodes.length > 0 ? mapNodes[0] : null);

  const filteredNodes = mapNodes.filter((node) => {
    if (evidenceFilter === 'all') return true;
    return node.evidenceStatus === evidenceFilter;
  });

  const verifiedCount = mapNodes.filter(n => n.evidenceStatus === 'verified').length;
  const unverifiedCount = mapNodes.filter(n => n.evidenceStatus === 'unverified').length;
  const missingCount = mapNodes.filter(n => n.evidenceStatus === 'missing').length;

  if (mapNodes.length === 0) {
    return (
      <div className={`card-base p-6 text-center ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-3">
          <Target className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold font-jakarta text-slate-900">Career Evidence Map</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
          Upload your resume or set your target role to generate your live competency map connecting your skills, evidence, and job requirements.
        </p>
        <Link to="/resume" className="btn-primary text-xs">
          Upload Resume to Populate Map
        </Link>
      </div>
    );
  }

  return (
    <div className={`card-base overflow-hidden ${className}`}>
      {/* Header bar */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/50 via-white to-violet-50/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-violet">Signature Intelligence</span>
            <span className="text-xs font-semibold text-slate-500">Live Skill-to-Evidence Matrix</span>
          </div>
          <h3 className="text-lg font-bold font-jakarta text-slate-900 mt-1">
            Career Evidence Map
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Audit how your demonstrated skills match the expectations for <span className="font-semibold text-slate-800">{targetRole}</span>, highlighting verified resume proof vs. unproven gaps.
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto bg-slate-100/80 p-1 rounded-xl border border-slate-200/70 text-xs">
          <button
            onClick={() => setEvidenceFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              evidenceFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({mapNodes.length})
          </button>
          <button
            onClick={() => setEvidenceFilter('verified')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              evidenceFilter === 'verified'
                ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            Verified Proof ({verifiedCount})
          </button>
          <button
            onClick={() => setEvidenceFilter('unverified')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              evidenceFilter === 'unverified'
                ? 'bg-white text-purple-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
            Self-Reported ({unverifiedCount})
          </button>
          <button
            onClick={() => setEvidenceFilter('missing')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              evidenceFilter === 'missing'
                ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Missing Gaps ({missingCount})
          </button>
        </div>
      </div>

      {/* Interactive two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        {/* Left Column: Interactive Skill Map Grid */}
        <div className="lg:col-span-7 p-5 sm:p-6 space-y-4 max-h-[520px] overflow-y-auto">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400">
              Evaluated Skills ({filteredNodes.length})
            </span>
            <span className="text-[11px] text-slate-400">Click any skill to view proof & closing action</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredNodes.map((item) => {
              const isSelected = activeSkill?.id === item.id;
              const isVerified = item.evidenceStatus === 'verified';
              const isUnverified = item.evidenceStatus === 'unverified';
              const isMissing = item.evidenceStatus === 'missing';

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedSkill(item)}
                  className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-900 font-jakarta line-clamp-1">
                      {item.name}
                    </span>
                    {isVerified && (
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-blue-600" /> Proof
                      </span>
                    )}
                    {isUnverified && (
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        Profile
                      </span>
                    )}
                    {isMissing && (
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5 text-amber-600" /> Gap
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate">{item.category}</span>
                    <span className="font-semibold text-slate-700">
                      {isMissing ? '0% Proof' : `${item.score}% Readiness`}
                    </span>
                  </div>

                  {/* Micro Progress Track */}
                  <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isVerified
                          ? 'bg-blue-600'
                          : isUnverified
                          ? 'bg-purple-500'
                          : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.max(item.score, isMissing ? 0 : 40)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Evidence Inspector & Action Bridge */}
        <div className="lg:col-span-5 p-5 sm:p-6 bg-slate-50/40 flex flex-col justify-between">
          {activeSkill ? (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Evidence Inspector
                  </span>
                  {activeSkill.evidenceStatus === 'verified' && (
                    <span className="badge-blue text-[10px]">Verified Resume Evidence</span>
                  )}
                  {activeSkill.evidenceStatus === 'unverified' && (
                    <span className="badge-violet text-[10px]">Self-Reported Entry</span>
                  )}
                  {activeSkill.evidenceStatus === 'missing' && (
                    <span className="badge-amber text-[10px]">Demonstration Gap</span>
                  )}
                </div>
                <h4 className="text-xl font-extrabold font-jakarta text-slate-900">
                  {activeSkill.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Category: <span className="font-medium text-slate-700">{activeSkill.category}</span>
                </p>
              </div>

              {/* Requirement Context */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  <span>Target Role Expectation</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-inter">
                  {targetRole} candidates typically require a solid foundation in {activeSkill.name}. Evaluated target competency is {activeSkill.targetScore}%.
                </p>
              </div>

              {/* Evidence Status Card */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <FileText className="w-3.5 h-3.5 text-violet-600" />
                  <span>Documented Evidence Proof</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-inter">
                  {activeSkill.evidenceDetail}
                </p>
              </div>

              {/* Closing Action Recommendation */}
              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/70 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Recommended Next Move</span>
                </div>
                <p className="text-xs text-blue-950 font-inter leading-relaxed">
                  {activeSkill.actionStep}
                </p>
                <Link
                  to={activeSkill.actionLink}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 pt-1 transition-colors"
                >
                  <span>{activeSkill.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select a skill on the left to inspect evidence and action steps.
            </div>
          )}

          {/* Bottom Transparency Disclaimer */}
          <div className="pt-4 border-t border-slate-200/70 text-[11px] text-slate-400 flex items-start gap-1.5 mt-4">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
            <span>
              CareerLens clearly separates verified proof (found in parsed resume text) from user-added skills or AI gap suggestions.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerEvidenceMap;
