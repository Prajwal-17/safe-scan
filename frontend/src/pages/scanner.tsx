import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import BarcodeScanner from '../components/BarcodeScanner'
import { findByBarcode, safetyColour, type Product } from '../data/products'

type PageState = 'scanning' | 'found' | 'not-found'
type SummaryState = 'idle' | 'loading' | 'done' | 'error'

export default function Scanner() {
  const navigate = useNavigate()

  const [pageState, setPageState] = useState<PageState>('scanning')
  const [manualInput, setManualInput] = useState('')
  const [product, setProduct] = useState<Product | null>(null)
  const [lastBarcode, setLastBarcode] = useState<string>('')
  const [scannerActive, setScannerActive] = useState(true)

  // AI summary state
  const [summaryState, setSummaryState] = useState<SummaryState>('idle')
  const [summary, setSummary] = useState<string>('')
  const [summaryError, setSummaryError] = useState<string>('')

  // Called by the BarcodeScanner component when a barcode is read
  const handleDetected = useCallback((barcode: string) => {
    if (barcode === lastBarcode) return   // debounce repeat scans
    setLastBarcode(barcode)
    setScannerActive(false)
    // Reset AI state for new scan
    setSummaryState('idle')
    setSummary('')
    setSummaryError('')

    const found = findByBarcode(barcode)
    if (found) {
      setProduct(found)
      setPageState('found')
    } else {
      setProduct(null)
      setPageState('not-found')
    }
  }, [lastBarcode])

  function handleManualSearch(e: React.FormEvent) {
    e.preventDefault()
    const barcode = manualInput.trim()
    if (!barcode) return
    handleDetected(barcode)
  }

  function handleRetry() {
    setPageState('scanning')
    setProduct(null)
    setLastBarcode('')
    setManualInput('')
    setScannerActive(true)
    setSummaryState('idle')
    setSummary('')
    setSummaryError('')
  }

  async function handleAISummarise() {
    if (!product || summaryState === 'loading') return
    setSummaryState('loading')
    setSummary('')
    setSummaryError('')

    try {
      const res = await fetch('http://localhost:3000/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ barcode: product.barcode }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Unknown error')
      setSummary(data.summary ?? '')
      setSummaryState('done')
    } catch (err: unknown) {
      setSummaryError(err instanceof Error ? err.message : 'Could not load AI summary')
      setSummaryState('error')
    }
  }

  const colour = product ? safetyColour(product.safetyScore) : 'green'

  return (
    <div className="scanner-page">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="scanner-header">
        <h1 className="scanner-title">Scan a Product</h1>
        <p className="scanner-sub">
          Use your camera or type a barcode to check ingredient safety
        </p>
      </div>

      {/* ── Camera / Result area ────────────────────────── */}
      {pageState === 'scanning' && (
        <BarcodeScanner
          active={scannerActive}
          onDetected={handleDetected}
        />
      )}

      {pageState === 'not-found' && (
        <div className="result-card result-card--error">
          <span className="result-icon">❌</span>
          <h2 className="result-title">Product not found</h2>
          <p className="result-sub">
            No product matched barcode <code className="barcode-code">{lastBarcode}</code>.
            Try a different product or check the barcode.
          </p>
          <button id="retry-btn" className="btn-scanner-primary" onClick={handleRetry}>
            Try again
          </button>
        </div>
      )}

      {pageState === 'found' && product && (
        <>
          <div className="result-card result-card--found">

            {/* Safety badge */}
            <div className={`safety-badge safety-badge--${colour}`}>
              <span className="safety-score">{product.safetyScore}</span>
              <span className="safety-label">/ 100</span>
              <span className="safety-tag">
                {colour === 'green' ? 'Safe' : colour === 'amber' ? 'Moderate' : 'Caution'}
              </span>
            </div>

            {/* Product identity */}
            <div className="product-identity">
              <span className="product-emoji">{product.imageEmoji}</span>
              <div>
                <h2 className="product-name">{product.name}</h2>
                <p className="product-brand">{product.brand} · {product.category}</p>
              </div>
            </div>

            {/* Scanned barcode */}
            <p className="scanned-barcode">
              <span className="barcode-icon">▌▌▌▌▌</span>
              {lastBarcode}
            </p>

            {/* Warnings */}
            {product.warnings.length > 0 && (
              <div className="warnings-box">
                <p className="warnings-title">⚠️ Warnings</p>
                <ul className="warnings-list">
                  {product.warnings.map(w => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Allergens + certifications */}
            <div className="tags-row">
              {product.allergens.map(a => (
                <span key={a} className="tag tag--allergen">{a}</span>
              ))}
              {product.certifications.map(c => (
                <span key={c} className="tag tag--cert">{c}</span>
              ))}
            </div>

            {/* Nutrition highlights */}
            {product.nutritionHighlights.length > 0 && (
              <div className="nutrition-grid">
                {product.nutritionHighlights.map(n => (
                  <div key={n.label} className="nutrition-cell">
                    <span className="nutrition-value">{n.value}</span>
                    <span className="nutrition-label">{n.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA buttons */}
            <div className="result-actions">
              <button
                id="analyse-btn"
                className="btn-scanner-primary"
                onClick={() => navigate(`/analysis/${lastBarcode}`)}
              >
                Full Analysis →
              </button>
              <button
                id="scan-again-btn"
                className="btn-scanner-ghost"
                onClick={handleRetry}
              >
                Scan another
              </button>
            </div>
          </div>

          {/* ── AI Summariser card ─────────────────────── */}
          <div className="ai-summariser-card">
            <div className="ai-summariser-top">
              <div className="ai-summariser-label">
                <span className="ai-summariser-sparkle">✨</span>
                <div>
                  <p className="ai-summariser-title">AI Product Summarizer</p>
                  <p className="ai-summariser-sub">
                    Get a plain-English breakdown powered by Gemini AI
                  </p>
                </div>
              </div>

              {summaryState === 'idle' && (
                <button
                  id="ai-summarise-btn"
                  className="btn-ai-summarise"
                  onClick={handleAISummarise}
                >
                  Summarise
                </button>
              )}

              {summaryState === 'loading' && (
                <div className="ai-summariser-loading">
                  <span className="spin" />
                  <span>Analysing…</span>
                </div>
              )}

              {(summaryState === 'done' || summaryState === 'error') && (
                <button
                  className="btn-scanner-ghost btn-ai-redo"
                  onClick={handleAISummarise}
                >
                  Redo
                </button>
              )}
            </div>

            {/* Summary output */}
            {summaryState === 'done' && summary && (
              <div className="ai-summariser-body">
                {summary.split('\n\n').filter(Boolean).map((para, i) => (
                  <p key={i}>{para.trim()}</p>
                ))}
              </div>
            )}

            {summaryState === 'error' && (
              <p className="ai-summariser-error">⚠️ {summaryError}</p>
            )}

            {summaryState === 'idle' && (
              <p className="ai-summariser-prompt-hint">
                Press <strong>Summarise</strong> to ask Gemini AI to analyse this product's safety, ingredients, and nutritional value.
              </p>
            )}
          </div>
        </>
      )}

      {/* ── Manual entry (always visible) ───────────────── */}
      <div className="manual-section">
        <div className="manual-divider">
          <span>or enter barcode manually</span>
        </div>

        <form className="manual-input-row" onSubmit={handleManualSearch}>
          <input
            id="manual-barcode-input"
            className="manual-input"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 8901030894316"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            aria-label="Barcode"
          />
          <button
            id="manual-search-btn"
            type="submit"
            className="btn-scanner-primary"
          >
            Search
          </button>
        </form>

        <p className="demo-hint">
          Demo barcodes:{' '}
          <button className="demo-barcode-btn" type="button"
            onClick={() => setManualInput('8901030894316')}>Maggi</button> ·{' '}
          <button className="demo-barcode-btn" type="button"
            onClick={() => setManualInput('8902102000014')}>Tulsi Tea</button> ·{' '}
          <button className="demo-barcode-btn" type="button"
            onClick={() => setManualInput('5000119314022')}>Dairy Milk</button>
        </p>
      </div>
    </div>
  )
}