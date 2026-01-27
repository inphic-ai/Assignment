import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function queryTasks() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    console.log(`\n✅ 找到 ${tasks.length} 筆任務:\n`);
    tasks.forEach((task, idx) => {
      console.log(`${idx + 1}. [${task.id}] ${task.title}`);
      console.log(`   - 狀態: ${task.status}`);
      console.log(`   - 分配給: ${task.assignedToId}`);
      console.log(`   - 建立時間: ${task.createdAt}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ 查詢失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

queryTasks();
