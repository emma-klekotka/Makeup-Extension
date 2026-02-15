import { describe, it, expect, vi } from "vitest"
import { getEWGReport } from "../src/ingredientScore"

describe("getEWGReport", () => {
  it("returns JSON containing the expected score", async () => {
    const mockResponse = {
      score: 3,
      ingredients: ["Water", "Sugar"],
    }

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => mockResponse,
    }))

    vi.stubGlobal("fetch", fetchMock)

    const result = await getEWGReport("Water, Sugar")
    const data = result as { score: number }

    expect(data.score).toBe(3)
    expect(fetchMock).toHaveBeenCalledOnce()

    vi.unstubAllGlobals()
  })
})
