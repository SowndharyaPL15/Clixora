const { nanoid } = require('nanoid');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Helper to fetch page title and description
const fetchPageMetadata = async (urlStr) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(urlStr, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    let description = '';
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i) ||
                      html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i) ||
                      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([\s\S]*?)["']/i);
    if (descMatch) {
      description = descMatch[1].trim();
    }

    const unescapeHtml = (str) => {
      return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&apos;/g, "'");
    };

    const cleanTitle = unescapeHtml(title);
    const cleanDesc = unescapeHtml(description);

    if (cleanTitle || cleanDesc) {
      return { title: cleanTitle, description: cleanDesc };
    }
    return null;
  } catch (err) {
    console.error('Metadata fetch error:', err.message);
    return null;
  }
};

// Heuristic to generate AI summary
const generateAiSummary = async (urlStr) => {
  const meta = await fetchPageMetadata(urlStr);
  if (!meta) {
    try {
      const hostname = new URL(urlStr).hostname.replace('www.', '');
      return `Link to ${hostname}. Details are unavailable.`;
    } catch (_) {
      return 'Shortened link destination.';
    }
  }

  const { title, description } = meta;
  if (title && description) {
    const descText = description.length > 150 ? description.substring(0, 150) + '...' : description;
    return `${title} - ${descText}`;
  } else if (title) {
    return `${title}`;
  } else if (description) {
    return description.length > 150 ? description.substring(0, 150) + '...' : description;
  }
  
  try {
    const hostname = new URL(urlStr).hostname.replace('www.', '');
    return `Link to ${hostname}.`;
  } catch (_) {
    return 'Shortened link destination.';
  }
};

