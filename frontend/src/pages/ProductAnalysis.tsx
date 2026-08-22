import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { findByBarcode, safetyColour, type Product } from '../data/products'

type SummaryState = 'idle' | 'loading' | 'done' | 'error'

export default function ProductAnalysis() {
  const { barcode } = useParams<{ barcode: string }>()
  const product: Product | undefined = barcode ? findByBarcode(barcode) : undefined

  const [summaryState, setSummaryState] = useState<SummaryState>('idle')
  const [summary, setSummary] = useState<string>('')
  const [summaryError, setSummaryError] = useState<string>('')

  useEffect(() => {
    if (!product) return
    setSummaryState('loading')
    setSummary('')
    setSummaryError('')

    fetch('http://localhost:3000/api/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ barcode: product.barcode }),
    })
      .then(async res => {
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error(data.error ?? 'Unknown error')
        setSummary(data.summary ?? '')
        setSummaryState('done')
      })
      .catch(err => {
        setSummaryError(err.message ?? 'Could not load AI summary')
        setSummaryState('error')
      })
  }, [product])

  if (!product) {
    return (
      <div className="analysis-page">
        <div className="analysis-not-found">
          <span className="result-icon">🔍</span>
          <h1>Product not found</h1>
          <p>No product data for barcode <code>{barcode}</code>.</p>
          <Link to="/scanner" className="btn-scanner-primary" id="back-to-scanner-btn">
            ← Back to Scanner
          </Link>
        </div>
      </div>
    )
  }

  const colour = safetyColour(product.safetyScore)
  const colourLabel =
    colour === 'green' ? 'Safe' : colour === 'amber' ? 'Moderate Risk' : 'High Risk'

  return (
    <div className="analysis-page">

      {/* ── Hero ─────────────────────────────────────── */}
      <div className="analysis-hero">
        <span className="analysis-emoji">{product.imageEmoji}</span>
        <div className="analysis-hero-text">
          <h1 className="analysis-product-name">{product.name}</h1>
          <p className="analysis-brand">{product.brand} · {product.category}</p>
          <p className="analysis-barcode">Barcode: {barcode}</p>
        </div>
        <div className={`safety-badge safety-badge--${colour} safety-badge--lg`}>
          <span className="safety-score">{product.safetyScore}</span>
          <span className="safety-label">/ 100</span>
          <span className="safety-tag">{colourLabel}</span>
        </div>
      </div>

      {/* ── AI Summary ───────────────────────────────── */}
      <div className="ai-summary-card">
        <div className="ai-summary-header">
          <span className="ai-summary-icon">✨</span>
          <h2 className="ai-summary-title">SafeScan AI Analysis</h2>
        </div>

        {summaryState === 'loading' && (
          <div className="ai-summary-loading">
            <span className="spin" />
            <span>Analysing with Gemini AI…</span>
          </div>
        )}

        {summaryState === 'done' && summary && (
          <div className="ai-summary-body">
            {summary.split('\n\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para.trim()}</p>
            ))}
          </div>
        )}

        {summaryState === 'error' && (
          <div className="ai-summary-error">
            <span>⚠️ {summaryError}</span>
            <button
              className="btn-scanner-ghost"
              onClick={() => setSummaryState('idle')}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* ── Detail Sections ───────────────────────────── */}
      <div className="analysis-sections">

        {/* Warnings */}
        {product.warnings.length > 0 && (
          <section className="analysis-section">
            <h2 className="section-heading">⚠️ Warnings</h2>
            <ul className="analysis-list analysis-list--warn">
              {product.warnings.map(w => <li key={w}>{w}</li>)}
            </ul>
          </section>
        )}

        {/* Allergens */}
        <section className="analysis-section">
          <h2 className="section-heading">🌾 Allergens</h2>
          <div className="tags-row">
            {product.allergens.map(a => (
              <span key={a} className="tag tag--allergen">{a}</span>
            ))}
          </div>
        </section>

        {/* Certifications */}
        {product.certifications.length > 0 && (
          <section className="analysis-section">
            <h2 className="section-heading">✅ Certifications</h2>
            <div className="tags-row">
              {product.certifications.map(c => (
                <span key={c} className="tag tag--cert">{c}</span>
              ))}
            </div>
          </section>
        )}

        {/* Nutrition */}
        {product.nutritionHighlights.length > 0 && (
          <section className="analysis-section">
            <h2 className="section-heading">📊 Nutrition per {product.servingSize}</h2>
            <div className="nutrition-grid">
              {product.nutritionHighlights.map(n => (
                <div key={n.label} className="nutrition-cell">
                  <span className="nutrition-value">{n.value}</span>
                  <span className="nutrition-label">{n.label}</span>
                </div>
              ))}
              <div className="nutrition-cell">
                <span className="nutrition-value">{product.calories} kcal</span>
                <span className="nutrition-label">Energy</span>
              </div>
            </div>
          </section>
        )}

        {/* Ingredients */}
        <section className="analysis-section">
          <h2 className="section-heading">🧪 Ingredients</h2>
          <p className="ingredients-text">
            {product.ingredients.join(', ')}
          </p>
        </section>

      </div>

      {/* ── Footer ───────────────────────────────────── */}
      <div className="analysis-footer">
        <Link
          to="/scanner"
          id="scan-another-link"
          className="btn-scanner-ghost"
        >
          ← Scan another product
        </Link>
      </div>

    </div>
  )
}
