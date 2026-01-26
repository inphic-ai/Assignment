# 00｜Project Scope

- 專案名稱：Chronos 任務大師
- 架構類型：SPA + Express API

## 專案目標
Chronos 任務大師是一款以時間維度去切分任務的優先級順序


## 環境變數需求
1. 核心 AI 服務 (AI Context)
API_KEY:
用途：Google Gemini API 的存取密鑰。
規範：必須具備 gemini-3-flash-preview 與 gemini-3-pro-preview 的調用權限。
安全：此為私鑰，僅在伺服器端或經過安全處理的環境中使用。
2. 資料持久化 (Database & Cache)
DATABASE_URL:
格式：postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DB_NAME]?sslmode=require
用途：Postgres 主資料庫連線字串。
規範：負責儲存 Task、Project、Allocations 及 User 權限資料。
REDIS_URL (選配):
用途：用於處理高頻率的計時器（Timeline）同步與快取，降低資料庫負擔。
3. 雲端存儲 (Cloudflare R2 / S3 Compatible)
R2_ACCOUNT_ID:
用途：Cloudflare 帳號識別碼。
R2_BUCKET_NAME:
用途：儲存任務附件（影像、文件）的儲存桶名稱。
R2_ACCESS_KEY_ID & R2_SECRET_ACCESS_KEY:
用途：用於伺服器端生成 Presigned URL（簽名連結）的 API 憑證。
R2_PUBLIC_DOMAIN:
用途：附件存取的 CDN 域名（例如 pub-xxxx.r2.dev）。
4. 安全與認證 (Security & Auth)
SESSION_SECRET:
用途：Remix 用於加密 Cookie Session 的密鑰。
規範：建議使用至少 32 字元的隨機字串。
JWT_SECRET:
用途：若系統涉及跨服務調用（如後台 API 調用）時的身份驗證。
NODE_ENV:
規範：development | production | test。
5. 前端對外變數 (Client-side Exposed)
APP_URL:
用途：系統的主域名（例如 https://chronos.yourdomain.com），用於生成導流連結或公告分享。
維護建議 (Best Practices)
.env 檔案管理：
本地開發時，請建立 .env 檔案（此檔案需列入 .gitignore）。
提供一個 .env.example 模板，標註各變數的範例格式，但不包含實際數值。
變數驗證：
建議在 entry.server.tsx 或專門的 env.server.ts 中加入 Zod 驗證。如果啟動時遺漏關鍵變數（如 API_KEY 或 DATABASE_URL），系統應立即噴錯 (Throw Error) 並停止服務，防止運行時產生不可預期的行為。
敏感度處理：
在 Remix 的 loader 中，切記不要將 process.env 完整傳回 json()。僅挑選必要的 APP_URL 或 R2_PUBLIC_DOMAIN 傳給前端，其餘私鑰（Secrets）應嚴格鎖死在伺服器端。