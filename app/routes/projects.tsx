import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { prisma } from "~/services/db.server";
import ProjectTasksView from "~/components/ProjectTasksView";

export async function loader({ request }: LoaderFunctionArgs) {
  const tasks = await prisma.task.findMany({
    include: {
      project: true,
      assignedTo: true,
      category: true,
      assignments: {
        include: {
          assignee: true,
          assignedBy: true,
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

  return json({
    tasks,
    projects,
    users,
  });
}

export default function ProjectsRoute() {
  const { tasks, projects, users } = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<{ currentUser: any; users: any[] }>();

  const formattedTasks = tasks.map((task: any) => ({
    ...task,
    assigneeId: task.assignedToId,
    projectId: task.projectId || undefined,
    categoryId: task.categoryId || undefined,
  }));

  return (
    <ProjectTasksView
      tasks={formattedTasks}
      projects={projects}
      users={users}
      currentUser={currentUser}
      onCreateTasks={(tasks, project) => console.log("Create tasks:", tasks, project)}
      onUpdateTask={(id, updates) => console.log("Update task:", id, updates)}
      onDeleteTask={(id) => console.log("Delete task:", id)}
      onDeleteProject={(id) => console.log("Delete project:", id)}
      onCreateProjectFull={(project, tasks) => console.log("Create project:", project, tasks)}
    />
  );
}
