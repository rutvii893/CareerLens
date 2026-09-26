import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  LoaderCircle,
  RefreshCw,
  UploadCloud,
} from 'lucide-react';
import { userService } from '../services/userService';
import Dashboard14 from '../components/dashboard/Dashboard14';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [selectedService, setSelectedService] = useState('career_overview');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userService.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.response?.data?.detail || 'Unable to load your career metrics. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleUpdateTargetGoal = async (targetRole, targetScore) => {
    try {
      await userService.updateTargetGoal(targetRole, targetScore);
      // Refresh metrics with updated skill gap calculations
      const updated = await userService.getDashboardMetrics();
      setMetrics(updated);
    } catch (err) {
      console.error('Failed to update target goal:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-[1360px] mx-auto w-full min-h-[60vh] flex flex-col items-center justify-center">
        <LoaderCircle className="w-10 h-10 animate-spin text-[#2563eb] mb-4" />
        <p className="text-slate-600 font-medium font-inter">Loading your live career intelligence data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-[1360px] mx-auto w-full">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-red-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <h3 className="font-semibold font-jakarta">Could not load dashboard</h3>
              <p className="text-sm text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchMetrics}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm shrink-0"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1360px] mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-jakarta text-slate-900 tracking-tight">
            Career Intelligence Board
          </h1>
          <p className="text-slate-500 font-inter mt-1">
            Master-detail service telemetry based on your resume, skills, target role, and career milestones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all shadow-sm flex items-center gap-2 text-xs font-semibold"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Link
            to="/resume"
            className="px-4 py-2.5 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:opacity-95 text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" /> Upload Resume
          </Link>
        </div>
      </div>

      {/* React Bits Pro Dashboard 14 Master-Detail Service Board */}
      <Dashboard14
        metrics={metrics}
        selectedService={selectedService}
        onSelectService={setSelectedService}
        onRefresh={fetchMetrics}
        onUpdateTargetGoal={handleUpdateTargetGoal}
      />
    </div>
  );
};

export default Dashboard;

