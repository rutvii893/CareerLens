import api from './api';

export const careerService = {
  analyzeSkillGap: async (resumeId, targetRole) => {
    const response = await api.post('/career/analyze', { resume_id: resumeId || null, target_role: targetRole });
    return response.data;
  },
  getRoadmap: async (resumeId) => {
    const response = await api.get('/career/roadmap', { params: resumeId ? { resumeId } : {} });
    return response.data;
  },
  getRoles: async () => {
    const response = await api.get('/career/roles');
    return response.data;
  },
  createRoadmap: async (resumeId, targetRole) => {
    const response = await api.post('/career/roadmap', { resume_id: resumeId || null, target_role: targetRole });
    return response.data;
  },
  updateRoadmapPhase: async (roadmapId, phaseIdx, status) => {
    const response = await api.patch(`/career/roadmap/${roadmapId}/phase/${phaseIdx}`, { status });
    return response.data;
  },
  listRoadmaps: async () => {
    const response = await api.get('/career/roadmaps');
    return response.data;
  },
  askCoach: async (question, resumeId, targetRole) => {
    const response = await api.post('/career/coach/ask', {
      question,
      resume_id: resumeId || null,
      target_role: targetRole || null,
    });
    return response.data;
  },
};
