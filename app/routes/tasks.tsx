import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { prisma } from "~/services/db.server";
import TaskListView from "~/components/TaskListView";
import { useState } from "react";

// Loader: 讀取所有任務
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

  const projects = await prisma.project.findMany();
  const categories = await prisma.category.findMany();
  const users = await prisma.user.findMany();

  return json({
    tasks,
    projects,
    categories,
    users,
  });
}

// Action: 處理任務的 CRUD 操作
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  console.log("[tasks.action] Intent:", intent);

  try {
    switch (intent) {
      case "create": {
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const projectId = formData.get("projectId") as string | null;
        const categoryId = formData.get("categoryId") as string | null;
        const assignedToId = formData.get("assignedToId") as string | null;

        if (!title) {
          return json({ error: "Title is required" }, { status: 400 });
        }

        const task = await prisma.task.create({
          data: {
            title,
            description: description || null,
            projectId: projectId || null,
            categoryId: categoryId || null,
            assignedToId: assignedToId || null,
            status: "PENDING",
            suggestedType: "MISC",
            suggestedValue: 0,
          },
        });

        console.log("[tasks.action] Task created:", task.id);
        return json({ success: true, task });
      }

      case "update": {
        const id = formData.get("id") as string;
        const status = formData.get("status") as string;

        if (!id) {
          return json({ error: "Task ID is required" }, { status: 400 });
        }

        const task = await prisma.task.update({
          where: { id },
          data: {
            ...(status && { status: status as any }),
          },
        });

        console.log("[tasks.action] Task updated:", task.id);
        return json({ success: true, task });
      }

      case "delete": {
        const id = formData.get("id") as string;

        if (!id) {
          return json({ error: "Task ID is required" }, { status: 400 });
        }

        await prisma.task.delete({
          where: { id },
        });

        console.log("[tasks.action] Task deleted:", id);
        return json({ success: true });
      }

      default:
        return json({ error: "Invalid intent" }, { status: 400 });
    }
  } catch (error) {
    console.error("[tasks.action] Error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export default function TasksRoute() {
  const { tasks, projects, categories, users } = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<{ currentUser: any; users: any[] }>();
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const formattedTasks = tasks.map((task: any) => ({
    ...task,
    assigneeId: task.assignedToId,
    projectId: task.projectId || undefined,
    categoryId: task.categoryId || undefined,
  }));

  return (
    <TaskListView
      tasks={formattedTasks}
      users={users}
      onSelectTask={(task) => setSelectedTask(task)}
    />
  );
}
