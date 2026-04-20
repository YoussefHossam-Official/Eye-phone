export const CACHE_KEYS = {
  dashboard: (shopId) => `dashboard:${shopId}`,
  inventory: (shopId, type = "all") => `inventory:${shopId}:${type}`,
  report: (shopId, query) => `report:${shopId}:${JSON.stringify(query)}`,
  detailedReport: (shopId, query) => `detailed_report:${shopId}:${JSON.stringify(query)}`,
};
 
export const CACHE_TTL = {
  dashboard: 120,  
  inventory: 300,  
  report: 600,      
  detailedReport: 600,  
};