import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
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

  const formattedTasks = tasks.map((task: any) => ({
    ...task,
    assigneeId: task.assignedToId,
    projectId: task.projectId || undefined,
    categoryId: task.categoryId || undefined,
  }));

  return (
    <DailyTasksView
      tasks={formattedTasks}
      projects={projects}
      users={users}
      currentUser={currentUser}
      onUpdateTask={(id, updates) => console.log("Update task:", id, updates)}
      onDeleteTask={(id) => console.log("Delete task:", id)}
      onOpenCreate={() => console.log("Open create task")}
    />
  );
}
