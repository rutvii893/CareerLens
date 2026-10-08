import React from 'react';
import { Link } from 'react-router-dom';
import LineWaves from '../components/landing/LineWaves';
import { FileText, Briefcase, Compass, Users } from 'lucide-react';

const Home = () => {
  return (
    <div className="w-full bg-[#F8FAFF]">
      {/* Hero Section */}
      <section className="relative w-full min-h-[calc(100vh-76px)] flex flex-col items-center justify-center py-16 overflow-hidden">
        {/* WebGL Background */}
        <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
          <LineWaves 
            speed={0.3}
            innerLineCount={32}
            outerLineCount={36}
            warpIntensity={1.0}
            rotation={-45}
            edgeFadeWidth={0}
            colorCycleSpeed={1.0}
            brightness={0.15}
            color1="#3B82F6"
            color2="#8B5CF6"
            color3="#3B82F6"
            enableMouseInteraction={true}
            mouseInfluence={1.5}
          />
        </div>
        
        {/* Subtle background gradient glow using primary blue + purple theme */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-400/10 via-indigo-300/10 to-purple-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-4xl mx-auto mt-2">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/80 border border-slate-200 backdrop-blur-md mb-6 shadow-2xs">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-[#3B82F6] uppercase">
              AI-POWERED CAREER INTELLIGENCE
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold font-jakarta text-[#0F172A] tracking-tight mb-6">
            Analyze. Improve. Prepare. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">Get Hired.</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-[#64748B] font-inter max-w-2xl mx-auto mb-10">
            CareerLens uses advanced AI to analyze your resume, recommend matched jobs, and provide personalized career and interview coaching.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link to="/register">
              <button className="px-8 py-3.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                Get Started for Free
              </button>
            </Link>
            <Link to="/login">
              <button className="px-8 py-3.5 bg-white text-[#0F172A] border border-[#e2e8f0] rounded-xl font-semibold shadow-2xs hover:bg-slate-50 transition-all duration-300 cursor-pointer">
                Log In
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Other sections below hero */}
      <section id="features" className="py-24 bg-[#F8FAFF] border-t border-slate-200/60">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-jakarta text-[#0F172A] mb-4">Why CareerLens?</h2>
            <p className="text-[#64748B] font-inter text-lg max-w-2xl mx-auto">
              Everything you need to accelerate your career journey in one integrated platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <FileText className="text-[#3B82F6] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-jakarta text-[#0F172A] mb-3">AI Resume Analysis</h3>
              <p className="text-[#64748B] font-inter text-sm leading-relaxed">
                Analyze resume quality, ATS compatibility, skills and missing keywords.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
                <Briefcase className="text-[#8B5CF6] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-jakarta text-[#0F172A] mb-3">Smart Job Matching</h3>
              <p className="text-[#64748B] font-inter text-sm leading-relaxed">
                Match user skills and resume information with relevant job opportunities.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <Compass className="text-[#3B82F6] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-jakarta text-[#0F172A] mb-3">Career Intelligence</h3>
              <p className="text-[#64748B] font-inter text-sm leading-relaxed">
                Get personalized career recommendations, skill-gap analysis and career roadmaps.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
                <Users className="text-[#8B5CF6] w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-jakarta text-[#0F172A] mb-3">Interview Preparation</h3>
              <p className="text-[#64748B] font-inter text-sm leading-relaxed">
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
