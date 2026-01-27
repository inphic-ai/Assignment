import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function createTestTask() {
  try {
    const task = await prisma.task.create({
      data: {
        title: '測試落地 2026-01-27',
        description: '驗證 Remix SSR 架構任務是否真的寫入資料庫',
        goal: '管理',
        timeType: 'MISC',
        timeValue: 30,
        status: 'IN_PROGRESS',
        assignedToId: 'u2', // Alex Chen
        creatorId: 'u2',
        startAt: new Date(),
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 明天
      }
    });
    
    console.log('✅ 任務建立成功:', task);
    console.log('任務 ID:', task.id);
    console.log('標題:', task.title);
  } catch (error) {
    console.error('❌ 建立任務失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestTask();
