# Remix Server-first 架構 - 最終驗收清單

**日期**: 2026-01-27  
**狀態**: 等待驗證

---

## 🎯 Remix Server-first 架構驗收

### Phase 1：資料庫實體化 ✅

| 檢查項目 | 狀態 | 驗證方式 |
|----------|------|----------|
| Migration 可執行 | ✅ | `prisma db push` 成功 |
| Seed 可執行 | ✅ | `pnpm run db:seed` 成功 |
| Seed 冪等性 | ✅ | 可重複執行不報錯 |
| DB 資料筆數 > 0 | ✅ | 18 筆記錄（8 categories, 6 users, 2 projects, 2 tasks） |
| 輸出 "✅ Seeding Completed" | ✅ | 已確認 |

---

### Phase 2：Remix Server-first（Loader / Action） ✅

| 檢查項目 | 狀態 | 驗證方式 |
|----------|------|----------|
| Remix 核心檔案 | ✅ | entry.client/server, root.tsx |
| Vite Plugin 配置 | ✅ | vite.config.ts 使用 @remix-run/dev |
| 首頁 Loader | ✅ | app/routes/_index.tsx 從 PostgreSQL 讀取 |
| 任務管理 Loader | ✅ | app/routes/tasks.tsx 讀取 tasks, projects, categories, users |
| 任務管理 Action | ✅ | 支援 create, update, delete |
| useLoaderData | ✅ | 組件使用 Loader 傳遞的資料 |
| Remix Form | ✅ | 使用 `<Form method="post">` |

---

### Phase 3：前端切換（移除 Mock / API Client） ✅

