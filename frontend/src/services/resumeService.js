import api from './api';

export const resumeService = {
  uploadResume: async (file) => {
    // const formData = new FormData();
    // formData.append('file', file);
    // const response = await api.post('/resumes/upload', formData, {
    //   headers: { 'Content-Type': 'multipart/form-data' }
    // });
    // return response.data;
    return new Promise((resolve) => setTimeout(() => resolve({ id: 'res_123', status: 'uploaded' }), 1000));
  },
  getAnalysis: async (id) => {
    // const response = await api.get(`/resumes/${id}/analysis`);
    // return response.data;
    return new Promise((resolve) => setTimeout(() => resolve({ 
      overall_score: 0, 
      keyword_score: 0, 
      missing_keywords: [], 
      recommendations: [] 
    }), 500));
  }
};
