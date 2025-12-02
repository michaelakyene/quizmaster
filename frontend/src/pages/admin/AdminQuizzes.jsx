import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { quizService } from "../../services/quiz.service";
import PageLayout from "../../components/PageLayout";
import "./AdminQuizzes.css";

export const AdminQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      const data = await quizService.getAllQuizzes();
      setQuizzes(data.quizzes);
    } catch (err) {
      setError("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await quizService.deleteQuiz(id);
      setQuizzes(quizzes.filter((q) => q.id !== id));
    } catch (err) {
      alert("Failed to delete quiz");
    }
  };

  const handleToggleActive = async (quiz) => {
    try {
      await quizService.updateQuiz(quiz.id, {
        ...quiz,
        isActive: !quiz.isActive,
      });
      loadQuizzes();
    } catch (err) {
      alert("Failed to update quiz");
    }
  };

  return (
    <PageLayout
      title="Manage Quizzes"
      loading={loading}
      error={error}
      action={
        <div className="action-bar">
          <Link to="/admin/quiz/create" className="btn btn-primary">
            + Create New Quiz
          </Link>
          <Link
            to="/admin/analytics"
            className="btn btn-outline"
            style={{ marginLeft: 8 }}
          >
            View Analytics
          </Link>
        </div>
      }
    >
      {quizzes.length === 0 ? (
        <div className="card">
          <p className="text-muted">No quizzes created yet.</p>
        </div>
      ) : (
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Questions</th>
                <th>Duration</th>
                <th>Attempts</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz) => (
                <tr key={quiz.id}>
                  <td>
                    <strong>{quiz.title}</strong>
                    <br />
                    <span className="text-muted text-sm">
                      {quiz.description}
                    </span>
                  </td>
                  <td>{quiz.questions?.length || 0}</td>
                  <td>{quiz.duration} min</td>
                  <td>{quiz._count?.attempts || 0}</td>
                  <td>
                    <button
                      className={`status-badge ${
                        quiz.isActive ? "active" : "inactive"
                      }`}
                      onClick={() => handleToggleActive(quiz)}
                    >
                      {quiz.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link
                        to={`/admin/quiz/${quiz.id}/edit`}
                        className="btn btn-sm btn-outline"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/admin/quiz/${quiz.id}/stats`}
                        className="btn btn-sm btn-outline"
                      >
                        Stats
                      </Link>
                      <button
                        onClick={() => handleDelete(quiz.id, quiz.title)}
                        className="btn btn-sm btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  );
};
