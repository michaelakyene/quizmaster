import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizService } from "../services/quiz.service";
import { attemptService } from "../services/attempt.service";
import PageLayout from "../components/PageLayout";
import "./QuizTake.css";

export const QuizTake = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [accessCode, setAccessCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [accessError, setAccessError] = useState("");

  useEffect(() => {
    // Load basic quiz meta (no questions until unlocked)
    const loadMeta = async () => {
      try {
        const data = await quizService.getQuizById(id);
        setQuiz(data.quiz);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };
    loadMeta();
  }, [id]);

  useEffect(() => {
    const autoStart = async () => {
      if (!quiz || quiz.requiresAccess || attempt) return;
      try {
        const attemptData = await attemptService.startAttempt(id);
        setAttempt(attemptData.attempt);
        setTimeRemaining(quiz.duration * 60);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to start quiz");
      }
    };

    autoStart();
  }, [quiz, attempt, id]);

  useEffect(() => {
    if (timeRemaining === null) return;

    if (timeRemaining <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setAccessError("");
    setVerifying(true);
    try {
      const unlocked = await quizService.verifyQuizAccess(id, accessCode);
      setQuiz(unlocked.quiz);
      const attemptData = await attemptService.startAttempt(id, accessCode);
      setAttempt(attemptData.attempt);
      setTimeRemaining(unlocked.quiz.duration * 60);
    } catch (err) {
      setAccessError(err.response?.data?.error || "Invalid access code");
    } finally {
      setVerifying(false);
    }
  };

  const handleAnswerChange = async (questionId, choiceId, isMultiple) => {
    let newAnswers = { ...answers };

    if (isMultiple) {
      const currentAnswers = newAnswers[questionId] || [];
      if (currentAnswers.includes(choiceId)) {
        newAnswers[questionId] = currentAnswers.filter((id) => id !== choiceId);
      } else {
        newAnswers[questionId] = [...currentAnswers, choiceId];
      }
    } else {
      newAnswers[questionId] = [choiceId];
    }

    setAnswers(newAnswers);

    // Submit answer to backend
    try {
      await attemptService.submitAnswer(
        attempt.id,
        questionId,
        newAnswers[questionId]
      );
    } catch (err) {
      console.error("Failed to save answer:", err);
    }
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const confirmSubmit = window.confirm(
      "Are you sure you want to submit your quiz? You cannot change your answers after submission."
    );

    if (!confirmSubmit) return;

    setSubmitting(true);

    try {
      const result = await attemptService.submitAttempt(attempt.id);
      navigate(`/attempt/${result.attempt.id}/result`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit quiz");
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading || error) {
    return (
      <PageLayout loading={loading} error={error}>
        {!loading && !error && null}
      </PageLayout>
    );
  }

  if (!quiz) return null;

  // Locked state (no questions loaded yet)
  if (quiz.requiresAccess && (!attempt || quiz.questions.length === 0)) {
    return (
      <PageLayout title={quiz.title}>
        <div className="unlock-card">
          <p className="text-muted">Enter the quiz access code to begin.</p>
          <form onSubmit={handleUnlock} className="unlock-form">
            <input
              type="text"
              placeholder="Access Code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              required
              className="form-input"
              disabled={verifying}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={verifying || !accessCode}
            >
              {verifying ? "Verifying..." : "Unlock Quiz"}
            </button>
          </form>
          {accessError && (
            <div className="alert alert-error">{accessError}</div>
          )}
        </div>
      </PageLayout>
    );
  }

  const question = quiz.questions[currentQuestion];
  const isMultiple = question.type === "MULTIPLE_CHOICE";
  const isTextBased =
    question.type === "SHORT_ANSWER" ||
    question.type === "FILL_IN_THE_BLANK" ||
    question.type === "ESSAY";
  const userAnswer = answers[question.id] || [];

  return (
    <PageLayout title={quiz.title}>
      <div className="quiz-header">
        <div>
          <p className="text-muted">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </p>
        </div>
        <div className="quiz-timer">
          <span className={timeRemaining < 300 ? "timer-warning" : ""}>
            ⏱️ {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      <div className="quiz-progress">
        <div
          className="quiz-progress-bar"
          style={{
            width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
          }}
        ></div>
      </div>

      <div className="question-card">
        <div className="question-header">
          <h2>{question.text}</h2>
          <span className="question-points">{question.points} point(s)</span>
        </div>

        {isMultiple && <p className="question-hint">Select all that apply</p>}

        {!isTextBased ? (
          <div className="choices">
            {question.choices.map((choice) => (
              <label key={choice.id} className="choice-label">
                <input
                  type={isMultiple ? "checkbox" : "radio"}
                  name={`question-${question.id}`}
                  checked={userAnswer.includes(choice.id)}
                  onChange={() =>
                    handleAnswerChange(question.id, choice.id, isMultiple)
                  }
                />
                <span className="choice-text">{choice.text}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="text-answer">
            <textarea
              className="form-textarea"
              placeholder={
                question.type === "ESSAY"
                  ? "Write your response here..."
                  : "Type your answer"
              }
              value={userAnswer[0] || ""}
              onChange={async (e) => {
                const value = e.target.value;
                setAnswers((prev) => ({ ...prev, [question.id]: [value] }));
                try {
                  await attemptService.submitAnswer(attempt.id, question.id, {
                    textResponse: value,
                  });
                } catch (err) {
                  console.error("Failed to save text answer:", err);
                }
              }}
              rows={question.type === "ESSAY" ? 6 : 3}
            />
          </div>
        )}
      </div>

      <div className="quiz-navigation">
        <button
          onClick={handlePrevious}
          className="btn btn-outline"
          disabled={currentQuestion === 0}
        >
          Previous
        </button>

        <div className="quiz-indicators">
          {quiz.questions.map((q, idx) => (
            <button
              key={q.id}
              className={`indicator ${
                idx === currentQuestion ? "active" : ""
              } ${answers[q.id]?.length > 0 ? "answered" : ""}`}
              onClick={() => setCurrentQuestion(idx)}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {currentQuestion === quiz.questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="btn btn-secondary"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        ) : (
          <button onClick={handleNext} className="btn btn-primary">
            Next
          </button>
        )}
      </div>
    </PageLayout>
  );
};
