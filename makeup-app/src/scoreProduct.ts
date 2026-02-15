import { getIngredientScore } from './ingredientScore'
import { checkLeapingBunny } from './leapingBunny'
import { countriesToScore } from './childLabor'
import { getManufacturingCountries } from './geminiCall'
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

export async function scoreProductAnimals(product: ProductInfo): Promise<ScoreResult> {
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

export async function scoreProduct(product: ProductInfo) {
  const animalScore = await scoreProductAnimals(product)
  const ingredientScore = await getIngredientScore(product.Ingredients.join(", "))
  const countries = await getManufacturingCountries(product["Company name"])
  const laborScore = await countriesToScore(countries)

  const hasLaborScore = Number(laborScore.score) !== -1 && laborScore.score !== "unknown"
  const hasIngredientScore = ingredientScore.score !== "unknown"

  let totalScore: number
  if (hasLaborScore && hasIngredientScore) {
    totalScore = Math.round(
      animalScore.score * 0.4 +
      Number(ingredientScore.score) * 0.4 +
      Number(laborScore.score) * 0.2
    )
  } else if (!hasLaborScore && !hasIngredientScore) {
    totalScore = Math.round(animalScore.score)
  } else if (!hasLaborScore) {
    totalScore = Math.round(
      animalScore.score * 0.5 +
      Number(ingredientScore.score) * 0.5
    )
  } else {
    totalScore = Math.round(
      animalScore.score * 0.5 +
      Number(laborScore.score) * 0.5
    )
  }

  return {
    "Product Name": product["Product Name"],
    "Company name": product["Company name"],
    "Photo": product["Photo"],
    "Total Sustainability Score": `${totalScore}`,
    "Justification": [
      {
        "Category": "Animal Testing",
        "Score": animalScore.score,
        "Reason": animalScore.reason
      },
      {
        "Category": "Ingredient Safety",
        "Score": hasIngredientScore ? Number(ingredientScore.score) : "N/A",
        "Reason": ingredientScore.reason
      },
      {
        "Category": " Labor Rights",
        "Score": hasLaborScore ? Number(laborScore.score) : "N/A",
        "Reason": laborScore.reason
      }
    ],
  }
}

