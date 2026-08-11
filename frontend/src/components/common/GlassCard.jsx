import React from 'react';

const GlassCard = ({ children, className = '' }) => {
  return (
    <div className={`bg-white/80 backdrop-blur-[16px] border border-white/30 rounded-2xl shadow-[0_30px_60px_-15px_rgba(37,99,235,0.05)] p-6 ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;
