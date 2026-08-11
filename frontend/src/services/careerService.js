import api from './api';

export const careerService = {
  analyzeSkillGap: async (resumeId, targetRole) => {
    // const response = await api.post('/career/analyze', { resumeId, targetRole });
    // return response.data;
    return new Promise((resolve) => setTimeout(() => resolve({ targetRole, missingSkills: [], roadmap: [] }), 1000));
  },
  getRoadmap: async (resumeId) => {
    // const response = await api.get(`/career/roadmap?resumeId=${resumeId}`);
    // return response.data;
    return new Promise((resolve) => setTimeout(() => resolve([]), 500));
  }
};
