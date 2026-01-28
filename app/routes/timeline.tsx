import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
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

  const allocations: any[] = [];

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

  const formattedTasks = tasks.map((task: any) => ({
    ...task,
    assigneeId: task.assignedToId,
    projectId: task.projectId || undefined,
    categoryId: task.categoryId || undefined,
  }));

  return (
    <TimelineView
      tasks={formattedTasks}
      projects={projects}
      users={users}
      currentUser={currentUser}
      allocations={allocations}
      onAddAllocation={(alloc) => console.log("Add allocation:", alloc)}
      onUpdateAllocation={(id, updates) => console.log("Update allocation:", id, updates)}
      onDeleteAllocation={(id) => console.log("Delete allocation:", id)}
    />
  );
}
