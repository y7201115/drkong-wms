const redis = require('redis');

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => {
  console.error('Redis 错误:', err.message);
});

redisClient.on('connect', () => {
  console.log('Redis 连接成功');
});

(async () => {
  await redisClient.connect().catch(console.error);
})();

module.exports = redisClient;
