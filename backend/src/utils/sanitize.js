// Simple input sanitization utilities to reduce XSS vectors.
// NOTE: For stronger security consider integrating a robust library like 'sanitize-html'.

const SCRIPT_TAG_REGEX = /<script[^>]*>[\s\S]*?<\/script>/gi;
const EVENT_HANDLER_ATTR_REGEX = /on[a-zA-Z]+\s*=\s*("[^"]*"|'[^']*')/gi;
const JAVASCRIPT_PROTOCOL_REGEX = /javascript:/gi;

export const sanitizeInput = (value) => {
  if (typeof value !== "string") return value;
  let sanitized = value;
  sanitized = sanitized.replace(SCRIPT_TAG_REGEX, "");
  sanitized = sanitized.replace(EVENT_HANDLER_ATTR_REGEX, "");
  sanitized = sanitized.replace(JAVASCRIPT_PROTOCOL_REGEX, "");
  // Encode angle brackets to avoid HTML injection when rendered
  sanitized = sanitized.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return sanitized.trim();
};

export const sanitizeObjectDeep = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => sanitizeObjectDeep(item));
  if (typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = sanitizeObjectDeep(v);
    }
    return out;
  }
  return sanitizeInput(obj);
};

export const sanitizeQuestionPayload = (payload) => {
  const cleaned = sanitizeObjectDeep(payload);
  if (Array.isArray(cleaned.choices)) {
    cleaned.choices = cleaned.choices.map((c) => ({
      ...c,
      text: sanitizeInput(c.text),
    }));
  }
  if (Array.isArray(cleaned.textKeys)) {
    cleaned.textKeys = cleaned.textKeys.map((k) => ({
      ...k,
      value: sanitizeInput(k.value),
    }));
  }
  if (Array.isArray(cleaned.matchPairs)) {
    cleaned.matchPairs = cleaned.matchPairs.map((p) => ({
      ...p,
      prompt: sanitizeInput(p.prompt),
      answer: sanitizeInput(p.answer),
    }));
  }
  return cleaned;
};
