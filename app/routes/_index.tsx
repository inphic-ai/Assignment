import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  // 獲取 URL 參數
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") || "u1";
  
  // 重定向到戰情室頁面，並保留 userId 參數
  return redirect(`/dashboard?userId=${userId}`);
}

export default function Index() {
  // 這個元件不會被渲染，因為會直接重定向
  return null;
}
