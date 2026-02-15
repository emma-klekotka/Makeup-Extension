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

// takes in a list of ingredients as a string, percent-encodes it, and fetches data from the EWG API
export async function getEWGReport(text: string): Promise<unknown> {
  const percentEncoded = encodeURIComponent(text)
  const fullUrl = EWG_BASE_URL + percentEncoded

  const response = await fetch(fullUrl)

  if (!response.ok) {
    throw new Error(`EWG request failed with status ${response.status}`)
  }

  const data = await response.json()

  return data
}

// takes a JSON from EWG Report and returns 




