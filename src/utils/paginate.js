import AppError from "./AppError.js";
 
const paginate = (query) => {
  const pageNum = Math.max(1, parseInt(query.page) || 1);
  const limitNum = Math.min(100, parseInt(query.limit) || 20);
  const offset = (pageNum - 1) * limitNum;
  return { pageNum, limitNum, offset };
};
 
export const calcPages = (count, limitNum) => {
  return Math.ceil(count / limitNum) || 1;
};
 
export const validateDateRange = (start, end) => {
  if (!start || !end) return null;
 
  const startDate = new Date(start);
  const endDate = new Date(end);
 
  if (isNaN(startDate.getTime())) throw new AppError("Invalid start date", 400);
  if (isNaN(endDate.getTime())) throw new AppError("Invalid end date", 400);
  if (startDate > endDate) throw new AppError("Start date must be before end date", 400);
 
  return {
    start: startDate,
    end: new Date(endDate.setHours(23, 59, 59, 999)),
  };
};
 
export default paginate;