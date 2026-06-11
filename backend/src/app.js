const express = require('express');
const cors = require('cors');
const useragent = require('express-useragent');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middlewares/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { redirectShortUrl } = require('./controllers/urlController');

const app = express();

// Configure CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://192.168.221.223:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
}));

// Request parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// User agent parser for analytics
app.use(useragent.express());

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

// Apply rate limiter to API routes
app.use('/api/', apiLimiter);

// Public redirection route
app.get('/r/:shortCode', redirectShortUrl);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
