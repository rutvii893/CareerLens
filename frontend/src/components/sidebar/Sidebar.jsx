import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  X,
  Compass,
} from 'lucide-react';
import LineSidebar from '../common/LineSidebar';
import { useUserContext } from '../../context/UserContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'My Skills', path: '/skills', icon: GraduationCap },
  { name: 'Resume Intelligence', path: '/resume', icon: FileText },
  { name: 'Job Matching', path: '/jobs', icon: Briefcase },
  { name: 'Learning Roadmap', path: '/career/roadmap', icon: Map },
  { name: 'AI Career Coach', path: '/career', icon: Sparkles },
  { name: 'Interview Prep', path: '/interview', icon: MessageSquare },
];

const Sidebar = ({ open = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { targetRole } = useUserContext();

  // Determine active index for LineSidebar
  const getActiveIndex = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 0;
    if (path === '/skills') return 1;
    if (path.startsWith('/resume')) return 2;
    if (path.startsWith('/jobs')) return 3;
    if (path.includes('/roadmap')) return 4;
    if (path === '/career' || path === '/coach') return 5;
    if (path.startsWith('/interview')) return 6;
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
        className={`fixed left-0 top-[64px] w-64 h-[calc(100vh-64px)] bg-white/95 backdrop-blur-md border-r border-[#e2e8f0] flex flex-col py-6 px-4 z-40 overflow-hidden transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between pb-3 mb-2 md:hidden border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#2563eb]" />
            <span className="text-xs font-bold text-slate-800">Navigation Menu</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* React Bits LineSidebar Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 pt-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Workspace Modules
          </div>

          <LineSidebar
            items={NAV_ITEMS.map((item) => item.name)}
            accentColor="#2563eb"
            textColor="#475569"
            markerColor="#cbd5e1"
            showIndex={true}
            showMarker={true}
            proximityRadius={80}
            maxShift={6}
            falloff="smooth"
            markerLength={18}
            markerGap={4}
            tickScale={0.5}
            scaleTick={true}
            itemGap={16}
            fontSize={0.92}
            smoothing={100}
            active={activeIdx}
            onItemClick={handleItemClick}
            className="w-full"
          />
        </div>

        {/* User Account & Preferences */}
        <div className="mt-auto pt-4 border-t border-[#e2e8f0] space-y-1.5">
          <Link
            to="/profile"
            onClick={onClose}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-inter text-sm font-semibold transition-all ${
              location.pathname === '/profile'
                ? 'bg-blue-50 text-[#2563eb] border border-blue-200/80 shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <User size={17} className={location.pathname === '/profile' ? 'text-[#2563eb]' : 'text-slate-400'} />
            <span>My Profile</span>
          </Link>
          <Link
            to="/settings"
            onClick={onClose}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-inter text-sm font-semibold transition-all ${
              location.pathname === '/settings'
                ? 'bg-blue-50 text-[#2563eb] border border-blue-200/80 shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Settings size={17} className={location.pathname === '/settings' ? 'text-[#2563eb]' : 'text-slate-400'} />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
