import React from 'react';
import { Target, FileText, CheckCircle2 } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-jakarta text-[#0f172a] mb-2">Welcome back!</h1>
        <p className="text-[#64748b] font-inter">Here is your daily career intelligence overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[#64748b] font-inter text-sm font-medium mb-1">Career Readiness Score</p>
            <h2 className="text-4xl font-bold font-jakarta text-[#2563eb]">72%</h2>
          </div>
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <Target className="text-[#2563eb] w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[#64748b] font-inter text-sm font-medium mb-1">Resume ATS Score</p>
            <h2 className="text-4xl font-bold font-jakarta text-[#7c3aed]">78%</h2>
          </div>
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
            <FileText className="text-[#7c3aed] w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm">
          <h3 className="text-lg font-bold font-jakarta text-[#0f172a] mb-6">Skill Progress</h3>
          <div className="space-y-5">
            {[
              { name: 'React', progress: 85, color: 'bg-blue-500' },
              { name: 'JavaScript', progress: 80, color: 'bg-blue-400' },
              { name: 'Python', progress: 65, color: 'bg-purple-500' },
              { name: 'SQL', progress: 50, color: 'bg-orange-400' },
              { name: 'DSA', progress: 40, color: 'bg-slate-400' },
            ].map(skill => (
              <div key={skill.name}>
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="text-[#334155]">{skill.name}</span>
                  <span className="text-[#64748b]">{skill.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={`${skill.color} h-2 rounded-full`} style={{ width: `${skill.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm">
          <h3 className="text-lg font-bold font-jakarta text-[#0f172a] mb-6">Recommended Jobs</h3>
          <div className="space-y-4">
            {[
              { title: 'Frontend Developer', skills: ['React', 'JavaScript', 'CSS'], match: 92 },
              { title: 'Full Stack Developer', skills: ['React', 'Node.js', 'SQL'], match: 78 },
              { title: 'Backend Developer', skills: ['Python', 'Django', 'SQL'], match: 65 },
            ].map((job, i) => (
              <div key={i} className="p-4 border border-[#e2e8f0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#2563eb] transition-colors cursor-pointer">
                <div>
                  <h4 className="font-bold text-[#0f172a] mb-1">{job.title}</h4>
                  <p className="text-sm text-[#64748b] font-inter flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                    Required: {job.skills.join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-green-50 text-[#16a34a] rounded-full text-sm font-semibold">
                    {job.match}% Match
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
