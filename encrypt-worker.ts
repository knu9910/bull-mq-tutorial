// src/workers/encrypt-worker.ts
import 'dotenv/config';
import { Worker } from 'bullmq';
import { connection } from './lib/redis-connetion';
import fs from 'fs';
import path from 'path';
import { encrypt } from './crypto';
import { saveCustomerData } from '.';

interface EncryptJobData {
  batch: any[];
  batchIndex: number;
}

const worker = new Worker<EncryptJobData>(
  'encrypt',
  async (job) => {
    const { batch, batchIndex } = job.data;
    console.log(`🔒 [Batch ${batchIndex}] 암호화 시작, 작업 개수: ${batch.length}`);

    const encryptedBatch = await Promise.all(
      batch.map(async (customer) => ({
        ...customer,
        name: await encrypt(customer.name),
        phone: await encrypt(customer.phone),
        email: await encrypt(customer.email),
        ssn_last4: await encrypt(customer.ssn_last4),
      })),
    );

    saveCustomerData(encryptedBatch, `encrypted_batch_${batchIndex}.json`);
    // 원하면 각 배치를 파일로 저장

    console.log(`✅ [Batch ${batchIndex}] 암호화 완료`);
    return { batchIndex, count: batch.length };
  },
  {
    connection,
    concurrency: 4, // CPU 사용률 제한용: 동시에 처리할 작업 개수
    lockDuration: 300000, // 5분 timeout
  },
);

worker.on('completed', async (job) => {
  console.log(`🎉 Job ${job.id} 완료`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} 실패:`, err);
});

console.log('🔑 Encrypt Worker 실행 중...');
