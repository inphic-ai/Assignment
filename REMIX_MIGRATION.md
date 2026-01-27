# Remix 架構遷移指南

## 📁 專案結構

```
app/                          # Remix 應用目錄
├── entry.client.tsx          # 客戶端入口（Hydration）
├── entry.server.tsx          # 伺服器端入口（SSR）
├── root.tsx                  # 根組件（HTML 結構）
├── routes/                   # 路由目錄
│   ├── _index.tsx            # 首頁（/）
│   └── tasks.tsx             # 任務管理（/tasks）
├── components/               # React 組件
├── services/                 # 服務層
│   └── db.server.ts          # Prisma Client（Server-only）
├── types.ts                  # TypeScript 類型定義
└── constants.ts              # 常數定義

配置檔案：
├── vite.config.remix.ts      # Remix Vite 配置
├── tsconfig.remix.json       # TypeScript 配置
└── remix.config.js           # Remix 配置
```

---

## 🚀 啟動方式

### 開發模式（Remix）
```bash
pnpm run dev:remix
```

### 建置（Remix）
```bash
pnpm run build:remix
```

### 生產模式（Remix）
```bash
pnpm run start:remix
```

---

## 🎯 Remix Server-first 架構

### 1. Loader（資料讀取）

所有資料讀取必須在 **Server-side Loader** 中完成：

```typescript
// app/routes/_index.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const tasks = await prisma.task.findMany({
    include: {
      project: true,
      assignedTo: true,
      category: true,
    },
  });

  return json({ tasks });
}
```

### 2. Action（資料寫入）

所有資料寫入必須透過 **Server-side Action**：

```typescript
// app/routes/tasks.tsx
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const task = await prisma.task.create({
      data: {
        title: formData.get("title") as string,
        // ...
      },
    });
    return json({ success: true, task });
  }
}
```

### 3. UI 組件（使用 Loader 資料）

```typescript
export default function Index() {
  const { tasks } = useLoaderData<typeof loader>();

  return (
    <div>
      {tasks.map((task) => (
        <div key={task.id}>{task.title}</div>
      ))}
    </div>
  );
}
```

### 4. 表單提交（使用 Remix Form）

```typescript
<Form method="post">
  <input type="hidden" name="intent" value="create" />
  <input type="text" name="title" required />
  <button type="submit">新增任務</button>
</Form>
```

---

## ✅ 已實作的路由

| 路由 | 檔案 | Loader | Action | 說明 |
|------|------|--------|--------|------|
| `/` | `app/routes/_index.tsx` | ✅ | ❌ | 首頁（顯示統計） |
| `/tasks` | `app/routes/tasks.tsx` | ✅ | ✅ | 任務管理（CRUD） |

---

## 🔒 Server-only 模組

所有包含 `.server` 的檔案只會在伺服器端執行：

- `app/services/db.server.ts` - Prisma Client
- 未來可新增：`app/services/auth.server.ts`, `app/services/email.server.ts`

---

## 🚫 禁止事項

### ❌ 不可在 Client 端直接呼叫 API

```typescript
// ❌ 錯誤：在組件中 fetch API
useEffect(() => {
  fetch('/api/tasks').then(res => res.json());
}, []);
```

### ❌ 不可在 Loader/Action 之外存取 DB

```typescript
// ❌ 錯誤：在組件中直接使用 Prisma
import { prisma } from '~/services/db.server';

export default function MyComponent() {
  const data = await prisma.task.findMany(); // 錯誤！
}
```

### ✅ 正確做法

```typescript
// ✅ 正確：在 Loader 中讀取資料
export async function loader() {
  const data = await prisma.task.findMany();
  return json({ data });
}

export default function MyComponent() {
  const { data } = useLoaderData<typeof loader>();
  return <div>{/* 使用 data */}</div>;
}
```

---

## 📊 Phase 2 完成狀態

| 項目 | 狀態 | 說明 |
|------|------|------|
| Remix 核心架構 | ✅ | entry, root, routes |
| Vite Plugin 配置 | ✅ | vite.config.remix.ts |
| Prisma 整合 | ✅ | db.server.ts |
| 首頁 Loader | ✅ | 從 PostgreSQL 讀取資料 |
| 任務管理 Loader | ✅ | 讀取 tasks, projects, categories, users |
| 任務管理 Action | ✅ | 新增、更新、刪除任務 |
| 組件遷移 | ✅ | 複製到 app/components/ |

---

## 🔄 下一步（Phase 3）

1. 移除舊的 Express API（`api/server.ts`）
2. 移除前端 API Client（`services/api.ts`）
3. 將 App.tsx 的 Mock 資料邏輯移除
4. 實作完整的 Dashboard 路由
5. 實作 Projects 路由
6. 更新 Railway 部署配置

---

## 📝 測試方式

### 1. 啟動 Remix 開發伺服器

```bash
pnpm run dev:remix
```

### 2. 訪問路由

- 首頁：http://localhost:5173/
- 任務管理：http://localhost:5173/tasks

### 3. 測試任務新增

1. 訪問 `/tasks`
2. 填寫表單並提交
3. 重新整理頁面，確認任務仍存在

### 4. 檢查 Network 標籤

- ✅ 應該看到 HTML 文件請求（SSR）
- ✅ 應該看到 POST /tasks 請求（Action）
- ❌ 不應該看到 `/api/*` 請求

---

## 🎓 Remix 核心概念

### Server-first 架構

> "資料必須來自資料庫，UI 只是資料的反映"

- **Loader：** 在伺服器端讀取資料，傳遞給組件
- **Action：** 在伺服器端處理表單提交和資料變更
- **useLoaderData：** 在組件中獲取 Loader 傳遞的資料
- **Form / useFetcher：** 提交表單到 Action

### 資料流

```
瀏覽器請求 → Remix Loader（Server）→ PostgreSQL
                    ↓
                  JSON
                    ↓
            useLoaderData（Client）
                    ↓
                  UI 渲染
```

```
表單提交 → Remix Action（Server）→ PostgreSQL
                    ↓
                重新載入 Loader
                    ↓
                  UI 更新
```

---

## 📚 參考資源

- [Remix 官方文件](https://remix.run/docs)
- [Remix Vite Plugin](https://remix.run/docs/en/main/future/vite)
- [Prisma with Remix](https://www.prisma.io/docs/guides/other/remix)
