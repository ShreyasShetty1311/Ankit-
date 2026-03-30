import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function scanUrlSafety(url: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this URL for safety and provide a brief summary of what the site is about. 
      URL: ${url}
      Return JSON format: { "safetyScore": number (0-100), "summary": string, "isPhishing": boolean, "category": string }`,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Scan Error:", error);
    return { safetyScore: 100, summary: "No AI insights available.", isPhishing: false, category: "Unknown" };
  }
}
