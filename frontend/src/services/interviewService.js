import api from './api';

export const interviewService = {
  startSession: async (resumeId, targetRole) => {
    const response = await api.post('/interview/start', { resume_id: resumeId, target_role: targetRole, interview_type: 'Mixed' });
    return response.data;
  },
  evaluateAnswer: async (sessionId, questionId, answerText) => {
    const response = await api.post('/interview/evaluate', { session_id: sessionId, question_id: questionId, answer_text: answerText });
    return response.data;
  },
  getSession: async (sessionId) => {
    const response = await api.get(`/interview/${sessionId}`);
    return response.data;
  }
};
