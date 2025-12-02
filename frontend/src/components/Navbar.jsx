import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Navbar.css";

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <img
              src="/logo.svg"
              alt="QuizMaster Logo"
              className="navbar-logo"
            />
            <span>QuizMaster</span>
          </Link>

          {user && (
            <div className="navbar-menu">
              <Link to="/dashboard" className="navbar-link">
                Dashboard
              </Link>
              {isAdmin && (
                <>
                  <Link to="/admin/quizzes" className="navbar-link">
                    Manage Quizzes
                  </Link>
                  <Link to="/admin/attempts" className="navbar-link">
                    View Attempts
                  </Link>
                </>
              )}
              <div className="navbar-user">
                <span className="navbar-username">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline btn-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
