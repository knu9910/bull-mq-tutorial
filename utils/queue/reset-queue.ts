import { encryptQueue } from '../../lib/redis-connetion';

export async function resetQueue() {
  await encryptQueue.obliterate({ force: true });
  console.log('큐 초기화 완료');
}
