import './App.css'
import { useCurrentTabUrl } from './getUrl'
import { generateGeminiResponse, generateProductCharacteristics, findSimilarSustainableProducts } from './getProductInfo'
import { scoreProduct } from './scoreProduct'
import { useEffect, useState } from 'react'

interface Justification {
  Category: string
  Score: number | string
  Reason: string
}

interface ProductResult {
  "Product Name": string
  "Company name": string
  "Photo": string
  "Total Sustainability Score": string
  "Justification": Justification[]
}

interface AlternativeProduct {
  "Product Name": string
  "Company": string
  "Image URL": string
  "Price": string
  "Link": string
}

function parseGeminiResponse(raw: string) {
  try {
    // Try extracting JSON from a ```json ... ``` code block first
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim()) as {
        "Product Name": string
        "Company name": string
        "Photo": string
        "Ingredients": string[]
      }
    }
    // Fall back to finding the first { ... } in the response
    const braceStart = raw.indexOf('{')
    const braceEnd = raw.lastIndexOf('}')
    if (braceStart !== -1 && braceEnd > braceStart) {
      return JSON.parse(raw.slice(braceStart, braceEnd + 1)) as {
        "Product Name": string
        "Company name": string
        "Photo": string
        "Ingredients": string[]
      }
    }
    return null
  } catch {
    return null
  }
}

function getScoreColor(score: number): string {
  if (score > 75) return '#8a9a7b'
  if (score > 50) return '#b8a89a'
  return '#c4868a'
}

function getScoreLabel(score: number): string {
  if (score > 75) return 'Great Choice!'
  if (score > 50) return 'Getting There'
  return 'Greenwashed Garbage'
}

