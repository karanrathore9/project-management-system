import Redis from 'ioredis';
import env from './env';

// One base client for general caching (GET/SET/EXPIRE).
// Socket.IO's Redis adapter needs its OWN pub/sub clients (duplicated
// connections) because a client in subscriber mode can't run normal commands.
//
// If REDIS_URL is provided (typical for managed/cloud Redis, e.g.
// redis://:password@host:6379 or rediss://... for TLS), use it directly.
// Otherwise fall back to discrete host/port/password (typical for local dev
// and docker-compose, where the "host" is just the service name, e.g. "redis").
export const redisClient = env.redis.url
  ? new Redis(env.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    })
  : new Redis({
      host: env.redis.host,
      port: env.redis.port,
      password: env.redis.password,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });

redisClient.on('connect', () => console.log('[Redis] connected'));
redisClient.on('error', (err) => console.error(`[Redis] error: ${err.message}`));

export function getPubSubClients() {
  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();

  // ioredis emits 'error' on every client instance; without a listener,
  // Node treats it as an unhandled error and can crash the process.
  pubClient.on('error', (err) => console.error(`[Redis pub] error: ${err.message}`));
  subClient.on('error', (err) => console.error(`[Redis sub] error: ${err.message}`));

  return { pubClient, subClient };
}