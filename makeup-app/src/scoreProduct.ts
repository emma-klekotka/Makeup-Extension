import { checkLeapingBunny } from './leapingBunny'
import { checkVegan } from './vegan'

interface ProductInfo {
  "Product Name": string
  "Company name": string
  "Photo": string
  "Ingredients": string[]
}

interface ScoreResult {
  score: number
  reason: string
}

export async function scoreProduct(product: ProductInfo): Promise<ScoreResult> {
  const companyName = product["Company name"]

  const [bunnyResult, veganResult] = await Promise.all([
    checkLeapingBunny(companyName),
    checkVegan(companyName),
  ])

  const isCrueltyFree = bunnyResult.found
  const isVegan = veganResult["Vegan?"]

  const score = (isCrueltyFree ? 75 : 0) + (isVegan ? 25 : 0)

  const parts: string[] = []
  if (isCrueltyFree) {
    parts.push(`${companyName} is Leaping Bunny certified (matched "${bunnyResult.bestMatch}")`)
  } else {
    parts.push(`${companyName} is not Leaping Bunny certified`)
  }
  if (isVegan) {
    parts.push(`listed as vegan on ethicy.com`)
  } else {
    parts.push(`not listed as vegan on ethicy.com`)
  }

  return {
    score,
    reason: parts.join(' and '),
  }
}
