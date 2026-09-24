import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Briefcase, GraduationCap, MessageSquareText, UserRound, X, Map } from 'lucide-react';

const Sidebar = ({ open = false, onClose }) => {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My skills', path: '/skills', icon: GraduationCap },
    { name: 'Resume', path: '/resume', icon: FileText },
    { name: 'Job matching', path: '/jobs', icon: Briefcase },
    { name: 'Roadmap', path: '/career/roadmap', icon: Map },
    { name: 'Interview', path: '/interview', icon: MessageSquareText },
  ];

  return (
    <>
      {open && <button className="mobile-backdrop md:hidden" onClick={onClose} aria-label="Close navigation" />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="flex items-center justify-between mb-7 px-3 md:hidden">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</span>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Close navigation"><X size={18} /></button>
        </div>
        <div className="flex items-center gap-2 px-3 mb-7">
          <span className="eyebrow-dot" />
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Student workspace</span>
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link 
              key={link.name} 
              to={link.path}
              onClick={onClose}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <Icon size={18} />
              {link.name}
            </Link>
          );
        })}
        </div>
        <div className="mt-auto pt-5 border-t border-slate-200/80">
        <Link 
          to="/profile"
          onClick={onClose}
          className={`nav-item ${location.pathname === '/profile' ? 'nav-item-active' : ''}`}
        >
          <UserRound size={18} />
          Profile
        </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
