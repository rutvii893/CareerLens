import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-inter font-medium transition-all duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-b from-[#2563eb] to-[#1d4ed8] text-white shadow-sm hover:shadow-md hover:from-[#1d4ed8] hover:to-[#1e40af]',
    secondary: 'bg-white/80 backdrop-blur-[16px] border border-white/30 text-slate-800 hover:bg-white/90',
    outline: 'border border-[#c3c6d7] text-slate-700 hover:bg-slate-50'
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
