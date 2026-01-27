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

  // 暫時使用空陣列，後續可以從資料庫載入例行工作模板
  const templates: any[] = [];

  return json({
    tasks,
    users,
    templates,
  });
}

export default function RoutinesRoute() {
  const { tasks, users, templates } = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<{ currentUser: any; users: any[] }>();

  const formattedTasks = tasks.map((task: any) => ({
    ...task,
    assigneeId: task.assignedToId,
    projectId: task.projectId || undefined,
    categoryId: task.categoryId || undefined,
  }));

  return (
    <RoutineManagerView
      currentUser={currentUser}
      users={users}
      templates={templates}
      onSaveTemplate={(template) => console.log("Save template:", template)}
      onDeleteTemplate={(id) => console.log("Delete template:", id)}
      onToggleTemplate={(id, status) => console.log("Toggle template:", id, status)}
      onInstantiate={(template) => console.log("Instantiate template:", template)}
    />
  );
}
