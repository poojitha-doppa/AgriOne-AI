import mongoose from 'mongoose';

const categorizeError = (err) => {
  const msg = err.message || '';
  if (msg.includes('Authentication failed') || msg.includes('bad auth')) {
    return 'AUTH_FAILED: Wrong username or password. Check Database Users in Atlas.';
  }
  if (msg.includes('ENOTFOUND') || msg.includes('querySrv') || msg.includes('DNS')) {
    return 'DNS_ERROR: Cannot resolve cluster hostname. Check network or cluster host in MONGO_URI.';
  }
  if (msg.includes('IP') || msg.includes('whitelist') || msg.includes('not allowed')) {
    return 'IP_BLOCKED: Your IP is not whitelisted. Add it in Atlas → Network Access.';
  }
  if (msg.includes('timed out') || msg.includes('ETIMEDOUT') || msg.includes('serverSelectionTimeout')) {
    return 'TIMEOUT: Could not reach Atlas. Check Atlas Network Access or your network connection.';
  }
  return `UNKNOWN: ${msg}`;
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    console.log(`[DB] Connected: ${conn.connection.host} / ${conn.connection.name}`);

    mongoose.connection.on('disconnected', () => console.warn('[DB] Disconnected — will auto-reconnect'));
    mongoose.connection.on('reconnected', () => console.log('[DB] Reconnected'));
    mongoose.connection.on('error', (err) => console.error('[DB] Runtime error:', err.message));
  } catch (err) {
    console.error(`[DB] Connection failed — ${categorizeError(err)}`);
    throw err;
  }
};

export const closeDB = async () => {
  await mongoose.connection.close();
  console.log('[DB] Connection closed cleanly');
};

export default connectDB;
