# 前台新增任務持久化修復 - 驗收清單

## 🎯 修復目標

確保前台新增任務後，資料能正確持久化到 PostgreSQL 資料庫。

---

## ✅ 驗收步驟

### 1. 前端驗證（Chrome DevTools）

#### 步驟 1.1：檢查 Network 請求
1. 打開 Chrome DevTools → **Network** 標籤
2. 點擊「新增任務」按鈕
3. 填寫任務資訊並提交

**預期結果：**
- ✅ 應該看到 `POST https://assignment-production-11ac.up.railway.app/api/tasks` 請求
- ✅ Status Code: `201 Created`
- ✅ Request Payload 包含：
  ```json
  {
    "title": "任務標題",
    "description": "任務描述",
    "projectId": null,
    "assignedToId": null,
    "suggestedType": "MISC",
    "suggestedValue": 30,
    "status": "PENDING"
  }
  ```
- ✅ Response 包含：
  ```json
  {
    "id": "uuid",
    "title": "任務標題",
    "createdAt": "2026-01-26T...",
    "updatedAt": "2026-01-26T...",
    ...
  }
  ```

#### 步驟 1.2：檢查 Console 日誌
打開 Chrome DevTools → **Console** 標籤

**預期日誌：**
```
[api.createTask] Sending request: {...}
[api.createTask] Task created successfully: {...}
[handleCreateTasks] Creating task: {...}
[handleCreateTasks] Successfully created 1 task(s)
```

---

### 2. 後端驗證（Railway Logs）

#### 步驟 2.1：查看部署日誌
1. 前往 Railway Dashboard
2. 選擇 **Chronos** 專案
3. 點擊 **Deployments** 標籤
4. 查看最新部署的日誌

**預期日誌：**
```
[POST /api/tasks] Request body: {
  "title": "任務標題",
  "description": "任務描述",
  ...
}
[POST /api/tasks] Task created successfully: {
  "id": "uuid",
  "title": "任務標題",
  "createdAt": "2026-01-26T...",
  ...
}
```

#### 步驟 2.2：檢查錯誤處理
嘗試提交空標題的任務

**預期結果：**
- ✅ Status Code: `400 Bad Request`
- ✅ Response: `{ "error": "Title is required" }`
- ✅ 前端顯示 alert：「新增任務失敗：Title is required」

---

### 3. 資料庫驗證（Prisma Studio / SQL）

#### 方法 A：使用 Prisma Studio
```bash
cd /home/ubuntu/Assignment_opt
pnpm exec prisma studio
```

1. 打開 **Task** 表格
2. 確認新增的任務存在
3. 檢查欄位：
   - `id`: UUID
   - `title`: 任務標題
   - `description`: 任務描述
   - `status`: PENDING
   - `createdAt`: 時間戳
   - `updatedAt`: 時間戳

#### 方法 B：使用 SQL 查詢
```sql
SELECT * FROM "Task" ORDER BY "createdAt" DESC LIMIT 10;
```

**預期結果：**
- ✅ 可以看到剛剛新增的任務
- ✅ 所有欄位正確填寫

---

### 4. 持久化驗證（重新整理頁面）

#### 步驟 4.1：新增任務
1. 在前台新增一個任務
2. 記下任務標題

#### 步驟 4.2：重新整理頁面
按 `F5` 或 `Ctrl+R` 重新整理頁面

**預期結果：**
- ✅ 頁面重新載入後，任務仍然存在
- ✅ Console 顯示：`[App] Loaded from backend: { projectCount: X, taskCount: Y }`
- ✅ 任務資料與新增時一致

---

### 5. 錯誤處理驗證

#### 測試案例 5.1：空標題
1. 點擊「新增任務」
2. 不填寫標題，直接提交

**預期結果：**
- ✅ 前端顯示 alert：「請輸入戰略標題」（前端驗證）
- ✅ 如果繞過前端驗證，後端返回 400 錯誤

#### 測試案例 5.2：無效的 projectId
1. 修改前端程式碼，傳送不存在的 `projectId`
2. 提交任務

**預期結果：**
- ✅ Status Code: `400 Bad Request`
- ✅ Response: `{ "error": "Project not found" }`
- ✅ 前端顯示 alert：「新增任務失敗：Project not found」

#### 測試案例 5.3：網路錯誤
1. 關閉網路連線
2. 嘗試新增任務

**預期結果：**
- ✅ 前端顯示 alert：「新增任務失敗：Failed to fetch」
- ✅ Console 顯示錯誤訊息

---

## 📋 完整驗收清單

| 項目 | 狀態 | 說明 |
|------|------|------|
| **前端 API 呼叫** | ⬜ | DevTools Network 看到 POST /api/tasks |
| **API 回傳正確資料** | ⬜ | Response 包含 id, createdAt 等欄位 |
| **後端日誌記錄** | ⬜ | Railway Logs 顯示 request body 和結果 |
| **資料庫寫入** | ⬜ | Prisma Studio 或 SQL 可查詢到任務 |
| **持久化驗證** | ⬜ | 重新整理頁面後任務仍存在 |
| **錯誤處理 - 空標題** | ⬜ | 顯示明確錯誤訊息 |
| **錯誤處理 - 無效 ID** | ⬜ | 顯示明確錯誤訊息 |
| **錯誤處理 - 網路錯誤** | ⬜ | 顯示明確錯誤訊息 |

---

## 🐛 如果驗收失敗

### 問題 A：前端沒有發送 POST 請求
**檢查：**
1. `services/api.ts` 是否有 `createTask()` 方法
2. `App.tsx` 的 `handleCreateTasks()` 是否呼叫 `api.createTask()`
3. Console 是否有錯誤訊息

### 問題 B：API 返回 400/500 錯誤
**檢查：**
1. Railway Logs 中的錯誤訊息
2. Prisma schema 是否正確（projectId 和 categoryId 應為 optional）
3. 資料庫是否執行了 `prisma db push`

### 問題 C：資料庫查詢不到任務
**檢查：**
1. Railway Logs 是否顯示「Task created successfully」
2. DATABASE_URL 環境變數是否正確
3. Prisma Client 是否正確連線到資料庫

### 問題 D：重新整理後任務消失
**檢查：**
1. `App.tsx` 的 `useEffect()` 是否呼叫 `api.getTasks()`
2. Console 是否顯示「Loaded from backend」
3. 後端 `GET /api/tasks` 是否正常運作

---

## 📞 需要協助

如果驗收過程中遇到問題，請提供：
1. Chrome DevTools Network 截圖（包含 Request 和 Response）
2. Chrome DevTools Console 日誌
3. Railway Logs 相關錯誤訊息
4. 具體的操作步驟和預期結果

我會立即協助診斷和修復！
