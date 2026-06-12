const db = require('../config/db');

// @desc    Get analytics for a specific URL (either owner or public based on requirements)
// @route   GET /api/analytics/:shortCode
// @access  Public (to support Public Analytics page requirement)
const getUrlAnalytics = async (req, res, next) => {
  const { shortCode } = req.params;

  try {
    // 1. Fetch URL details
    const urlResult = await db.query(
      'SELECT id, original_url, short_code, custom_alias, click_count, qr_code, expiry_date, created_at FROM urls WHERE short_code = $1',
      [shortCode]
    );

    if (urlResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'URL not found',
      });
    }

    const url = urlResult.rows[0];

    // 2. Fetch Daily Click Trends (last 14 days)
    const trendsResult = await db.query(
      `SELECT DATE(visited_at) as visit_date, COUNT(*) as clicks
       FROM visits
       WHERE url_id = $1 AND visited_at >= NOW() - INTERVAL '14 days'
       GROUP BY DATE(visited_at)
       ORDER BY visit_date ASC`,
      [url.id]
    );

    // 3. Fetch Device distribution
    const devicesResult = await db.query(
      `SELECT device, COUNT(*) as count
       FROM visits
       WHERE url_id = $1
       GROUP BY device
       ORDER BY count DESC`,
      [url.id]
    );

    // 4. Fetch Browser distribution
    const browsersResult = await db.query(
      `SELECT browser, COUNT(*) as count
       FROM visits
       WHERE url_id = $1
       GROUP BY browser
       ORDER BY count DESC`,
      [url.id]
    );

    // 5. Fetch Recent Visits (last 15 visits)
    const recentVisitsResult = await db.query(
      `SELECT visited_at, ip_address, device, browser
       FROM visits
       WHERE url_id = $1
       ORDER BY visited_at DESC
       LIMIT 15`,
      [url.id]
    );

    res.status(200).json({
      success: true,
      data: {
        url,
        trends: trendsResult.rows,
        devices: devicesResult.rows,
        browsers: browsersResult.rows,
        recentVisits: recentVisitsResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUrlAnalytics,
};
