const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Retries an async function with exponential backoff.
 * Only retries on network/5xx errors — 4xx are passed through immediately.
 */
export const withRetry = async (fn, { retries = 2, baseDelayMs = 800 } = {}) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err.response?.status;
      // Don't retry on client errors (4xx)
      if (status && status >= 400 && status < 500) throw err;
      if (attempt === retries) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(`[Retry] Attempt ${attempt + 1} failed — retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
};

/**
 * Simple in-memory circuit breaker.
 * After threshold failures, opens for cooldownMs before allowing calls again.
 */
export const createCircuitBreaker = ({ threshold = 5, cooldownMs = 60_000 } = {}) => {
  const state = { failures: 0, openUntil: null };

  return {
    isOpen: () => state.openUntil !== null && Date.now() < state.openUntil,
    recordSuccess: () => { state.failures = 0; state.openUntil = null; },
    recordFailure: () => {
      state.failures++;
      if (state.failures >= threshold) {
        state.openUntil = Date.now() + cooldownMs;
        console.warn(`[CircuitBreaker] Opened for ${cooldownMs / 1000}s after ${threshold} failures`);
      }
    },
  };
};
