import NodeCache from 'node-cache';

/*
|--------------------------------------------------------------------------

CACHE INSTANCE
TTL is in seconds
stdTTL = default expiration time
checkperiod = cleanup interval
--------------------------------------------------------------------------
*/

const cache = new NodeCache({
stdTTL: 3600, // 1 hour default
checkperiod: 120, // cleanup every 2 min
useClones: false // better performance
});

/*
|--------------------------------------------------------------------------

CACHE HELPERS
*/

export const getCache = (key) => {
return cache.get(key);
};

export const setCache = (key, value, ttl = 3600) => {
return cache.set(key, value, ttl);
};

export const deleteCache = (key) => {
return cache.del(key);
};

export const flushCache = () => {
return cache.flushAll();
};

/*
|--------------------------------------------------------------------------

ADVANCED HELPER (USED IN ROUTES)
*/

export const getOrSetCache = async (key, fetchFn, ttl = 3600) => {
const cached = cache.get(key);
if (cached) return cached;

const data = await fetchFn();
cache.set(key, data, ttl);
return data;
};

export default cache;
