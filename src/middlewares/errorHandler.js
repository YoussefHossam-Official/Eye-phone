const errorHandler = (err, req, res, next) => {
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      message: err.errors.map((e) => e.message),
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      message: err.errors.map((e) => e.message),
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token expired" });
  }

  const statusCode = err.statusCode || 500;

  const message = statusCode === 500 ? "Internal server error" : err.message;

  res.status(statusCode).json({ message });
};

export default errorHandler;
