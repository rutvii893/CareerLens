import React from 'react';
import { Search, MapPin, ArrowUpRight, SlidersHorizontal } from 'lucide-react';

const JobRecommendations = () => {
  return (
    <div className="page-wrap"><div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-end mb-7"><div><span className="eyebrow">Job matching</span><h1 className="page-title">Roles that fit your direction.</h1><p className="muted mt-2">Based on your current resume and target skills.</p></div><button className="button button-quiet"><SlidersHorizontal size={16} /> Filters</button></div><div className="surface p-2 flex gap-2 mb-5"><Search size={19} className="m-3 text-slate-400" /><input className="flex-1 bg-transparent outline-none text-sm" placeholder="Search role, company, or skill" /><button className="button button-primary">Search</button></div><div className="grid gap-4 lg:grid-cols-2">{[['Product Designer','Northstar Labs','87% match','Remote · New York'],['Frontend Engineer','Brightline Systems','81% match','Remote · Austin'],['UX Researcher','Fieldwork Studio','76% match','Hybrid · Chicago'],['Design Systems Lead','Atlas Works','72% match','Remote · San Francisco']].map(([role,company,match,location]) => <article className="surface surface-pad" key={role}><div className="flex justify-between gap-3"><div><span className="tag text-[#e26d3d] bg-[#fbe5dc]">{match}</span><h2 className="font-display text-xl font-bold mt-4">{role}</h2><p className="muted text-sm mt-1">{company}</p></div><button className="icon-button" aria-label={`Open ${role}`}><ArrowUpRight size={18} /></button></div><div className="flex items-center gap-2 muted text-xs mt-6"><MapPin size={15} />{location}</div><div className="flex flex-wrap gap-2 mt-5"><span className="tag">Figma</span><span className="tag">Strategy</span><span className="tag">Collaboration</span></div></article>)}</div></div>
  );
};

export default JobRecommendations;
