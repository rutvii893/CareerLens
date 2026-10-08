import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Menu } from 'lucide-react';
import Button from '../common/Button';
import { authService } from '../../services/authService';
import { getAccessToken } from '../../services/tokenStorage';

const Navbar = ({ isLanding = false, onMenuToggle }) => {
  const navigate = useNavigate();
  const token = getAccessToken();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 w-full h-[64px] bg-white/90 backdrop-blur-md border-b border-[#e2e8f0] z-50 px-4 md:px-8 flex items-center justify-between transition-colors duration-300">
      <div className="flex items-center gap-3">
        {!isLanding && (
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 md:hidden transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} />
          </button>
        )}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-[#2563eb] to-[#7c3aed] rounded-xl flex items-center justify-center text-white font-bold font-jakarta shadow-xs">
            C
          </div>
          <span className="font-jakarta font-extrabold text-xl text-[#0f172a] tracking-tight">CareerLens</span>
        </Link>
      </div>
      
      {isLanding && (
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-inter text-[#64748b] hover:text-[#2563eb] transition-colors">Features</a>
          <Link to="/resume" className="text-sm font-inter text-[#64748b] hover:text-[#2563eb] transition-colors">AI Resume Screening</Link>
          <Link to="/jobs" className="text-sm font-inter text-[#64748b] hover:text-[#2563eb] transition-colors">Job Matching</Link>
          <Link to="/career" className="text-sm font-inter text-[#64748b] hover:text-[#2563eb] transition-colors">Career Intelligence</Link>
          <Link to="/interview" className="text-sm font-inter text-[#64748b] hover:text-[#2563eb] transition-colors">Interview Preparation</Link>
        </div>
      )}

      <div className="flex items-center gap-4">
        {token ? (
          <>
            <Link to="/dashboard" className="text-sm font-inter font-medium text-[#2563eb] flex items-center gap-1.5 hover:text-[#1d4ed8]">
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm font-inter font-medium text-[#64748b] hover:text-red-600 flex items-center gap-1.5 transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm font-inter font-medium text-[#64748b] hover:text-[#0f172a]">Log in</Link>
            <Link to="/register">
              <Button variant="primary">Get Started</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
