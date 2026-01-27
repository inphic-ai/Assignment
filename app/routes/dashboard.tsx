import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { prisma } from "~/services/db.server";
import Dashboard from "~/components/Dashboard";

export async function loader({ request }: LoaderFunctionArgs) {
  // 從資料庫載入所有必要資料
  const tasks = await prisma.task.findMany({
    include: {
      project: true,
      assignedTo: true,
      creator: true,
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const projects = await prisma.project.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const users = await prisma.user.findMany({
    where: {
      active: true,
    },
  });

  // 暫時使用空陣列，後續可以從資料庫載入
  const allocations: any[] = [];

  // 轉換 Prisma 資料格式為前端期望的格式
  const formattedTasks = tasks.map((task) => ({
    ...task,
    // 將 Date 物件轉為 ISO string
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    startAt: task.startAt?.toISOString() || new Date().toISOString(),
    dueAt: task.dueAt?.toISOString() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    deletedAt: task.deletedAt?.toISOString(),
    submittedAt: task.submittedAt?.toISOString(),
    reviewedAt: task.reviewedAt?.toISOString(),
    // 映射欄位名稱
    assigneeId: task.assignedToId || '',
    timeType: task.timeType.toLowerCase() as 'misc' | 'daily' | 'long',
    // 確保必要欄位存在
    role: 'assigned_to_me' as const,
    attachments: [],
    watchers: task.watchers || [],
    collaboratorIds: task.collaboratorIds || [],
  }));

  const formattedUsers = users.map((user) => ({
    ...user,
    role: user.role.toLowerCase() as 'admin' | 'manager' | 'user',
  }));

  return json({
    tasks: formattedTasks,
    projects,
    users: formattedUsers,
    allocations,
  });
}

export default function DashboardRoute() {
  const { tasks, projects, users, allocations } = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<{ currentUser: any; users: any[] }>();

  const handleNavigateToTasks = (filter: any) => {
    // TODO: 實作導航到任務清單並套用篩選
    console.log("Navigate to tasks with filter:", filter);
  };

  const handleOpenCreate = () => {
    // TODO: 實作開啟新增任務對話框
    console.log("Open create task dialog");
  };

  return (
    <Dashboard
      tasks={tasks}
      projects={projects}
      users={users}
      currentUser={currentUser}
      viewingUserId={currentUser.id}
      allocations={allocations}
      onSwitchUser={(userId) => console.log("Switch to user:", userId)}
      onNavigateToTasks={handleNavigateToTasks}
      onOpenCreate={handleOpenCreate}
    />
  );
}
