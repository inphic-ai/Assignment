// services/geminiService.ts
// 此服務現在作為後端 API 的代理，不再直接調用 Gemini API
const API_BASE = process.env.VITE_API_BASE || 'http://localhost:3000/api';
/**
 * 使用後端 API 調用 Gemini AI 拆解專案任務
 * API Key 安全地存放在後端，不會暴露給前端
 */
export const breakdownProjectTask = async (projectDescription) => {
    try {
        const response = await fetch(`${API_BASE}/ai/breakdown`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ description: projectDescription }),
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.tasks || [];
    }
    catch (error) {
        console.error('Error calling AI breakdown API:', error);
        // 降級：返回 Mock 數據
        return [
            { title: '需求分析', description: '檢視相關文件', suggestedType: 'misc', suggestedValue: 30, suggestedGoal: '行政' },
            { title: '草擬提案', description: '建立初步草案', suggestedType: 'daily', suggestedValue: 4, suggestedGoal: '管理' },
            { title: '執行階段', description: '核心開發與實作', suggestedType: 'long', suggestedValue: 3, suggestedGoal: '維修' },
        ];
    }
};
