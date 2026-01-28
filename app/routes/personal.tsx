import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { prisma } from "~/services/db.server";
import PersonalDashboard from "~/components/PersonalDashboard";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") || "u1";

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { assignedToId: userId },
        {
          assignments: {
            some: {
              assigneeId: userId,
            },
          },
        },
      ],
    },
    include: {
      project: true,
      assignedTo: true,
      category: true,
      assignments: {
        include: {
          assignee: true,
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

  const allocations: any[] = [];

  return json({
    tasks,
    projects,
    users,
    allocations,
  });
}
