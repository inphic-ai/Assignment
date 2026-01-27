import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import AnnouncementCenter from "~/components/AnnouncementCenter";

export async function loader({ request }: LoaderFunctionArgs) {
  // 暫時使用空陣列，後續可以從資料庫載入公告資料
  const announcements: any[] = [];

  return json({
    announcements,
  });
}

export default function AnnouncementRoute() {
  const { announcements } = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<{ currentUser: any; users: any[] }>();

  return (
    <AnnouncementCenter
      announcements={announcements}
      currentUser={currentUser}
      onCreateAnnouncement={(announcement) => console.log("Create announcement:", announcement)}
      onUpdateAnnouncement={(id, updates) => console.log("Update announcement:", id, updates)}
      onDeleteAnnouncement={(id) => console.log("Delete announcement:", id)}
      onMarkAsRead={(id) => console.log("Mark announcement as read:", id)}
    />
  );
}
