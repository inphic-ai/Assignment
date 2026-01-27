import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { prisma } from "~/services/db.server";
import RoutineManagerView from "~/components/RoutineManagerView";

export async function loader({ request }: LoaderFunctionArgs) {
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

  const users = await prisma.user.findMany({
    where: {
      active: true,
    },
  });

  // 暫時使用空陣列，後續可以從資料庫載入例行工作
  const routines: any[] = [];

  return json({
    tasks,
    users,
    routines,
  });
}

export default function RoutinesRoute() {
  const { tasks, users, routines } = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<{ currentUser: any; users: any[] }>();

  const formattedTasks = tasks.map((task: any) => ({
    ...task,
    assigneeId: task.assignedToId,
    projectId: task.projectId || undefined,
    categoryId: task.categoryId || undefined,
  }));

  return (
    <RoutineManagerView
      tasks={formattedTasks}
      users={users}
      currentUser={currentUser}
      routines={routines}
      onCreateRoutine={(routine) => console.log("Create routine:", routine)}
      onUpdateRoutine={(id, updates) => console.log("Update routine:", id, updates)}
      onDeleteRoutine={(id) => console.log("Delete routine:", id)}
      onGenerateTask={(routine) => console.log("Generate task from routine:", routine)}
    />
  );
}
