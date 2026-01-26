import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// 載入環境變數
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 設定 CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://your-railway-domain.com' : '*', // 在生產環境中請替換為您的實際網域
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// 設定 JSON 解析
app.use(express.json());

// ----------------------------------------------------------------
// 1. Gemini API Proxy 路由
// ----------------------------------------------------------------
import { breakdownProjectTask } from './services/geminiService';

app.post('/api/ai/breakdown', async (req: Request, res: Response) => {
  try {
    const { projectDescription } = req.body;
    if (!projectDescription) {
      return res.status(400).json({ error: 'Missing projectDescription in request body.' });
    }

    // 檢查 API Key 是否存在於伺服器環境變數中
    if (!process.env.API_KEY) {
      console.error('API_KEY is not set in server environment.');
      return res.status(500).json({ error: 'AI service is not configured on the server.' });
    }

    // 呼叫原本的 Gemini 服務邏輯
    const result = await breakdownProjectTask(projectDescription);
    
    // 成功後回傳結果
    res.json(result);

  } catch (error) {
    console.error('Error during AI breakdown:', error);
    res.status(500).json({ error: 'Failed to process AI request.' });
  }
});

// ----------------------------------------------------------------
// 2. 資料庫 API 路由
// ----------------------------------------------------------------
import projectRoutes from './api/project';
// import taskRoutes from './api/task'; // 任務路由待實作

app.use('/api/projects', projectRoutes);
// app.use('/api/tasks', taskRoutes);
// ... 等等

// ----------------------------------------------------------------
// 3. 靜態檔案服務 (用於部署前端)
// ----------------------------------------------------------------
if (process.env.NODE_ENV === 'production') {
  // 假設前端 build 結果在 dist 資料夾
  const frontendPath = path.join(__dirname, 'dist');
  app.use(express.static(frontendPath));

  // 處理 SPA 路由，將所有未匹配的請求導向 index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
