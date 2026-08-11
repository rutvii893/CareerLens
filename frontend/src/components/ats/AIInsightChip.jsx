import React from 'react';
import { Sparkles } from 'lucide-react';

const AIInsightChip = ({ children, className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50/50 border border-purple-100 text-[#7c3aed] text-xs font-semibold font-inter shadow-[0_0_10px_rgba(124,58,237,0.15)] ${className}`}>
      <Sparkles size={12} className="text-[#7c3aed]" />
      {children}
    </div>
  );
};

export default AIInsightChip;
