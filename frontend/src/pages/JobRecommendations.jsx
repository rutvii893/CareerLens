import React from 'react';
import { Search, Briefcase, Building, MapPin, DollarSign, CheckCircle2 } from 'lucide-react';

const JobRecommendations = () => {
  const jobs = [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      company: 'TechCorp Solutions',
      location: 'Remote',
      salary: '$120k - $150k',
      skills: ['React', 'TypeScript', 'Tailwind CSS'],
      match: 95
    },
    {
      id: 2,
      title: 'React Engineer',
      company: 'InnovateAI',
      location: 'New York, NY',
      salary: '$110k - $140k',
      skills: ['React', 'JavaScript', 'Redux'],
      match: 88
    },
    {
      id: 3,
      title: 'Full Stack Web Developer',
      company: 'Global Systems',
      location: 'San Francisco, CA',
      salary: '$130k - $160k',
      skills: ['React', 'Node.js', 'PostgreSQL'],
      match: 75
    }
  ];

  return (
    <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-jakarta text-[#0f172a] mb-2">Recommended Jobs</h1>
        <p className="text-[#64748b] font-inter">Personalized job matches based on your resume and skills profile.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b] w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by job title, company, or skills..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb]/50 focus:border-[#2563eb] transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {jobs.map(job => (
          <div key={job.id} className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md hover:border-[#2563eb] transition-all flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Briefcase className="text-[#2563eb] w-6 h-6" />
              </div>
              <span className="inline-block px-3 py-1 bg-green-50 text-[#16a34a] rounded-full text-sm font-semibold border border-green-100">
                {job.match}% Match
              </span>
            </div>
            
            <h3 className="text-xl font-bold font-jakarta text-[#0f172a] mb-2">{job.title}</h3>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-[#64748b] text-sm">
                <Building className="w-4 h-4" />
                <span>{job.company}</span>
              </div>
              <div className="flex items-center gap-2 text-[#64748b] text-sm">
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-2 text-[#64748b] text-sm">
                <DollarSign className="w-4 h-4" />
                <span>{job.salary}</span>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-xs font-semibold text-[#334155] uppercase tracking-wider mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {job.skills.map(skill => (
                  <span key={skill} className="px-2.5 py-1 bg-slate-100 text-[#334155] text-xs font-medium rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#16a34a]" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-[#e2e8f0]">
              <button className="w-full py-2.5 bg-white border border-[#e2e8f0] text-[#0f172a] rounded-lg font-medium shadow-sm hover:bg-slate-50 transition-colors">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobRecommendations;
