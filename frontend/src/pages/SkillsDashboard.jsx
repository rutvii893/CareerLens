import React from 'react';
import { Code2, PenTool, Database, CheckCircle2 } from 'lucide-react';

const SkillsDashboard = () => {
  const categories = [
    {
      name: 'Frontend Development',
      icon: Code2,
      color: 'text-[#2563eb]',
      bgColor: 'bg-blue-50',
      skills: [
        { name: 'React', level: 'Advanced', progress: 85 },
        { name: 'JavaScript', level: 'Advanced', progress: 80 },
        { name: 'CSS/Tailwind', level: 'Intermediate', progress: 70 },
      ]
    },
    {
      name: 'Backend & Data',
      icon: Database,
      color: 'text-[#7c3aed]',
      bgColor: 'bg-purple-50',
      skills: [
        { name: 'Python', level: 'Intermediate', progress: 65 },
        { name: 'SQL', level: 'Beginner', progress: 50 },
        { name: 'Node.js', level: 'Beginner', progress: 45 },
      ]
    },
    {
      name: 'Tools & Practices',
      icon: PenTool,
      color: 'text-[#16a34a]',
      bgColor: 'bg-green-50',
      skills: [
        { name: 'Git', level: 'Advanced', progress: 85 },
        { name: 'Agile', level: 'Intermediate', progress: 70 },
        { name: 'Testing', level: 'Beginner', progress: 40 },
      ]
    }
  ];

  return (
    <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-jakarta text-[#0f172a] mb-2">My Skills</h1>
        <p className="text-[#64748b] font-inter">Your current skill profile based on resume analysis and assessments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.name} className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${category.bgColor}`}>
                  <Icon className={`w-6 h-6 ${category.color}`} />
                </div>
                <h2 className="text-lg font-bold font-jakarta text-[#0f172a]">{category.name}</h2>
              </div>
              
              <div className="space-y-6">
                {category.skills.map(skill => (
                  <div key={skill.name}>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="font-semibold text-[#0f172a] text-sm">{skill.name}</p>
                        <p className="text-xs text-[#64748b] mt-0.5">{skill.level}</p>
                      </div>
                      <span className="text-sm font-medium text-[#0f172a]">{skill.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${category.color.replace('text-', 'bg-')}`} 
                        style={{ width: `${skill.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillsDashboard;
