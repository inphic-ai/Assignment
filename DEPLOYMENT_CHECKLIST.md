# Railway 部署檢查清單

## 部署前準備

- [x] 後端 API 代碼完成
- [x] Prisma Schema 定義完成
- [x] 環境變數配置完成 (在 Railway 上)
- [x] GitHub 代碼已推送

## Railway 部署步驟

1. **觸發新部署**
   - 在 Railway 儀表板上點擊 "Assignment" 服務
   - 點擊 "Deploy" 按鈕或等待自動部署

2. **監控建置進度**
   - 查看 "Build Logs" 標籤
   - 確認以下步驟成功：
     - ✅ `pnpm install` - 安裝依賴
     - ✅ `pnpm db:generate` - 生成 Prisma Client
     - ✅ `pnpm build` - 編譯前端
     - ✅ TypeScript 編譯後端代碼

3. **監控部署進度**
   - 查看 "Deploy Logs" 標籤
   - 確認以下步驟成功：
     - ✅ `pnpm db:migrate` - 執行資料庫遷移
     - ✅ `pnpm start` - 啟動 Express 伺服器

## 部署後驗證

### 1. 檢查健康狀態
```bash
curl https://assignment-production-11ac.up.railway.app/api/health
```

預期回應：
```json
{
  "status": "ok",
  "timestamp": "2026-01-26T..."
}
```

### 2. 測試 AI 拆解端點
```bash
curl -X POST https://assignment-production-11ac.up.railway.app/api/ai/breakdown \
  -H "Content-Type: application/json" \
  -d '{"description": "建立一個任務管理系統"}'
```

預期回應：
```json
{
  "tasks": [
    {
      "title": "需求分析",
      "description": "檢視相關文件",
      "suggestedType": "misc",
      "suggestedValue": 30,
      "suggestedGoal": "行政"
    },
    ...
  ]
}
```

### 3. 測試專案端點
```bash
curl https://assignment-production-11ac.up.railway.app/api/projects
```

預期回應：
```json
[
  {
    "id": "demo-project-001",
    "title": "示範專案",
    "description": "這是一個用於展示系統功能的示範專案",
    "status": "IN_PROGRESS",
    "ownerId": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

## 常見問題排查

### 問題 1: `pnpm install` 失敗
**原因**: `pnpm-lock.yaml` 與 `package.json` 不同步
**解決**: 已在本地重新生成 lock 檔案並推送

### 問題 2: 資料庫遷移失敗
**原因**: `DATABASE_URL` 環境變數未設定或連線字串錯誤
**檢查**: 在 Railway 儀表板確認 `DATABASE_URL` 已正確設定

### 問題 3: API 端點返回 500 錯誤
**原因**: 可能是 Prisma Client 未正確初始化
**檢查**: 查看 Deploy Logs 中的錯誤訊息

### 問題 4: Gemini API 返回 Mock 數據
**原因**: `API_KEY` 環境變數未設定
**檢查**: 在 Railway 儀表板確認 `API_KEY` 已正確設定

## 環境變數檢查清單

在 Railway 儀表板上確認以下環境變數已設定：

- [ ] `DATABASE_URL` - PostgreSQL 連線字串
- [ ] `API_KEY` - Google Gemini API 金鑰
- [ ] `SESSION_SECRET` - Session 加密密鑰
- [ ] `NODE_ENV` - 應設為 "production"
- [ ] `VITE_API_BASE` - 前端 API 基礎 URL (可選，預設為 `http://localhost:3000/api`)

## 前端配置

前端需要設定 `VITE_API_BASE` 環境變數指向後端 API：

```javascript
// 在 Railway 上應設為：
VITE_API_BASE=https://assignment-production-11ac.up.railway.app/api
```

## 回滾計畫

如果部署失敗，可以：

1. 查看 Build Logs 和 Deploy Logs 中的錯誤訊息
2. 在 GitHub 上檢查最新的 commit
3. 如需回滾，可以在 Railway 上選擇之前的部署版本

## 聯絡支援

如有問題，請：
1. 查看 Railway 儀表板的 Logs
2. 檢查 GitHub 的最新 commit
3. 提供錯誤訊息和 Logs 截圖
