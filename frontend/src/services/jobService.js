import api from './api';

export const jobService = {
  getJobMatches: async (resumeId) => {
    const response = await api.get('/matching/jobs', { params: { resumeId } });
    return response.data;
  },
  analyzeJobMatch: async (resumeId, jobDescription) => {
    const response = await api.post('/matching/analyze', { resume_id: resumeId, job_description: jobDescription });
    return response.data;
  },
  createJob: async (job) => {
    const response = await api.post('/matching/jobs', job);
    return response.data;
  }
};
