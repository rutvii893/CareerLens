import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Globe,
  LoaderCircle,
  Save,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { userService } from '../services/userService';

const COUNTRIES = [
  { code: 'in', label: 'India (Default)' },
  { code: 'us', label: 'United States' },
  { code: 'gb', label: 'United Kingdom' },
  { code: 'ca', label: 'Canada' },
  { code: 'de', label: 'Germany' },
  { code: 'au', label: 'Australia' },
  { code: 'sg', label: 'Singapore' },
];

const Settings = () => {
  const [preferences, setPreferences] = useState({
    defaultCountry: 'in',
    enableAiSuggestions: true,
    emailAlerts: false,
    autoMatchJobs: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    userService.getProfile()
      .then((data) => {
        if (data.preferences) {
          setPreferences((prev) => ({ ...prev, ...data.preferences }));
        }
      })
      .catch((err) => {
        console.error('Failed to load settings:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      await userService.updateProfile({ preferences });
      setSuccessMsg('Settings and search preferences saved!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError(err.response?.data?.detail || 'Failed to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container min-h-[50vh] flex flex-col items-center justify-center">
        <LoaderCircle className="w-8 h-8 animate-spin text-[#3B82F6] mb-3" />
        <p className="text-sm font-medium text-slate-500 font-inter">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="page-container max-w-[800px] space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="badge-neutral text-[11px]">Configuration</span>
          <span className="text-xs text-slate-400">• Workspace Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-jakarta text-slate-900 tracking-tight">
          Application Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-inter mt-1">
          Customize search regions, career intelligence context, and automatic skill match calculation.
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

      <form onSubmit={handleSave} className="card-base p-6 sm:p-8 space-y-6">
        {/* Job Search Preferences */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold font-jakarta text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Target Job Search Country</span>
          </h2>
          <p className="text-xs text-slate-500 font-inter">
            Sets the primary country region used when querying live vacancies from Adzuna.
          </p>
          <select
            value={preferences.defaultCountry}
            onChange={(e) => setPreferences({ ...preferences, defaultCountry: e.target.value })}
            className="w-full max-w-sm px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 mt-2"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* AI & Automation Toggles */}
        <div className="pt-5 border-t border-slate-100 space-y-4">
          <h2 className="text-sm font-bold font-jakarta text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span>Intelligence & Career Context</span>
          </h2>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.enableAiSuggestions}
              onChange={(e) => setPreferences({ ...preferences, enableAiSuggestions: e.target.checked })}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-800 block">AI Career Coaching Context</span>
              <p className="text-slate-500 mt-0.5 font-inter">
                Automatically supply your analyzed resume skills and target role to Career Coach questions.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.autoMatchJobs}
              onChange={(e) => setPreferences({ ...preferences, autoMatchJobs: e.target.checked })}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-800 block">Automatic Job Matching</span>
              <p className="text-slate-500 mt-0.5 font-inter">
                Calculate transparent percentage overlap for all Adzuna job listings against your profile.
              </p>
            </div>
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-xs disabled:opacity-50"
          >
            {saving ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
