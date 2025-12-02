import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { quizService } from "../services/quiz.service";
import { attemptService } from "../services/attempt.service";
import { useAuth } from "../contexts/AuthContext";
import PageLayout from "../components/PageLayout";
import "./Dashboard.css";

export const Dashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [quizzesData, attemptsData] = await Promise.all([
        quizService.getAllQuizzes(),
        attemptService.getUserAttempts(),
      ]);
      setQuizzes(quizzesData.quizzes);
      setAttempts(attemptsData.attempts);
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Dashboard"
      loading={loading}
      error={error}
      action={
        isAdmin && (
          <Link to="/admin/quizzes" className="btn btn-primary">
            Manage Quizzes
          </Link>
        )
      }
    >
      <div className="dashboard-section">
        <h2 className="section-title">Available Quizzes</h2>
        {quizzes.length === 0 ? (
          <div className="card">
            <p className="text-muted">No quizzes available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-2">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="quiz-card">
                <h3>{quiz.title}</h3>
                <p className="text-muted">{quiz.description}</p>
                <div className="quiz-meta">
                  <span>⏱️ {quiz.duration} minutes</span>
                  <span>📝 {quiz.questions?.length || 0} questions</span>
                </div>
                <Link
                  to={`/quiz/${quiz.id}`}
                  className="btn btn-primary btn-block mt-2"
                >
                  Start Quiz
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2 className="section-title">Your Recent Attempts</h2>
        {attempts.length === 0 ? (
          <div className="card">
            <p className="text-muted">You haven't attempted any quizzes yet.</p>
          </div>
        ) : (
          <div className="attempts-list">
            {attempts.map((attempt) => (
              <div key={attempt.id} className="attempt-card">
                <div className="attempt-info">
                  <h4>{attempt.quiz.title}</h4>
                  <p className="text-muted text-sm">
                    Submitted: {new Date(attempt.submittedAt).toLocaleString()}
                  </p>
                </div>
                <div className="attempt-score">
                  <span className="score-value">
                    {attempt.score} / {attempt.maxScore}
                  </span>
                  <span className="score-percent">
                    {Math.round((attempt.score / attempt.maxScore) * 100)}%
                  </span>
                </div>
                <Link
                  to={`/attempt/${attempt.id}/result`}
                  className="btn btn-outline"
                >
                  View Results
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};
