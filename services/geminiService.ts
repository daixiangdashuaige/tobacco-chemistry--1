import { GoogleGenAI } from "@google/genai";
import { Question } from "../types";

// Initialize the client with the API key from environment variables
// Note: In a real production app, ensure this is handled securely or via a backend proxy.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIExplanation = async (
  question: Question,
  userSelectedOptionIndex: number
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const userOptionText = question.options[userSelectedOptionIndex];
    const correctOptionText = question.options[question.answer];

    const prompt = `
      作为一个专业的全能助教，请分析这道题目。
      
      题目: "${question.question}"
      
      用户选择的错误选项: "${userOptionText}"
      正确选项: "${correctOptionText}"
      
      请用通俗易懂的中文：
      1. 解释为什么用户的选择是错误的。
      2. 解释为什么正确选项是对的。
      3. 给出记忆技巧或补充知识点。
      
      保持简洁，不超过150字。
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "AI暂时无法生成解析，请稍后再试。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI解析服务连接失败，请检查网络或API Key配置。";
  }
};