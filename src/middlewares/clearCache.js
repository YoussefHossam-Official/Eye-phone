import { clearShopCache } from "../utils/cacheHelper.js";
 
const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];
 
const clearCache = async (req, res, next) => {
  if (!MUTATING_METHODS.includes(req.method)) {
    return next();
  }
 
  const originalJson = res.json.bind(res);
 
  res.json = async (data) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const shopId = req.shop?.id;
      if (shopId) await clearShopCache(shopId);
    }
    return originalJson(data);
  };
 
  next();
};
 
export default clearCache;
 