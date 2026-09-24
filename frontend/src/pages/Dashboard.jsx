import React from 'react';
import { ArrowUpRight, CheckCircle2, FileText, Target, Sparkles, Clock3 } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="page-wrap">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8"><div><span className="eyebrow">Tuesday, September 23</span><h1 className="page-title">Good morning, Jordan.</h1><p className="muted mt-2">Your next strong move is closer than it looks.</p></div><button className="button button-primary"><Sparkles size={16} /> Improve my resume</button></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">
        {[['Career readiness','72','+8% this month',Target],['Resume score','68','Needs a refresh',FileText],['Matched roles','12','4 new this week',ArrowUpRight],['Interview prep','4 / 6','Sessions complete',Clock3]].map(([label,value,detail,Icon]) => <div className="surface surface-pad" key={label}><div className="flex justify-between items-start"><span className="section-label">{label}</span><Icon size={18} className="text-[#e26d3d]" /></div><div className="stat-value mt-5">{value}</div><p className="muted text-xs mt-1">{detail}</p></div>)}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_.9fr]">
        <section className="surface surface-pad"><div className="flex justify-between items-center mb-6"><div><span className="section-label">Readiness overview</span><p className="muted text-sm mt-1">A simple view of what is moving your score.</p></div><span className="tag">Updated today</span></div><div className="flex items-center gap-6"><div className="grid place-items-center w-28 h-28 rounded-full border-[10px] border-[#f7ddd2] border-t-[#e26d3d] border-r-[#e26d3d]"><strong className="font-display text-3xl">72</strong><span className="muted text-xs">out of 100</span></div><div className="flex-1 grid gap-4"><div><div className="flex justify-between text-xs mb-2"><span className="muted">Resume quality</span><strong>68%</strong></div><div className="progress-track"><div className="progress-fill w-[68%]" /></div></div><div><div className="flex justify-between text-xs mb-2"><span className="muted">Target skills</span><strong>76%</strong></div><div className="progress-track"><div className="progress-fill w-[76%]" /></div></div><div><div className="flex justify-between text-xs mb-2"><span className="muted">Interview confidence</span><strong>72%</strong></div><div className="progress-track"><div className="progress-fill w-[72%]" /></div></div></div></div></section>
        <section className="surface surface-pad"><div className="flex justify-between mb-5"><span className="section-label">Your next actions</span><ArrowUpRight size={17} className="text-slate-400" /></div><div className="grid gap-4">{[['Add measurable impact to 2 bullets','Resume'],['Practice a system design answer','Interview'],['Review your missing skills','Career']].map(([task,kind]) => <div className="flex gap-3 items-start" key={task}><CheckCircle2 size={18} className="mt-0.5 text-[#e26d3d]" /><div><p className="text-sm font-bold">{task}</p><span className="muted text-xs">{kind} · 10 min</span></div></div>)}</div></section>
      </div>
    </div>
  );
};

export default Dashboard;
