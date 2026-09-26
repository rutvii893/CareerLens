import api from './api';

export const interviewService = {
  startSession: async (resumeId, targetRole, interviewType = 'Mixed') => {
    const response = await api.post('/interview/start', {
      resume_id: resumeId ? Number(resumeId) : null,
      target_role: targetRole,
      interview_type: interviewType,
    });
    return response.data;
  },
  evaluateAnswer: async (sessionId, questionId, answerText) => {
    const response = await api.post('/interview/evaluate', {
      session_id: sessionId,
      question_id: questionId,
      answer_text: answerText,
    });
    return response.data;
  },
  getSession: async (sessionId) => {
    const response = await api.get(`/interview/${sessionId}`);
    return response.data;
  },
  getSessions: async () => {
    const response = await api.get('/interview/sessions');
    return response.data;
  },
};
