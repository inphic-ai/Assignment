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

  return json({
    tasks,
    projects,
    users,
    allocations,
  });
}

export default function DashboardRoute() {
  const { tasks, projects, users, allocations } = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<{ currentUser: any; users: any[] }>();

  // 轉換資料格式以符合 Dashboard 組件的期望
  const formattedTasks = tasks.map((task: any) => ({
    ...task,
    assigneeId: task.assignedToId,
    projectId: task.projectId || undefined,
    categoryId: task.categoryId || undefined,
  }));

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
      tasks={formattedTasks}
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
