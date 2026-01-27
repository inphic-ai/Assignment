// services/geminiService.ts
// Gemini AI 服務 - 用於任務拆解功能

export interface BreakdownResult {
  title: string;
  description: string;
  suggestedType: 'misc' | 'daily' | 'long';
  suggestedValue: number;
  suggestedGoal: string;
}

/**
 * 使用 Gemini AI 拆解專案任務
 * 注意：此功能需要在 server-side 實作，目前暫時返回 mock 資料
 */
export const breakdownProjectTask = async (
  projectDescription: string
): Promise<BreakdownResult[]> => {
  try {
    // TODO: 實作 Remix action 來處理 AI 請求
    // 目前返回 mock 資料作為降級方案
    console.warn('AI breakdown not implemented yet, returning mock data');
    
    return [
      {
        title: '需求分析',
        description: '檢視相關文件與需求',
        suggestedType: 'misc',
        suggestedValue: 30,
        suggestedGoal: '行政',
      },
      {
        title: '草擬提案',
        description: '建立初步草案',
        suggestedType: 'daily',
        suggestedValue: 4,
        suggestedGoal: '管理',
      },
      {
        title: '執行階段',
        description: '核心開發與實作',
        suggestedType: 'long',
        suggestedValue: 3,
        suggestedGoal: '維修',
      },
    ];
  } catch (error) {
    console.error('Error in AI breakdown:', error);
    // 降級：返回基本任務結構
    return [
      {
        title: '任務 1',
        description: '請描述任務內容',
        suggestedType: 'daily',
        suggestedValue: 1,
        suggestedGoal: '管理',
      },
    ];
  }
};
