const express = require('express');
const router = express.Router();
const {
  createShortUrl,
  getUserUrls,
  updateUrl,
  deleteUrl,
  createBulkUrls,
  unlockUrl,
} = require('../controllers/urlController');
const { protect } = require('../middlewares/authMiddleware');
const { validateUrl } = require('../middlewares/validationMiddleware');

// Public unlock route for password-protected links
router.post('/unlock/:shortCode', unlockUrl);

// Mount routes
router.post('/bulk', protect, createBulkUrls);

router.route('/')
  .post(protect, validateUrl, createShortUrl)
  .get(protect, getUserUrls);

router.route('/:id')
  .put(protect, validateUrl, updateUrl)
  .delete(protect, deleteUrl);

module.exports = router;
