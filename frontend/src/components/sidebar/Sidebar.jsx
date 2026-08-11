import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Briefcase, GraduationCap, Users, Settings } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Skills', path: '/skills', icon: GraduationCap },
    { name: 'Resume', path: '/resume', icon: FileText },
    { name: 'Jobs', path: '/jobs', icon: Briefcase },
    { name: 'Career Coach', path: '/career', icon: Users },
    { name: 'Interview', path: '/interview', icon: Users },
  ];

  return (
    <aside className="fixed left-0 top-[64px] w-64 h-[calc(100vh-64px)] bg-[#f9f9ff] border-r border-slate-200 hidden md:flex flex-col py-6 px-4">
      <div className="flex-1 flex flex-col gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link 
              key={link.name} 
              to={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-inter text-sm font-medium transition-colors
                ${isActive ? 'bg-[#e9edff] text-[#004ac6]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              <Icon size={18} />
              {link.name}
            </Link>
          );
        })}
      </div>
      
      <div className="mt-auto">
        <Link 
          to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-inter text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <Settings size={18} />
          Profile & Settings
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
