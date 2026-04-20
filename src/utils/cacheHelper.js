import cache from "./cache.js";
 

export const getCache = async (key) => {
  try {
    const data = await cache.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Cache GET error (skipping):", err.message);
    return null; 
  }
};
 
export const setCache = async (key, value, ttl) => {
  try {
    await cache.set(key, JSON.stringify(value), "EX", ttl);
  } catch (err) {
    console.error("Cache SET error (skipping):", err.message);

  }
};
 
export const clearShopCache = async (shopId) => {
  try {
    return new Promise((resolve) => {
      const stream = cache.scanStream({ match: `*:${shopId}*` });
      const keys = [];
 
      stream.on("data", (batch) => keys.push(...batch));
 
      stream.on("end", async () => {
        if (keys.length > 0) await cache.del(keys);
        resolve();
      });
 
      stream.on("error", (err) => {
        console.error("Cache CLEAR error (skipping):", err.message);
        resolve(); 
      });
    });
  } catch (err) {
    console.error("Cache CLEAR error (skipping):", err.message);
  }
};