// @desc    Create a shortened URL
// @route   POST /api/urls
// @access  Private
const createShortUrl = async (req, res, next) => {
  const { original_url, custom_alias, expiry_date, password, max_clicks, category, notes } = req.body;
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

    // Hash password if provided
    let passwordHash = null;
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    // Generate AI Summary
    let formatUrl = original_url.trim();
    if (formatUrl && !/^https?:\/\//i.test(formatUrl)) {
      formatUrl = 'https://' + formatUrl;
    }
    const aiSummary = await generateAiSummary(formatUrl);

    // Insert into DB
    const newUrl = await db.query(
      `INSERT INTO urls (user_id, original_url, short_code, custom_alias, qr_code, expiry_date, password_hash, max_clicks, is_active, ai_summary, category, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        userId,
        formatUrl,
        shortCode,
        custom_alias || null,
        qrCodeDataUrl,
        dbExpiry,
        passwordHash,
        max_clicks ? parseInt(max_clicks) : null,
        1, // is_active (true / 1)
        aiSummary,
        category || 'General',
        notes || null
      ]
    );

    const dataObj = { ...newUrl.rows[0], has_password: !!passwordHash };
    delete dataObj.password_hash;

    res.status(201).json({
      success: true,
      data: dataObj,
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
      `SELECT u.*, (SELECT MAX(visited_at) FROM visits v WHERE v.url_id = u.id) as last_visited
       FROM urls u
       WHERE u.user_id = $1
       ORDER BY u.created_at DESC`,
      [userId]
    );

    const sanitizedData = result.rows.map(row => {
      const copy = { ...row };
      copy.has_password = !!copy.password_hash;
      delete copy.password_hash;
      return copy;
    });

    res.status(200).json({
      success: true,
      count: sanitizedData.length,
      data: sanitizedData,
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
  const { original_url, expiry_date, max_clicks, is_active, category, notes, password } = req.body;
  const userId = req.user.id;

  try {
    // Check ownership
    const urlCheck = await db.query(
      'SELECT * FROM urls WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (urlCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'URL not found or unauthorized',
      });
    }

    const oldUrl = urlCheck.rows[0];

    // Format expiry date to end of day if it is YYYY-MM-DD
    let dbExpiry = expiry_date || null;
    if (dbExpiry && /^\d{4}-\d{2}-\d{2}$/.test(dbExpiry)) {
      dbExpiry = `${dbExpiry}T23:59:59.999Z`;
    }

    // Password change logic
    let passwordHash = oldUrl.password_hash;
    if (req.body.hasOwnProperty('password')) {
      const newPass = req.body.password;
      if (newPass === null || newPass === '') {
        passwordHash = null;
      } else {
        const salt = await bcrypt.genSalt(10);
        passwordHash = await bcrypt.hash(newPass, salt);
      }
    }

    // AI Summary updates if original url changes
    let formatUrl = original_url ? original_url.trim() : oldUrl.original_url;
    if (original_url && !/^https?:\/\//i.test(formatUrl)) {
      formatUrl = 'https://' + formatUrl;
    }
    let aiSummary = oldUrl.ai_summary;
    if (original_url && formatUrl !== oldUrl.original_url) {
      aiSummary = await generateAiSummary(formatUrl);
    }

    const dbIsActive = is_active !== undefined ? (is_active === true || is_active === 1 || is_active === 'true' ? 1 : 0) : oldUrl.is_active;

    const result = await db.query(
      `UPDATE urls 
       SET original_url = $1, 
           expiry_date = $2, 
           max_clicks = $3, 
           is_active = $4, 
           category = $5, 
           notes = $6, 
           password_hash = $7, 
           ai_summary = $8
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [
        formatUrl,
        dbExpiry,
        max_clicks !== undefined ? (max_clicks ? parseInt(max_clicks) : null) : oldUrl.max_clicks,
        dbIsActive,
        category !== undefined ? category : oldUrl.category,
        notes !== undefined ? (notes || null) : oldUrl.notes,
        passwordHash,
        aiSummary,
        id,
        userId
      ]
    );

    const dataObj = { ...result.rows[0], has_password: !!passwordHash };
    delete dataObj.password_hash;

    res.status(200).json({
      success: true,
      data: dataObj,
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

    // Check paused
    const dbIsActive = url.is_active === true || url.is_active === 1 || url.is_active === '1';
    if (!dbIsActive) {
      return res.status(403).send('<h1>403 Link Paused</h1><p>This shortened link has been temporarily paused by the owner.</p>');
    }

    // Check click limit
    if (url.max_clicks !== null && url.max_clicks !== undefined && url.click_count >= url.max_clicks) {
      return res.status(410).send('<h1>410 Link Limit Reached</h1><p>This shortened link has reached its maximum click limit and is no longer active.</p>');
    }

    // Check link expiry
    if (url.expiry_date && new Date(url.expiry_date) < new Date()) {
      return res.status(410).send('<h1>410 Link Expired</h1><p>This shortened link has expired and is no longer active.</p>');
    }

    // Password Redirect
    if (url.password_hash) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(302, `${frontendUrl}/unlock/${shortCode}`);
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

      // Bulk imported URLs also get summaries scraped!
      const aiSummary = await generateAiSummary(original_url);

      const newUrl = await db.query(
        `INSERT INTO urls (user_id, original_url, short_code, custom_alias, qr_code, expiry_date, ai_summary, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [userId, original_url, shortCode, custom_alias || null, qrCodeDataUrl, dbExpiry, aiSummary, 'General']
      );
      
      const copy = { ...newUrl.rows[0], has_password: false };
      delete copy.password_hash;
      results.push({ original_url, short_code: shortCode, data: copy });
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

// @desc    Unlock a password-protected short URL and log analytics
// @route   POST /api/urls/unlock/:shortCode
// @access  Public
const unlockUrl = async (req, res, next) => {
  const { shortCode } = req.params;
  const { password } = req.body;

  try {
    const result = await db.query(
      'SELECT * FROM urls WHERE short_code = $1',
      [shortCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }

    const url = result.rows[0];

    // Check paused
    const dbIsActive = url.is_active === true || url.is_active === 1 || url.is_active === '1';
    if (!dbIsActive) {
      return res.status(403).json({ success: false, error: 'This link is paused by the owner' });
    }

    // Check click limit
    if (url.max_clicks !== null && url.click_count >= url.max_clicks) {
      return res.status(410).json({ success: false, error: 'This link has reached its click limit' });
    }

    // Check expiry
    if (url.expiry_date && new Date(url.expiry_date) < new Date()) {
      return res.status(410).json({ success: false, error: 'This link has expired' });
    }

    // Check password match
    if (url.password_hash) {
      const isMatch = await bcrypt.compare(password || '', url.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Incorrect password' });
      }
    }

    // Log the click analytics (since the unlock page was successful)
    await db.query(
      'UPDATE urls SET click_count = click_count + 1 WHERE id = $1',
      [url.id]
    );

    const ua = req.useragent || {};
    let device = 'Desktop';
    if (ua.isMobile) device = 'Mobile';
    else if (ua.isTablet) device = 'Tablet';
    else if (ua.isSmartTV) device = 'SmartTV';

    const browser = ua.browser || 'Unknown';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    await db.query(
      `INSERT INTO visits (url_id, ip_address, device, browser)
       VALUES ($1, $2, $3, $4)`,
      [url.id, ipAddress, device, browser]
    );

    res.status(200).json({
      success: true,
      original_url: url.original_url
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
  unlockUrl,
};
