import { GoogleGenAI } from "@google/genai";

// Check if API key is available
const apiKey = process.env.API_KEY;
const useMock = !apiKey;

// Initialize the client only if API key is available
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Mock responses for demo mode
const mockResponses: Record<string, string> = {
  default: "Đây là phản hồi mẫu từ AI. Trong chế độ demo, API Gemini không được kết nối. Vui lòng cấu hình API_KEY trong file .env để sử dụng AI thực.",
};

export const generateResponse = async (prompt: string, modelName: string = 'gemini-3-flash-preview') => {
  // Demo mode - return mock response
  if (useMock || !ai) {
    if (import.meta.env.DEV) console.log("[DEMO MODE] Gemini API - Returning mock response");
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    return mockResponses.default;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    if (import.meta.env.DEV) console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generatePlanJson = async (topic: string) => {
  // Demo mode - return mock plan
  if (useMock || !ai) {
    if (import.meta.env.DEV) console.log("[DEMO MODE] Gemini API - Returning mock plan for:", topic);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    return {
      topic: topic,
      steps: [
        { step: 1, title: "Bước 1: Tìm hiểu cơ bản", description: "Nghiên cứu các khái niệm nền tảng" },
        { step: 2, title: "Bước 2: Thực hành", description: "Áp dụng kiến thức vào bài tập thực tế" },
        { step: 3, title: "Bước 3: Nâng cao", description: "Mở rộng và đào sâu kiến thức" }
      ]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a 3-step learning plan for: ${topic}. Return ONLY JSON.`,
      config: {
        responseMimeType: 'application/json',
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    if (import.meta.env.DEV) console.error("Gemini JSON Error:", error);
    throw error;
  }
};