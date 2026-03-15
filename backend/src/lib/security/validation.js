function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function validateField(key, rule, value) {
  if (value == null) {
    if (rule.required) {
      return `${key} is required`;
    }
    return null;
  }

  switch (rule.type) {
    case "string": {
      if (typeof value !== "string") return `${key} must be a string`;
      if (rule.min != null && value.length < rule.min) {
        return `${key} must be at least ${rule.min} characters`;
      }
      if (rule.max != null && value.length > rule.max) {
        return `${key} must be at most ${rule.max} characters`;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return `${key} format is invalid`;
      }
      return null;
    }
    case "number": {
      if (typeof value !== "number" || Number.isNaN(value)) {
        return `${key} must be a number`;
      }
      if (rule.min != null && value < rule.min) {
        return `${key} must be >= ${rule.min}`;
      }
      if (rule.max != null && value > rule.max) {
        return `${key} must be <= ${rule.max}`;
      }
      return null;
    }
    case "boolean": {
      if (typeof value !== "boolean") return `${key} must be a boolean`;
      return null;
    }
    case "array:string": {
      if (!Array.isArray(value)) return `${key} must be an array`;
      if (!value.every((v) => typeof v === "string")) {
        return `${key} must be an array of strings`;
      }
      if (rule.maxItems != null && value.length > rule.maxItems) {
        return `${key} must contain at most ${rule.maxItems} items`;
      }
      return null;
    }
    case "enum": {
      if (!rule.values || !Array.isArray(rule.values)) {
        return `${key} enum configuration is invalid`;
      }
      if (!rule.values.includes(value)) {
        return `${key} must be one of: ${rule.values.join(", ")}`;
      }
      return null;
    }
    case "object": {
      if (!isPlainObject(value)) return `${key} must be an object`;
      return null;
    }
    default:
      return `${key} validation type is unsupported`;
  }
}

export function validateSchema(payload, schema, options = {}) {
  if (!isPlainObject(payload)) {
    return { success: false, error: "Request body must be a JSON object" };
  }

  const errors = [];
  const sanitized = {};
  const { stripUnknown = true } = options;

  for (const [key, rule] of Object.entries(schema)) {
    const value = payload[key];
    const error = validateField(key, rule, value);
    if (error) {
      errors.push(error);
      continue;
    }

    if (value !== undefined) {
      sanitized[key] = value;
    }
  }

  if (!stripUnknown) {
    for (const key of Object.keys(payload)) {
      if (!(key in schema)) {
        sanitized[key] = payload[key];
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, error: errors.join("; ") };
  }

  return { success: true, data: sanitized };
}
