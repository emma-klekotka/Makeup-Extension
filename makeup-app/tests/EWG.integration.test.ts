import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest"
import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"
import { getEWGReport } from "../src/ingredientScore"

const server = setupServer(
  http.get("https://api.ewg.org/skin_deep/v4/build_your_own", ({ request }) => {
    const url = new URL(request.url)

    // basic sanity checks: uuid exists and ingredients exists
    const uuid = url.searchParams.get("uuid")
    const ingredients = url.searchParams.get("ingredients")

    if (uuid !== "skindeepBuildYourOwn" || !ingredients) {
      return HttpResponse.json({ error: "bad request" }, { status: 400 })
    }

    // Return what your app expects
    return HttpResponse.json({
      score: 3,
      ingredients: ["Water", "Sugar"],
    })
  })
)

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("getEWGReport (integration)", () => {
  it("calls the EWG endpoint and returns a response with score", async () => {
    const result = await getEWGReport("Water, Sugar")
    const data = result as { score: number }

    expect(data.score).toBe(3)
  })
})
