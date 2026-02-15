/// <reference types="vite/client" />
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

// A function to call the Gemini API to find 3 key characteristics of a beauty product
export async function generateProductCharacteristics(productDescription: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `${productDescription}:  can you tell me 3 stand out characteristics of this make-up product? 
    Keep them concise and please provide them in list form. Don't make them too specific,
    an answer such as "price point" will suffice. Please output it in the following format:
    JSON{
    "Characteristic 1": string,
    "Characteristic 2": string,
    "Characteristic 3": string
    }`
  }); 
  return response.text;
}

// A function call to the Gemini API that searches for similar products w/
// an inputted characteristic and an emphasis on sustainability
export async function findSimilarSustainableProducts(url: string, characteristic: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `${url}: Using the URL provided, can you find a similar product that is also ${characteristic} and is more sustainable?
    Please provide me with the name of the product, the company, an image URL, the price, and a link to the product page. If you can't find a similar product that is more sustainable, please say "No alternative found." Please output it in the following format:
    JSON{
      "Product Name": string,
      "Company": string,
      "Image URL": string,
      "Price": string,
      "Link": string
    }`
  });
  return response.text;
}
