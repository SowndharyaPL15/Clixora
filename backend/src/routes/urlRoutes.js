const express = require('express');
const router = express.Router();
const {
  createShortUrl,
  getUserUrls,
  updateUrl,
  deleteUrl,
  createBulkUrls,
} = require('../controllers/urlController');
const { protect } = require('../middlewares/authMiddleware');
const { validateUrl } = require('../middlewares/validationMiddleware');

// Mount routes
router.post('/bulk', protect, createBulkUrls);

router.route('/')
  .post(protect, validateUrl, createShortUrl)
  .get(protect, getUserUrls);

router.route('/:id')
  .put(protect, validateUrl, updateUrl)
  .delete(protect, deleteUrl);

module.exports = router;
