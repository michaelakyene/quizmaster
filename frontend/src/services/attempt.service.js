import { http } from "./http";

export const attemptService = {
  async startAttempt(quizId, code) {
    return http.post("/attempts/start", { quizId, code });
  },

  async submitAnswer(attemptId, questionId, payload) {
    // payload can be { choiceIds: [...] } or { textResponse } or { matchPairs: [...] }
    return http.post(`/attempts/${attemptId}/answer`, {
      questionId,
      ...(Array.isArray(payload) || typeof payload === "string"
        ? { choiceIds: payload }
        : payload),
    });
  },

  async submitAttempt(attemptId) {
    return http.post(`/attempts/${attemptId}/submit`);
  },

  async getAttemptById(attemptId) {
    return http.get(`/attempts/${attemptId}`);
  },

  async getUserAttempts() {
    return http.get("/attempts/user/me");
  },

  async getAllAttempts(quizId = null) {
    const url = quizId ? `/attempts?quizId=${quizId}` : "/attempts";
    return http.get(url);
  },
};
