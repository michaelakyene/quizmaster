import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AuthLayout from "../components/AuthLayout";

export const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "",
    unmet: [],
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const trimmed = value.length > 512 ? value.slice(0, 512) : value; // simple length cap
    const next = { ...formData, [name]: trimmed };
    setFormData(next);
    if (name === "password") updatePasswordStrength(trimmed);
  };

  const updatePasswordStrength = (pwd) => {
    const requirements = [
      { label: "Min 8 chars", test: (p) => p.length >= 8 },
      { label: "Uppercase letter", test: (p) => /[A-Z]/.test(p) },
      { label: "Lowercase letter", test: (p) => /[a-z]/.test(p) },
      { label: "Number", test: (p) => /[0-9]/.test(p) },
      { label: "Symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
    ];
    const met = requirements.filter((r) => r.test(pwd));
    const score = met.length;
    // Distinct custom labels (non-generic)
    const labels = [
      "Minimal",
      "Low",
      "Moderate",
      "Elevated",
      "High",
      "Fortified",
    ];
    const unmet = requirements.filter((r) => !r.test(pwd)).map((r) => r.label);
    setPasswordStrength({ score, label: labels[score], unmet });
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const nameTrimmed = formData.name.trim();
    const emailTrimmed = formData.email.trim();
    const passwordTrimmed = formData.password;
    const confirmTrimmed = formData.confirmPassword;

    if (nameTrimmed.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (!emailRegex.test(emailTrimmed)) {
      setError("Enter a valid email address");
      return;
    }

    if (passwordTrimmed !== confirmTrimmed) {
      setError("Passwords do not match");
      return;
    }

    if (passwordTrimmed.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (passwordStrength.score < 3) {
      setError("Password is too weak. Satisfy more requirements.");
      return;
    }

    setLoading(true);

    try {
      await register(emailTrimmed, passwordTrimmed, nameTrimmed, formData.role);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      footer={
        <>
          Already have an account? <Link to="/login">Login here</Link>
        </>
      }
    >
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            name="name"
            className="form-input"
            value={formData.name}
            onChange={handleChange}
            autoComplete="name"
            aria-required="true"
            aria-invalid={!!error && formData.name.trim().length < 2}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            className="form-input"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            aria-required="true"
            aria-invalid={!!error && !emailRegex.test(formData.email.trim())}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="role">
            I am a
          </label>
          <select
            id="role"
            name="role"
            className="form-input"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="STUDENT">Student</option>
            <option value="ADMIN">Teacher / Lecturer</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">
            Password
          </label>
          <div className="password-input-wrapper">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              aria-required="true"
              aria-invalid={!!error && passwordStrength.score < 3}
              required
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              title={showPassword ? "Hide" : "Show"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          {formData.password && (
            <div className="password-strength" aria-live="polite">
              <div>Strength: {passwordStrength.label}</div>
              {passwordStrength.unmet.length > 0 && (
                <ul className="password-requirements">
                  {passwordStrength.unmet.map((req) => (
                    <li key={req}>{req}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <div className="password-input-wrapper">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              className="form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
              onClick={() => setShowConfirmPassword((v) => !v)}
              title={showConfirmPassword ? "Hide" : "Show"}
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <div className="btn-center">
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};
