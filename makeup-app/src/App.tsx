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
  if (score > 75) return '#8a9a7b'
  if (score > 50) return '#b8a89a'
  return '#c4868a'
}

function getScoreLabel(score: number): string {
  if (score > 75) return 'High'
  if (score > 50) return 'Medium'
  return 'Low'
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

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
        <h1 className="app-title">Behind the Blush</h1>
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
        <h1 className="app-title">Behind the Blush</h1>
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
      <h1 className="app-title">Behind the Blush</h1>
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

      <div className="meter-section">
        <p className="score-title">Cruelty-Free Score</p>
        <div className="meter-score-display">
          <span className="meter-score-number" style={{ color: getScoreColor(totalScore) }}>
            {totalScore}
          </span>
          <span className="meter-score-out-of">/ 100</span>
        </div>
        <div className="meter-track">
          <div className="meter-zone meter-zone--low">Low</div>
          <div className="meter-zone meter-zone--mid">Medium</div>
          <div className="meter-zone meter-zone--high">High</div>
          <div
            className="meter-pointer"
            style={{ left: `${totalScore}%` }}
          >
            <svg className="meter-pointer-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M6 8L0 0h12L6 8z" fill={getScoreColor(totalScore)} />
            </svg>
          </div>
        </div>
        <div className="meter-labels">
          <span>0</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>

      <div className="breakdown">
        {Object.entries(result["Breakdown"]).map(([category, detail]) => {
          const catScore = getScoreNumber(detail)
          const justification = detail.replace(/^\d+\/100:\s*/, '')
          const catLabel = category.replace(/\s*\(\d+%\)/, '')
          const weight = category.match(/\((\d+%)\)/)?.[1] || ''
          const isOpen = expandedCategories.has(category)

          const toggleCategory = () => {
            setExpandedCategories(prev => {
              const next = new Set(prev)
              if (next.has(category)) next.delete(category)
              else next.add(category)
              return next
            })
          }

          return (
            <div className={`category-card ${isOpen ? 'category-card--open' : ''}`} key={category}>
              <button className="category-toggle" onClick={toggleCategory}>
                <span className="category-emoji">{getCategoryEmoji(category)}</span>
                <span className="category-name">{catLabel}</span>
                {weight && <span className="category-weight">{weight}</span>}
                <span
                  className="category-score"
                  style={{ color: getScoreColor(catScore) }}
                >
                  {catScore}/100
                </span>
                <svg className={`category-chevron ${isOpen ? 'category-chevron--open' : ''}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className={`category-body ${isOpen ? 'category-body--open' : ''}`}>
                <div className="category-body-inner">
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
              </div>
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
