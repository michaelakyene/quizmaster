import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { Navbar } from "./components/Navbar";
import { PrivateRoute, AdminRoute } from "./components/PrivateRoute";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { QuizTake } from "./pages/QuizTake";
import { QuizResult } from "./pages/QuizResult";
import { AdminQuizzes } from "./pages/admin/AdminQuizzes";
import { QuizCreate } from "./pages/admin/QuizCreate";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/quiz/:id"
          element={
            <PrivateRoute>
              <QuizTake />
            </PrivateRoute>
          }
        />

        <Route
          path="/attempt/:attemptId/result"
          element={
            <PrivateRoute>
              <QuizResult />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/quizzes"
          element={
            <AdminRoute>
              <AdminQuizzes />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/analytics"
          element={
            <AdminRoute>
              <AdminAnalytics />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/quiz/create"
          element={
            <AdminRoute>
              <QuizCreate />
            </AdminRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;
