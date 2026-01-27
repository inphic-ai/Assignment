import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/services/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Server-side data loading from PostgreSQL
  const tasks = await prisma.task.findMany({
    include: {
      project: true,
      assignedTo: true,
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  const projects = await prisma.project.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const categories = await prisma.category.findMany();

  return json({
    tasks,
    projects,
    categories,
  });
}

export default function Index() {
  const { tasks, projects, categories } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Chronos 任務大師
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">任務總數</h2>
            <p className="text-3xl font-bold text-blue-600">{tasks.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">專案總數</h2>
            <p className="text-3xl font-bold text-green-600">{projects.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">分類總數</h2>
            <p className="text-3xl font-bold text-purple-600">{categories.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">最近任務</h2>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="font-semibold">{task.title}</h3>
                <p className="text-sm text-gray-600">{task.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>專案：{task.project?.title || "無"}</span>
                  <span>分類：{task.category?.name || "無"}</span>
                  <span>狀態：{task.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
