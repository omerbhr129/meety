const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.header('Authorization');
    
    // If no authorization header, check for userId in the request body or query
    const userId = authHeader || req.body.userId || req.query.userId;
    
    if (!userId) {
      // If this is a login or register route, continue without authentication
      if (req.path === '/api/login' || req.path === '/api/register') {
        return next();
      }
      throw new Error('Authentication required');
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is active
    if (user.status === 'inactive' || user.status === 'deleted') {
      throw new Error('User account is not active');
    }

    // Add user to request
    req.user = user;
    req.userId = user._id;

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'אנא התחבר מחדש' });
  }
};

module.exports = auth;
