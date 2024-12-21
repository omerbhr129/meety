const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware: Headers received:', {
      authorization: req.headers.authorization ? '[PRESENT]' : '[MISSING]',
      allHeaders: Object.keys(req.headers)
    });

    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth middleware: Invalid authorization header:', authHeader);
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Auth middleware: Token extracted:', token.substring(0, 20) + '...');

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Auth middleware: Token verified:', {
        userId: decoded.userId,
        email: decoded.email,
        token: token.substring(0, 20) + '...'
      });

      // Add user info to request
      req.userId = decoded.userId;
      req.userEmail = decoded.email;

      next();
    } catch (error) {
      console.error('Auth middleware: Token verification failed:', error);
      res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware: Error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = auth;
