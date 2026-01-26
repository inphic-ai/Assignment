// api/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// 載入環境變數
dotenv.config();

// 導入路由
import projectRouter from './project';
import taskRouter from './task';
import aiRouter from './ai';

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// 健康檢查端點 (放在最前面，確保優先匹配)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API 路由
app.use('/api/projects', projectRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/ai', aiRouter);

// 靜態檔案服務 (Vite 編譯後的前端)
// 使用 process.cwd() 獲取工作目錄
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// SPA 路由回退 (所有非 API 路由都返回 index.html)
app.get('*', (req, res) => {
  // 如果是 API 路由但未匹配，返回 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // 否則返回前端 SPA
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
