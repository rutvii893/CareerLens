import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';
import { clearAccessToken, getAccessToken } from '../services/tokenStorage';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [targetRole, setTargetRole] = useState(localStorage.getItem('cl_target_role') || 'Full Stack Engineer');
  const [targetScore, setTargetScore] = useState(Number(localStorage.getItem('cl_target_score')) || 80);
  const [loading, setLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchUserData = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const profile = await userService.getProfile();
      if (profile) {
        setUser(profile);
        const prefs = profile.preferences || {};
        const canonicalRole = profile.target_role || prefs.target_role;
        const canonicalScore = profile.target_score || prefs.target_score || 80;

        if (canonicalRole) {
          setTargetRole(canonicalRole);
          localStorage.setItem('cl_target_role', canonicalRole);
        }
        setTargetScore(canonicalScore);
        localStorage.setItem('cl_target_score', String(canonicalScore));
      }
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

    const previousRole = targetRole;
    const previousScore = targetScore;

    // 1. Optimistically update local state & storage
    setTargetRole(trimmedRole);
    setTargetScore(newScore);
    localStorage.setItem('cl_target_role', trimmedRole);
    localStorage.setItem('cl_target_score', String(newScore));

    // Update current user state optimistically
    setUser((prev) => prev ? {
      ...prev,
      target_role: trimmedRole,
      preferences: { ...(prev.preferences || {}), target_role: trimmedRole, target_score: newScore },
    } : prev);

    // 2. Persist to backend database
    try {
      const updatedUser = await userService.updateTargetGoal(trimmedRole, newScore);
      if (updatedUser) {
        setUser(updatedUser);
      }
      // 3. Trigger global refetch so all subscribers update
      setRefreshIndex((prev) => prev + 1);
    } catch (err) {
      // Rollback on failure
      setTargetRole(previousRole);
      setTargetScore(previousScore);
      if (previousRole) {
        localStorage.setItem('cl_target_role', previousRole);
      } else {
        localStorage.removeItem('cl_target_role');
      }
      localStorage.setItem('cl_target_score', String(previousScore));
      setUser((prev) => prev ? {
        ...prev,
        target_role: previousRole,
        preferences: { ...(prev.preferences || {}), target_role: previousRole, target_score: previousScore },
      } : prev);
      console.error('Failed to update target goal in backend:', err);
      throw err;
    }
  };

  const refreshUserData = () => {
    setRefreshIndex((prev) => prev + 1);
  };

  const logout = () => {
    clearAccessToken();
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
