// Centralized environment config — validated once at startup
// Values are read lazily via getters so dotenv always loads first

const REQUIRED = ['MONGO_URI', 'JWT_SECRET'];

export const validateEnv = () => {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`[Config] FATAL — missing required env variables: ${missing.join(', ')}`);
    console.error('[Config] Check your .env file and restart.');
    process.exit(1);
  }
  console.log('[Config] Environment validated OK');
};

export const config = {
  get port() { return parseInt(process.env.PORT || '5000', 10); },
  get nodeEnv() { return process.env.NODE_ENV || 'development'; },
  get isProduction() { return process.env.NODE_ENV === 'production'; },

  // DB — never log this value
  get mongoUri() { return process.env.MONGO_URI; },

  // Auth
  get jwtSecret() { return process.env.JWT_SECRET; },
  jwtExpiresIn: '7d',

  // Admin credentials — set ADMIN_PHONE and ADMIN_PASSWORD in .env; never hardcode in source
  get adminPhone() {
    const v = process.env.ADMIN_PHONE;
    if (!v) console.warn('[Config] ADMIN_PHONE env var not set; admin login disabled');
    return v || '';
  },
  get adminPassword() {
    const v = process.env.ADMIN_PASSWORD;
    if (!v) console.warn('[Config] ADMIN_PASSWORD env var not set; admin login disabled');
    return v || '';
  },

  // CORS — comma-separated list of allowed origins
  get allowedOrigins() {
    return process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
      : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000'];
  },

  // AI services (optional — services degrade gracefully if missing)
  get roboflowApiKey() { return process.env.ROBOFLOW_API_KEY || ''; },
  get roboflowUrl() { return process.env.ROBOFLOW_URL || ''; },
  get llmProvider() { return process.env.LLM_PROVIDER || 'auto'; },
  get openrouterApiKey() { return process.env.OPENROUTER_API_KEY || ''; },
  get openrouterModel() { return process.env.OPENROUTER_MODEL || ''; },
  get geminiApiKey() { return process.env.GEMINI_API_KEY || ''; },
  get newsApiKey() { return process.env.NEWS_API_KEY || ''; },
};
