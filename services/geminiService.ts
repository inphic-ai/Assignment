
import { GoogleGenAI, Type } from "@google/genai";
import { TimeType, GoalCategory } from "../types";

// Define the schema for the breakdown response
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

export interface BreakdownResult {
  title: string;
  description: string;
  suggestedType: TimeType;
  suggestedValue: number;
  suggestedGoal: GoalCategory;
}

export const breakdownProjectTask = async (
  projectDescription: string
): Promise<BreakdownResult[]> => {
  if (!process.env.API_KEY) {
    console.warn("API Key not found. Returning mock data.");
    return [
      { title: "需求分析", description: "檢視相關文件", suggestedType: "misc", suggestedValue: 30, suggestedGoal: "行政" },
      { title: "草擬提案", description: "建立初步草案", suggestedType: "daily", suggestedValue: 4, suggestedGoal: "管理" },
      { title: "執行階段", description: "核心開發與實作", suggestedType: "long", suggestedValue: 3, suggestedGoal: "維修" },
    ];
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Break down the following project description into smaller, actionable tasks in Traditional Chinese (繁體中文).
      For each task, suggest a Time Type ('misc' for < 60 mins, 'daily' for < 8 hours, 'long' for > 1 day) 
      and a Value (minutes for misc, hours for daily, days for long).
      Also suggest a Goal Category strictly from this list: 業務, 人資, 管理, 倉儲, 維修, 行銷, 售後, 行政.
      
      Project Description: "${projectDescription}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: breakdownSchema,
        systemInstruction: "You are a project manager assistant. Break down vague requirements into concrete tasks. Output language must be Traditional Chinese (繁體中文).",
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as BreakdownResult[];
    }
    return [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
