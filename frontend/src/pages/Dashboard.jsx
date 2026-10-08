import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  LoaderCircle,
  RefreshCw,
  UploadCloud,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { userService } from '../services/userService';
import Dashboard14 from '../components/dashboard/Dashboard14';

const Dashboard = () => {
  const { targetRole, updateTargetGoal } = useUser();
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
  }, [targetRole]);

  const handleUpdateTargetGoal = async (newRole, newScore) => {
    try {
      await updateTargetGoal(newRole, newScore);
      const updated = await userService.getDashboardMetrics();
      setMetrics(updated);
    } catch (err) {
      console.error('Failed to update target goal:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-[1360px] mx-auto w-full min-h-[60vh] flex flex-col items-center justify-center">
        <LoaderCircle className="w-10 h-10 animate-spin text-[#3B82F6] mb-4" />
        <p className="text-[#64748B] font-medium font-inter">Loading your live career intelligence data...</p>
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
          <h1 className="text-3xl font-extrabold font-jakarta text-[#0F172A] tracking-tight">
            Dashboard
          </h1>
          <p className="text-[#64748B] font-inter mt-1">
            Your progress toward becoming a {targetRole || 'Software Engineer'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            className="p-2.5 bg-white hover:bg-slate-50 text-[#64748B] border border-slate-200 rounded-xl transition-all shadow-2xs flex items-center gap-2 text-xs font-semibold cursor-pointer"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Link
            to="/resume"
            className="px-4 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-95 text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
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

