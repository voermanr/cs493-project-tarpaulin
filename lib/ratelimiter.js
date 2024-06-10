const Redis = require('ioredis');
const redis = new Redis(`redis://redis:6379`)

const RATE_LIMIT_WINDOW = 60;
const MAX_REQUESTS = 61;

async function rateLimiter(req, res, next) {
    const ip = req.ip;
    const currentTime = Math.floor((Date.now() / 1000));

    try {
        const tokenBucket = await redis.get(ip);

        let tokensLeft;
        let lastRefillTime;

        if (tokenBucket) {
            const bucket = JSON.parse(tokenBucket);
            tokensLeft = bucket.tokens;
            lastRefillTime = bucket.last
        } else {
            tokensLeft = MAX_REQUESTS;
            lastRefillTime = currentTime;
        }

        const timePassed = currentTime - lastRefillTime;
        const tokensToAdd = Math.floor(timePassed * (MAX_REQUESTS / RATE_LIMIT_WINDOW))

        tokensLeft = Math.min(tokensLeft + tokensToAdd, MAX_REQUESTS);
        lastRefillTime = currentTime;

        if (tokensLeft > 0) {
            tokensLeft -= 1;
            await redis.set(ip, JSON.stringify({
                tokens: tokensLeft,
                last: lastRefillTime
            }));
            next();
        } else {
            return res.status(429).json({ error: 'Too many requests, try again laterrrrrr'})
        }
    } catch (err) {
        next(err);
    }
}

module.exports = rateLimiter;
