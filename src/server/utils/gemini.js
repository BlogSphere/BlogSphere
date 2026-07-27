let currentIndex = 0;
const cooldowns = new Map();

export const reportKeyFailure = (key) => {
  if (key) {
    cooldowns.set(key, Date.now() + 60 * 1000);
    console.warn(`[Gemini Rotation] ⚠️ Key put on 60-second cooldown due to failure: ${key.substring(0, 10)}...`);
  }
};

export const getGeminiApiKey = () => {
  const mainKey = process.env.GEMINI_API_KEY;
  if (!mainKey) {
    return null;
  }

  const keys = mainKey.split(',').map(k => k.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  if (keys.length === 0) {
    return null;
  }

  const now = Date.now();

  // Find index of next available key that is not on cooldown
  let selectedKey = null;
  let selectedIndex = -1;

  for (let i = 0; i < keys.length; i++) {
    const checkIndex = (currentIndex + i) % keys.length;
    const key = keys[checkIndex];
    const cooldownExpires = cooldowns.get(key) || 0;

    if (cooldownExpires <= now) {
      selectedKey = key;
      selectedIndex = checkIndex;
      break;
    }
  }

  if (selectedKey !== null) {
    // Move circular index to the one after the selected key
    currentIndex = (selectedIndex + 1) % keys.length;
    return selectedKey;
  }

  // Fallback: All keys are on cooldown. Choose the one that will expire the soonest.
  let soonestKey = keys[0];
  let soonestTime = cooldowns.get(keys[0]) || Infinity;

  for (let i = 1; i < keys.length; i++) {
    const time = cooldowns.get(keys[i]) || Infinity;
    if (time < soonestTime) {
      soonestTime = time;
      soonestKey = keys[i];
    }
  }

  // Still update currentIndex to follow the soonest key circular index
  const soonestIndex = keys.indexOf(soonestKey);
  currentIndex = (soonestIndex + 1) % keys.length;

  return soonestKey;
};

export const callGeminiWithRetry = async (payload) => {
  const mainKey = process.env.GEMINI_API_KEY;
  if (!mainKey) {
    throw new Error('No API keys configured.');
  }

  const keys = mainKey.split(',').map(k => k.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  const maxRetries = Math.min(keys.length, 5); // Retry up to 5 times or keys count
  let attempts = 0;
  let lastError = null;

  while (attempts < maxRetries) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error('No API keys configured or all keys are exhausted.');
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return response;
      }

      const errorText = await response.text();
      lastError = new Error(`Gemini API returned status ${response.status}: ${errorText}`);
      console.warn(`[Gemini Failover] Key returned status ${response.status}. Retrying with next key...`);
      reportKeyFailure(apiKey);
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini Failover] Request failed: ${err.message}. Retrying with next key...`);
      reportKeyFailure(apiKey);
    }

    attempts++;
  }

  throw lastError || new Error('All Gemini API keys failed after multiple retries.');
};
