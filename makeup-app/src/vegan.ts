interface VeganResult {
  "Vegan?": boolean
  "Reason": string
}

export function checkVegan(companyName: string): Promise<VeganResult> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'CHECK_VEGAN', companyName },
      (response: { found: boolean; bestMatch: string | null; score: number; error?: string }) => {
        const res = response ?? { found: false, bestMatch: null, score: 0 }
        if (res.found) {
          resolve({
            "Vegan?": true,
            "Reason": `Company matched "${res.bestMatch}" on https://ethicy.com/vegan-brands`,
          })
        } else {
          resolve({
            "Vegan?": false,
            "Reason": "Company is not listed under https://ethicy.com/vegan-brands",
          })
        }
      }
    )
  })
}