| 檢查項目 | 狀態 | 驗證方式 |
|----------|------|----------|
| 移除 SPA 入口 | ✅ | index.tsx, index.html, App.tsx 已移除 |
| 移除 Express API | ✅ | api/server.ts, api/*.ts 已移除 |
| 移除 API Client | ✅ | services/api.ts 已移除 |
| 移除舊組件 | ✅ | components/*.tsx 已移除（已複製到 app/） |
| 切換 Vite 配置 | ✅ | vite.config.ts 改為 Remix |
| 切換 TypeScript 配置 | ✅ | tsconfig.json 改為 Remix |
| 更新 package.json | ✅ | scripts 改為 Remix |

---

## 🚫 禁止事項驗證

### ❌ 不可在 Client 端呼叫 API

**驗證方式：**
1. 打開 Chrome DevTools → Network
2. 訪問首頁和任務管理頁面
3. **確認：** 無 `/api/*` 請求

**預期結果：**
- ✅ 只有 HTML 文件請求（SSR）
- ✅ 只有靜態資源請求（CSS, JS）
- ❌ 無 `/api/tasks` 等 API 請求

---

### ❌ 不可在 Loader/Action 之外存取 DB

**驗證方式：**
```bash
# 搜尋是否有在組件中直接使用 Prisma
grep -r "import.*prisma" app/components/
```

**預期結果：**
- ❌ 組件中不應該有 `import { prisma }` 或 `import prisma`

---

### ❌ 不可使用 Mock 資料

**驗證方式：**
```bash
# 搜尋是否有 Mock 資料
grep -r "MOCK_" app/
```

**預期結果：**
- ❌ 不應該有 `MOCK_USERS`, `MOCK_TASKS` 等變數

---

## ✅ 功能驗收

### 1. 首頁顯示統計

**測試步驟：**
1. 訪問 http://localhost:5173/
2. 確認顯示：
   - 任務總數
   - 專案總數
   - 分類總數
   - 最近任務列表

**預期結果：**
- ✅ 所有資料來自 PostgreSQL
- ✅ 重新整理後資料一致

---

### 2. 任務管理（CRUD）

#### 新增任務

**測試步驟：**
1. 訪問 http://localhost:5173/tasks
2. 填寫表單：
   - 任務標題：「測試任務」
   - 任務描述：「這是一個測試」
   - 選擇專案、分類、指派人（可選）
3. 點擊「新增任務」

**預期結果：**
- ✅ 頁面重新載入
- ✅ 新任務出現在列表中
- ✅ 重新整理後任務仍存在
- ✅ Network 標籤顯示 `POST /tasks`

**DB 驗證：**
```sql
SELECT * FROM "Task" WHERE title = '測試任務';
```
- ✅ 資料庫中存在該任務

---

#### 刪除任務

**測試步驟：**
1. 在任務列表中點擊「刪除」按鈕
2. 確認任務從列表中消失

**預期結果：**
- ✅ 任務立即從 UI 中移除
- ✅ 重新整理後任務不再出現
- ✅ Network 標籤顯示 `POST /tasks` (intent=delete)

**DB 驗證：**
```sql
SELECT * FROM "Task" WHERE id = '<deleted_task_id>';
```
- ✅ 資料庫中不存在該任務

---

### 3. 資料持久化

**測試步驟：**
1. 新增一個任務
2. 關閉瀏覽器
3. 重新打開瀏覽器並訪問 http://localhost:5173/tasks

**預期結果：**
- ✅ 任務仍然存在

---

### 4. 錯誤處理

**測試步驟：**
1. 嘗試新增一個沒有標題的任務
2. 提交表單

**預期結果：**
- ✅ 瀏覽器顯示「請填寫此欄位」（HTML5 驗證）
- ✅ 或伺服器返回 400 錯誤

---

## 🚀 部署驗收（Railway）

### 1. 自動部署

**驗證方式：**
1. 推送到 GitHub
2. 前往 Railway Dashboard
3. 查看部署日誌

**預期結果：**
- ✅ Railway 自動觸發部署
- ✅ 執行 `pnpm install`
- ✅ 執行 `prisma generate`
- ✅ 執行 `pnpm run build`
- ✅ 啟動 `pnpm run start`

---

### 2. 生產環境測試

**測試步驟：**
1. 訪問 Railway 提供的 URL
2. 測試首頁和任務管理功能
3. 新增一個任務
4. 重新整理頁面

**預期結果：**
- ✅ 首頁正常顯示
- ✅ 任務管理正常運作
- ✅ 新增任務成功
- ✅ 重新整理後任務仍存在

---

### 3. 環境變數檢查

**驗證方式：**
1. 前往 Railway Dashboard → Variables
2. 確認存在：
   - `DATABASE_URL`
   - `NODE_ENV=production`

**預期結果：**
- ✅ 所有必要環境變數已設定

---

## 📊 最終檢查清單

| 項目 | 狀態 | 說明 |
|------|------|------|
| **Phase 1 完成** | ✅ | 資料庫實體化與 Seed |
| **Phase 2 完成** | ✅ | Remix Loader/Action |
| **Phase 3 完成** | ✅ | 移除 SPA 和 Express API |
| **無 Mock 資料** | ⏳ | 待驗證 |
| **無 Client API 呼叫** | ⏳ | 待驗證 |
| **無 DB 直接存取** | ⏳ | 待驗證 |
| **任務持久化** | ⏳ | 待驗證 |
| **CRUD 功能** | ⏳ | 待驗證 |
| **生產環境** | ⏳ | 待 Railway 部署完成 |

---

## 🎓 Remix Server-first 驗證

### 資料流驗證

```
瀏覽器請求 → Remix Loader（Server）→ PostgreSQL
                    ↓
                  JSON
                    ↓
            useLoaderData（Client）
                    ↓
                  UI 渲染
```

**驗證方式：**
1. 打開 Chrome DevTools → Network
2. 訪問首頁
3. 查看 HTML 文件內容

**預期結果：**
- ✅ HTML 中包含完整的資料（SSR）
- ✅ 無需等待 Client-side fetch

---

### 表單提交驗證

```
表單提交 → Remix Action（Server）→ PostgreSQL
                    ↓
                重新載入 Loader
                    ↓
                  UI 更新
```

**驗證方式：**
1. 打開 Chrome DevTools → Network
2. 新增一個任務
3. 查看 Network 請求

**預期結果：**
- ✅ 看到 `POST /tasks` 請求
- ✅ 返回 302 Redirect 或 200 OK
- ✅ 頁面重新載入並顯示新任務

---

## ✅ 驗收通過標準

### 必須全部通過：

1. ⏳ 無 `/api/*` 請求
2. ⏳ 無 Mock 資料
3. ⏳ 無組件中直接使用 Prisma
4. ⏳ 新增任務後重新整理仍存在
5. ⏳ DB 查詢可以看到任務
6. ⏳ 刪除任務後 DB 中不存在
7. ⏳ 生產環境正常運作

---

**最後更新**: 2026-01-27 GMT+8  
**下一次驗證**: 等待 Railway 部署完成
