import jwt from 'jsonwebtoken';

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided',
      requestId: req.requestId,
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId, isAdmin: Boolean(decoded.isAdmin) };
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Token has expired — please log in again'
      : 'Invalid token';
    return res.status(401).json({
      success: false,
      message,
      requestId: req.requestId,
    });
  }
};

export default protect;
