import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FilePlus2,
  Briefcase,
  GraduationCap,
  Sparkles,
  Map,
  MessageSquare,
  Settings,
  User,
  X,
  Compass,
} from 'lucide-react';
import LineSidebar from '../common/LineSidebar';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'My Skills', path: '/skills', icon: GraduationCap },
  { name: 'Resume Analyzer', path: '/resume', icon: FileText },
  { name: 'Resume Generator', path: '/resume-generator', icon: FilePlus2 },
  { name: 'Job Matching', path: '/jobs', icon: Briefcase },
  { name: 'Learning Roadmap', path: '/career/roadmap', icon: Map },
  { name: 'AI Career Coach', path: '/career', icon: Sparkles },
  { name: 'Interview Prep', path: '/interview', icon: MessageSquare },
];

const Sidebar = ({ open = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active index for LineSidebar
  const getActiveIndex = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 0;
    if (path === '/skills') return 1;
    if (path === '/resume') return 2;
    if (path.startsWith('/resume-generator')) return 3;
    if (path.startsWith('/jobs')) return 4;
    if (path.includes('/roadmap')) return 5;
    if (path === '/career' || path === '/coach') return 6;
    if (path.startsWith('/interview')) return 7;
    return 0;
  };

  const activeIdx = getActiveIndex();

  const handleItemClick = (index) => {
    const target = NAV_ITEMS[index];
    if (target) {
      navigate(target.path);
      if (onClose) onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-[76px] w-64 h-[calc(100vh-76px)] bg-white/95 backdrop-blur-md border-r border-[#e2e8f0] flex flex-col py-5 px-4 z-40 overflow-y-auto transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Sidebar Header */}
        <div className="flex items-center justify-end md:hidden pb-2 mb-2 border-b border-slate-100">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* LineSidebar Navigation Items */}
        <div className="flex-1 pt-2">
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">
            Workspace Modules
          </div>

          <LineSidebar
            items={NAV_ITEMS.map(i => i.name)}
            active={activeIdx}
            accentColor="#3B82F6"
            textColor="#64748b"
            markerColor="#cbd5e1"
            showIndex={true}
            showMarker={true}
            proximityRadius={95}
            maxShift={18}
            falloff="smooth"
            markerLength={32}
            markerGap={4}
            tickScale={0.5}
            scaleTick={true}
            itemGap={15}
            fontSize={0.98}
            smoothing={120}
            onItemClick={handleItemClick}
            className="pl-[42px] pr-2"
          />
        </div>

        {/* User Account & Preferences */}
        <div className="mt-auto pt-4 border-t border-[#e2e8f0] space-y-1.5">
          <Link
            to="/profile"
            onClick={onClose}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-inter text-xs font-bold transition-all ${
              location.pathname === '/profile'
                ? 'bg-blue-50 text-[#3B82F6] border border-blue-200/80 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <User size={17} className={location.pathname === '/profile' ? 'text-[#3B82F6]' : 'text-slate-400'} />
            <span>My Profile</span>
          </Link>
          <Link
            to="/settings"
            onClick={onClose}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-inter text-xs font-bold transition-all ${
              location.pathname === '/settings'
                ? 'bg-blue-50 text-[#3B82F6] border border-blue-200/80 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Settings size={17} className={location.pathname === '/settings' ? 'text-[#3B82F6]' : 'text-slate-400'} />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
