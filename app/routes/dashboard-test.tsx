import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { prisma } from "~/services/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    console.log("[dashboard-test] Starting loader...");
    
    // 測試 1: 基本資料庫連接
    const taskCount = await prisma.task.count();
    console.log("[dashboard-test] Task count:", taskCount);
    
    // 測試 2: 載入任務（不包含關聯）
    const tasks = await prisma.task.findMany({
      take: 5,
    });
    console.log("[dashboard-test] Tasks loaded:", tasks.length);
    
    // 測試 3: 載入任務（包含關聯）
    const tasksWithRelations = await prisma.task.findMany({
      include: {
        project: true,
        assignedTo: true,
        creator: true,
        category: true,
      },
      take: 5,
    });
    console.log("[dashboard-test] Tasks with relations loaded:", tasksWithRelations.length);
    
    return json({
      success: true,
      taskCount,
      tasks: tasksWithRelations.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        createdAt: task.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[dashboard-test] Error:", error);
    throw new Response(JSON.stringify({ 
      error: String(error),
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

export default function DashboardTest() {
  const data = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<{ currentUser: any; users: any[] }>();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard Test</h1>
      
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 p-4 rounded">
          <p className="font-semibold text-green-800">✅ Loader Success</p>
          <p className="text-sm text-green-600">Task count: {data.taskCount}</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
          <p className="font-semibold text-blue-800">Current User</p>
          <p className="text-sm text-blue-600">{currentUser.name} ({currentUser.role})</p>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 p-4 rounded">
          <p className="font-semibold text-gray-800">Tasks</p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1">
            {data.tasks.map((task: any) => (
              <li key={task.id}>
                {task.title} - {task.status}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
