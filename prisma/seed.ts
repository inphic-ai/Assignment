// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // 1. 初始化 Category (八大分類) - 冪等
  const categories = [
    '業務', '人資', '管理', '倉儲', '維修', '行銷', '售後', '行政'
  ];

  console.log('📦 Seeding categories...');
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✅ ${categories.length} categories seeded.`);

  // 2. 初始化 Users (從 MOCK_USERS) - 冪等
  const mockUsers = [
    { id: 'u1', email: 'alex.chen@chronos.com', name: 'Alex Chen', role: 'ADMIN', department: '研發部' },
    { id: 'u2', email: 'lin.shuhao@chronos.com', name: '林書豪', role: 'USER', department: '設計部' },
    { id: 'u3', email: 'wang.daming@chronos.com', name: '王大明', role: 'USER', department: '業務部' },
    { id: 'u4', email: 'zhang.xiaomei@chronos.com', name: '張小美', role: 'USER', department: '設計部' },
    { id: 'u5', email: 'li.along@chronos.com', name: '李阿龍', role: 'USER', department: '業務部' },
  ];

  const defaultPassword = 'password123'; // 僅用於測試
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  console.log('👥 Seeding users...');
  for (const user of mockUsers) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        name: user.name,
        role: user.role as any,
      },
      create: {
        id: user.id,
        email: user.email,
        passwordHash: hashedPassword,
        name: user.name,
        role: user.role as any,
      },
    });
  }
  console.log(`✅ ${mockUsers.length} users seeded (password: ${defaultPassword}).`);

  // 3. 初始化 Projects (從 App.tsx 的 Mock 資料) - 冪等
  const mockProjects = [
    { 
      id: 'p1', 
      title: '市場與競品分析', 
      description: '深度分析目前市場趨勢', 
      ownerId: 'u1',
      status: 'PENDING' as const
    },
    { 
      id: 'p2', 
      title: '2026 產品路線圖', 
      description: '規劃未來年度產品方向', 
      ownerId: 'u1',
      status: 'PENDING' as const
    }
  ];

  console.log('📁 Seeding projects...');
  for (const project of mockProjects) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: {
        title: project.title,
        description: project.description,
        status: project.status,
      },
      create: {
        id: project.id,
        title: project.title,
        description: project.description,
        ownerId: project.ownerId,
        status: project.status,
      },
    });
  }
  console.log(`✅ ${mockProjects.length} projects seeded.`);

  // 4. 初始化 Sample Tasks (示例任務) - 冪等
  const adminCategory = await prisma.category.findUnique({ where: { name: '行政' } });
  const businessCategory = await prisma.category.findUnique({ where: { name: '業務' } });

  const sampleTasks = [
    {
      id: 'task-sample-1',
      title: '準備週會簡報',
      description: '整理本週工作進度與下週計畫',
      projectId: 'p1',
      assignedToId: 'u1',
      categoryId: adminCategory?.id,
      suggestedType: 'DAILY' as const,
      suggestedValue: 2,
      status: 'PENDING' as const,
    },
    {
      id: 'task-sample-2',
      title: '客戶需求訪談',
      description: '與潛在客戶進行產品需求訪談',
      projectId: 'p2',
      assignedToId: 'u3',
      categoryId: businessCategory?.id,
      suggestedType: 'MISC' as const,
      suggestedValue: 90,
      status: 'PENDING' as const,
    },
  ];

  console.log('📝 Seeding sample tasks...');
  for (const task of sampleTasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {
        title: task.title,
        description: task.description,
        status: task.status,
      },
      create: {
        id: task.id,
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        assignedToId: task.assignedToId,
        categoryId: task.categoryId,
        suggestedType: task.suggestedType,
        suggestedValue: task.suggestedValue,
        status: task.status,
      },
    });
  }
  console.log(`✅ ${sampleTasks.length} sample tasks seeded.`);

  // 5. 驗證資料筆數
  const counts = {
    categories: await prisma.category.count(),
    users: await prisma.user.count(),
    projects: await prisma.project.count(),
    tasks: await prisma.task.count(),
  };

  console.log('\n📊 Database Summary:');
  console.log(`   Categories: ${counts.categories}`);
  console.log(`   Users: ${counts.users}`);
  console.log(`   Projects: ${counts.projects}`);
  console.log(`   Tasks: ${counts.tasks}`);
  console.log(`   Total Records: ${Object.values(counts).reduce((a, b) => a + b, 0)}`);

  console.log('\n✅ Seeding Completed');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
