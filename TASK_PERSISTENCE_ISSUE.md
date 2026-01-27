# 前台新增任務無法持久化問題診斷報告

## 問題定位

### ❌ **根本原因：前端沒有呼叫後端 API**

經過逐層檢查，發現問題出在 **第一層（前端）**：

1. **前端 API 服務層 (`services/api.ts`)** 
   - ✅ 有 `getProjects()` 方法
   - ✅ 有 `createProject()` 方法
   - ✅ 有 `updateTask()` 方法
   - ❌ **缺少 `createTask()` 方法**

2. **CreateTaskModal 組件**
   - ❌ 呼叫 `onCreate()` callback，但這只是更新前端 state
   - ❌ 沒有呼叫 `api.createTask()` 來持久化到資料庫

3. **App.tsx 的 handleCreateTasks**
   - ❌ 只更新 `setData(prev => ({ ...prev, tasks: [...prev.tasks, ...newTasks] }))`
   - ❌ 這是 **Optimistic UI**，但沒有實際的 API 呼叫

---

## 資料流分析

### 當前流程（錯誤）
```
用戶點擊「新增任務」
  ↓
CreateTaskModal.handleSubmitSingle()
  ↓
呼叫 onCreate([taskData])  ← 這只是 callback
  ↓
App.handleCreateTasks()
  ↓
setData(prev => ({ ...prev, tasks: [...prev.tasks, ...newTasks] }))  ← 只更新前端 state
  ↓
❌ 沒有呼叫後端 API
  ↓
重新整理頁面 → 任務消失
```

### 正確流程（應該）
```
用戶點擊「新增任務」
  ↓
CreateTaskModal.handleSubmitSingle()
  ↓
呼叫 api.createTask(taskData)  ← 呼叫後端 API
  ↓
後端 POST /api/tasks
  ↓
Prisma 寫入資料庫
  ↓
返回 { id, createdAt, ... }
  ↓
前端更新 state（使用後端返回的資料）
  ↓
✅ 重新整理頁面 → 任務仍存在
```

---

## 後端 API 檢查

### ✅ 後端 API 已正確實作

**路由：** `POST /api/tasks`  
**檔案：** `api/task.ts` (第 57-77 行)

```typescript
router.post('/', async (req, res) => {
  try {
    const { title, description, projectId, categoryId, suggestedType, suggestedValue } = req.body;

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        categoryId,
        suggestedType: suggestedType || 'MISC',
        suggestedValue: suggestedValue || 0,
        status: 'PENDING',
      },
    });
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});
```

**問題：**
- ⚠️ 後端 schema 要求 `projectId` 和 `categoryId` 是必填
- ⚠️ 但前端可能傳 `null`，會導致 Prisma 錯誤

---

## Schema 與前端資料不匹配

### Prisma Schema
```prisma
model Task {
  projectId     String      // ❌ 必填，不允許 null
  categoryId    String      // ❌ 必填，不允許 null
}
```

### 前端資料
```typescript
{
  projectId: selectedProjectId,  // 可能是 null
  // ❌ 沒有傳 categoryId
}
```

---

## 修復計劃

### 1. 前端修復
- [ ] 在 `services/api.ts` 新增 `createTask()` 方法
- [ ] 在 `App.tsx` 的 `handleCreateTasks()` 呼叫 API
- [ ] 實作完整的錯誤處理（顯示錯誤訊息給用戶）

### 2. 後端修復
- [ ] 修改 Prisma schema，允許 `projectId` 為 optional
- [ ] 修改 Prisma schema，允許 `categoryId` 為 optional（或提供預設值）
- [ ] 增強 API 日誌（記錄 request body）
- [ ] 增強錯誤處理（返回詳細錯誤訊息）

### 3. 驗證步驟
- [ ] 新增任務後，重新整理頁面仍存在
- [ ] 使用 Prisma Studio 或 SQL 查詢可以看到該筆 task
- [ ] API 回傳包含 `id`、`createdAt` 等欄位
- [ ] 失敗時 UI 顯示明確錯誤訊息

---

## 需要用戶驗證的點

### DevTools Network 檢查
1. 打開 Chrome DevTools → Network 標籤
2. 點擊「新增任務」
3. 確認是否有 `POST /api/tasks` 請求
   - ❌ 如果沒有 → 前端沒呼叫 API
   - ✅ 如果有 → 檢查 Request Payload 和 Response

### 後端日誌檢查
1. Railway 部署日誌中搜尋：
   - `[createTask]` 或 `POST /api/tasks`
   - 如果沒有 → API 沒收到請求
   - 如果有錯誤 → 檢查 Prisma 錯誤訊息

---

## 下一步

立即修復前端和後端程式碼。
