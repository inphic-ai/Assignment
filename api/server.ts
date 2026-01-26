// api/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 載入環境變數
dotenv.config();

// 導入路由
import projectRouter from './project.js';
import taskRouter from './task.js';
import aiRouter from './ai.js';

const app = express();
const PORT = process.env.PORT || 8080;

// ES Module 中獲取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../dist');

// 中間件
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// 1. API 路由 (優先匹配)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.1',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/projects', projectRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/ai', aiRouter);

// 2. 靜態檔案服務 (服務 assets, favicon 等)
app.use(express.static(distPath));

// 3. SPA 路由回退 (處理前端路由)
// 確保不攔截 API 請求
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// 全域錯誤處理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend served from ${distPath}`);
});

export default app;
