import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';

const Navbar = ({ isLanding = false }) => {
  return (
    <nav className="fixed top-0 left-0 w-full h-[64px] bg-[#f8fafc]/80 backdrop-blur-md border-b border-[#e2e8f0] z-50 px-4 md:px-10 flex items-center justify-between transition-colors duration-300">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-[#2563eb] to-[#7c3aed] rounded-lg flex items-center justify-center text-white font-bold font-jakarta">
          C
        </div>
        <span className="font-jakarta font-bold text-xl text-[#0f172a] tracking-tight">CareerLens</span>
      </Link>
      
      {isLanding && (
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-inter text-[#64748b] hover:text-[#2563eb] transition-colors">Features</a>
          <Link to="/resume" className="text-sm font-inter text-[#64748b] hover:text-[#2563eb] transition-colors">AI Resume Screening</Link>
          <Link to="/jobs" className="text-sm font-inter text-[#64748b] hover:text-[#2563eb] transition-colors">Job Matching</Link>
          <Link to="/career" className="text-sm font-inter text-[#64748b] hover:text-[#2563eb] transition-colors">Career Intelligence</Link>
          <Link to="/interview" className="text-sm font-inter text-[#64748b] hover:text-[#2563eb] transition-colors">Interview Preparation</Link>
          <a href="#recruiters" className="text-sm font-inter text-[#64748b] hover:text-[#2563eb] transition-colors">For Recruiters</a>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Link to="/login" className="text-sm font-inter font-medium text-[#64748b] hover:text-[#0f172a]">Log in</Link>
        <Link to="/register">
          <Button variant="primary">Get Started</Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
