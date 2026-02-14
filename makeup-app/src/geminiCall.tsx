import { GoogleGenAI } from "@google/genai";

const VITE_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// A function to call the Gemini API and log the response
const ai = new GoogleGenAI({ apiKey: VITE_GEMINI_API_KEY });

export async function generateGeminiResponse(url: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `${url}: Using the URL provided, generate a sustainability score for the product on the page. 
    Consider factors such as materials used, manufacturing processes, and company sustainability practices. 
    Provide a score from 0 to 100, where 100 represents the most sustainable option. Include a brief explanation of the score based 
    on the information available on the page.`,
  });
  console.log("Gemini API response:", response);
  return response.text;
}
