import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Sparkles } from 'lucide-react';

const Navbar = ({ isLanding = false, onMenuToggle }) => {
  return (
    <nav className={`fixed top-0 left-0 w-full h-[72px] ${isLanding ? 'bg-transparent border-b border-white/15' : 'bg-[#fbfcff]/90 border-b border-slate-200/80'} backdrop-blur-xl z-50 px-5 md:px-8 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        {!isLanding && (
          <button type="button" onClick={onMenuToggle} className="icon-button md:hidden" aria-label="Toggle navigation">
            <Menu size={20} />
          </button>
        )}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="brand-mark"><Sparkles size={17} strokeWidth={2.5} /></div>
          <span className={`font-display font-bold text-xl ${isLanding ? 'text-white' : 'text-slate-900'} tracking-[-0.02em]`}>CareerLens</span>
        </Link>
      </div>
      
      {isLanding && (
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-inter text-slate-200 hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm font-inter text-slate-200 hover:text-white transition-colors">How It Works</a>
          <a href="#students" className="text-sm font-inter text-slate-200 hover:text-white transition-colors">For Students</a>
          <a href="#recruiters" className="text-sm font-inter text-slate-200 hover:text-white transition-colors">For Recruiters</a>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Link to="/profile" className={`hidden sm:flex items-center gap-2 text-sm font-medium ${isLanding ? 'text-slate-200' : 'text-slate-600'}`}>
          <span className="avatar avatar-small">JD</span>
          <span>Jordan Davis</span>
        </Link>
        {isLanding && <Link to="/register" className="button button-primary">Get started</Link>}
      </div>
    </nav>
  );
};

export default Navbar;
