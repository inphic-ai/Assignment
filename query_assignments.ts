import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const assignments = await prisma.taskAssignment.findMany({
    include: {
      task: { select: { title: true } },
      assignee: { select: { name: true } },
      assignedBy: { select: { name: true } }
    },
    orderBy: { assignedAt: 'desc' }
  });
  
  console.log('TaskAssignment 記錄：');
  console.log(JSON.stringify(assignments, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
