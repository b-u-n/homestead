class RateLimiter {
  constructor() {
    this.requests = new Map(); // IP -> { count, resetTime }
  }

  isAllowed(ip) {
    const now = Date.now();
    const windowMs = 3 * 60 * 1000; // 3 minutes
    const maxRequests = 3;

    if (!this.requests.has(ip)) {
      this.requests.set(ip, { count: 1, resetTime: now + windowMs });
      return true;
    }

    const record = this.requests.get(ip);

    // Reset if window has passed
    if (now >= record.resetTime) {
      this.requests.set(ip, { count: 1, resetTime: now + windowMs });
      return true;
    }

    // Check if under limit
    if (record.count < maxRequests) {
      record.count++;
      return true;
    }

    return false;
  }

  getRemainingTime(ip) {
    const record = this.requests.get(ip);
    if (!record) return 0;
    
    const now = Date.now();
    return Math.max(0, record.resetTime - now);
  }

  cleanup() {
    const now = Date.now();
    for (const [ip, record] of this.requests.entries()) {
      if (now >= record.resetTime) {
        this.requests.delete(ip);
      }
    }
  }
}

module.exports = new RateLimiter();