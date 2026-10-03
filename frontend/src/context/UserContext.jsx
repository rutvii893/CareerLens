import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [targetRole, setTargetRole] = useState(localStorage.getItem('cl_target_role') || 'Full Stack Engineer');
  const [targetScore, setTargetScore] = useState(Number(localStorage.getItem('cl_target_score')) || 80);
  const [loading, setLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [profileData, metricsData] = await Promise.allSettled([
        userService.getProfile(),
        userService.getDashboardMetrics(),
      ]);

      let canonicalRole = null;
      let canonicalScore = 80;

      if (profileData.status === 'fulfilled' && profileData.value) {
        setUser(profileData.value);
        if (profileData.value.target_role) {
          canonicalRole = profileData.value.target_role;
        }
        if (profileData.value.target_score) {
          canonicalScore = profileData.value.target_score;
        }
      }

      if (metricsData.status === 'fulfilled' && metricsData.value) {
        if (!canonicalRole && metricsData.value.target_role) {
          canonicalRole = metricsData.value.target_role;
        }
        if (metricsData.value.target_score) {
          canonicalScore = metricsData.value.target_score;
        }
      }

      if (canonicalRole) {
        setTargetRole(canonicalRole);
        localStorage.setItem('cl_target_role', canonicalRole);
      }
      setTargetScore(canonicalScore);
      localStorage.setItem('cl_target_score', String(canonicalScore));
    } catch (err) {
      console.warn('Could not sync user profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData, refreshIndex]);

  // Global Canonical Target Role Updater
  const updateTargetGoal = async (newRole, newScore = targetScore) => {
    const trimmedRole = (newRole || '').trim();
    if (!trimmedRole) return;

    // 1. Optimistically update local state & storage
    setTargetRole(trimmedRole);
    setTargetScore(newScore);
    localStorage.setItem('cl_target_role', trimmedRole);
    localStorage.setItem('cl_target_score', String(newScore));

    // 2. Persist to backend database
    try {
      await userService.updateTargetGoal(trimmedRole, newScore);
      // 3. Trigger global refetch so all subscribers update
      setRefreshIndex((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to update target goal in backend:', err);
      throw err;
    }
  };

  const refreshUserData = () => {
    setRefreshIndex((prev) => prev + 1);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('cl_target_role');
    localStorage.removeItem('cl_target_score');
    setUser(null);
    setTargetRole('Full Stack Engineer');
    setTargetScore(80);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        targetRole,
        targetScore,
        loading,
        updateTargetGoal,
        refreshUserData,
        setUser,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const useUserContext = useUser;

export default UserContext;
