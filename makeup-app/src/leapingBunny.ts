interface LeapingBunnyResult {
  found: boolean
  bestMatch: string | null
  score: number
  error?: string
}

export function checkLeapingBunny(companyName: string): Promise<LeapingBunnyResult> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'CHECK_LEAPING_BUNNY', companyName },
      (response: LeapingBunnyResult) => {
        resolve(response ?? { found: false, bestMatch: null, score: 0 })
      }
    )
  })
}
