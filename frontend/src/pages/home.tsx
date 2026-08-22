import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../lib/auth-client'

export default function Home() {
  const { data: session, isPending } = useSession()
  const navigate = useNavigate()

  function openLogin() {
    navigate('/?modal=login')
  }

  return (
    <div className="home-page">

      {/* Hero section */}
      <div className="home-hero">
        <div className="home-hero-badge">🌿 Ingredient Safety Scanner</div>
        <h1 className="home-hero-title">
          Know what's <em>really</em> in your food
        </h1>
        <p className="home-hero-sub">
          Scan any product barcode and instantly see ingredient safety scores,
          allergens, warnings, and certifications.
        </p>
      </div>

      {/* Scanner preview — clickable for guests, real link for users */}
      {!isPending && (
        session ? (
          /* ── Logged in: real scanner button ── */
          <div className="home-scanner-preview home-scanner-preview--active">
            <div className="hsp-camera-box">
              <div className="hsp-corners" />
              <div className="hsp-scan-line" />
              <div className="hsp-center-text">
                <span className="hsp-icon">📷</span>
                <span>Camera ready</span>
              </div>
            </div>
            <Link to="/scanner" id="hero-scan-btn" className="btn-hero hsp-cta">
              Start Scanning →
            </Link>
          </div>
        ) : (
          /* ── Guest: fake scanner that opens auth modal ── */
          <button
            id="hero-scan-btn"
            className="home-scanner-preview home-scanner-preview--guest"
            onClick={openLogin}
            aria-label="Sign in to start scanning"
          >
            <div className="hsp-camera-box">
              <div className="hsp-corners" />
              <div className="hsp-scan-line hsp-scan-line--paused" />
              <div className="hsp-lock-overlay">
                <span className="hsp-lock-icon">🔒</span>
                <p className="hsp-lock-title">Sign in to Scan</p>
                <p className="hsp-lock-sub">Tap to create a free account or log in</p>
              </div>
            </div>
            <span className="hsp-guest-hint">Free to use · No credit card needed</span>
          </button>
        )
      )}

      {/* Loading placeholder */}
      {isPending && <div className="home-scanner-placeholder" aria-hidden />}

      {/* Feature cards */}
      <div className="home-features">
        <div className="feature-card">
          <span className="feature-icon">📷</span>
          <h3>Camera Scanner</h3>
          <p>Point your phone camera at any barcode for an instant result.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">⚠️</span>
          <h3>Ingredient Warnings</h3>
          <p>Flags additives, high sodium, trans fats, and other concerns.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🌾</span>
          <h3>Allergen Detection</h3>
          <p>Instantly see gluten, dairy, nuts, and other common allergens.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">✅</span>
          <h3>Safety Score</h3>
          <p>A 0–100 score shows how safe a product is at a glance.</p>
        </div>
      </div>

    </div>
  )
}