const express = require('express');
const router = express.Router();
const { getUrlAnalytics } = require('../controllers/analyticsController');

router.get('/:shortCode', getUrlAnalytics);

module.exports = router;
