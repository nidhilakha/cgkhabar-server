import { Redis } from "ioredis";
require("dotenv").config();

const redisClient = () => {
    if (process.env.REDIS_URL) {
        console.log(`Connecting to Redis at ${process.env.REDIS_URL}`);
        return process.env.REDIS_URL;
    }

    throw new Error(`Redis connection failed`);
};

const redis = new Redis(redisClient(), {
    retryStrategy: (times) => {
        console.log(`Retrying connection attempt ${times}`);
        if (times >= 20) {
            console.error('Max retries reached. Redis server is unreachable.');
            return null; // Stop retrying after 20 attempts
        }
        return Math.min(times * 100, 2000); // Exponential backoff
    },
    reconnectOnError: (err) => {
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
            // Only reconnect when the error contains "READONLY"
            return true;
        }
        return false; // or `return 1;`
    },
    tls: {
        rejectUnauthorized: false, // Might be necessary for self-signed certificates
    },
});

redis.on('connect', () => {
    console.log('Connected to Redis');
});

redis.on('error', (err) => {
    console.error('Redis error:', err);
});

redis.on('end', () => {
    console.log('Redis connection closed');
});

redis.on('reconnecting', (delay:any) => {
    console.log(`Reconnecting to Redis in ${delay} ms`);
});

// Example function to set a key-value pair in Redis
const setUser = async (user: any) => {
    try {
        await redis.set(user._id, JSON.stringify(user));
        console.log('User set in Redis successfully');
    } catch (error) {
        console.error('Error setting user in Redis:', error);
    }
};

export { redis, setUser };
