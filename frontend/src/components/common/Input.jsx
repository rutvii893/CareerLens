import React from 'react';

const Input = ({ label, id, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium font-inter text-slate-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`px-3 py-2 rounded-lg border font-inter text-sm outline-none transition-colors duration-200
          ${error 
            ? 'border-red-500 focus:border-red-500' 
            : 'border-slate-300 focus:border-[#2563eb]'
          }`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 font-inter">{error}</span>}
    </div>
  );
};

export default Input;
