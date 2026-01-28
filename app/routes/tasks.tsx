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

      case "batchCreate": {
        const tasksJson = formData.get("tasksJson") as string;
        const creatorId = formData.get("creatorId") as string;
        const assigneeIds = formData.getAll("assigneeIds[]") as string[];

        if (!tasksJson) {
          return json({ error: "Tasks data is required" }, { status: 400 });
        }

        const tasks = JSON.parse(tasksJson);

        // 使用 Transaction 確保所有任務同時建立成功
        const results = await prisma.$transaction(async (tx) => {
          const createdTasks = [];

          for (const taskData of tasks) {
            // 建立任務
            const task = await tx.task.create({
              data: {
                title: taskData.title,
                description: taskData.description || null,
                projectId: taskData.projectId || null,
                goal: taskData.goal || "行政",
                timeType: (taskData.timeType?.toUpperCase() || "MISC") as any,
                timeValue: taskData.timeValue || 0,
                assignedToId: taskData.assigneeId || null,
                creatorId: creatorId || null,
                status: "PENDING",
                priority: "medium",
                startAt: taskData.startAt || null,
                dueAt: taskData.dueAt || null,
                orderDaily: taskData.orderDaily || 0,
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

            createdTasks.push(task);
          }

          return createdTasks;
        });

        console.log("[tasks.action] Batch created:", results.length, "tasks");
        return json({ success: true, tasks: results });
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

      case "createAllocation": {
        const taskId = formData.get("taskId") as string;
        const userId = formData.get("userId") as string;
        const date = formData.get("date") as string;
        const startTime = formData.get("startTime") as string;
        const endTime = formData.get("endTime") as string;
        const status = formData.get("status") as string;

        if (!taskId || !userId || !date || !startTime || !endTime) {
          return json({ error: "Missing required fields" }, { status: 400 });
        }

        const allocation = await prisma.taskAllocation.create({
          data: {
            taskId,
            userId,
            date,
            startTime,
            endTime,
            status: status || "planned",
          },
        });

        console.log("[tasks.action] Allocation created:", allocation.id);
        return json({ success: true, allocation });
      }

      case "updateAllocation": {
        const id = formData.get("id") as string;
        const date = formData.get("date") as string;
        const startTime = formData.get("startTime") as string;
        const endTime = formData.get("endTime") as string;
        const status = formData.get("status") as string;

        if (!id) {
          return json({ error: "Allocation ID is required" }, { status: 400 });
        }

        const allocation = await prisma.taskAllocation.update({
          where: { id },
          data: {
            ...(date && { date }),
            ...(startTime && { startTime }),
            ...(endTime && { endTime }),
            ...(status && { status }),
          },
        });

        console.log("[tasks.action] Allocation updated:", allocation.id);
        return json({ success: true, allocation });
      }

      case "deleteAllocation": {
        const id = formData.get("id") as string;

        if (!id) {
          return json({ error: "Allocation ID is required" }, { status: 400 });
        }

        await prisma.taskAllocation.delete({
          where: { id },
        });

        console.log("[tasks.action] Allocation deleted:", id);
        return json({ success: true });
      }

      case "deleteProject": {
        const id = formData.get("id") as string;

        if (!id) {
          return json({ error: "Project ID is required" }, { status: 400 });
        }

        await prisma.project.delete({
          where: { id },
        });

        console.log("[tasks.action] Project deleted:", id);
        return json({ success: true });
      }

      case "createProjectFull": {
        const projectName = formData.get("projectName") as string;
        const projectDescription = formData.get("projectDescription") as string;
        const tasksJson = formData.get("tasksJson") as string;
        const creatorId = formData.get("creatorId") as string;

        if (!projectName) {
          return json({ error: "Project name is required" }, { status: 400 });
        }

        const tasks = tasksJson ? JSON.parse(tasksJson) : [];

        const result = await prisma.$transaction(async (tx) => {
          const project = await tx.project.create({
            data: {
              name: projectName,
              description: projectDescription || null,
            },
          });

          const createdTasks = [];
          for (const taskData of tasks) {
            const task = await tx.task.create({
              data: {
                title: taskData.title,
                description: taskData.description || null,
                projectId: project.id,
                goal: taskData.goal || "行政",
                timeType: (taskData.timeType?.toUpperCase() || "LONG") as any,
                timeValue: taskData.timeValue || 0,
                assignedToId: taskData.assigneeId || null,
                creatorId: creatorId || null,
                status: "PENDING",
                priority: "medium",
                startAt: taskData.startAt || null,
                dueAt: taskData.dueAt || null,
                orderDaily: taskData.orderDaily || 0,
              },
            });
            createdTasks.push(task);
          }

          return { project, tasks: createdTasks };
        });

        console.log("[tasks.action] Project created:", result.project.id, "with", result.tasks.length, "tasks");
        return json({ success: true, project: result.project, tasks: result.tasks });
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
