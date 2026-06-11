const { nanoid } = require('nanoid');
const QRCode = require('qrcode');
const db = require('../config/db');

// @desc    Create a shortened URL
// @route   POST /api/urls
// @access  Private
const createShortUrl = async (req, res, next) => {
  const { original_url, custom_alias, expiry_date } = req.body;
  const userId = req.user.id;

  try {
    let shortCode;

    // Check custom alias if provided
    if (custom_alias) {
      const aliasCheck = await db.query(
        'SELECT id FROM urls WHERE short_code = $1 OR custom_alias = $1',
        [custom_alias]
      );
      if (aliasCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Custom alias or short code is already taken',
        });
      }
      shortCode = custom_alias;
    } else {
      // Generate a unique short code
      let unique = false;
      while (!unique) {
        shortCode = nanoid(7);
        const codeCheck = await db.query(
          'SELECT id FROM urls WHERE short_code = $1',
          [shortCode]
        );
        if (codeCheck.rows.length === 0) {
          unique = true;
        }
      }
    }

    // Generate QR Code Base64
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/r/${shortCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(redirectUrl);

    // Format expiry date to end of day if it is YYYY-MM-DD
    let dbExpiry = expiry_date || null;
    if (dbExpiry && /^\d{4}-\d{2}-\d{2}$/.test(dbExpiry)) {
      dbExpiry = `${dbExpiry}T23:59:59.999Z`;
    }

    // Insert into DB
    const newUrl = await db.query(
      `INSERT INTO urls (user_id, original_url, short_code, custom_alias, qr_code, expiry_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, original_url, shortCode, custom_alias || null, qrCodeDataUrl, dbExpiry]
    );

    res.status(201).json({
      success: true,
      data: newUrl.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all URLs for logged in user
// @route   GET /api/urls
// @access  Private
const getUserUrls = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      'SELECT * FROM urls WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update destination URL or Expiry Date
// @route   PUT /api/urls/:id
// @access  Private
const updateUrl = async (req, res, next) => {
  const { id } = req.params;
  const { original_url, expiry_date } = req.body;
  const userId = req.user.id;

  try {
    // Check ownership
    const urlCheck = await db.query(
      'SELECT id FROM urls WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (urlCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'URL not found or unauthorized',
      });
    }

    // Format expiry date to end of day if it is YYYY-MM-DD
    let dbExpiry = expiry_date || null;
    if (dbExpiry && /^\d{4}-\d{2}-\d{2}$/.test(dbExpiry)) {
      dbExpiry = `${dbExpiry}T23:59:59.999Z`;
    }

    const result = await db.query(
      `UPDATE urls 
       SET original_url = $1, expiry_date = $2
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [original_url, dbExpiry, id, userId]
    );

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a shortened URL
// @route   DELETE /api/urls/:id
// @access  Private
const deleteUrl = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Check ownership
    const urlCheck = await db.query(
      'SELECT id FROM urls WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (urlCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'URL not found or unauthorized',
      });
    }

    await db.query('DELETE FROM urls WHERE id = $1 AND user_id = $2', [id, userId]);

    res.status(200).json({
      success: true,
      message: 'URL deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Redirect short URL to original URL and log analytics
// @route   GET /r/:shortCode
// @access  Public
const redirectShortUrl = async (req, res, next) => {
  const { shortCode } = req.params;

  try {
    const result = await db.query(
      'SELECT * FROM urls WHERE short_code = $1',
      [shortCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('<h1>404 Link Not Found</h1><p>The shortened link you are trying to access does not exist.</p>');
    }

    const url = result.rows[0];

    // Check link expiry
    if (url.expiry_date && new Date(url.expiry_date) < new Date()) {
      return res.status(410).send('<h1>410 Link Expired</h1><p>This shortened link has expired and is no longer active.</p>');
    }

    // Increment click count (fire-and-forget or async update)
    await db.query(
      'UPDATE urls SET click_count = click_count + 1 WHERE id = $1',
      [url.id]
    );

    // Extract device/browser details using express-useragent
    const ua = req.useragent || {};
    let device = 'Desktop';
    if (ua.isMobile) device = 'Mobile';
    else if (ua.isTablet) device = 'Tablet';
    else if (ua.isSmartTV) device = 'SmartTV';

    const browser = ua.browser || 'Unknown';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Log visit into visits table
    await db.query(
      `INSERT INTO visits (url_id, ip_address, device, browser)
       VALUES ($1, $2, $3, $4)`,
      [url.id, ipAddress, device, browser]
    );

    // Redirect to destination
    res.redirect(302, url.original_url);
  } catch (error) {
    next(error);
  }
};

// @desc    Create bulk shortened URLs (from CSV import)
// @route   POST /api/urls/bulk
// @access  Private
const createBulkUrls = async (req, res, next) => {
  const { urls } = req.body;
  const userId = req.user.id;

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a non-empty list of URLs',
    });
  }

  // Simple validation helper
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  try {
    const results = [];
    
    // We run in a simple loop. For high volume, transactions are preferred.
    for (const urlItem of urls) {
      let { original_url, custom_alias, expiry_date } = urlItem;

      if (!original_url) {
        results.push({ original_url, error: 'URL is required' });
        continue;
      }

      // Auto-prepend https:// if protocol is missing (consistent with single shorten validation)
      if (!/^https?:\/\//i.test(original_url)) {
        original_url = 'https://' + original_url;
      }

      if (!isValidUrl(original_url)) {
        results.push({ original_url, error: 'Invalid URL format' });
        continue;
      }

      let shortCode;
      if (custom_alias) {
        // Clean and test custom alias
        const aliasRegex = /^[a-zA-Z0-9-_]+$/;
        if (!aliasRegex.test(custom_alias)) {
          results.push({ original_url, error: 'Alias format invalid' });
          continue;
        }
        const aliasCheck = await db.query(
          'SELECT id FROM urls WHERE short_code = $1 OR custom_alias = $1',
          [custom_alias]
        );
        if (aliasCheck.rows.length > 0) {
          results.push({ original_url, error: 'Alias already taken' });
          continue;
        }
        shortCode = custom_alias;
      } else {
        let unique = false;
        while (!unique) {
          shortCode = nanoid(7);
          const codeCheck = await db.query(
            'SELECT id FROM urls WHERE short_code = $1',
            [shortCode]
          );
          if (codeCheck.rows.length === 0) {
            unique = true;
          }
        }
      }

      const redirectUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/r/${shortCode}`;
      const qrCodeDataUrl = await QRCode.toDataURL(redirectUrl);

      // Format expiry date to end of day if it is YYYY-MM-DD
      let dbExpiry = expiry_date || null;
      if (dbExpiry && /^\d{4}-\d{2}-\d{2}$/.test(dbExpiry)) {
        dbExpiry = `${dbExpiry}T23:59:59.999Z`;
      }

      const newUrl = await db.query(
        `INSERT INTO urls (user_id, original_url, short_code, custom_alias, qr_code, expiry_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, original_url, shortCode, custom_alias || null, qrCodeDataUrl, dbExpiry]
      );
      results.push({ original_url, short_code: shortCode, data: newUrl.rows[0] });
    }

    res.status(200).json({
      success: true,
      processed: urls.length,
      results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createShortUrl,
  getUserUrls,
  updateUrl,
  deleteUrl,
  redirectShortUrl,
  createBulkUrls,
};
