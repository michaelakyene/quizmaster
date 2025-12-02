import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { attemptService } from "../services/attempt.service";
import PageLayout from "../components/PageLayout";
import "./QuizResult.css";

export const QuizResult = () => {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAttempt();
  }, [attemptId]);

  const loadAttempt = async () => {
    try {
      const data = await attemptService.getAttemptById(attemptId);
      setAttempt(data.attempt);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  if (loading || error) {
    return <PageLayout loading={loading} error={error} />;
  }

  if (!attempt) return null;

  const percentage = Math.round((attempt.score / attempt.maxScore) * 100);
  const isPassed = percentage >= 60;

  // Group answers by question
  const answersByQuestion = {};
  attempt.answers.forEach((answer) => {
    if (!answersByQuestion[answer.questionId]) {
      answersByQuestion[answer.questionId] = [];
    }
    answersByQuestion[answer.questionId].push(answer.choiceId);
  });

  return (
    <PageLayout title="Quiz Results">
      <div className="result-header">
        <h1>Quiz Results</h1>
        <div className={`result-badge ${isPassed ? "passed" : "failed"}`}>
          {isPassed ? "✓ Passed" : "✗ Failed"}
        </div>
      </div>

      <div className="result-summary">
        <div className="result-card">
          <h2>Your Score</h2>
          <div className="score-display">
            <span className="score-main">{attempt.score}</span>
            <span className="score-divider">/</span>
            <span className="score-total">{attempt.maxScore}</span>
          </div>
          <div className="score-percentage">{percentage}%</div>
        </div>

        <div className="result-info">
          <h3>{attempt.quiz.title}</h3>
          <div className="result-meta">
            <p>
              <strong>Submitted:</strong>{" "}
              {new Date(attempt.submittedAt).toLocaleString()}
            </p>
            <p>
              <strong>Total Questions:</strong> {attempt.quiz.questions.length}
            </p>
            <p>
              <strong>Duration:</strong> {attempt.quiz.duration} minutes
            </p>
          </div>
        </div>
      </div>

      <div className="questions-review">
        <h2>Question Review</h2>
        {attempt.quiz.questions.map((question, idx) => {
          const userAnswerIds = answersByQuestion[question.id] || [];
          const correctChoiceIds = question.choices
            .filter((c) => c.isCorrect)
            .map((c) => c.id)
            .sort();
          const userChoiceIdsSorted = [...userAnswerIds].sort();

          const isCorrect =
            JSON.stringify(correctChoiceIds) ===
            JSON.stringify(userChoiceIdsSorted);

          return (
            <div
              key={question.id}
              className={`review-card ${isCorrect ? "correct" : "incorrect"}`}
            >
              <div className="review-header">
                <h4>
                  Question {idx + 1}: {question.text}
                </h4>
                <div className="review-status">
                  {isCorrect ? (
                    <span className="status-correct">✓ Correct</span>
                  ) : (
                    <span className="status-incorrect">✗ Incorrect</span>
                  )}
                  <span className="question-points">
                    {isCorrect ? question.points : 0} / {question.points} points
                  </span>
                </div>
              </div>

              <div className="review-choices">
                {question.choices.map((choice) => {
                  const isUserAnswer = userAnswerIds.includes(choice.id);
                  const isCorrectChoice = choice.isCorrect;

                  let className = "review-choice";
                  if (isCorrectChoice) {
                    className += " correct-choice";
                  }
                  if (isUserAnswer && !isCorrectChoice) {
                    className += " wrong-choice";
                  }

                  return (
                    <div key={choice.id} className={className}>
                      <span className="choice-indicator">
                        {isCorrectChoice && "✓ "}
                        {isUserAnswer && !isCorrectChoice && "✗ "}
                      </span>
                      {choice.text}
                      {isUserAnswer && (
                        <span className="user-answer-badge">Your answer</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="result-actions">
        <Link to="/dashboard" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    </PageLayout>
  );
};
