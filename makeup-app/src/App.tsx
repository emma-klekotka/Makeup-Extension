import './App.css'
import { useCurrentTabUrl } from './getUrl'
import { generateGeminiResponse } from './geminiCall'
import { useEffect, useState } from 'react'

interface ProductResult {
  "Product Name": string
  "Company name": string
  "Photo": string
  "Total Cruelty-Free Score": string
  "Breakdown": Record<string, string>
  "Alternative Recommendation": string
}

function parseResponse(raw: string): ProductResult | null {
  try {
    // Strip markdown code fences if present
    let cleaned = raw.trim()
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '')
    }
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

function getScoreNumber(scoreStr: string): number {
  const match = scoreStr.match(/(\d+)\/100/)
  return match ? parseInt(match[1], 10) : 0
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#4caf50'
  if (score >= 50) return '#ff9800'
  return '#f44336'
}

function getCategoryEmoji(category: string): string {
  if (category.includes('Supply Chain')) return '🔗'
  if (category.includes('Certification')) return '🏅'
  if (category.includes('Market')) return '🌍'
  if (category.includes('Ownership')) return '🏢'
  if (category.includes('Vegan')) return '🌱'
  return '📋'
}

function App() {
  const url = useCurrentTabUrl()
  const [geminiResponse, setGeminiResponse] = useState<string | null>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (url) {
      setLoading(true)
      generateGeminiResponse(url)
        .then(response => {
          setGeminiResponse(response || 'No response from Gemini API')
        })
        .catch(error => {
          console.error('Gemini API error:', error)
          setGeminiResponse(`Error: ${error.message}`)
        })
        .finally(() => setLoading(false))
    }
  }, [url])

  const result = geminiResponse ? parseResponse(geminiResponse) : null
  const totalScore = result ? getScoreNumber(result["Total Cruelty-Free Score"]) : 0

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner" />
          <p>Analyzing product...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="container">
        <h1 className="app-title">Cruelty-Free Check</h1>
        {geminiResponse && geminiResponse.startsWith('Error:') ? (
          <p className="error-msg">{geminiResponse}</p>
        ) : (
          <p className="placeholder-msg">Open a product page to analyze it</p>
        )}
      </div>
    )
  }

  return (
    <div className="container">
      <div className="product-header">
        <img
          className="product-photo"
          src={result["Photo"]}
          alt={result["Product Name"]}
        />
        <div className="product-info">
          <h1 className="product-name">{result["Product Name"]}</h1>
          <p className="company-name">{result["Company name"]}</p>
        </div>
      </div>

      <div className="score-ring-wrapper">
        <svg className="score-ring" viewBox="0 0 120 120">
          <circle className="score-ring-bg" cx="60" cy="60" r="52" />
          <circle
            className="score-ring-fill"
            cx="60"
            cy="60"
            r="52"
            style={{
              stroke: getScoreColor(totalScore),
              strokeDasharray: `${(totalScore / 100) * 327} 327`,
            }}
          />
        </svg>
        <div className="score-ring-text">
          <span className="score-number" style={{ color: getScoreColor(totalScore) }}>
            {totalScore}
          </span>
          <span className="score-label">/ 100</span>
        </div>
      </div>
      <p className="score-title">Cruelty-Free Score</p>

      <div className="breakdown">
        {Object.entries(result["Breakdown"]).map(([category, detail]) => {
          const catScore = getScoreNumber(detail)
          const justification = detail.replace(/^\d+\/100:\s*/, '')
          const catLabel = category.replace(/\s*\(\d+%\)/, '')
          const weight = category.match(/\((\d+%)\)/)?.[1] || ''

          return (
            <div className="category-card" key={category}>
              <div className="category-header">
                <span className="category-emoji">{getCategoryEmoji(category)}</span>
                <div className="category-title-group">
                  <span className="category-name">{catLabel}</span>
                  {weight && <span className="category-weight">{weight}</span>}
                </div>
                <span
                  className="category-score"
                  style={{ color: getScoreColor(catScore) }}
                >
                  {catScore}/100
                </span>
              </div>
              <div className="category-bar-track">
                <div
                  className="category-bar-fill"
                  style={{
                    width: `${catScore}%`,
                    backgroundColor: getScoreColor(catScore),
                  }}
                />
              </div>
              <p className="category-detail">{justification}</p>
            </div>
          )
        })}
      </div>

      {result["Alternative Recommendation"] &&
        !result["Alternative Recommendation"].startsWith('N/A') && (
          <div className="alternative">
            <h3>Recommended Alternative</h3>
            <p>{result["Alternative Recommendation"]}</p>
          </div>
        )}
    </div>
  )
}

export default App
