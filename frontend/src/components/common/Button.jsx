import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-inter font-medium transition-all duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white shadow-sm hover:shadow-md hover:opacity-95',
    secondary: 'bg-white/80 backdrop-blur-[16px] border border-slate-200 text-slate-800 hover:bg-white',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50'
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
