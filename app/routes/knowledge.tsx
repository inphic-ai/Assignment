import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import KnowledgeBase from "~/components/KnowledgeBase";

export async function loader({ request }: LoaderFunctionArgs) {
  // 暫時使用空陣列，後續可以從資料庫載入知識庫資料
  const knowledgeItems: any[] = [];

  return json({
    knowledgeItems,
  });
}

export default function KnowledgeRoute() {
  const { knowledgeItems } = useLoaderData<typeof loader>();
  const { currentUser } = useOutletContext<{ currentUser: any; users: any[] }>();

  return (
    <KnowledgeBase
      items={knowledgeItems}
      currentUser={currentUser}
      onCreateItem={(item) => console.log("Create knowledge item:", item)}
      onUpdateItem={(id, updates) => console.log("Update knowledge item:", id, updates)}
      onDeleteItem={(id) => console.log("Delete knowledge item:", id)}
    />
  );
}
