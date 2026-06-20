require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== 'production';

async function start() {
  // --- Initialize Database ---
  await initDatabase();
  console.log('🗄️  Database initialized');

  // --- Middleware ---
  app.use(cors({ origin: isDev ? 'http://localhost:5173' : false, credentials: true }));
  app.use(express.json());

  // Session setup with file store (zero native deps)
  app.use(session({
    store: new FileStore({
      path: path.join(__dirname, 'data', 'sessions'),
      ttl: 86400,
      retries: 0,
    }),
    secret: process.env.SESSION_SECRET || 'cu-store-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }));

  // --- API Routes ---
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/products', require('./routes/products'));
  app.use('/api/categories', require('./routes/categories'));
  app.use('/api/suppliers', require('./routes/suppliers'));
  app.use('/api/dashboard', require('./routes/dashboard'));
  app.use('/api/excel', require('./routes/excel'));

  // --- Serve React build in production ---
  if (!isDev) {
    app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 CU Product Expiry Server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
