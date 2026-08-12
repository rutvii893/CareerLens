import React, { useState } from 'react';
import { Target, MessageSquare, PlayCircle, Clock, CheckCircle2, History } from 'lucide-react';

const InterviewPrep = () => {
  const [selectedType, setSelectedType] = useState('Technical');

  const history = [
    { id: 1, date: 'Oct 12, 2026', type: 'Technical', role: 'Frontend Developer', score: 85 },
    { id: 2, date: 'Oct 10, 2026', type: 'HR', role: 'Frontend Developer', score: 92 },
    { id: 3, date: 'Oct 05, 2026', type: 'Mixed', role: 'React Engineer', score: 78 }
  ];

  return (
    <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-jakarta text-[#0f172a] mb-2">Interview Preparation</h1>
          <p className="text-[#64748b] font-inter">Practice with AI mock interviews tailored to your target role.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm">
          <h2 className="text-xl font-bold font-jakarta text-[#0f172a] mb-6 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-[#2563eb]" />
            New Interview Session
          </h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#334155] mb-2">Target Role</label>
            <div className="relative">
              <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b] w-5 h-5" />
              <input 
                type="text" 
                defaultValue="Frontend Developer"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb]/50 focus:border-[#2563eb] text-[#0f172a] font-medium"
              />
            </div>
          </div>
          
          <div className="mb-8">
            <label className="block text-sm font-medium text-[#334155] mb-2">Interview Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['Technical', 'HR', 'Mixed'].map(type => (
                <button 
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all
                    ${selectedType === type 
                      ? 'bg-blue-50 border-[#2563eb] text-[#2563eb]' 
                      : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-slate-50 hover:border-[#cbd5e1]'}`}
                >
                  <MessageSquare className={`w-4 h-4 ${selectedType === type ? 'text-[#2563eb]' : 'text-[#64748b]'}`} />
                  {type}
                </button>
              ))}
            </div>
          </div>
          
          <button className="w-full py-4 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-lg">
            <PlayCircle className="w-6 h-6" />
            Start Interview
          </button>
        </div>

        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm">
          <h2 className="text-xl font-bold font-jakarta text-[#0f172a] mb-6 flex items-center gap-2">
            <History className="w-5 h-5 text-[#7c3aed]" />
            Recent Sessions
          </h2>
          
          <div className="space-y-4">
            {history.map(session => (
              <div key={session.id} className="p-4 rounded-xl border border-[#e2e8f0] hover:border-[#7c3aed] transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-[#334155] rounded">
                    {session.type}
                  </span>
                  <div className="flex items-center gap-1 text-[#64748b] text-xs">
                    <Clock className="w-3 h-3" />
                    {session.date}
                  </div>
                </div>
                
                <h3 className="font-bold text-[#0f172a] mb-3 text-sm">{session.role}</h3>
                
                <div className="flex items-center justify-between">
                  <span className="text-[#64748b] text-sm">Overall Score</span>
                  <div className="flex items-center gap-1">
                    <span className={`font-bold ${session.score >= 80 ? 'text-[#16a34a]' : 'text-[#f59e0b]'}`}>
                      {session.score}/100
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-6 py-2.5 bg-white border border-[#e2e8f0] text-[#0f172a] rounded-lg font-medium shadow-sm hover:bg-slate-50 transition-colors">
            View All History
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewPrep;
