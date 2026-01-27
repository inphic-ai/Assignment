import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Form, useFetcher } from "@remix-run/react";
import { prisma } from "~/services/db.server";

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
  const fetcher = useFetcher();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">任務管理</h1>
          <a
            href="/"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            返回首頁
          </a>
        </div>

        {/* 新增任務表單 */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-2xl font-semibold mb-4">新增任務</h2>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="create" />
            
            <div>
              <label className="block text-sm font-medium mb-2">任務標題 *</label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-3 py-2 border rounded"
                placeholder="輸入任務標題"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">任務描述</label>
              <textarea
                name="description"
                rows={3}
                className="w-full px-3 py-2 border rounded"
                placeholder="輸入任務描述"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">專案</label>
                <select name="projectId" className="w-full px-3 py-2 border rounded">
                  <option value="">無</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">分類</label>
                <select name="categoryId" className="w-full px-3 py-2 border rounded">
                  <option value="">無</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">指派給</label>
                <select name="assignedToId" className="w-full px-3 py-2 border rounded">
                  <option value="">無</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              新增任務
            </button>
          </Form>
        </div>

        {/* 任務列表 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">所有任務 ({tasks.length})</h2>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="border-l-4 border-blue-500 pl-4 py-3 flex justify-between items-start"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{task.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>專案：{task.project?.title || "無"}</span>
                    <span>分類：{task.category?.name || "無"}</span>
                    <span>指派：{task.assignedTo?.name || "無"}</span>
                    <span className="font-semibold">狀態：{task.status}</span>
                  </div>
                </div>

                <fetcher.Form method="post" className="ml-4">
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="id" value={task.id} />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    刪除
                  </button>
                </fetcher.Form>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
