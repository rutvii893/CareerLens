import React from 'react';
import { Link } from 'react-router-dom';
import LineWaves from '../components/landing/LineWaves';
import { FileText, Briefcase, Compass, Users } from 'lucide-react';

const Home = () => {
  return (
    <div className="w-full bg-[#f8fafc]">
      {/* Hero Section */}
      <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* WebGL Background */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <LineWaves 
            speed={0.3}
            innerLineCount={32}
            outerLineCount={36}
            warpIntensity={1.0}
            rotation={-45}
            edgeFadeWidth={0}
            colorCycleSpeed={1.0}
            brightness={0.15}
            color1="#2563eb"
            color2="#7c3aed"
            color3="#2563eb"
            enableMouseInteraction={true}
            mouseInfluence={1.5}
          />
        </div>
        
        {/* Glass Overlay for Text Readability - Light mode */}
        <div className="absolute inset-0 z-10 bg-transparent"></div>

        {/* Hero Content */}
        <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-4xl mx-auto mt-16">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/60 border border-slate-200 backdrop-blur-md mb-6 shadow-sm">
            <span className="text-sm font-semibold tracking-wider text-[#2563eb] uppercase">
              AI-POWERED CAREER INTELLIGENCE
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold font-jakarta text-[#0f172a] tracking-tight mb-6">
            Analyze. Improve. Prepare. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563eb] to-[#7c3aed]">Get Hired.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-[#64748b] font-inter max-w-2xl mx-auto mb-10">
            CareerLens uses advanced AI to analyze your resume, recommend matched jobs, and provide personalized career and interview coaching.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link to="/register">
              <button className="px-8 py-3.5 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                Get Started for Free
              </button>
            </Link>
            <Link to="/login">
              <button className="px-8 py-3.5 bg-white text-[#0f172a] border border-[#e2e8f0] rounded-xl font-semibold shadow-sm hover:bg-slate-50 transition-all duration-300">
                Log In
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Other sections below hero */}
      <section id="features" className="py-24 bg-[#f8fafc]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-jakarta text-[#0f172a] mb-4">Why CareerLens?</h2>
            <p className="text-[#64748b] font-inter text-lg max-w-2xl mx-auto">
              Everything you need to accelerate your career journey in one integrated platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <FileText className="text-[#2563eb] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-jakarta text-[#0f172a] mb-3">AI Resume Analysis</h3>
              <p className="text-[#64748b] font-inter text-sm leading-relaxed">
                Analyze resume quality, ATS compatibility, skills and missing keywords.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
                <Briefcase className="text-[#7c3aed] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-jakarta text-[#0f172a] mb-3">Smart Job Matching</h3>
              <p className="text-[#64748b] font-inter text-sm leading-relaxed">
                Match user skills and resume information with relevant job opportunities.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <Compass className="text-[#2563eb] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-jakarta text-[#0f172a] mb-3">Career Intelligence</h3>
              <p className="text-[#64748b] font-inter text-sm leading-relaxed">
                Get personalized career recommendations, skill-gap analysis and career roadmaps.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
                <Users className="text-[#7c3aed] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-jakarta text-[#0f172a] mb-3">Interview Preparation</h3>
              <p className="text-[#64748b] font-inter text-sm leading-relaxed">
                Practice role-specific interview questions and receive structured feedback.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
