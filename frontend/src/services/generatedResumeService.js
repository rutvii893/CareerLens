import api from './api';

export const generatedResumeService = {
  list: async () => (await api.get('/resume-generator/resumes')).data,
  get: async (id) => (await api.get(`/resume-generator/resumes/${id}`)).data,
  create: async (resume) => (await api.post('/resume-generator/resumes', resume)).data,
  update: async (id, resume) => (await api.put(`/resume-generator/resumes/${id}`, resume)).data,
  remove: async (id) => api.delete(`/resume-generator/resumes/${id}`),
  downloadPdf: async (id, template) => api.get(`/resume-generator/resumes/${id}/pdf`, {
    params: { template },
    responseType: 'blob',
  }),
  finalize: async (resume) => (await api.post('/resume-generator/finalize', resume)).data,
};
