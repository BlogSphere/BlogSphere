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

  const keys = mainKey.split(',').map(k => k.trim()).filter(Boolean);
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
