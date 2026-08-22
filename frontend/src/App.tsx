import { useState, useEffect } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useSearchParams,
} from 'react-router-dom'

import { useSession, signOut } from './lib/auth-client'
import AuthModal from './components/AuthModal'
import Home from './pages/home.tsx'
import Scanner from './pages/scanner.tsx'
import ProductAnalysis from './pages/ProductAnalysis.tsx'

import './App.css'

type ModalState = 'login' | 'register' | null

function LeafMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 3 3.58.9 9.2A7.001 7.001 0 0 1 11 20z" />
      <path d="M19 2c-2.26 4.33-5.27 7.14-8 8" />
    </svg>
  )
}

function Layout() {
  const { data: session, isPending } = useSession()
  const [modal, setModal] = useState<ModalState>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  // Auto-open auth modal when ?modal=login or ?modal=register is in the URL
  useEffect(() => {
    const m = searchParams.get('modal')
    if (m === 'login' || m === 'register') {
      setModal(m)
      setSearchParams({}, { replace: true })   // clean the URL
    }
  }, [searchParams, setSearchParams])

  return (
    <>
      {/* Navbar */}
      <nav id="main-nav">

        <Link
          id="brand-link"
          className="brand"
          to="/"
          aria-label="SafeScan home"
        >
          <LeafMark />
          <span>SafeScan</span>
        </Link>

        <div className="nav-right">

          {session ? (
            <>
              <span className="nav-user">
                {session.user.email}
              </span>

              <button
                id="signout-btn"
                className="btn-ghost"
                onClick={() => signOut()}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                id="login-btn"
                className="btn-ghost"
                onClick={() => setModal('login')}
              >
                Log in
              </button>

              <button
                id="register-btn"
                className="btn-green"
                onClick={() => setModal('register')}
              >
                Sign up
              </button>
            </>
          )}

        </div>
      </nav>

      {/* Auth Modal */}
      {modal && (
        <AuthModal
          defaultTab={modal}
          onClose={() => setModal(null)}
        />
      )}

      {/* Pages */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/scanner"
          element={
            isPending ? null : session
              ? <Scanner />
              : <Navigate to="/?modal=login" replace />
          }
        />
        <Route
          path="/analysis/:barcode"
          element={
            isPending ? null : session
              ? <ProductAnalysis />
              : <Navigate to="/?modal=login" replace />
          }
        />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}