import React from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '../components/common/GlassCard';
import LineWaves from '../components/landing/LineWaves';

const Home = () => {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* WebGL Background */}
        <div className="absolute inset-0 z-0 bg-slate-900">
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
            color3="#22c55e"
            enableMouseInteraction={true}
            mouseInfluence={1.5}
          />
        </div>
        
        {/* Glass Overlay for Text Readability */}
        <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px]"></div>

        {/* Hero Content */}
        <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-4xl mx-auto mt-16">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6">
            <span className="text-sm font-semibold tracking-wider text-[#e2e8f0] uppercase">
              AI-POWERED CAREER INTELLIGENCE
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold font-jakarta text-white tracking-tight mb-6 drop-shadow-lg">
            Analyze. Improve. Prepare. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Get Hired.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 font-inter max-w-2xl mx-auto mb-10 drop-shadow">
            CareerLens uses advanced AI to screen your resume, recommend matched jobs, and provide personalized interview coaching.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link to="/register">
              <button className="px-8 py-3.5 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                Get Started for Free
              </button>
            </Link>
            <Link to="/login">
              <button className="px-8 py-3.5 bg-white/10 text-white border border-white/20 rounded-xl font-semibold backdrop-blur-md hover:bg-white/20 transition-all duration-300">
                Log In
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Other sections below hero */}
      <section id="features" className="py-24 bg-[#f9f9ff]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <GlassCard>
            <h2 className="text-3xl font-bold font-jakarta text-[#2563eb] mb-4">Why CareerLens?</h2>
            <p className="text-slate-600 font-inter">This page is ready for real API data integration.</p>
          </GlassCard>
        </div>
      </section>
    </div>
  );
};

export default Home;
