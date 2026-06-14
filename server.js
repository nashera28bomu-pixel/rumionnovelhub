import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { testSupabaseConnection } from './config/supabase.js';

/*
|--------------------------------------------------------------------------

ROUTES
*/
import authRoutes from './routes/auth.js';
import novelRoutes from './routes/novels.js';
import bookmarkRoutes from './routes/bookmarks.js';
import historyRoutes from './routes/history.js';
import favoriteRoutes from './routes/favorites.js';

dotenv.config();

const app = express();

/*
|--------------------------------------------------------------------------

BASIC CONFIG
*/

const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

/*
|--------------------------------------------------------------------------

SECURITY MIDDLEWARE
*/

app.use(
helmet({
crossOriginResourcePolicy: false
})
);

/*
|--------------------------------------------------------------------------

CORS
*/

const allowedOrigins = [
'http://localhost:3000',
'http://localhost:5173',
process.env.FRONTEND_URL
].filter(Boolean);

app.use(
cors({
origin: (origin, callback) => {
if (!origin) return callback(null, true);

  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  return callback(new Error('CORS blocked'));
},
credentials: true

})
);

/*
|--------------------------------------------------------------------------

RATE LIMITING
*/

const limiter = rateLimit({
windowMs: 15 * 60 * 1000,
max: 300,
message: {
success: false,
message: 'Too many requests, slow down.'
}
});

app.use(limiter);

/*
|--------------------------------------------------------------------------

GLOBAL MIDDLEWARE
*/

app.use(compression());

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan('dev'));

/*
|--------------------------------------------------------------------------

HEALTH CHECK
*/

app.get('/health', (req, res) => {
res.json({
success: true,
service: 'Rumion Novel Hub API',
status: 'running',
uptime: process.uptime(),
timestamp: new Date().toISOString()
});
});

/*
|--------------------------------------------------------------------------

ROOT
*/

app.get('/', (req, res) => {
res.json({
success: true,
message: 'Welcome to Rumion Novel Hub API',
version: '1.0.0'
});
});

/*
|--------------------------------------------------------------------------

API ROUTES
*/

app.use('/api/auth', authRoutes);
app.use('/api/novels', novelRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/favorites', favoriteRoutes);

/*
|--------------------------------------------------------------------------

404 HANDLER
*/

app.use((req, res) => {
res.status(404).json({
success: false,
message: 'Route not found'
});
});

/*
|--------------------------------------------------------------------------

GLOBAL ERROR HANDLER
*/

app.use((err, req, res, next) => {
console.error('🔥 Error:', err.message);

res.status(err.status || 500).json({
success: false,
message:
process.env.NODE_ENV === 'production'
? 'Internal server error'
: err.message
});
});

/*
|--------------------------------------------------------------------------

START SERVER
*/

const startServer = async () => {
try {
console.log('🔄 Connecting to Supabase...');

const connected = await testSupabaseConnection();

if (!connected) {
  throw new Error('Supabase connection failed');
}

app.listen(PORT, () => {
  console.log(`

====================================
🚀 Rumion Novel Hub API
🌍 Environment: ${process.env.NODE_ENV}
📡 Port: ${PORT}

  `);
});

} catch (error) {
console.error('❌ Server failed to start:', error.message);
process.exit(1);
}
};

startServer();

/*
|--------------------------------------------------------------------------

GRACEFUL SHUTDOWN
*/

process.on('SIGTERM', () => {
console.log('SIGTERM received, shutting down...');
process.exit(0);
});

process.on('SIGINT', () => {
console.log('SIGINT received, shutting down...');
process.exit(0);
});
