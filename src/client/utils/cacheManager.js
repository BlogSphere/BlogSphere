/**
 * Client-Side Cache Manager using Cookies + localStorage.
 * Provides instant page loads (0ms render from cache) and background revalidation,
 * with immediate mutation/invalidation on user changes.
 */

// Helper to set a cookie
export function setCookie(name, value, days = 7) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn('Cookie write error:', e);
  }
}

// Helper to get a cookie value
export function getCookie(name) {
  try {
    return document.cookie.split('; ').reduce((r, v) => {
      const parts = v.split('=');
      return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
  } catch (e) {
    return '';
  }
}

// Helper to delete a cookie
export function deleteCookie(name) {
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
  } catch (e) {
    console.warn('Cookie delete error:', e);
  }
}

/**
 * Retrieve cached data from localStorage if valid.
 * @param {string} key Cache key identifier
 * @param {number} maxAgeMs Maximum age in milliseconds (default: 10 minutes)
 */
export function getCache(key, maxAgeMs = 10 * 60 * 1000) {
  try {
    const raw = localStorage.getItem(`cache_${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.timestamp) return null;
    
    // Check if expired
    const isExpired = Date.now() - parsed.timestamp > maxAgeMs;
    if (isExpired) {
      return null;
    }
    return parsed.data;
  } catch (e) {
    console.warn(`Error reading cache for ${key}:`, e);
    return null;
  }
}

/**
 * Save data to localStorage and set a tracking cookie.
 * @param {string} key Cache key identifier
 * @param {any} data Payload data
 */
export function setCache(key, data) {
  try {
    const payload = {
      timestamp: Date.now(),
      data
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(payload));
    setCookie(`cache_${key}`, String(payload.timestamp), 7);
  } catch (e) {
    console.warn(`Error setting cache for ${key}:`, e);
  }
}

/**
 * Invalidate specific cache key or keys matching a prefix pattern (e.g. 'admin_')
 * @param {string} keyOrPrefix 
 */
export function invalidateCache(keyOrPrefix) {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k === `cache_${keyOrPrefix}` || k.startsWith(`cache_${keyOrPrefix}`))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => {
      localStorage.removeItem(k);
      deleteCookie(k);
    });
  } catch (e) {
    console.warn(`Error invalidating cache for ${keyOrPrefix}:`, e);
  }
}

/**
 * Stale-While-Revalidate execution helper:
 * 1. Checks cache and immediately passes cached data to `onSuccess(data, isFromCache = true)`
 * 2. Fetches fresh data from API server in background
 * 3. Updates cache and invokes `onSuccess(freshData, isFromCache = false)`
 * 
 * @param {string} key Cache key
 * @param {Function} fetcher Async function that returns fresh data
 * @param {Function} onSuccess Callback (data, isFromCache) => void
 * @param {number} maxAgeMs Cache TTL
 */
export async function staleWhileRevalidate(key, fetcher, onSuccess, maxAgeMs = 10 * 60 * 1000) {
  const cached = getCache(key, maxAgeMs);
  let hasServedCache = false;

  if (cached !== null) {
    onSuccess(cached, true);
    hasServedCache = true;
  }

  try {
    const freshData = await fetcher();
    setCache(key, freshData);
    onSuccess(freshData, false);
    return freshData;
  } catch (err) {
    if (!hasServedCache) {
      throw err;
    }
  }
}
