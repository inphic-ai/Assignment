// api/ai.ts
import { Router } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const router = Router();

// 定義 Gemini 回應的 Schema
const breakdownSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      suggestedType: { type: Type.STRING, enum: ['misc', 'daily', 'long'] },
      suggestedValue: { type: Type.NUMBER },
      suggestedGoal: { type: Type.STRING, enum: ['業務', '人資', '管理', '倉儲', '維修', '行銷', '售後', '行政'] },
    },
    required: ['title', 'description', 'suggestedType', 'suggestedValue', 'suggestedGoal'],
  },
};

// POST /api/ai/breakdown - 使用 Gemini AI 拆解專案任務
router.post('/breakdown', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid description' });
    }

    // 從環境變數讀取 API Key（安全：只在後端存取）
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.warn('API_KEY not found. Returning mock data.');
      // 降級：返回 Mock 數據
      return res.json({
        tasks: [
          { title: '需求分析', description: '檢視相關文件', suggestedType: 'misc', suggestedValue: 30, suggestedGoal: '行政' },
          { title: '草擬提案', description: '建立初步草案', suggestedType: 'daily', suggestedValue: 4, suggestedGoal: '管理' },
          { title: '執行階段', description: '核心開發與實作', suggestedType: 'long', suggestedValue: 3, suggestedGoal: '維修' },
        ],
      });
    }

    // 初始化 Gemini AI
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Break down the following project description into smaller, actionable tasks in Traditional Chinese (繁體中文).
      For each task, suggest a Time Type ('misc' for < 60 mins, 'daily' for < 8 hours, 'long' for > 1 day) 
      and a Value (minutes for misc, hours for daily, days for long).
      Also suggest a Goal Category strictly from this list: 業務, 人資, 管理, 倉儲, 維修, 行銷, 售後, 行政.
      
      Project Description: "${description}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: breakdownSchema,
        systemInstruction: 'You are a project manager assistant. Break down vague requirements into concrete tasks. Output language must be Traditional Chinese (繁體中文).',
      },
    });

    if (response.text) {
      const tasks = JSON.parse(response.text);
      return res.json({ tasks });
    }

    return res.json({ tasks: [] });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: 'Failed to process AI request' });
  }
});

export default router;
