const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

connectDB().catch((error) => {
  console.error('Database startup failed:', error.message);
});

// AFTER — trust proxy must be set before ANY middleware
const app = express();
app.set('trust proxy', 1);

// Standardize Vercel Serverless / Vercel Dev request paths
app.use((req, res, next) => {
  if ((process.env.VERCEL || !require.main?.filename?.endsWith('server.js')) && !req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  next();
});

app.use(helmet({ contentSecurityPolicy: false }));

const defaultClientUrls = [
  'http://localhost:10000',
  'http://127.0.0.1:10000',

  'http://localhost:5500',
  'http://127.0.0.1:5500',

  'http://localhost:5502',
  'http://127.0.0.1:5502',

  'http://localhost:3000',
  'http://127.0.0.1:3000',

  'http://localhost:5001',
  'http://127.0.0.1:5001',

  'http://localhost:5173',
  'http://127.0.0.1:5173'
];
const envClientUrls = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URLS,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
]
  .filter(Boolean)
  .flatMap((value) => value.split(','))
  .map((value) => value.trim().replace(/\/+$/, ''))
  .filter((value) => value && !value.includes('your-frontend-url.com'));

const allowedOrigins = new Set([...defaultClientUrls, ...envClientUrls]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || process.env.ALLOW_ANY_ORIGIN === 'true') {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked request from ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again after 15 minutes.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
});

app.use('/api/', limiter);
app.use('/', limiter);

app.use('/api/auth/login', authLimiter);
app.use('/auth/login', authLimiter);

app.use('/api/auth/register', authLimiter);
app.use('/auth/register', authLimiter);

app.use('/api/auth/forgot-password', authLimiter);
app.use('/auth/forgot-password', authLimiter);

const rootHandler = (req, res) => {
  res.json({
    success: true,
    message: 'MockAI Backend API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
};
app.get('/api', rootHandler);

const healthHandler = (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

app.use('/api/auth', require('./routes/auth'));
app.use('/auth', require('./routes/auth'));

app.use('/api/interviews', require('./routes/interviews'));
app.use('/interviews', require('./routes/interviews'));

app.use(
  "/api/resume",
  require("./routes/resume")
);
app.use(
  "/resume",
  require("./routes/resume")
);

app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/dashboard', require('./routes/dashboard'));

const frontendDir = path.join(__dirname, '..', 'front_end');
app.use(express.static(frontendDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  return res.sendFile(path.join(frontendDir, 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\nMockAI Backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`API Base URL: http://localhost:${PORT}/api\n`);
  });
}

module.exports = app;
