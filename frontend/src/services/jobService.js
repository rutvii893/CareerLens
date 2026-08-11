import api from './api';

export const jobService = {
  getJobMatches: async (resumeId) => {
    // const response = await api.get(`/matching/jobs?resumeId=${resumeId}`);
    // return response.data;
    return new Promise((resolve) => setTimeout(() => resolve([]), 500));
  },
  analyzeJobMatch: async (resumeId, jobDescription) => {
    // const response = await api.post('/matching/analyze', { resumeId, jobDescription });
    // return response.data;
    return new Promise((resolve) => setTimeout(() => resolve({ match_score: 0, missing_skills: [] }), 1000));
  }
};
