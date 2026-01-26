// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. 初始化 Category (八大分類)
  const categories = [
    '業務', '人資', '管理', '倉儲', '維修', '行銷', '售後', '行政'
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Categories seeded.');

  // 2. 初始化測試 User (Admin)
  const testUserEmail = 'admin@chronos.com';
  const testUserPassword = 'password'; // 僅用於測試，生產環境應使用更複雜的密碼
  const hashedPassword = await bcrypt.hash(testUserPassword, 10);

  await prisma.user.upsert({
    where: { email: testUserEmail },
    update: {},
    create: {
      id: 'clx1234567890abcdefghijk', // 與 project.ts 中的暫時 ID 保持一致
      email: testUserEmail,
      passwordHash: hashedPassword,
      name: 'Chronos Admin',
      role: 'ADMIN',
    },
  });
  console.log(`Test Admin User created: ${testUserEmail} / ${testUserPassword}`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
