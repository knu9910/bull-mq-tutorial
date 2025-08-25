import * as crypto from 'crypto';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const algorithm = process.env['CRYPTO_ALGORITHM'] || 'aes-256-gcm';
const key = process.env['CRYPTO_KEY']!;
const salt = process.env['CRYPTO_SALT']!;

if (!key || !salt) {
  throw new Error('CRYPTO 관련 환경 변수가 .env에 설정되어 있지 않습니다.');
}

const pbkdf2Async = promisify(crypto.pbkdf2);

// Salt를 사용하여 키를 파생하는 비동기 함수
async function deriveKey(password: string, salt: string, keyLength: number = 32): Promise<Buffer> {
  return pbkdf2Async(password, salt, 100000, keyLength, 'sha256');
}

// 암호화 함수: 암호문 + IV + tag를 '_'로 합쳐서 반환
async function encrypt(text: string): Promise<string> {
  const derivedKey = await deriveKey(key, salt);
  const iv = crypto.randomBytes(16); // 매번 새로운 IV
  const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = (cipher as any).getAuthTag();

  // Base64로 인코딩 후 '_'로 합치기
  return `${encrypted.toString('base64')}_${iv.toString('base64')}_${tag.toString('base64')}`;
}

// 복호화 함수: '_'로 분리된 암호문, IV, tag 사용
async function decrypt(payload: string): Promise<string> {
  const [encryptedBase64, ivBase64, tagBase64] = payload.split('_');
  const derivedKey = await deriveKey(key, salt);

  const encryptedBuffer = Buffer.from(encryptedBase64!, 'base64');
  const iv = Buffer.from(ivBase64!, 'base64');
  const tag = Buffer.from(tagBase64!, 'base64');

  const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
  (decipher as any).setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  return decrypted.toString('utf8');
}

export { encrypt, decrypt };
