import { generateIngredientDescription } from "./geminiCall"

// Simulated Gemini response
// export const GEMINI_RESPONSE = {
//   text: JSON.stringify({
//     ingredients: ["Water", "Sugar"],
//   }),
// } as const

// // Percent-encode helper
// export function percentEncode(input: string): string {
//   return encodeURIComponent(input)
// }

// // Parse Gemini response
// const parsed = JSON.parse(GEMINI_RESPONSE.text) as {
//   ingredients: string[]
// }

// // Build ingredient string WITH spaces preserved
// // Join with ", " so it becomes "%2C%20" after encoding
// const ingredientString = parsed.ingredients
//   .map(i => i.toLowerCase()) // keep spaces inside words
//   .join(", ")

// // Encode for URL usage
// const encoded = percentEncode(ingredientString)

// console.log(encoded)

const EWG_BASE_URL =
  "https://api.ewg.org/skin_deep/v4/build_your_own?uuid=skindeepBuildYourOwn&ingredients="

// takes in a list of ingredients as a string, percent-encodes it, and fetches data from the EWG API via background script
export async function getEWGReport(text: string): Promise<unknown> {
  const percentEncoded = encodeURIComponent(text)
  const fullUrl = EWG_BASE_URL + percentEncoded

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'FETCH_EWG', url: fullUrl }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else if (!response.success) {
        reject(new Error(response.error))
      } else {
        resolve(response.data)
      }
    })
  })
}

// takes an EWG report and returns a score (normalized to 100)
export function normalizeEWGScore(score: string): number {
  const numericScore = Number(score.split("_")[0])

  if (Number.isNaN(numericScore) || numericScore < 1 || numericScore > 10) {
    throw new Error(`Invalid EWG score: ${score}`)
  }

  const normalized = ((10 - numericScore) / 9) * 99 + 1

  return Math.round(normalized)
}

// takes an ingredient string, fetches the EWG report, extracts the score, and generates a description
export async function getIngredientScore(ingredients: string): Promise<{ score: string; reason: string }> {
  const ewgData = await getEWGReport(ingredients) as { score?: string }
  const score = ewgData.score ?? "unknown"
  const normalizedScore = typeof score === "string" ? normalizeEWGScore(score) : "unknown"

  const description = await generateIngredientDescription(JSON.stringify(ewgData))

  return {
    score: normalizedScore === "unknown" ? "unknown" : normalizedScore.toString(),
    reason: description ?? "",
  }
}
