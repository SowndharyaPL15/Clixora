// Helper to validate URL structure
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Helper to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide name, email, and password',
    });
  }

  if (name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Name must be at least 2 characters long',
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid email address',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long',
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide email and password',
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid email address',
    });
  }

  next();
};

const validateUrl = (req, res, next) => {
  let { original_url, custom_alias } = req.body;

  if (!original_url) {
    return res.status(400).json({
      success: false,
      error: 'Please provide the original URL',
    });
  }

  // Auto-prepend https:// if protocol is missing
  if (!/^https?:\/\//i.test(original_url)) {
    original_url = 'https://' + original_url;
    req.body.original_url = original_url;
  }

  if (!isValidUrl(original_url)) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid original URL (include http:// or https://)',
    });
  }

  if (custom_alias) {
    // Check if custom alias contains only alphanumeric and hyphens/underscores
    const aliasRegex = /^[a-zA-Z0-9-_]+$/;
    if (!aliasRegex.test(custom_alias)) {
      return res.status(400).json({
        success: false,
        error: 'Custom alias can only contain letters, numbers, hyphens, and underscores',
      });
    }
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateUrl,
};
