import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function queryUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    console.log(`\n✅ 找到 ${users.length} 位使用者:\n`);
    users.forEach((user, idx) => {
      console.log(`${idx + 1}. [${user.id}] ${user.name} (${user.email}) - ${user.role}`);
    });
  } catch (error) {
    console.error('❌ 查詢失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

queryUsers();
