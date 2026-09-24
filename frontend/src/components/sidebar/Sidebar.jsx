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
    <aside className="fixed left-0 top-[64px] w-64 h-[calc(100vh-64px)] bg-white border-r border-[#e2e8f0] hidden md:flex flex-col py-6 px-4">
      <div className="flex-1 flex flex-col gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link 
              key={link.name} 
              to={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-inter text-sm font-medium transition-colors
                ${isActive ? 'bg-blue-50 text-[#2563eb] border border-blue-100' : 'text-[#334155] hover:bg-slate-50 hover:text-[#0f172a]'}`}
            >
              <Icon size={18} />
              {link.name}
            </Link>
          );
        })}
      </div>
      
      <div className="mt-auto pt-4 border-t border-[#e2e8f0]">
        <Link 
          to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-inter text-sm font-medium text-[#334155] hover:bg-slate-50 hover:text-[#0f172a]"
        >
          <Settings size={18} />
          Profile & Settings
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
