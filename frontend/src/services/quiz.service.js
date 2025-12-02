import { http } from "./http";

export const quizService = {
  async getAllQuizzes() {
    return http.get("/quizzes");
  },

  async getQuizById(id) {
    return http.get(`/quizzes/${id}`);
  },

  async verifyQuizAccess(id, code) {
    return http.post(`/quizzes/${id}/access`, { code });
  },

  async createQuiz(quizData) {
    return http.post("/quizzes", quizData);
  },

  async updateQuiz(id, quizData) {
    return http.put(`/quizzes/${id}`, quizData);
  },

  async deleteQuiz(id) {
    return http.delete(`/quizzes/${id}`);
  },

  async addQuestion(quizId, questionData) {
    return http.post(`/quizzes/${quizId}/questions`, questionData);
  },

  async getQuizStats(id) {
    return http.get(`/quizzes/${id}/stats`);
  },
};
