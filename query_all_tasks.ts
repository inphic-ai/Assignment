import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.task.findMany({
    include: {
      assignedTo: true,
      project: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  console.log(`\n找到 ${tasks.length} 筆任務：\n`);
  tasks.forEach((task, idx) => {
    console.log(`${idx + 1}. [${task.id}] ${task.title}`);
    console.log(`   分配給: ${task.assignedTo?.name || '未分配'} (${task.assignedToId})`);
    console.log(`   狀態: ${task.status}`);
    console.log(`   建立時間: ${task.createdAt}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
