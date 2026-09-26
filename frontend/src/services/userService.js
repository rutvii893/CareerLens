import api from './api';

export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await api.put('/users/me', data);
    return response.data;
  },
  getDashboardMetrics: async () => {
    const response = await api.get('/users/me/dashboard');
    return response.data;
  },
  getSkills: async () => {
    const response = await api.get('/users/me/skills');
    return response.data;
  },
  addCustomSkill: async (skillName, currentScore = null) => {
    const response = await api.post('/users/me/skills', {
      skill_name: skillName,
      current_score: currentScore,
    });
    return response.data;
  },
  deleteCustomSkill: async (skillName) => {
    const response = await api.delete(`/users/me/skills/${encodeURIComponent(skillName)}`);
    return response.data;
  },
  updateSkillAssessment: async (skillName, currentScore, targetScore = 80) => {
    const response = await api.put('/users/me/skills/assessment', {
      skill_name: skillName,
      current_score: currentScore,
      target_score: targetScore,
    });
    return response.data;
  },
  updateTargetGoal: async (targetRole, targetScore = 80) => {
    const response = await api.put('/users/me/target-goal', {
      target_role: targetRole,
      target_score: targetScore,
    });
    return response.data;
  },
};
