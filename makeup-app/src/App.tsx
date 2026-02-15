import './App.css'
import { useCurrentTabUrl } from './getUrl'
import { generateGeminiResponse, generateProductCharacteristics, findSimilarSustainableProducts } from './getProductInfo'
import { useEffect, useState } from 'react'

interface Justification {
  name: string
  Score: number
  Reason: string
}

interface ProductResult {
  "Product Name": string
  "Product Image": string
  "Company": string
  "Overall Score": number
  "Justification": Justification[]
}

function parseResponse(raw: string): ProductResult | null {
  try {
    let cleaned = raw.trim()
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '')
    }
    return JSON.parse(cleaned)
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
  const [geminiResponse, setGeminiResponse] = useState<string | null>('')
  const [loading, setLoading] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [characteristics, setCharacteristics] = useState<string[] | null>(null)
  const [loadingCharacteristics, setLoadingCharacteristics] = useState(false)
  const [alternativeResult, setAlternativeResult] = useState<string | null>(null)
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
    try {
      const raw = await findSimilarSustainableProducts(url, characteristic)
      setAlternativeResult(raw || 'No alternative found.')
    } catch (e) {
      console.error('Failed to find alternative:', e)
      setAlternativeResult('Error finding alternative.')
    } finally {
      setLoadingAlternative(false)
    }
  }

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
  const totalScore = result ? result["Overall Score"] : 0

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
      <img className="corner-logo" src="/BTB_logo.png" alt="BTB Logo" />
      <h1 className="app-title">Behind the Blush</h1>
      <div className="product-header">
        <img
          className="product-photo"
          src={result["Product Image"]}
          alt={result["Product Name"]}
        />
        <div className="product-info">
          <h1 className="product-name">{result["Product Name"]}</h1>
          <p className="company-name">{result["Company"]}</p>
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
        {result["Justification"].map((item) => {
          const isOpen = expandedCategories.has(item.name)

          const toggleCategory = () => {
            setExpandedCategories(prev => {
              const next = new Set(prev)
              if (next.has(item.name)) next.delete(item.name)
              else next.add(item.name)
              return next
            })
          }

          return (
            <div className={`category-card ${isOpen ? 'category-card--open' : ''}`} key={item.name}>
              <button className="category-toggle" onClick={toggleCategory}>
                <span className="category-name">{item.name}</span>
                <span
                  className="category-score"
                  style={{ color: getScoreColor(item.Score) }}
                >
                  {item.Score}/100
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
                        width: `${item.Score}%`,
                        backgroundColor: getScoreColor(item.Score),
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

          {alternativeResult && (
            <div className="alternative">
              <h3>Healthier Alternative</h3>
              <p>{alternativeResult}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
