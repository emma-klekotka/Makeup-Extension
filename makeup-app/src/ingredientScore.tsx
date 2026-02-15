
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

export function normalizeEWGScore(score: string): number {
  const numericScore = Number(score.split("_")[0])

  if (Number.isNaN(numericScore) || numericScore < 1 || numericScore > 10) {
    throw new Error(`Invalid EWG score: ${score}`)
  }

  const normalized = ((10 - numericScore) / 9) * 99 + 1

  return Math.round(normalized)
}

