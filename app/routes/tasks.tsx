import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext, useSubmit, useNavigate } from "@remix-run/react";
import { prisma } from "~/services/db.server";
import TaskListView from "~/components/TaskListView";
import EditTaskModal from "~/components/EditTaskModal";
import { useState } from "react";

// Loader: 讀取所有任務（包含被指派的任務）
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
        const goal = formData.get("goal") as string | null;
        const timeType = formData.get("timeType") as string | null;
        const timeValue = parseInt(formData.get("timeValue") as string || "0");
        const assignedToId = formData.get("assignedToId") as string | null;
        const creatorId = formData.get("creatorId") as string | null;
        const assigneeIds = formData.getAll("assigneeIds[]") as string[];

        if (!title) {
          return json({ error: "Title is required" }, { status: 400 });
        }

        // 使用 Transaction 確保任務建立與指派關係同時成功
        const result = await prisma.$transaction(async (tx) => {
          // 建立任務
          const task = await tx.task.create({
            data: {
              title,
              description: description || null,
              projectId: projectId || null,
              goal: goal || "行政",
              timeType: (timeType?.toUpperCase() || "MISC") as any,
              timeValue: timeValue,
              assignedToId: assignedToId || null,
              creatorId: creatorId || null,
              status: "PENDING",
              priority: "medium",
            },
          });

          // 如果有指派員工，建立 TaskAssignment 記錄
          if (assigneeIds && assigneeIds.length > 0 && creatorId) {
            await tx.taskAssignment.createMany({
              data: assigneeIds.map(assigneeId => ({
                taskId: task.id,
                assigneeId,
                assignedById: creatorId,
                status: "pending",
              })),
            });
          }

          return task;
        });

        console.log("[tasks.action] Task created:", result.id, "with", assigneeIds.length, "assignees");
        return json({ success: true, task: result });
      }

      case "update": {
        const id = formData.get("id") as string;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const goalCategory = formData.get("goalCategory") as string;
        const timeType = formData.get("timeType") as string;
        const projectId = formData.get("projectId") as string;
        const dueAt = formData.get("dueAt") as string;
        const status = formData.get("status") as string;

        if (!id) {
          return json({ error: "Task ID is required" }, { status: 400 });
        }

        const task = await prisma.task.update({
          where: { id },
          data: {
            ...(title && { title }),
            ...(description && { description }),
            ...(goalCategory && { goal: goalCategory }),
            ...(timeType && { timeType: timeType as any }),
            ...(projectId && { projectId }),
            ...(dueAt && { dueAt: new Date(dueAt) }),
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
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const submit = useSubmit();
  const navigate = useNavigate();

  const formattedTasks = tasks.map((task: any) => ({
    ...task,
    assigneeId: task.assignedToId,
    projectId: task.projectId || undefined,
    categoryId: task.categoryId || undefined,
  }));

  const handleEditTask = (task: any) => {
    setEditingTask(task);
  };

  const handleEditSubmit = (taskId: string, data: any) => {
    const formData = new FormData();
    formData.append('intent', 'update');
    formData.append('id', taskId);
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('goalCategory', data.goalCategory);
    formData.append('timeType', data.timeType);
    formData.append('projectId', data.projectId);
    formData.append('dueAt', data.dueAt);
    formData.append('status', data.status);
    submit(formData, { method: 'post' });
  };

  const handleDeleteTask = (taskId: string) => {
    const formData = new FormData();
    formData.append('intent', 'delete');
    formData.append('id', taskId);
    submit(formData, { method: 'post' });
  };

  return (
    <>
      <TaskListView
        tasks={formattedTasks}
        users={users}
        onSelectTask={(task) => setSelectedTask(task)}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
      />
      <EditTaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={handleEditSubmit}
        task={editingTask}
        projects={projects}
      />
    </>
  );
}
