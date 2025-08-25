// 시나리오: 핀테크 스타트업 "SecureBank" 개인정보 암호화 프로젝트
//
// 배경:
// - SecureBank는 새로운 개인정보보호법 대응을 위해 기존 고객 데이터를 암호화해야 함
// - 20,000명의 고객 데이터 (이름, 이메일, 전화번호, 주민번호 뒷자리)를 AES-256으로 암호화
// - 서비스 중단 없이 백그라운드에서 안전하게 처리해야 함
// - CPU 사용률을 50% 이하로 제한하여 다른 서비스(API, 웹사이트) 정상 운영 보장
//
// 요구사항:
// 1. 100개씩 배치로 나누어 200개 작업으로 분할
// 2. 각 작업은 최대 5분 timeout
// 3. 실패 시 3번까지 재시도
// 4. 암호화 진행률 실시간 모니터링
// 5. 완료 시 관리자에게 알림
import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';
import { encrypt } from './crypto';
import { connection } from './lib/redis-connetion';
import { Queue } from 'bullmq';
// 고객 데이터 인터페이스
interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  ssn_last4: string; // 주민번호 뒷자리
  address: string;
  birthDate: string;
  joinDate: string;
  accountBalance: number;
  isVip: boolean;
}

// 한국 이름 생성을 위한 성씨와 이름 데이터
const koreanLastNames = [
  '김',
  '이',
  '박',
  '최',
  '정',
  '강',
  '조',
  '윤',
  '장',
  '임',
  '한',
  '오',
  '서',
  '신',
  '권',
  '황',
  '안',
  '송',
  '류',
  '전',
];

const koreanFirstNames = [
  '민준',
  '서준',
  '도윤',
  '시우',
  '주원',
  '하준',
  '지호',
  '지후',
  '준서',
  '건우',
  '서연',
  '서윤',
  '지우',
  '서현',
  '예은',
  '하은',
  '윤서',
  '지유',
  '채원',
  '지원',
];

// 한국 전화번호 생성
function generateKoreanPhone(): string {
  const prefixes = ['010', '011', '016', '017', '018', '019'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const middle = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
  const last = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
  return `${prefix}-${middle}-${last}`;
}

// 한국 이름 생성
function generateKoreanName(): string {
  const lastName = koreanLastNames[Math.floor(Math.random() * koreanLastNames.length)]!;
  const firstName = koreanFirstNames[Math.floor(Math.random() * koreanFirstNames.length)]!;
  return lastName + firstName;
}

// 주민번호 뒷자리 생성 (암호화 대상)
function generateSSNLast4(): string {
  // 성별코드(1-4) + 3자리 랜덤
  const genderCode = Math.floor(Math.random() * 4) + 1;
  const randomDigits = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${genderCode}${randomDigits}`;
}

// 한국 주소 생성
function generateKoreanAddress(): string {
  const cities = ['서울시', '부산시', '대구시', '인천시', '광주시', '대전시', '울산시'];
  const districts = ['강남구', '서초구', '송파구', '강동구', '마포구', '용산구', '종로구'];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const district = districts[Math.floor(Math.random() * districts.length)];
  const street = faker.location.street();
  const building = Math.floor(Math.random() * 999) + 1;

  return `${city} ${district} ${street} ${building}번길`;
}

// 고객 데이터 생성 함수
function generateCustomerData(id: number): CustomerData {
  const isKorean = Math.random() > 0.3; // 70% 한국인, 30% 외국인

  return {
    id: `CUST${id.toString().padStart(6, '0')}`,
    name: isKorean ? generateKoreanName() : faker.person.fullName(),
    email: faker.internet.email(),
    phone: isKorean ? generateKoreanPhone() : faker.phone.number(),
    ssn_last4: generateSSNLast4(),
    address: isKorean ? generateKoreanAddress() : faker.location.streetAddress(),
    birthDate:
      faker.date
        .between({
          from: '1950-01-01',
          to: '2005-12-31',
        })
        ?.toISOString()
        ?.split('T')[0] || '1950-01-01',
    joinDate:
      faker.date
        .between({
          from: '2020-01-01',
          to: '2024-12-31',
        })
        ?.toISOString()
        ?.split('T')[0] || '2020-01-01',
    accountBalance: Math.floor(Math.random() * 10000000), // 0 ~ 1000만원
    isVip: Math.random() > 0.85, // 15% VIP 고객
  };
}

// 대용량 고객 데이터 생성
function generateBulkCustomerData(count: number = 20000): CustomerData[] {
  console.log(`🏭 ${count}명의 고객 데이터 생성 중...`);

  const customers: CustomerData[] = [];
  const startTime = Date.now();

  for (let i = 1; i <= count; i++) {
    customers.push(generateCustomerData(i));
  }

  const endTime = Date.now();
  console.log(`✅ 데이터 생성 완료! 소요시간: ${endTime - startTime}ms`);

  return customers;
}

// 데이터를 파일로 저장
function saveCustomerData(customers: CustomerData[], filename: string = 'customer_data.json'): void {
  console.log(`💾 데이터를 ${filename}에 저장 중...`);

  const outputPath = path.join(process.cwd(), filename);
  fs.writeFileSync(outputPath, JSON.stringify(customers, null, 2));

  console.log(`✅ ${customers.length}개 고객 데이터가 ${outputPath}에 저장되었습니다.`);
  console.log(`📋 파일 크기: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
}

// 샘플 데이터 미리보기
function previewData(customers: CustomerData[], count: number = 3): void {
  console.log('\n📋 생성된 데이터 미리보기:');
  console.log('='.repeat(80));

  customers.slice(0, count).forEach((customer, index) => {
    console.log(`\n고객 #${index + 1}:`);
    console.log(`  ID: ${customer.id}`);
    console.log(`  이름: ${customer.name}`);
    console.log(`  이메일: ${customer.email}`);
    console.log(`  전화번호: ${customer.phone}`);
    console.log(`  주민번호 뒷자리: ${customer.ssn_last4} (🔒 암호화 대상)`);
    console.log(`  주소: ${customer.address}`);
    console.log(`  생년월일: ${customer.birthDate}`);
    console.log(`  가입일: ${customer.joinDate}`);
    console.log(`  계좌잔액: ${customer.accountBalance.toLocaleString()}원`);
    console.log(`  VIP 여부: ${customer.isVip ? '⭐ VIP' : '일반'}`);
  });

  console.log('='.repeat(80));
}

// 메인 실행 함수
async function main() {
  console.log('🏦 SecureBank 고객 데이터 생성기 v1.0');
  console.log('📋 개인정보보호법 대응을 위한 암호화 대상 데이터 생성\n');

  try {
    // 1. 대용량 고객 데이터 생성
    const customerData = generateBulkCustomerData(20000);

    const queue = new Queue('customer-data', { connection });

    // 2. 파일로 저장
    saveCustomerData(customerData);

    // 3. 데이터를 큐에 추가
    await queue.addBulk(
      customerData.map((customer) => ({
        name: 'customer-data',
        data: customer,
      })),
    );
  } catch (error) {
    console.error('❌ 데이터 생성 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export type { CustomerData };
export { generateCustomerData, generateBulkCustomerData, saveCustomerData };
