import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisHost = process.env['REDIS_HOST'];
const redisPort = process.env['REDIS_PORT'];
const redisPassword = process.env['REDIS_PASSWORD'];
const redisDb = process.env['REDIS_DB'];

export const connection = new IORedis({
  host: redisHost!, // string
  port: Number(redisPort!),
  password: redisPassword ?? '1234',
  db: Number(redisDb!),
  maxRetriesPerRequest: null,
});

export const encryptQueue = new Queue('encrypt', { connection });

connection.on('connect', () => {
  console.log('Redis connected');
});

connection.on('error', (error) => {
  console.error('Redis error', error);
});

connection.on('close', () => {
  console.log('Redis closed');
});

connection.on('reconnecting', () => {
  console.log('Redis reconnecting');
});
