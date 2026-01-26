
import { AppState, Task, TaskAllocation } from '../types';

/**
 * 此 Service 模擬前端呼叫 Remix 後端 API 的行為
 * 當您切換到真正的 Remix 時，這些 function 會被替換為 fetch('/api/...')
 */
export const api = {
  // 模擬 Remix Loader: 獲取全域狀態
  async loadAppState(): Promise<Partial<AppState>> {
    // 實務上會從 Postgres 讀取
    const saved = localStorage.getItem('chronos_data_v18');
    return saved ? JSON.parse(saved) : {};
  },

  // 模擬 Remix Action: 更新任務狀態
  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    console.log(`[API Action] 更新任務 ${id} 至資料庫`);
    // 在後端，這裡會呼叫 db.server.ts
  },

  // 模擬 R2 附件獲取
  async getAttachmentUrl(fileKey: string): Promise<string> {
    // 這是一個典型的簽名 URL 獲取流程
    return `/api/storage/sign?key=${encodeURIComponent(fileKey)}`;
  }
};
