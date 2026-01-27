import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import FeatureRequestCenter from "~/components/FeatureRequestCenter";

export async function loader({ request }: LoaderFunctionArgs) {
  // 暫時使用空陣列，後續可以從資料庫載入功能建議資料
  const featureRequests: any[] = [];

  return json({
    featureRequests,
  });
}

export default function FeatureRequestRoute() {
  const { featureRequests } = useLoaderData<typeof loader>();
  const { currentUser, users } = useOutletContext<{ currentUser: any; users: any[] }>();

  // 建構 AppState 物件以符合組件期望
  const appState = {
    currentUser,
    users,
    featureRequests,
    tasks: [],
    projects: [],
    categories: [],
    allocations: [],
    routineTemplates: [],
  };

  return (
    <FeatureRequestCenter
      data={appState}
      onCreateRequest={(request) => console.log("Create feature request:", request)}
    />
  );
}
