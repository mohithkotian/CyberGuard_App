const { maskName } = require('../utils/nameMasking');

// Field names (at any nesting depth) that should be masked when the
// requester isn't allowed to see real names.
const NAME_FIELDS = ['name', 'fullName', 'victimName', 'suspectName', 'reporterName'];

// Roles allowed to see real names. Adjust to match your app's role model.
const UNMASKED_ROLES = ['admin', 'officer']; // Changed investigator to officer to match role schema

function canViewFullNames(user) {
  return !!user && UNMASKED_ROLES.includes(user.role);
}

async function maskFieldsDeep(value, shouldMask) {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => maskFieldsDeep(item, shouldMask)));
  }

  // Preserve Date, ObjectId, and Buffer objects exactly as they are.
  if (value instanceof Date || Buffer.isBuffer(value) || value._bsontype === 'ObjectId' || (value.constructor && value.constructor.name === 'ObjectId')) {
    return value;
  }

  if (typeof value === 'object') {
    // Convert Mongoose documents (which uniquely have toObject()) to a plain object
    // before deep traversal to prevent infinite recursion and heap out-of-memory errors.
    if (typeof value.toJSON === 'function' && typeof value.toObject === 'function') {
      value = value.toJSON();
    }

    const result = {};
    for (const [key, val] of Object.entries(value)) {
      if (shouldMask && NAME_FIELDS.includes(key) && typeof val === 'string') {
        result[key] = await maskName(val);
      } else if (val && typeof val === 'object') {
        result[key] = await maskFieldsDeep(val, shouldMask);
      } else {
        result[key] = val;
      }
    }
    return result;
  }

  return value;
}

/**
 * Wraps res.json so every JSON response is passed through name masking
 * before it goes out, based on req.user.role. Mount after your auth
 * middleware so req.user is already populated.
 */
function nameMaskingMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = async (data) => {
    try {
      const shouldMask = !canViewFullNames(req.user);
      const masked = await maskFieldsDeep(data, shouldMask);
      return originalJson(masked);
    } catch (err) {
      // Fail closed: never leak an unmasked response if masking errors.
      console.error('Name masking failed:', err);
      res.statusCode = 500;
      return originalJson({
        status: 'fail',
        message: 'Unable to safely prepare this response',
      });
    }
  };

  next();
}

module.exports = nameMaskingMiddleware;
