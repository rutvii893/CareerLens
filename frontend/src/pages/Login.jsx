import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';

const Login = () => {
  return (
    <div className="min-h-[calc(100vh-72px)] grid place-items-center px-5 py-12">
      <div className="w-full max-w-[440px] surface surface-pad">
        <div className="mb-8"><span className="eyebrow">Welcome back</span><h1 className="page-title text-[32px]">Continue your progress</h1><p className="muted mt-2 text-sm">Sign in to pick up where you left off.</p></div>
        <form className="grid gap-5" onSubmit={(event) => event.preventDefault()}>
          <label className="form-field"><span className="form-label">Email address</span><span className="relative"><Mail size={17} className="absolute left-3 top-3.5 text-slate-400" /><input className="form-input pl-10" type="email" placeholder="you@example.com" required /></span></label>
          <label className="form-field"><span className="form-label">Password</span><span className="relative"><LockKeyhole size={17} className="absolute left-3 top-3.5 text-slate-400" /><input className="form-input pl-10" type="password" placeholder="Your password" required /></span></label>
          <div className="flex items-center justify-between text-sm"><label className="flex items-center gap-2 muted"><input type="checkbox" /> Remember me</label><button type="button" className="font-bold text-[#e26d3d]">Forgot password?</button></div>
          <button className="button button-primary w-full" type="submit">Sign in <ArrowRight size={17} /></button>
        </form>
        <p className="mt-7 text-center text-sm muted">New to CareerLens? <Link className="font-bold text-[#e26d3d]" to="/register">Create an account</Link></p>
      </div>
    </div>
  );
};

export default Login;
