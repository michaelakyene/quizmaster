export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // Minimum 6 characters
  return password && password.length >= 6;
};

export const validateRequired = (value) => {
  return value !== undefined && value !== null && value !== "";
};

export const validateQuizData = (data) => {
  const errors = [];

  if (!validateRequired(data.title)) {
    errors.push("Title is required");
  }
  if (data.title && data.title.length > 150) {
    errors.push("Title must be at most 150 characters");
  }

  if (data.duration && (data.duration < 1 || data.duration > 300)) {
    errors.push("Duration must be between 1 and 300 minutes");
  }

  if (data.description && data.description.length > 2000) {
    errors.push("Description must be at most 2000 characters");
  }

  return errors;
};

export const validateQuestionData = (data) => {
  const errors = [];

  if (!validateRequired(data.text)) {
    errors.push("Question text is required");
  }
  if (data.text && data.text.length > 1000) {
    errors.push("Question text must be at most 1000 characters");
  }

  if (!validateRequired(data.type)) {
    errors.push("Question type is required");
  }

  if (data.points && data.points < 0) {
    errors.push("Points must be non-negative");
  }

  // Specific collections length constraints
  if (Array.isArray(data.choices) && data.choices.length > 50) {
    errors.push("Too many choices (max 50)");
  }
  if (Array.isArray(data.textKeys) && data.textKeys.length > 50) {
    errors.push("Too many acceptable answers (max 50)");
  }
  if (Array.isArray(data.matchPairs) && data.matchPairs.length > 50) {
    errors.push("Too many matching pairs (max 50)");
  }

  // Validate individual item lengths
  if (Array.isArray(data.choices)) {
    data.choices.forEach((c, idx) => {
      if (!validateRequired(c.text)) {
        errors.push(`Choice ${idx + 1} text is required`);
      } else if (c.text.length > 300) {
        errors.push(`Choice ${idx + 1} text too long (max 300)`);
      }
    });
  }
  if (Array.isArray(data.textKeys)) {
    data.textKeys.forEach((k, idx) => {
      if (!validateRequired(k.value)) {
        errors.push(`Acceptable answer ${idx + 1} is required`);
      } else if (k.value.length > 300) {
        errors.push(`Acceptable answer ${idx + 1} too long (max 300)`);
      }
    });
  }
  if (Array.isArray(data.matchPairs)) {
    data.matchPairs.forEach((p, idx) => {
      if (!validateRequired(p.prompt) || !validateRequired(p.answer)) {
        errors.push(`Matching pair ${idx + 1} requires prompt and answer`);
      } else {
        if (p.prompt.length > 300) {
          errors.push(`Matching pair ${idx + 1} prompt too long (max 300)`);
        }
        if (p.answer.length > 300) {
          errors.push(`Matching pair ${idx + 1} answer too long (max 300)`);
        }
      }
    });
  }

  return errors;
};
