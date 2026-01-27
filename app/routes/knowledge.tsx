import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { prisma } from "~/services/db.server";
import KnowledgeBase from "~/components/KnowledgeBase";

export async function loader({ request }: LoaderFunctionArgs) {
  // 載入所有已完成的任務（知識庫）
  const tasks = await prisma.task.findMany({
    where: {
      status: "COMPLETED",
    },
    include: {
      assignedTo: true,
      project: true,
      category: true,
    },
  });

  const users = await prisma.user.findMany();

  return json({
    tasks: tasks.map((task) => ({
      ...task,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      startAt: task.startAt?.toISOString() || null,
      dueAt: task.dueAt?.toISOString() || null,
    })),
    users,
  });
}

export default function KnowledgeRoute() {
  const { tasks, users } = useLoaderData<typeof loader>();

  return (
    <KnowledgeBase
      tasks={tasks}
      users={users}
      onSelectTask={(task) => console.log("Select task:", task)}
    />
  );
}
