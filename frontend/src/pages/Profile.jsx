import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  LoaderCircle,
  Mail,
  MapPin,
  Save,
  ShieldCheck,
  Target,
  User,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { userService } from '../services/userService';

const Profile = () => {
  const { refreshUserData } = useUser();
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
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      await userService.updateProfile(formData);
      setSuccessMsg('Profile updated successfully!');
      refreshUserData();
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
      <div className="page-container min-h-[60vh] flex flex-col items-center justify-center">
        <LoaderCircle className="w-8 h-8 animate-spin text-[#3B82F6] mb-3" />
        <p className="text-sm font-medium text-slate-500 font-inter">Loading profile details...</p>
      </div>
    );
  }

  // Calculate profile completeness
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
    <div className="page-container space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="badge-neutral text-[11px]">User Account</span>
          <span className="text-xs text-slate-400">• Profile Settings</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-jakarta text-slate-900 tracking-tight">
          Profile & Career Identity
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-inter mt-1 max-w-2xl">
          Keep your professional details updated so your Career Evidence Map, AI coaching, and job matching stay calibrated.
        </p>
      </div>

      {successMsg && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#3B82F6] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Summary Card */}
        <div className="lg:col-span-4 space-y-5">
          <div className="card-base p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] text-white text-xl font-extrabold font-jakarta rounded-full flex items-center justify-center mx-auto shadow-sm">
              {getInitials(formData.name)}
            </div>
            <div>
              <h2 className="text-lg font-bold font-jakarta text-slate-900">{formData.name || 'User'}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{formData.email}</p>
            </div>

            {formData.target_role && (
              <span className="badge-blue text-xs mx-auto">
                {formData.target_role}
              </span>
            )}

            <div className="pt-4 border-t border-slate-100 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Profile Completeness</span>
                <span className="font-bold text-blue-600">{strengthPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${strengthPercentage}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Complete fields to calibrate role recommendations.
              </p>
            </div>
          </div>

          <div className="card-base p-5 space-y-2.5 text-xs">
            <h3 className="font-bold font-jakarta text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Authentication & Privacy</span>
            </h3>
            <p className="text-slate-500 font-inter leading-relaxed">
              Your account is secured with JWT tokens and bcrypt encryption. Your data is isolated and never exposed publicly.
            </p>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              Member since: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Active'}
            </div>
          </div>
        </div>

        {/* Right Column: Profile Form */}
        <div className="lg:col-span-8 card-base p-6 sm:p-8">
          <form onSubmit={handleSave} className="space-y-5">
            <h3 className="text-base font-bold font-jakarta text-slate-900 pb-3 border-b border-slate-100">
              Personal & Career Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
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
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
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
                  placeholder="e.g. Full Stack Engineer"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location / Region
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. Bengaluru, India or Remote"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
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
                  placeholder="e.g. B.Tech Computer Science"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Experience Level
                </label>
                <input
                  type="text"
                  value={formData.experience}
                  onChange={(e) => handleChange('experience', e.target.value)}
                  placeholder="e.g. Fresher / 2+ Years"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
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
                placeholder="Brief summary of your background, technical interests, and goal timeline..."
                rows={4}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs disabled:opacity-50"
              >
                {saving ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
