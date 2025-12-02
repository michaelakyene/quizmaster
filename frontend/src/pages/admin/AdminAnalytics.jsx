import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import "./AdminQuizzes.css";

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setError("");
      setLoading(true);
      try {
        const res = await api.get("/analytics/overview?days=30");
        setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (user?.role !== "ADMIN") {
    return <div className="card">Access denied</div>;
  }

  return (
    <div className="page-container">
      <h2>Analytics</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="card">Loading...</div>}

      {data && (
        <div className="grid-2">
          {/* Simple bar chart for Top Quizzes */}
          <div className="card">
            <h3>Top Quizzes</h3>
            <div style={{ padding: 8 }}>
              <svg width="100%" height={160} viewBox={`0 0 400 160`}>
                {data.topQuizzes.map((q, i) => {
                  const pct = Math.round(q.average * 100);
                  const barWidth = (pct / 100) * 300;
                  const y = 20 + i * 28;
                  return (
                    <g key={q.quizId}>
                      <text x={0} y={y} dy={-6} fontSize="10">
                        {q.title}
                      </text>
                      <rect
                        x={80}
                        y={y - 16}
                        width={barWidth}
                        height={16}
                        fill="#4f46e5"
                      />
                      <text x={80 + barWidth + 6} y={y - 4} fontSize="10">
                        {pct}%
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Avg Score</th>
                  <th>Attempts</th>
                </tr>
              </thead>
              <tbody>
                {data.topQuizzes.map((q) => (
                  <tr key={q.quizId}>
                    <td>{q.title}</td>
                    <td>{(q.average * 100).toFixed(1)}%</td>
                    <td>{q.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3>Low Quizzes</h3>
            <div style={{ padding: 8 }}>
              <svg width="100%" height={160} viewBox={`0 0 400 160`}>
                {data.lowQuizzes.map((q, i) => {
                  const pct = Math.round(q.average * 100);
                  const barWidth = (pct / 100) * 300;
                  const y = 20 + i * 28;
                  return (
                    <g key={q.quizId}>
                      <text x={0} y={y} dy={-6} fontSize="10">
                        {q.title}
                      </text>
                      <rect
                        x={80}
                        y={y - 16}
                        width={barWidth}
                        height={16}
                        fill="#ef4444"
                      />
                      <text x={80 + barWidth + 6} y={y - 4} fontSize="10">
                        {pct}%
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Avg Score</th>
                  <th>Attempts</th>
                </tr>
              </thead>
              <tbody>
                {data.lowQuizzes.map((q) => (
                  <tr key={q.quizId}>
                    <td>{q.title}</td>
                    <td>{(q.average * 100).toFixed(1)}%</td>
                    <td>{q.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3>Student Performance</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Avg Score</th>
                  <th>Attempts</th>
                </tr>
              </thead>
              <tbody>
                {data.studentPerformance.map((s) => (
                  <tr key={s.userId}>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{(s.average * 100).toFixed(1)}%</td>
                    <td>{s.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3>Attempts (Last 30 days)</h3>
            <div style={{ padding: 8 }}>
              {(() => {
                const points = data.attemptsPerDay.map((d, i) => ({
                  x: i,
                  y: d.count,
                  label: d.date,
                }));
                const maxY = Math.max(1, ...points.map((p) => p.y));
                const width = 400,
                  height = 160,
                  left = 40,
                  bottom = 20;
                const scaleX = (x) =>
                  left +
                  (x / Math.max(1, points.length - 1)) * (width - left - 10);
                const scaleY = (y) =>
                  height - bottom - (y / maxY) * (height - bottom - 10);
                const path = points
                  .map(
                    (p, i) =>
                      `${i === 0 ? "M" : "L"}${scaleX(p.x)},${scaleY(p.y)}`
                  )
                  .join(" ");
                return (
                  <svg
                    width="100%"
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                  >
                    <line
                      x1={left}
                      y1={10}
                      x2={left}
                      y2={height - bottom}
                      stroke="#ccc"
                    />
                    <line
                      x1={left}
                      y1={height - bottom}
                      x2={width - 10}
                      y2={height - bottom}
                      stroke="#ccc"
                    />
                    <path
                      d={path}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                    {points.map((p, i) => (
                      <circle
                        key={i}
                        cx={scaleX(p.x)}
                        cy={scaleY(p.y)}
                        r={3}
                        fill="#10b981"
                      />
                    ))}
                  </svg>
                );
              })()}
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Attempts</th>
                </tr>
              </thead>
              <tbody>
                {data.attemptsPerDay.map((d) => (
                  <tr key={d.date}>
                    <td>{d.date}</td>
                    <td>{d.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