function App() {
  const url = useCurrentTabUrl()
  const [result, setResult] = useState<ProductResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [characteristics, setCharacteristics] = useState<string[] | null>(null)
  const [loadingCharacteristics, setLoadingCharacteristics] = useState(false)
  const [alternativeResult, setAlternativeResult] = useState<AlternativeProduct | null>(null)
  const [alternativeError, setAlternativeError] = useState<string | null>(null)
  const [loadingAlternative, setLoadingAlternative] = useState(false)

  const handleSeeAlternatives = async () => {
    if (!result) return
    setLoadingCharacteristics(true)
    try {
      const raw = await generateProductCharacteristics(result["Product Name"])
      let cleaned = raw?.trim() || ''
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '')
      }
      const parsed = JSON.parse(cleaned)
      setCharacteristics([
        parsed["Characteristic 1"],
        parsed["Characteristic 2"],
        parsed["Characteristic 3"],
      ])
    } catch (e) {
      console.error('Failed to get characteristics:', e)
    } finally {
      setLoadingCharacteristics(false)
    }
  }

  const handleSelectCharacteristic = async (characteristic: string) => {
    if (!url) return
    setLoadingAlternative(true)
    setAlternativeError(null)
    try {
      const raw = await findSimilarSustainableProducts(url, characteristic)
      let cleaned = raw?.trim() || ''
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '')
      }
      const parsed = JSON.parse(cleaned) as AlternativeProduct
      setAlternativeResult(parsed)
    } catch (e) {
      console.error('Failed to find alternative:', e)
      setAlternativeError('No alternative found.')
    } finally {
      setLoadingAlternative(false)
    }
  }

  useEffect(() => {
    if (url) {
      setLoading(true)
      setError(null)
      setResult(null)
      generateGeminiResponse(url)
        .then(response => {
          const productInfo = parseGeminiResponse(response || '')
          if (!productInfo) {
            throw new Error('Failed to parse product info from page')
          }
          return scoreProduct(productInfo)
        })
        .then(scored => {
          setResult(scored)
        })
        .catch(err => {
          console.error('Error:', err)
          setError(`Error: ${err.message}`)
        })
        .finally(() => setLoading(false))
    }
  }, [url])

  const totalScore = result ? Number(result["Total Sustainability Score"]) : 0

  if (loading) {
    return (
      <div className="container">
        <img className="corner-logo" src="/BTB_logo.png" alt="BTB Logo" />
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
        <img className="corner-logo" src="/BTB_logo.png" alt="BTB Logo" />
        <h1 className="app-title">Behind the Blush</h1>
        {error ? (
          <p className="error-msg">{error}</p>
        ) : (
          <p className="placeholder-msg">Open a product page to analyze it</p>
        )}
      </div>
    )
  }

  return (
    <div className="container">
      <img className="corner-logo" src="/BTB_logo.png" alt="BTB Logo" />
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

      <div className="gauge-section">
        {(() => {
          const r = 80
          const cx = 100
          const cy = 90
          const needleAngle = -180 + (totalScore / 100) * 180
          const needleLen = r - 10
          const needleRad = (needleAngle * Math.PI) / 180
          const nx = cx + needleLen * Math.cos(needleRad)
          const ny = cy + needleLen * Math.sin(needleRad)

          const arcPoint = (angle: number) => {
            const rad = ((-180 + angle) * Math.PI) / 180
            return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`
          }

          return (
            <svg className="gauge-svg" viewBox="0 0 200 110">
              <path
                d={`M ${arcPoint(0)} A ${r} ${r} 0 0 1 ${arcPoint(90)}`}
                fill="none" stroke="#c4868a" strokeWidth="14" strokeLinecap="butt" opacity="0.35"
              />
              <path
                d={`M ${arcPoint(90)} A ${r} ${r} 0 0 1 ${arcPoint(135)}`}
                fill="none" stroke="#987f8f" strokeWidth="14" strokeLinecap="butt" opacity="0.35"
              />
              <path
                d={`M ${arcPoint(135)} A ${r} ${r} 0 0 1 ${arcPoint(180)}`}
                fill="none" stroke="#60535b" strokeWidth="14" strokeLinecap="butt" opacity="0.35"
              />
              <line
                x1={cx} y1={cy} x2={nx} y2={ny}
                stroke={getScoreColor(totalScore)}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx={cx} cy={cy} r="4" fill={getScoreColor(totalScore)} />
            </svg>
          )
        })()}
        <p className="gauge-tier-label" style={{ color: getScoreColor(totalScore) }}>
          {getScoreLabel(totalScore)}
        </p>
      </div>

      <div className="breakdown">
        {(result["Justification"] ?? []).map((item) => {
          const isOpen = expandedCategories.has(item.Category)
          const numericScore = typeof item.Score === "number" ? item.Score : null

          const toggleCategory = () => {
            setExpandedCategories(prev => {
              const next = new Set(prev)
              if (next.has(item.Category)) next.delete(item.Category)
              else next.add(item.Category)
              return next
            })
          }

          return (
            <div className={`category-card ${isOpen ? 'category-card--open' : ''}`} key={item.Category}>
              <button className="category-toggle" onClick={toggleCategory}>
                <span className="category-name">{item.Category}</span>
                <span
                  className="category-score"
                  style={{ color: numericScore !== null ? getScoreColor(numericScore) : '#999' }}
                >
                  {numericScore !== null ? `${numericScore}/100` : 'N/A'}
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
                        width: numericScore !== null ? `${numericScore}%` : '0%',
                        backgroundColor: numericScore !== null ? getScoreColor(numericScore) : '#999',
                      }}
                    />
                  </div>
                  <p className="category-detail">{item.Reason}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {totalScore < 75 && (
        <div className="alternatives-section">
          {!characteristics && !loadingCharacteristics && (
            <button className="alt-main-btn" onClick={handleSeeAlternatives}>
              See Healthier Alternatives
            </button>
          )}

          {loadingCharacteristics && (
            <div className="loading">
              <div className="spinner" />
              <p>Finding characteristics...</p>
            </div>
          )}

          {characteristics && !alternativeResult && !loadingAlternative && (
            <div className="char-buttons">
              {characteristics.map((char) => (
                <button
                  key={char}
                  className="char-btn"
                  onClick={() => handleSelectCharacteristic(char)}
                >
                  {char}
                </button>
              ))}
            </div>
          )}

          {loadingAlternative && (
            <div className="loading">
              <div className="spinner" />
              <p>Searching for alternatives...</p>
            </div>
          )}

          {alternativeError && (
            <div className="alternative">
              <p className="alt-error">{alternativeError}</p>
            </div>
          )}

          {alternativeResult && (
            <div className="alternative">
              <h3>Healthier Alternative</h3>
              <div className="alt-card">
                <img
                  className="alt-card-image"
                  src={alternativeResult["Image URL"]}
                  alt={alternativeResult["Product Name"]}
                />
                <div className="alt-card-info">
                  <p className="alt-card-name">{alternativeResult["Product Name"]}</p>
                  <p className="alt-card-company">{alternativeResult["Company"]}</p>
                  <p className="alt-card-price">{alternativeResult["Price"]}</p>
                  <a
                    className="alt-card-link"
                    href={alternativeResult["Link"]}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Product
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
