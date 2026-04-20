import Redis from "ioredis";

const cache = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
});

cache.on("connect", () => console.log("Redis connected"));
cache.on("error", (err) => console.error("Redis error:", err));

export default cache;
