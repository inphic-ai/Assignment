import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { prisma } from "~/services/db.server";
import PersonalDashboard from "~/components/PersonalDashboard";

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

export default function PersonalDashboardRoute() {
  const { tasks, projects, users, allocations } = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<{ currentUser: any; users: any[] }>();

  const formattedTasks = tasks.map((task: any) => ({
    ...task,
    assigneeId: task.assignedToId,
    projectId: task.projectId || undefined,
    categoryId: task.categoryId || undefined,
  }));

  return (
    <PersonalDashboard
      tasks={formattedTasks}
      projects={projects}
      users={users}
      currentUser={currentUser}
      allocations={allocations}
      onNavigateToTasks={(filter) => console.log("Navigate to tasks:", filter)}
      onOpenCreate={() => console.log("Open create task")}
    />
  );
}
