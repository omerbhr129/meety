const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'meety_secret_key_123');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'אנא התחבר למערכת' });
  }
};

module.exports = auth;