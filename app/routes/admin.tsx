import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { prisma } from "~/services/db.server";
import AdminCenter from "~/components/AdminCenter";

export async function loader({ request }: LoaderFunctionArgs) {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const projects = await prisma.project.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return json({
    users,
    projects,
    categories,
  });
}

export default function AdminRoute() {
  const { users, projects, categories } = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<{ currentUser: any; users: any[] }>();

  // 檢查權限
  if (currentUser.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-800 mb-2">權限不足</h2>
          <p className="text-stone-500">您沒有權限訪問此頁面</p>
        </div>
      </div>
    );
  }

  return (
    <AdminCenter
      users={users}
      projects={projects}
      categories={categories}
      currentUser={currentUser}
      onCreateUser={(user) => console.log("Create user:", user)}
      onUpdateUser={(id, updates) => console.log("Update user:", id, updates)}
      onDeleteUser={(id) => console.log("Delete user:", id)}
      onCreateCategory={(category) => console.log("Create category:", category)}
      onUpdateCategory={(id, updates) => console.log("Update category:", id, updates)}
      onDeleteCategory={(id) => console.log("Delete category:", id)}
    />
  );
}
