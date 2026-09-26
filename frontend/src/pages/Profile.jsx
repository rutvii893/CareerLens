import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Briefcase,
  Camera,
  CheckCircle2,
  GraduationCap,
  LoaderCircle,
  Mail,
  MapPin,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  User,
} from 'lucide-react';
import { userService } from '../services/userService';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    target_role: '',
    location: '',
    education: '',
    experience: '',
    bio: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userService.getProfile();
      setProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        target_role: data.target_role || '',
        location: data.location || '',
        education: data.education || '',
        experience: data.experience || '',
        bio: data.bio || '',
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err.response?.data?.detail || 'Unable to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      setError('Name cannot be blank.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const updated = await userService.updateProfile(formData);
      setProfile(updated);
      setSuccessMsg('Profile details saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-[1100px] mx-auto w-full min-h-[60vh] flex flex-col items-center justify-center">
        <LoaderCircle className="w-10 h-10 animate-spin text-[#2563eb] mb-4" />
        <p className="text-slate-600 font-medium font-inter">Loading profile details...</p>
      </div>
    );
  }

  // Calculate profile strength
  const fields = [formData.name, formData.email, formData.target_role, formData.location, formData.education, formData.experience, formData.bio];
  const filledFields = fields.filter((f) => Boolean(f && f.trim())).length;
  const strengthPercentage = Math.round((filledFields / fields.length) * 100);

  const getInitials = (name) => {
    if (!name) return 'CL';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-6 md:p-8 max-w-[1100px] mx-auto w-full space-y-8">
      {/* Header */}
      <div>
        <span className="px-2.5 py-0.5 bg-blue-50 text-[#2563eb] border border-blue-200/60 rounded-md text-xs font-bold uppercase tracking-wider">
          User Account
        </span>
        <h1 className="text-3xl font-extrabold font-jakarta text-slate-900 tracking-tight mt-1">
          Profile & Preferences
        </h1>
        <p className="text-slate-500 font-inter mt-1">
          Keep your details up-to-date so AI coaching, roadmaps, and job matching stay accurate.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-[#2563eb] to-[#7c3aed] text-white text-2xl font-extrabold font-jakarta rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              {getInitials(formData.name)}
            </div>
            <h2 className="text-xl font-bold font-jakarta text-slate-900">{formData.name || 'User'}</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{formData.email}</p>
            {formData.target_role && (
              <span className="inline-block mt-3 px-3 py-1 bg-blue-50 text-[#2563eb] border border-blue-200/60 rounded-full text-xs font-bold">
                {formData.target_role}
              </span>
            )}

            <div className="mt-6 pt-5 border-t border-slate-100 text-left">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-700">Profile Completeness</span>
                <span className="font-extrabold text-[#2563eb]">{strengthPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#2563eb] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${strengthPercentage}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Complete all fields to maximize skill matching precision.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="text-sm font-bold font-jakarta text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Account Security
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your account is authenticated with JWT tokens. Passwords are encrypted with bcrypt hashing.
            </p>
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">
              Joined: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Active user'}
            </div>
          </div>
        </div>

        {/* Right: Editable Form */}
        <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
          <form onSubmit={handleSave} className="space-y-5">
            <h2 className="text-lg font-bold font-jakarta text-slate-900 pb-2 border-b border-slate-100">
              Personal & Career Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#2563eb]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#2563eb]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-slate-400" /> Target Career Role
                </label>
                <input
                  type="text"
                  value={formData.target_role}
                  onChange={(e) => handleChange('target_role', e.target.value)}
                  placeholder="e.g. Full Stack Developer"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Preferred Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. San Francisco, CA or Remote"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Highest Education
                </label>
                <input
                  type="text"
                  value={formData.education}
                  onChange={(e) => handleChange('education', e.target.value)}
                  placeholder="e.g. BS in Computer Science"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Years of Experience
                </label>
                <input
                  type="text"
                  value={formData.experience}
                  onChange={(e) => handleChange('experience', e.target.value)}
                  placeholder="e.g. 2+ Years"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#2563eb]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Bio & Career Objectives
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="Brief summary of your background, career interests, and goals..."
                rows={4}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
