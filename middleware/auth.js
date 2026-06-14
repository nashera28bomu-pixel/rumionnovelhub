import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/*
|--------------------------------------------------------------------------

AUTH MIDDLEWARE
*/

export const authenticate = (req, res, next) => {
try {
const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return res.status(401).json({
    success: false,
    message: 'No token provided'
  });
}

const token = authHeader.split(' ')[1];

if (!token) {
  return res.status(401).json({
    success: false,
    message: 'Invalid token format'
  });
}

const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET
);

req.user = decoded;

next();

} catch (error) {
return res.status(401).json({
success: false,
message: 'Unauthorized access',
error: error.message
});
}
};

/*
|--------------------------------------------------------------------------

ROLE-BASED ACCESS CONTROL (RBAC)
*/

export const requireRole = (role) => {
return (req, res, next) => {
try {
if (!req.user) {
return res.status(401).json({
success: false,
message: 'Not authenticated'
});
}

  if (req.user.role !== role) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: insufficient permissions'
    });
  }

  next();
} catch (error) {
  return res.status(500).json({
    success: false,
    message: 'Role check failed',
    error: error.message
  });
}

};
};

/*
|--------------------------------------------------------------------------

OPTIONAL AUTH (for public + logged-in enhancement)
*/

export const optionalAuth = (req, res, next) => {
try {
const authHeader = req.headers.authorization;

if (!authHeader?.startsWith('Bearer ')) {
  req.user = null;
  return next();
}

const token = authHeader.split(' ')[1];

const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET
);

req.user = decoded;

next();

} catch (error) {
req.user = null;
next();
}
};
