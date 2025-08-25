import { encryptQueue } from '../../lib/redis-connetion';

export async function checkQueue() {
  // waiting: 아직 처리되지 않은 작업
  const jobs = await encryptQueue.getJobs(['waiting', 'delayed', 'active']);
  console.log(`현재 큐에 총 ${jobs.length}개의 Job이 있습니다.`);
}
