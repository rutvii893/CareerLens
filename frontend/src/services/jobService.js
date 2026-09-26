import api from './api';

export const jobService = {
  searchLiveJobs: async (params = {}) => {
    const response = await api.get('/jobs/search', { params });
    return response.data;
  },
  saveJob: async (jobData) => {
    const response = await api.post('/jobs/save', jobData);
    return response.data;
  },
  getSavedJobs: async () => {
    const response = await api.get('/jobs/saved');
    return response.data;
  },
  updateJobStatus: async (applicationId, status, notes = null) => {
    const response = await api.patch(`/jobs/saved/${applicationId}/status`, { status, notes });
    return response.data;
  },
  deleteSavedJob: async (applicationId) => {
    const response = await api.delete(`/jobs/saved/${applicationId}`);
    return response.data;
  },
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
  },
};
