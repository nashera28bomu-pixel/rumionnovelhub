import express from 'express';
import supabase from '../config/supabase.js';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

/*
|--------------------------------------------------------------------------

REGISTER USER
Uses Supabase Auth
--------------------------------------------------------------------------
*/

router.post('/register', async (req, res) => {
try {
const { email, password, username } = req.body;

if (!email || !password) {
  return res.status(400).json({
    success: false,
    message: 'Email and password are required'
  });
}

const { data, error } = await supabase.auth.signUp({
  email,
  password
});

if (error) {
  return res.status(400).json({
    success: false,
    message: error.message
  });
}

// Create user profile in DB
if (data?.user) {
  await supabase.from('users').insert([
    {
      id: data.user.id,
      email,
      username: username || email.split('@')[0],
      created_at: new Date().toISOString()
    }
  ]);
}

res.json({
  success: true,
  message: 'User registered successfully',
  user: data.user
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

/*
|--------------------------------------------------------------------------

LOGIN USER
*/

router.post('/login', async (req, res) => {
try {
const { email, password } = req.body;

if (!email || !password) {
  return res.status(400).json({
    success: false,
    message: 'Email and password are required'
  });
}

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

if (error) {
  return res.status(401).json({
    success: false,
    message: error.message
  });
}

const user = data.user;

// Create YOUR OWN JWT (for middleware compatibility)
const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: user.role || 'user'
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

res.json({
  success: true,
  message: 'Login successful',
  token,
  user: {
    id: user.id,
    email: user.email
  }
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

/*
|--------------------------------------------------------------------------

GET CURRENT USER
*/

router.get('/me', authenticate, async (req, res) => {
try {
const userId = req.user.id;

const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

if (error) {
  return res.status(404).json({
    success: false,
    message: error.message
  });
}

res.json({
  success: true,
  user: data
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

/*
|--------------------------------------------------------------------------

LOGOUT (CLIENT HANDLED)
*/

router.post('/logout', authenticate, async (req, res) => {
try {
// Supabase doesn't require server logout for JWT approach
// Client just deletes token

res.json({
  success: true,
  message: 'Logged out successfully'
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

export default router;
