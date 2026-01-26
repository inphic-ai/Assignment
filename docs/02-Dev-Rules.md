# 02｜Dev Rules

1. 職責分離與架構邊界
Server-Side Logic: 所有的資料庫查詢 (Postgres) 或 R2 互動必須保留在 .server.ts 結尾的檔案中。嚴禁在客戶端組件直接引入伺服器端套件。
Loader & Action: 遵循 Remix 慣例，資料讀取一律在 loader 處理，資料寫入 (CRUD) 一律透過 action 觸發，保持組件的純粹性。
AI Service: 呼叫 Gemini API 需封裝在 services/geminiService.ts 中，並嚴格遵守系統提供的「三維度拆解邏輯」(雜事/今日事/任務)。
2. UI/UX 視覺規範 (Aesthetics First)
Tailwind Only: 除非極其必要，否則不撰寫任何外部 CSS 檔案。使用系統定義的 stone (中性色) 與 orange/amber (行動色) 進行排版。
語義化命名: UI 變數應對應戰略系統主題，如 UI_TOKEN.H1 (標題)、UI_TOKEN.CARD (卡片)。
戰術風格: UI 文字應保持「專業、軍事、戰略感」，例如使用「部署」代替「建立」，「對齊基因」代替「資料過濾」。
3. 時間與維度規範 (核心業務邏輯)
雜事 (Misc): 預算單位必須為「分鐘」，限額為 < 60m。
今日事 (Daily): 預算單位必須為「小時」，範圍為 1-8h。
任務 (Long): 預算單位必須為「天」，範圍為 > 1 day。
案子 (Project): 視為上述三者的聚合容器。
二、 Git Commit 規範
建議採用 Conventional Commits 標準，並針對本系統加入「戰術範疇 (Scope)」標記。
格式
<type>(<scope>): <subject>
1. Type (類型)
feat: 新增戰略功能 (如：AI 腦暴功能、新的圖表)。
fix: 修復 Bug (如：計時器計算錯誤、排版跑版)。
docs: 文件更新。
style: 不影響程式邏輯的樣式更動 (Tailwind 類名調整)。
refactor: 程式碼重構 (不影響功能，僅優化架構)。
perf: 性能優化 (提升數據讀取速度)。
chore: 瑣事 (更新套件、環境設定)。
2. Scope (範疇 - 針對本系統定義)
ai: 關於 Gemini 提示詞、模型參數或拆解邏輯。
logic: 核心時間計算、超時判定邏輯。
ui: 佈局、按鈕樣式、動畫效果。
db: 伺服器端資料庫、R2 儲存、Loader/Action 邏輯。
auth: 角色權限、使用者切換器。

## 程式碼規範
- 禁止在前端組件中硬編碼 API Key。
- 必須實作 Zod 欄位驗證。