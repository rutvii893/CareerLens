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
  Zap,
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
      <div className="p-6 md:p-8 max-w-[800px] mx-auto w-full min-h-[50vh] flex flex-col items-center justify-center">
        <LoaderCircle className="w-8 h-8 animate-spin text-[#2563eb] mb-3" />
        <p className="text-slate-600 font-medium text-sm">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[800px] mx-auto w-full space-y-6">
      {/* Header */}
      <div>
        <span className="px-2.5 py-0.5 bg-blue-50 text-[#2563eb] border border-blue-200/60 rounded-md text-xs font-bold uppercase tracking-wider">
          Preferences
        </span>
        <h1 className="text-3xl font-extrabold font-jakarta text-slate-900 tracking-tight mt-1">
          Application Settings
        </h1>
        <p className="text-slate-500 font-inter mt-1">
          Customize default search filters, AI recommendations, and notification behavior.
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

      <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        {/* Job Search Preferences */}
        <div>
          <h2 className="text-base font-bold font-jakarta text-slate-900 flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-[#2563eb]" /> Job Search Country
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Sets the primary country region used when querying live vacancies from Adzuna.
          </p>
          <select
            value={preferences.defaultCountry}
            onChange={(e) => setPreferences({ ...preferences, defaultCountry: e.target.value })}
            className="w-full max-w-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#2563eb]"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* AI & Automation Toggles */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h2 className="text-base font-bold font-jakarta text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#7c3aed]" /> Intelligence & Automation
          </h2>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.enableAiSuggestions}
              onChange={(e) => setPreferences({ ...preferences, enableAiSuggestions: e.target.checked })}
              className="mt-1 rounded text-[#2563eb] focus:ring-[#2563eb]"
            />
            <div>
              <span className="text-sm font-bold text-slate-800 block">AI Career Coaching & Context</span>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically supply your analyzed resume skills to Career Coach questions.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.autoMatchJobs}
              onChange={(e) => setPreferences({ ...preferences, autoMatchJobs: e.target.checked })}
              className="mt-1 rounded text-[#2563eb] focus:ring-[#2563eb]"
            />
            <div>
              <span className="text-sm font-bold text-slate-800 block">Live Skill Match Calculation</span>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculate transparent percentage overlap for all Adzuna job listings against your profile.
              </p>
            </div>
          </label>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
