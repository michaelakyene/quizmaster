import React from "react";
import "../pages/Auth.css";

export const AuthLayout = ({ title, children, footer }) => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">{title}</h1>
        {children}
        {footer && <p className="auth-footer">{footer}</p>}
      </div>
    </div>
  );
};

export default AuthLayout;
