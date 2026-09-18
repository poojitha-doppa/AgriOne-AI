import { randomBytes } from 'crypto';

// Attaches a unique request ID to every request for traceability
const requestId = (req, _res, next) => {
  req.requestId = randomBytes(8).toString('hex');
  next();
};

export default requestId;
