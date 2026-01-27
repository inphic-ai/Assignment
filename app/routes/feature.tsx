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
  const { currentUser } = useOutletContext<{ currentUser: any; users: any[] }>();

  return (
    <FeatureRequestCenter
      requests={featureRequests}
      currentUser={currentUser}
      onCreateRequest={(request) => console.log("Create feature request:", request)}
      onUpdateRequest={(id, updates) => console.log("Update feature request:", id, updates)}
      onDeleteRequest={(id) => console.log("Delete feature request:", id)}
    />
  );
}
