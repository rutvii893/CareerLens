import api from './api';

export const interviewService = {
  startSession: async (resumeId, targetRole) => {
    // const response = await api.post('/interview/start', { resumeId, targetRole });
    // return response.data;
    return new Promise((resolve) => setTimeout(() => resolve({ sessionId: 'int_123', questions: [] }), 1000));
  },
  evaluateAnswer: async (sessionId, questionId, answerText) => {
    // const response = await api.post('/interview/evaluate', { sessionId, questionId, answerText });
    // return response.data;
    return new Promise((resolve) => setTimeout(() => resolve({ feedback: 'Empty state ready', score: 0 }), 1000));
  }
};
