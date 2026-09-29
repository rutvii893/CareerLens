import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  GraduationCap,
  Sparkles,
  Map,
  MessageSquare,
  Settings,
  User,
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Skills', path: '/skills', icon: GraduationCap },
    { name: 'Resume Intelligence', path: '/resume', icon: FileText },
    { name: 'Job Matching', path: '/jobs', icon: Briefcase },
    { name: 'Learning Roadmap', path: '/career/roadmap', icon: Map },
    { name: 'AI Career Coach', path: '/career', icon: Sparkles },
    { name: 'Interview Prep', path: '/interview', icon: MessageSquare },
  ];

  return (
    <aside className="fixed left-0 top-[64px] w-64 h-[calc(100vh-64px)] bg-white border-r border-[#e2e8f0] hidden md:flex flex-col py-6 px-4 z-40">
      <div className="flex-1 flex flex-col gap-1.5">
        <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Navigation
        </span>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            location.pathname === link.path ||
            (link.path === '/career' && (location.pathname === '/career' || location.pathname === '/coach')) ||
            (link.path === '/career/roadmap' && (location.pathname === '/career/roadmap' || location.pathname === '/roadmap')) ||
            (link.path === '/resume' && location.pathname.startsWith('/resume'));

          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-inter text-xs font-semibold transition-all
                ${
                  isActive
                    ? 'bg-blue-50 text-[#2563eb] border border-blue-200/80 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
            >
              <Icon size={17} className={isActive ? 'text-[#2563eb]' : 'text-slate-400'} />
              {link.name}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-[#e2e8f0] space-y-1">
        <Link
          to="/profile"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-inter text-xs font-semibold transition-all ${
            location.pathname === '/profile'
              ? 'bg-blue-50 text-[#2563eb] border border-blue-200/80 shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <User size={17} className="text-slate-400" />
          My Profile
        </Link>
        <Link
          to="/settings"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-inter text-xs font-semibold transition-all ${
            location.pathname === '/settings'
              ? 'bg-blue-50 text-[#2563eb] border border-blue-200/80 shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Settings size={17} className="text-slate-400" />
          Settings
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
