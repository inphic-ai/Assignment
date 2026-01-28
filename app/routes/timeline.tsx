import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext, useSubmit } from "@remix-run/react";
import { prisma } from "~/services/db.server";
import TimelineView from "~/components/TimelineView";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") || "u1";

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { assignedToId: userId },
        {
          assignments: {
            some: {
              assigneeId: userId,
            },
          },
        },
      ],
    },
    include: {
      project: true,
      assignedTo: true,
      category: true,
      assignments: {
        include: {
          assignee: true,
        },
      },
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

  const allocations = await prisma.taskAllocation.findMany({
    where: {
      userId: userId,
    },
    include: {
      task: {
        include: {
          project: true,
        },
      },
      user: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  return json({
    tasks,
    projects,
    users,
    allocations,
  });
}

export default function TimelineRoute() {
  const { tasks, projects, users, allocations } = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<{ currentUser: any; users: any[] }>();
  const submit = useSubmit();

  const formattedTasks = tasks.map((task: any) => ({
    ...task,
    assigneeId: task.assignedToId,
    projectId: task.projectId || undefined,
    categoryId: task.categoryId || undefined,
  }));

  const handleAddAllocation = (alloc: any) => {
    const formData = new FormData();
    formData.append("intent", "createAllocation");
    formData.append("taskId", alloc.taskId);
    formData.append("userId", currentUser.id);
    formData.append("date", alloc.date);
    formData.append("startTime", alloc.startTime);
    formData.append("endTime", alloc.endTime);
    formData.append("status", alloc.status || "planned");
    
    submit(formData, { method: "post", action: "/tasks" });
  };

  const handleUpdateAllocation = (id: string, updates: any) => {
    const formData = new FormData();
    formData.append("intent", "updateAllocation");
    formData.append("id", id);
    
    if (updates.date) formData.append("date", updates.date);
    if (updates.startTime) formData.append("startTime", updates.startTime);
    if (updates.endTime) formData.append("endTime", updates.endTime);
    if (updates.status) formData.append("status", updates.status);
    
    submit(formData, { method: "post", action: "/tasks" });
  };

  const handleDeleteAllocation = (id: string) => {
    if (!confirm("確定要刪除此時間分配嗎？")) return;
    
    const formData = new FormData();
    formData.append("intent", "deleteAllocation");
    formData.append("id", id);
    
    submit(formData, { method: "post", action: "/tasks" });
  };

  return (
    <TimelineView
      tasks={formattedTasks}
      projects={projects}
      users={users}
      currentUser={currentUser}
      allocations={allocations}
      onAddAllocation={handleAddAllocation}
      onUpdateAllocation={handleUpdateAllocation}
      onDeleteAllocation={handleDeleteAllocation}
    />
  );
}
