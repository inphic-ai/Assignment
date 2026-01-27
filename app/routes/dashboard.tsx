import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext, useRouteError, isRouteErrorResponse } from "@remix-run/react";
import { prisma } from "~/services/db.server";
import Dashboard from "~/components/Dashboard";

export async function loader({ request }: LoaderFunctionArgs) {
  // 從 URL 參數獲取選擇的使用者 ID
  const url = new URL(request.url);
  const selectedUserId = url.searchParams.get('userId');

  // 從資料庫載入所有必要資料
  const tasks = await prisma.task.findMany({
    where: selectedUserId ? {
      assignedToId: selectedUserId,
    } : undefined,
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

  // 查詢今日的時間分配
  const today = new Date().toISOString().split('T')[0];
  const allocations = await prisma.taskAllocation.findMany({
    where: {
      date: today,
    },
    include: {
      task: true,
      user: true,
    },
  });

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

  const formattedAllocations = allocations.map((alloc) => ({
    ...alloc,
    createdAt: alloc.createdAt.toISOString(),
    updatedAt: alloc.updatedAt.toISOString(),
  }));

  return json({
    tasks: formattedTasks,
    projects,
    users: formattedUsers,
    allocations: formattedAllocations,
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

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
        <h1 className="text-2xl font-bold text-red-800 mb-4">
          {error.status} {error.statusText}
        </h1>
        <p className="text-red-600">{error.data}</p>
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
        <h1 className="text-2xl font-bold text-red-800 mb-4">Dashboard Error</h1>
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-red-700">Error Message:</p>
            <p className="text-red-600 font-mono text-sm">{error.message}</p>
          </div>
          <div>
            <p className="font-semibold text-red-700">Stack Trace:</p>
            <pre className="text-xs text-red-600 bg-red-100 p-4 rounded overflow-auto max-h-96">
              {error.stack}
            </pre>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
        <h1 className="text-2xl font-bold text-red-800">Unknown Error</h1>
        <p className="text-red-600">An unexpected error occurred.</p>
      </div>
    );
  }
}
