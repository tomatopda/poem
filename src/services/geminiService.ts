/*
// AI 功能已移除，此文件暂时保留作为占位符，防止其他文件引用报错。
// 如果您确定其他文件（如 Editor.tsx）已删除了对本文件的引用，可以直接删除此文件。

import { GoogleGenAI, Type } from "@google/genai";
import { PoemAnalysis } from "../types";

const GEMINI_API_KEY = process.env.API_KEY || '';

// Mock return if no key provided to prevent crashing in demo mode, 
// though strictly we should use the key.
const hasKey = !!GEMINI_API_KEY;

export const analyzePoem = async (title: string, content: string): Promise<PoemAnalysis> => {
  if (!hasKey) {
    console.warn("No API Key provided. Returning mock analysis.");
    return {
      mood: "宁静",
      commentary: "请在代码环境中配置 process.env.API_KEY 以获取 Google Gemini 的实时诗歌赏析。",
      suggestedTags: ["演示", "诗歌", "需配置Key"]
    };
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const prompt = `
    请作为一位资深的文学评论家，分析以下这首诗。
    
    标题：${title}
    内容：
    ${content}
    
    请返回JSON格式，包含以下字段：
    - mood: 用一个词形容诗歌的意境（如：苍凉、明快、恬淡）。
    - commentary: 50字以内的短评，赏析诗歌的意境或用词。
    - suggestedTags: 3个相关的标签。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood: { type: Type.STRING },
            commentary: { type: Type.STRING },
            suggestedTags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["mood", "commentary", "suggestedTags"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    return {
      mood: result.mood || '未知',
      commentary: result.commentary || '暂无赏析',
      suggestedTags: result.suggestedTags || []
    };

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      mood: "未知",
      commentary: "AI 赏析暂时不可用，请稍后再试。",
      suggestedTags: []
    };
  }
};
*/
export {}; // 保持文件为模块，避免 TypeScript 报错