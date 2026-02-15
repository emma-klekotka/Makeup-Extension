import { GoogleGenAI } from "@google/genai";

const VITE_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// A function to call the Gemini API and log the response
const ai = new GoogleGenAI({ apiKey: VITE_GEMINI_API_KEY });

// get relevant product info from the url using Gemini API
export async function generateGeminiResponse(url: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Role: You are a helpful and precise assistant for analyzing cruelty-free makeup products.
Task: Analyze the following product URL. Find the Product name, company, a photo of the product and the list of ingredients. Please pull only from this page and do not make assumptions. 
Output Format:
JSON {
  "Product Name": string,
  "Company name": string,
  "Photo": string (URL),
  "Ingredients": string[]
}
URL: ${url}`,
  });
  console.log("Gemini API response:", response);
  return response.text;
}
