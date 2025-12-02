import "../pages/Dashboard.css";

const PageLayout = ({ title, action, loading, error, children }) => {
  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {(title || action) && (
        <div className="dashboard-header">
          {title && <h1>{title}</h1>}
          {action}
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {children}
    </div>
  );
};

export default PageLayout;
