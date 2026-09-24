import React from 'react';
import { Target, CheckCircle2, AlertTriangle, ArrowRight, Zap } from 'lucide-react';

const CareerCoach = () => {
  return (
    <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-jakarta text-[#0f172a] mb-2">Career Coach</h1>
          <p className="text-[#64748b] font-inter">Personalized AI-driven insights to accelerate your career.</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
          <Target className="w-5 h-5 text-[#2563eb]" />
          <span className="text-[#0f172a] font-medium text-sm">Target Role: <span className="text-[#2563eb] font-bold">Frontend Developer</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm">
          <h2 className="text-xl font-bold font-jakarta text-[#0f172a] mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#f59e0b]" />
            Career Insights
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle2 className="w-5 h-5 text-[#16a34a] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-[#0f172a] text-sm">Strong React foundation</p>
                <p className="text-[#64748b] text-xs mt-1">Your resume and assessments show deep knowledge of React hooks and state management.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle2 className="w-5 h-5 text-[#16a34a] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-[#0f172a] text-sm">Good JavaScript skills</p>
                <p className="text-[#64748b] text-xs mt-1">Solid understanding of ES6+ features and asynchronous programming.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
              <AlertTriangle className="w-5 h-5 text-[#f59e0b] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-[#0f172a] text-sm">Improve SQL</p>
                <p className="text-[#64748b] text-xs mt-1">Missing database skills often required for senior or full-stack crossover roles.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
              <AlertTriangle className="w-5 h-5 text-[#f59e0b] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-[#0f172a] text-sm">Strengthen DSA</p>
                <p className="text-[#64748b] text-xs mt-1">Data structures and algorithms are critical for passing technical rounds at top tech companies.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
              <AlertTriangle className="w-5 h-5 text-[#f59e0b] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-[#0f172a] text-sm">Improve backend development</p>
                <p className="text-[#64748b] text-xs mt-1">Consider learning Node.js or Python to broaden your architectural understanding.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col">
          <h2 className="text-xl font-bold font-jakarta text-[#0f172a] mb-6">Recommended Next Steps</h2>
          
          <div className="flex-1 space-y-4">
            {[
              { id: 1, text: 'Strengthen DSA' },
              { id: 2, text: 'Build one full-stack project' },
              { id: 3, text: 'Improve SQL' },
              { id: 4, text: 'Practice technical interviews' },
            ].map(step => (
              <div key={step.id} className="flex items-center gap-4 p-4 rounded-xl border border-[#e2e8f0] hover:border-[#2563eb] hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0] flex items-center justify-center font-bold text-sm group-hover:bg-[#2563eb] group-hover:text-white group-hover:border-[#2563eb] transition-colors">
                  {step.id}
                </div>
                <span className="font-medium text-[#0f172a]">{step.text}</span>
                <ArrowRight className="w-4 h-4 text-[#cbd5e1] ml-auto group-hover:text-[#2563eb] transition-colors" />
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-[#e2e8f0]">
            <button className="w-full py-3.5 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all">
              Generate Career Roadmap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerCoach;
