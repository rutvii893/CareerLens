import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Sparkles,
} from 'lucide-react';
import CareerLensLogo from '../components/common/CareerLensLogo';
import { authService } from '../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credentials.email.trim() || !credentials.password) {
      setError('Please enter both your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.login(credentials);
      navigate('/dashboard');
    } catch (requestError) {
      console.error('Login error:', requestError);
      setError(
        requestError.response?.data?.detail ||
          'Invalid email or password. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[#F8FAFF] via-slate-50 to-blue-50/20">
      <div className="w-full max-w-[460px] bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-blue-500/5 p-6 sm:p-10 animate-fadeIn">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <CareerLensLogo variant="full" size="auth" className="mb-4" />
          <h1 className="text-2xl sm:text-3xl font-extrabold font-jakarta text-[#0F172A] tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] font-inter mt-1.5">
            Sign in to continue your personalized career roadmap & diagnostics.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="email"
                required
                autoComplete="email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-blue-500/15 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <LockKeyhole className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                placeholder="Enter your password"
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-blue-500/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-95 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
          >
            {loading ? (
              <>
                <LoaderCircle className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in to CareerLens</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs sm:text-sm text-[#64748B] font-inter">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-bold text-[#3B82F6] hover:text-[#2563EB] hover:underline">
              Create your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
