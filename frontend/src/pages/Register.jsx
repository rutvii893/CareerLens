import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, UserRound, Mail, LockKeyhole } from 'lucide-react';
import { authService } from '../services/authService';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = React.useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.register(form);
      navigate('/login');
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] grid place-items-center px-5 py-10">
      <div className="w-full max-w-[500px] surface surface-pad">
        <div className="mb-7"><span className="eyebrow">Start with clarity</span><h1 className="page-title text-[32px]">Build your career edge</h1><p className="muted mt-2 text-sm">Create a workspace for your resume, goals, and next interview.</p></div>
        <form className="grid gap-4" onSubmit={submit}>
          <label className="form-field"><span className="form-label">Full name</span><span className="relative"><UserRound size={17} className="absolute left-3 top-3.5 text-slate-400" /><input className="form-input pl-10" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Jordan Davis" required /></span></label>
          <label className="form-field"><span className="form-label">Email address</span><span className="relative"><Mail size={17} className="absolute left-3 top-3.5 text-slate-400" /><input className="form-input pl-10" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" required /></span></label>
          <label className="form-field"><span className="form-label">Password</span><span className="relative"><LockKeyhole size={17} className="absolute left-3 top-3.5 text-slate-400" /><input className="form-input pl-10" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" minLength="8" required /></span></label>
          <label className="flex items-start gap-2 py-2 text-sm muted"><input type="checkbox" className="mt-1" required /> I agree to the terms and understand how my data is used.</label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button className="button button-primary w-full" type="submit" disabled={loading}>{loading ? 'Creating workspace...' : 'Create workspace'} <ArrowRight size={17} /></button>
        </form>
        <p className="mt-7 text-center text-sm muted">Already have an account? <Link className="font-bold text-[#e26d3d]" to="/login">Sign in</Link></p>
      </div>
    </div>
  );
};

export default Register;
