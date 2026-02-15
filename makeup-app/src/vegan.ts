import { GoogleGenAI } from "@google/genai";

const VITE_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: VITE_GEMINI_API_KEY });

interface VeganResult {
  "Vegan?": boolean
  "Reason": string
}

export async function checkVegan(companyName: string): Promise<VeganResult> {
  const slug = companyName.toLowerCase().replace(/\s+/g, '-')
  const url = `https://ethicy.com/question/is-${slug}-vegan`

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Visit this URL: ${url}
Does this page explicitly state that ${companyName} is vegan? Only answer true if the page clearly designates the company as vegan. If the page does not exist, shows an error, or does not clearly state the company is vegan, answer false.
Respond with ONLY a JSON object in this exact format, no other text:
{"vegan": true or false}`,
    })

    const raw = response.text?.trim() ?? ""
    let cleaned = raw
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '')
    }
    const parsed = JSON.parse(cleaned) as { vegan: boolean }

    return {
      "Vegan?": parsed.vegan,
      "Reason": parsed.vegan
        ? `${companyName} is listed as vegan on ethicy.com`
        : `${companyName} is not listed as vegan on ethicy.com`,
    }
  } catch (e) {
    console.error('Failed to check vegan status:', e)
    return {
      "Vegan?": false,
      "Reason": `Could not verify vegan status for ${companyName}`,
    }
  }
}
