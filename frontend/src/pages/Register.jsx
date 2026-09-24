import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, UserRound, Mail, LockKeyhole } from 'lucide-react';

const Register = () => {
  return (
    <div className="min-h-[calc(100vh-72px)] grid place-items-center px-5 py-10">
      <div className="w-full max-w-[500px] surface surface-pad">
        <div className="mb-7"><span className="eyebrow">Start with clarity</span><h1 className="page-title text-[32px]">Build your career edge</h1><p className="muted mt-2 text-sm">Create a workspace for your resume, goals, and next interview.</p></div>
        <form className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
          <label className="form-field"><span className="form-label">Full name</span><span className="relative"><UserRound size={17} className="absolute left-3 top-3.5 text-slate-400" /><input className="form-input pl-10" placeholder="Jordan Davis" required /></span></label>
          <label className="form-field"><span className="form-label">Email address</span><span className="relative"><Mail size={17} className="absolute left-3 top-3.5 text-slate-400" /><input className="form-input pl-10" type="email" placeholder="you@example.com" required /></span></label>
          <label className="form-field"><span className="form-label">Password</span><span className="relative"><LockKeyhole size={17} className="absolute left-3 top-3.5 text-slate-400" /><input className="form-input pl-10" type="password" placeholder="At least 8 characters" minLength="8" required /></span></label>
          <label className="flex items-start gap-2 py-2 text-sm muted"><input type="checkbox" className="mt-1" required /> I agree to the terms and understand how my data is used.</label>
          <button className="button button-primary w-full" type="submit">Create workspace <ArrowRight size={17} /></button>
        </form>
        <p className="mt-7 text-center text-sm muted">Already have an account? <Link className="font-bold text-[#e26d3d]" to="/login">Sign in</Link></p>
      </div>
    </div>
  );
};

export default Register;
