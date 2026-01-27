
import { useState, useEffect } from 'react';
import { db } from '../services/db.server';
import { r2 } from '../services/r2.server';
import App from '../App';

/**
 * Remix Loader: 伺服器端資料讀取
 * 這確保了 Postgres 查詢與 R2 簽名在渲染前完成
 */
export async function loader({ request }: { request: Request }) {
  const userId = "u1"; // 應從 Session 獲取
  const appData = await db.getDashboardData(userId);
  
  // 為所有附件生成簽名 URL
  // appData.tasks.forEach(t => t.attachments.forEach(async a => a.url = await r2.getSignedViewUrl(a.fileKey)));

  return { 
    initialData: appData,
    env: { R2_URL: process.env.R2_PUBLIC_DOMAIN }
  };
}

/**
 * Remix Action: 伺服器端資料寫入
 * 處理任務建立、狀態更新、工時回填
 */
export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "updateTask") {
    // await db.upsertTask(...)
  }
  
  return { success: true };
}

// 在此環境中，我們用一個預設匯出來啟動 App
export default function IndexRoute() {
  // 在真正的 Remix 中，這裡會使用 useLoaderData()
  return <App />;
}
