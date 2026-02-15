const DOL_API_KEY = import.meta.env.VITE_DOL_API_KEY

interface LaborReport {
  score: number | "unknown"
  reason: string
}

async function getWorkingPercent(countryName: string): Promise<number | null> {
  if (!DOL_API_KEY) {
    console.error("VITE_DOL_API_KEY not found in .env file.")
    return null
  }

  const params = new URLSearchParams({
    limit: "1",
    offset: "0",
    fields: "working_percent",
    filter_object: JSON.stringify({ field: "country", operator: "eq", value: countryName }),
    "X-API-KEY": DOL_API_KEY,
  })

  const url = `https://apiprod.dol.gov/v4/get/ILAB/LaborShield_ReportingData/json?${params}`

  try {
    const result = await new Promise<{ success: boolean; data?: { data?: { working_percent: string }[] }; error?: string }>((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'FETCH_DOL', url }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(response)
        }
      })
    })

    if (!result.success) throw new Error(result.error)

    const data = result.data?.data ?? []
    if (data.length === 0) return null

    const value = String(data[0].working_percent).replace("%", "")
    return parseFloat(value)
  } catch (e) {
    console.error(`Error fetching labor data for ${countryName}:`, e)
    return null
  }
}

export async function countriesToScore(countries: string[]): Promise<LaborReport> {
  const countryList = countries.slice(0, 2)
  const countryScores: number[] = []

  for (const country of countryList) {
    const val = await getWorkingPercent(country)
    if (val != null) countryScores.push(val)
  }

  if (countryScores.length === 0) {
    return {
      score: "unknown",
      reason: "Unfortunately no information was found on these countries",
    }
  }

  const avg = countryScores.reduce((a, b) => a + b, 0) / countryScores.length
  // anything >= 50% child labor → score 0; each percent removes 2 points from 100
  const score = avg >= 50 ? 0 : Math.round(100 - avg * 2)

  return {
    score,
    reason:
      `This score was created by evaluating the child labor practices of ${countries[0]} and ${countries[1]}` +
      ` using Department of Labor statistics.`,
  }
}
