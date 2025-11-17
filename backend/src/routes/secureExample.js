const { body, query, validationResult } = require('express-validator');
const xss = require('xss');
const router = require('express').Router();

/**
 * Validation error handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * GET /search
 * Search with query parameter validation
 * 
 * Query Parameters:
 *   - q (required): Search query string (1-128 chars)
 *   - limit (optional): Results limit (default: 10, max: 100)
 *   - offset (optional): Results offset (default: 0)
 */
router.get(
  '/search',
  query('q')
    .trim()
    .isLength({ min: 1, max: 128 })
    .withMessage('Search query must be between 1 and 128 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .toInt()
    .withMessage('Offset must be 0 or greater'),
  handleValidationErrors,
  (req, res) => {
    try {
      const { q, limit = 10, offset = 0 } = req.query;
      
      // Sanitize search query
      const sanitizedQuery = xss(q, {
        whiteList: {},
        stripIgnoredTag: true,
      });

      // In a real app, this would query the database
      res.json({
        success: true,
        data: {
          query: sanitizedQuery,
          limit,
          offset,
          results: [],
          total: 0,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Search failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * POST /profile
 * Update user profile with body validation
 * 
 * Body Parameters:
 *   - name (required): User name (2-64 chars)
 *   - bio (optional): User biography (max 500 chars)
 *   - email (optional): User email
 *   - phone (optional): User phone number
 */
router.post(
  '/profile',
  body('name')
    .isString()
    .trim()
    .isLength({ min: 2, max: 64 })
    .withMessage('Name must be between 2 and 64 characters')
    .escape(),
  body('bio')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Biography must not exceed 500 characters')
    .escape(),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Invalid phone number format'),
  handleValidationErrors,
  (req, res) => {
    try {
      const { name, bio, email, phone } = req.body;

      // Additional sanitization (input already escaped by express-validator)
      const payload = {
        name: xss(name, { whiteList: {}, stripIgnoredTag: true }),
        bio: bio ? xss(bio, { whiteList: {}, stripIgnoredTag: true }) : null,
        email: email || null,
        phone: phone || null,
      };

      // In a real app, validate user ownership and update database
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: payload,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Profile update failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * POST /change-password
 * Secure password change endpoint
 * 
 * Body Parameters:
 *   - currentPassword (required): Current password
 *   - newPassword (required): New password (8+ chars, mixed case, numbers, special chars)
 *   - confirmPassword (required): Password confirmation
 */
router.post(
  '/change-password',
  body('currentPassword')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Current password is required'),
  body('newPassword')
    .isString()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain uppercase letters')
    .matches(/[a-z]/)
    .withMessage('Password must contain lowercase letters')
    .matches(/\d/)
    .withMessage('Password must contain numbers')
    .matches(/[@$!%*#?&]/)
    .withMessage('Password must contain special characters (@$!%*#?&)'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  handleValidationErrors,
  (req, res) => {
    try {
      // In a real app:
      // 1. Verify user is authenticated
      // 2. Verify currentPassword matches user's password
      // 3. Hash and store newPassword
      // 4. Invalidate all existing sessions/tokens

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Password change failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * DELETE /profile
 * Delete user account (with confirmation)
 */
router.delete(
  '/profile',
  body('confirmEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid confirmation email required'),
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),
  handleValidationErrors,
  (req, res) => {
    try {
      // In a real app:
      // 1. Verify user is authenticated
      // 2. Verify confirmEmail matches user's email
      // 3. Soft-delete or hard-delete user data
      // 4. Log the deletion reason
      // 5. Invalidate all sessions/tokens

      res.json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Account deletion failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

module.exports = router;
