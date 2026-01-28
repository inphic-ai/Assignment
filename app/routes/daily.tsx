import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext, useSubmit } from "@remix-run/react";
import { prisma } from "~/services/db.server";
import DailyTasksView from "~/components/DailyTasksView";

export async function loader({ request }: LoaderFunctionArgs) {
  const tasks = await prisma.task.findMany({
    where: {
      timeType: "DAILY",
    },
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

  return json({
    tasks,
    projects,
    users,
  });
}

export default function DailyTasksRoute() {
  const { tasks, projects, users } = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<{ currentUser: any; users: any[] }>();
  const submit = useSubmit();

  const formattedTasks = tasks.map((task: any) => ({
    ...task,
    assigneeId: task.assignedToId,
    projectId: task.projectId || undefined,
    categoryId: task.categoryId || undefined,
  }));

  const handleUpdateTask = (id: string, updates: any) => {
    const formData = new FormData();
    formData.append("intent", "update");
    formData.append("id", id);
    
    if (updates.title) formData.append("title", updates.title);
    if (updates.description) formData.append("description", updates.description);
    if (updates.goalCategory) formData.append("goalCategory", updates.goalCategory);
    if (updates.timeType) formData.append("timeType", updates.timeType);
    if (updates.projectId) formData.append("projectId", updates.projectId);
    if (updates.dueAt) formData.append("dueAt", updates.dueAt);
    if (updates.status) formData.append("status", updates.status);
    
    submit(formData, { method: "post", action: "/tasks" });
  };

  const handleDeleteTask = (id: string) => {
    if (!confirm("確定要刪除此任務嗎？")) return;
    
    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("id", id);
    
    submit(formData, { method: "post", action: "/tasks" });
  };

  return (
    <DailyTasksView
      tasks={formattedTasks}
      projects={projects}
      users={users}
      currentUser={currentUser}
      onUpdateTask={handleUpdateTask}
      onDeleteTask={handleDeleteTask}
      onOpenCreate={() => console.log("Open create task")}
    />
  );
}
