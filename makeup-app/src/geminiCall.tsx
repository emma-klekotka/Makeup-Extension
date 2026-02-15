import { GoogleGenAI } from "@google/genai";

const VITE_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// A function to call the Gemini API and log the response
const ai = new GoogleGenAI({ apiKey: VITE_GEMINI_API_KEY });

export async function generateGeminiResponse(url: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Role: You are a consumer researching beauty products. Follow the instructions carefully and provide the requested information in the specified format.
Task: 1. Analyze the following product URL. Find the Product name, company, a photo of the product and the list of ingredients. Please pull only from this page and do not make assumptions.
output format:
JSON {
  "Product Name": string,
  "Company name": string,
  "Photo": string (URL),
  "Ingredients": string[]
}
URL: ${url}
}`,
  });
  console.log("Gemini API response:", response);
  return response.text;
}

// A function to call the Gemini API to find 3 key characteristics of a beauty product
export async function generateProductCharacteristics(productDescription: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `${productDescription}:  can you tell me 3 stand out characteristics of this make-up product? 
    Keep them concise and please provide them in list form. Don't make them too specific,
    an answer such as "price point" will suffice.`
  }); 
  return response.text;
}

// A function call to the Gemini API that searches for similar products w/
// an inputted characteristic and an emphasis on sustainability
export async function findSimilarSustainableProducts(url: string, characteristic: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `${url}: Using the URL provided, can you find a similar product that is also ${characteristic} 
    and is more sustainable? Can you provide this answer as a JSON with the following format: { "Recommended Products": list of URLs }`
  });
  return response.text;
}

// A function call to the Gemini API that returns the top 2 manufacturing countries for a company
export async function getManufacturingCountries(companyName: string): Promise<string[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `What are the top 2 countries where ${companyName} manufactures its products?
    Respond with ONLY a JSON array of exactly 2 country names, e.g. ["China", "India"]. No other text.`
  });
  try {
    const text = response.text ?? "[]"
    const cleaned = text.replace(/```json\s*/g, "").replace(/```/g, "").trim()
    return JSON.parse(cleaned) as string[]
  } catch {
    return []
  }
}

// A function call to the Gemini API that takes an JSON EWG report and returns a
// 3 sentence description of the product's environmental friendliness and human health impacts
export async function generateIngredientDescription(ewgReport: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `can you give us a concise 3 sentence description about the
     environmental friendliness and human health impacts of these ingredients based off 
     of the following JSON. Emphasize specific ingredients that are beneficial 
     (if any) and harmful (if any) and make sure it is understandable for somone with little knowledge of 
     the ingredients. Your word maximum is 70 words. Here is the JSON: ${ewgReport}`
  });
  return response.text;
}