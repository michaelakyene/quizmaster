import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { quizService } from "../../services/quiz.service";
import PageLayout from "../../components/PageLayout";
import "./QuizForm.css";

export const QuizCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: 30,
    isActive: true,
    hasPassword: false,
    accessCode: "",
  });
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        type: "SINGLE_CHOICE",
        points: 1,
        order: questions.length + 1,
        choices: [
          { text: "", isCorrect: false, order: 1 },
          { text: "", isCorrect: false, order: 2 },
        ],
        textKeys: [],
        matchPairs: [],
      },
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const addChoice = (questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].choices.push({
      text: "",
      isCorrect: false,
      order: newQuestions[questionIndex].choices.length + 1,
    });
    setQuestions(newQuestions);
  };

  const updateChoice = (questionIndex, choiceIndex, field, value) => {
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];
    if (field === "isCorrect" && question.type === "SINGLE_CHOICE") {
      if (value) {
        question.choices = question.choices.map((c, idx) => ({
          ...c,
          isCorrect: idx === choiceIndex,
        }));
      } else {
        question.choices[choiceIndex].isCorrect = false;
      }
    } else {
      question.choices[choiceIndex][field] = value;
    }
    setQuestions(newQuestions);
  };

  const addTextKey = (questionIndex) => {
    const newQuestions = [...questions];
    if (!newQuestions[questionIndex].textKeys)
      newQuestions[questionIndex].textKeys = [];
    newQuestions[questionIndex].textKeys.push({
      value: "",
      caseSensitive: false,
    });
    setQuestions(newQuestions);
  };

  const updateTextKey = (questionIndex, keyIndex, field, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].textKeys[keyIndex][field] = value;
    setQuestions(newQuestions);
  };

  const removeTextKey = (questionIndex, keyIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].textKeys.splice(keyIndex, 1);
    setQuestions(newQuestions);
  };

  const addMatchPair = (questionIndex) => {
    const newQuestions = [...questions];
    if (!newQuestions[questionIndex].matchPairs)
      newQuestions[questionIndex].matchPairs = [];
    newQuestions[questionIndex].matchPairs.push({ prompt: "", answer: "" });
    setQuestions(newQuestions);
  };

  const updateMatchPair = (questionIndex, pairIndex, field, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].matchPairs[pairIndex][field] = value;
    setQuestions(newQuestions);
  };

  const removeMatchPair = (questionIndex, pairIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].matchPairs.splice(pairIndex, 1);
    setQuestions(newQuestions);
  };

  const removeChoice = (questionIndex, choiceIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].choices.splice(choiceIndex, 1);
    setQuestions(newQuestions);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (questions.length === 0) {
      setError("Please add at least one question");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text || !q.text.trim()) {
        setError(`Question ${i + 1}: Text is required`);
        return;
      }
      if (!q.points || Number(q.points) < 1) {
        setError(`Question ${i + 1}: Points must be at least 1`);
        return;
      }
      if (q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE") {
        if (!q.choices || q.choices.length < 2) {
          setError(`Question ${i + 1}: At least 2 choices required`);
          return;
        }
        const correctCount = q.choices.filter((c) => c.isCorrect).length;
        if (q.type === "SINGLE_CHOICE") {
          if (correctCount !== 1) {
            setError(`Question ${i + 1}: Exactly one choice must be correct`);
            return;
          }
        } else {
          if (correctCount < 1) {
            setError(`Question ${i + 1}: Mark at least one choice as correct`);
            return;
          }
        }
      } else if (q.type === "SHORT_ANSWER" || q.type === "FILL_IN_THE_BLANK") {
        if (!q.textKeys || q.textKeys.length < 1) {
          setError(`Question ${i + 1}: Add at least one acceptable answer`);
          return;
        }
        const allFilled = q.textKeys.every((k) => k.value && k.value.trim());
        if (!allFilled) {
          setError(`Question ${i + 1}: Acceptable answers cannot be empty`);
          return;
        }
      } else if (q.type === "MATCHING") {
        if (!q.matchPairs || q.matchPairs.length < 1) {
          setError(`Question ${i + 1}: Add at least one matching pair`);
          return;
        }
        const allPairsValid = q.matchPairs.every(
          (p) => p.prompt && p.prompt.trim() && p.answer && p.answer.trim()
        );
        if (!allPairsValid) {
          setError(
            `Question ${i + 1}: Matching pairs require both prompt and answer`
          );
          return;
        }
      } else if (q.type === "ESSAY") {
        // No additional validation for essay
      } else {
        setError(`Question ${i + 1}: Unsupported question type`);
        return;
      }
    }

    if (formData.hasPassword && !formData.accessCode.trim()) {
      setError("Please enter a password or disable 'Add password'.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        duration: formData.duration,
        isActive: formData.isActive,
        accessCode: formData.hasPassword ? formData.accessCode.trim() : "",
      };

      const quizData = await quizService.createQuiz(payload);
      const quizId = quizData.quiz.id;

      // Add questions
      for (const question of questions) {
        await quizService.addQuestion(quizId, question);
      }

      navigate("/admin/quizzes");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout title="Create New Quiz" error={error}>
      <form onSubmit={handleSubmit}>
        <div className="card">
          <h2 className="card-title">Quiz Information</h2>

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Duration (minutes) *</label>
            <input
              type="number"
              name="duration"
              className="form-input"
              value={formData.duration}
              onChange={handleChange}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label flex" style={{ alignItems: "center" }}>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                style={{ marginRight: "8px" }}
              />
              Active (visible to students)
            </label>
          </div>

          <div className="form-group">
            <label className="form-label flex" style={{ alignItems: "center" }}>
              <input
                type="checkbox"
                name="hasPassword"
                checked={formData.hasPassword}
                onChange={handleChange}
                style={{ marginRight: "8px" }}
              />
              Add password
            </label>
          </div>

          {formData.hasPassword && (
            <div className="form-group">
              <label className="form-label">Quiz password</label>
              <input
                type="text"
                name="accessCode"
                className="form-input"
                value={formData.accessCode}
                onChange={handleChange}
                placeholder="e.g. QUIZ123"
              />
            </div>
          )}
        </div>

        <div className="questions-section">
          <div className="flex-between mb-2">
            <h2>Questions</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="btn btn-secondary"
            >
              + Add Question
            </button>
          </div>

          {questions.map((question, qIdx) => (
            <div key={qIdx} className="question-form card">
              <div className="flex-between mb-2">
                <h3>Question {qIdx + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  className="btn btn-danger btn-sm"
                >
                  Remove
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Question Text *</label>
                <textarea
                  className="form-textarea"
                  value={question.text}
                  onChange={(e) => updateQuestion(qIdx, "text", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    value={question.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const newQuestions = [...questions];
                      newQuestions[qIdx].type = newType;
                      if (
                        newType === "SINGLE_CHOICE" ||
                        newType === "MULTIPLE_CHOICE"
                      ) {
                        if (
                          !newQuestions[qIdx].choices ||
                          newQuestions[qIdx].choices.length < 2
                        ) {
                          newQuestions[qIdx].choices = [
                            { text: "", isCorrect: false, order: 1 },
                            { text: "", isCorrect: false, order: 2 },
                          ];
                        }
                        newQuestions[qIdx].textKeys = [];
                        newQuestions[qIdx].matchPairs = [];
                      } else if (
                        newType === "SHORT_ANSWER" ||
                        newType === "FILL_IN_THE_BLANK"
                      ) {
                        newQuestions[qIdx].choices = [];
                        if (
                          !newQuestions[qIdx].textKeys ||
                          newQuestions[qIdx].textKeys.length === 0
                        ) {
                          newQuestions[qIdx].textKeys = [
                            { value: "", caseSensitive: false },
                          ];
                        }
                        newQuestions[qIdx].matchPairs = [];
                      } else if (newType === "MATCHING") {
                        newQuestions[qIdx].choices = [];
                        newQuestions[qIdx].textKeys = [];
                        if (
                          !newQuestions[qIdx].matchPairs ||
                          newQuestions[qIdx].matchPairs.length === 0
                        ) {
                          newQuestions[qIdx].matchPairs = [
                            { prompt: "", answer: "" },
                          ];
                        }
                      } else if (newType === "ESSAY") {
                        newQuestions[qIdx].choices = [];
                        newQuestions[qIdx].textKeys = [];
                        newQuestions[qIdx].matchPairs = [];
                      }
                      setQuestions(newQuestions);
                    }}
                  >
                    <option value="SINGLE_CHOICE">Single Choice</option>
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                    <option value="FILL_IN_THE_BLANK">Fill in the Blank</option>
                    <option value="MATCHING">Matching</option>
                    <option value="ESSAY">Essay</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Points *</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    value={question.points}
                    onChange={(e) =>
                      updateQuestion(qIdx, "points", Number(e.target.value))
                    }
                    required
                  />
                </div>

                {(question.type === "SINGLE_CHOICE" ||
                  question.type === "MULTIPLE_CHOICE") && (
                  <div className="choices-section">
                    <label className="form-label">Choices *</label>
                    {question.choices.map((choice, cIdx) => (
                      <div key={cIdx} className="choice-input">
                        <input
                          type="checkbox"
                          checked={choice.isCorrect}
                          onChange={(e) =>
                            updateChoice(
                              qIdx,
                              cIdx,
                              "isCorrect",
                              e.target.checked
                            )
                          }
                          title="Mark as correct"
                        />
                        <input
                          type="text"
                          className="form-input"
                          placeholder={`Choice ${cIdx + 1}`}
                          value={choice.text}
                          onChange={(e) =>
                            updateChoice(qIdx, cIdx, "text", e.target.value)
                          }
                          required
                        />
                        {question.choices.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeChoice(qIdx, cIdx)}
                            className="btn btn-danger btn-sm"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addChoice(qIdx)}
                      className="btn btn-outline btn-sm mt-1"
                    >
                      + Add Choice
                    </button>
                  </div>
                )}

                {(question.type === "SHORT_ANSWER" ||
                  question.type === "FILL_IN_THE_BLANK") && (
                  <div className="choices-section">
                    <label className="form-label">Acceptable Answers *</label>
                    {(question.textKeys || []).map((key, kIdx) => (
                      <div key={kIdx} className="choice-input">
                        <input
                          type="text"
                          className="form-input"
                          placeholder={`Answer ${kIdx + 1}`}
                          value={key.value}
                          onChange={(e) =>
                            updateTextKey(qIdx, kIdx, "value", e.target.value)
                          }
                          required
                        />
                        <label
                          className="form-label"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!key.caseSensitive}
                            onChange={(e) =>
                              updateTextKey(
                                qIdx,
                                kIdx,
                                "caseSensitive",
                                e.target.checked
                              )
                            }
                          />
                          Case sensitive
                        </label>
                        {(question.textKeys?.length || 0) > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTextKey(qIdx, kIdx)}
                            className="btn btn-danger btn-sm"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addTextKey(qIdx)}
                      className="btn btn-outline btn-sm mt-1"
                    >
                      + Add Answer
                    </button>
                  </div>
                )}

                {question.type === "MATCHING" && (
                  <div className="choices-section">
                    <label className="form-label">Matching Pairs *</label>
                    {(question.matchPairs || []).map((pair, pIdx) => (
                      <div
                        key={pIdx}
                        className="grid grid-2"
                        style={{ gap: 8, alignItems: "center" }}
                      >
                        <input
                          type="text"
                          className="form-input"
                          placeholder={`Prompt ${pIdx + 1}`}
                          value={pair.prompt}
                          onChange={(e) =>
                            updateMatchPair(
                              qIdx,
                              pIdx,
                              "prompt",
                              e.target.value
                            )
                          }
                          required
                        />
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="text"
                            className="form-input"
                            placeholder={`Answer ${pIdx + 1}`}
                            value={pair.answer}
                            onChange={(e) =>
                              updateMatchPair(
                                qIdx,
                                pIdx,
                                "answer",
                                e.target.value
                              )
                            }
                            required
                          />
                          {(question.matchPairs?.length || 0) > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMatchPair(qIdx, pIdx)}
                              className="btn btn-danger btn-sm"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addMatchPair(qIdx)}
                      className="btn btn-outline btn-sm mt-1"
                    >
                      + Add Pair
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate("/admin/quizzes")}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create Quiz"}
          </button>
        </div>
      </form>
    </PageLayout>
  );
};
