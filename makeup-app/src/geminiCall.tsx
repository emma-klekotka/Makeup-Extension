import { GoogleGenAI } from "@google/genai";

const VITE_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// A function to call the Gemini API and log the response
const ai = new GoogleGenAI({ apiKey: VITE_GEMINI_API_KEY });

export async function generateGeminiResponse(url: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Role: You are a Cruelty-Free Beauty Auditor. Your goal is to evaluate a beauty product based on its URL and generate a "Cruelty-Free Score" from 0 to 100.

Task: > 1. Visit the provided URL: ${url}. Extract the product name, company name, and a photo of the product from this page.

2. Research the brand's current animal testing policy, its parent company status, its third-party certifications (Leaping Bunny, PETA, etc.), and its retail presence in countries with mandatory testing laws (e.g., physical stores in mainland China).

3. Use the following weighted formula to calculate the score:



Supply Chain Depth (30%): Does the brand verify all raw ingredients? (100 = FCOD implemented, 0 = No verification).

Certification (25%): 100 = Leaping Bunny, 60 = PETA, 0 = None.

Market Compliance (20%): 100 = No physical sales in testing markets, 0 = Active physical retail in China.

Ownership (15%): 100 = Independent, 50 = Owned by testing parent, 0 = Tests itself.

Vegan Status (10%): 100 = 100% Vegan product/brand, 0 = Contains animal by-products.

Output Format:
JSON {

Product Name: name of product

Company name: name of company producing product

Photo: provide a photo of the product

Total Cruelty-Free Score: [Score]/100

Breakdown: Provide a brief 1-sentence justification for the points awarded in each of the 5 categories.

Alternative Recommendation: If the score is below 80, suggest one "Gold Standard" (90+ score) alternative product in the same category. }`,
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
    contents: `${url}: Using the URL provided, can you find a similar product that is also ${characteristic} and is more sustainable?`
  });
  return response.text;
}