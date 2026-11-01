// Bounded per-process throttle. Use a shared edge limiter for multi-instance deployment.
const entries = new Map();
module.exports = function authRateLimit(req, res, next) {
  const now = Date.now();
  for (const [key, entry] of entries)
    if (entry.until <= now) entries.delete(key);
  const key = req.ip;
  let entry = entries.get(key);
  if (!entry) {
    if (entries.size >= 10000)
      return res
        .status(429)
        .json({ error: "Too many requests. Try again later." });
    entry = { count: 0, until: now + 15 * 60 * 1000 };
    entries.set(key, entry);
  }
  if (++entry.count > 40)
    return res
      .status(429)
      .set("Retry-After", String(Math.ceil((entry.until - now) / 1000)))
      .json({ error: "Too many sign-in attempts. Try again in 15 minutes." });
  next();
};
