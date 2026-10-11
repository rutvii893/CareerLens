import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Menu } from 'lucide-react';
import Button from '../common/Button';
import { authService } from '../../services/authService';
import { getAccessToken } from '../../services/tokenStorage';

import CareerLensLogo from '../common/CareerLensLogo';

const Navbar = ({ isLanding = false, onMenuToggle }) => {
  const navigate = useNavigate();
  const token = getAccessToken();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 w-full h-[76px] bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] z-50 px-6 md:px-10 flex items-center justify-between transition-colors duration-300">
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
        <CareerLensLogo variant="full" size="navbar" />
      </div>
      
      {isLanding && (
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-inter text-[#64748B] hover:text-[#3B82F6] transition-colors">Features</a>
          <Link to="/resume" className="text-sm font-inter text-[#64748B] hover:text-[#3B82F6] transition-colors">AI Resume Screening</Link>
          <Link to="/jobs" className="text-sm font-inter text-[#64748B] hover:text-[#3B82F6] transition-colors">Job Matching</Link>
          <Link to="/career" className="text-sm font-inter text-[#64748B] hover:text-[#3B82F6] transition-colors">Career Intelligence</Link>
          <Link to="/interview" className="text-sm font-inter text-[#64748B] hover:text-[#3B82F6] transition-colors">Interview Preparation</Link>
        </div>
      )}

      <div className="flex items-center gap-4">
        {token ? (
          <>
            <Link to="/dashboard" className="text-sm font-inter font-medium text-[#3B82F6] flex items-center gap-1.5 hover:text-[#2563EB]">
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm font-inter font-medium text-[#64748B] hover:text-red-600 flex items-center gap-1.5 transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm font-inter font-medium text-[#64748B] hover:text-[#0F172A]">Log in</Link>
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
