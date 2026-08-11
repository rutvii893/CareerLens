import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';

const Navbar = ({ isLanding = false }) => {
  return (
    <nav className={`fixed top-0 left-0 w-full h-[64px] ${isLanding ? 'bg-transparent border-b border-white/20 z-50' : 'bg-white/80 backdrop-blur-md border-b border-slate-200 z-50'} px-4 md:px-10 flex items-center justify-between transition-colors duration-300`}>
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-[#2563eb] to-[#7c3aed] rounded-lg flex items-center justify-center text-white font-bold font-jakarta">
          C
        </div>
        <span className={`font-jakarta font-bold text-xl ${isLanding ? 'text-white' : 'text-slate-800'} tracking-tight`}>CareerLens</span>
      </Link>
      
      {isLanding && (
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-inter text-slate-200 hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm font-inter text-slate-200 hover:text-white transition-colors">How It Works</a>
          <a href="#students" className="text-sm font-inter text-slate-200 hover:text-white transition-colors">For Students</a>
          <a href="#recruiters" className="text-sm font-inter text-slate-200 hover:text-white transition-colors">For Recruiters</a>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Link to="/login" className={`text-sm font-inter font-medium ${isLanding ? 'text-slate-200 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>Log in</Link>
        <Link to="/register">
          <Button variant="primary">Get Started</Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
