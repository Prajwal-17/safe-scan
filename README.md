# 🌿 SafeScan — Complete Project Guide

> **Scan a barcode → Know what's in your food → Stay safe.**

SafeScan is a full-stack web application that lets users scan product barcodes using their phone/laptop camera, instantly fetches ingredient data, calculates a safety score, and generates an AI-powered plain-English summary using **Google Gemini**.

---

## 📋 Table of Contents

1. [What This Project Does](#what-this-project-does)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Architecture & Data Flow](#architecture--data-flow)
5. [How Barcode Scanning Works (Deep Dive)](#how-barcode-scanning-works-deep-dive)
6. [File-by-File Walkthrough](#file-by-file-walkthrough)
7. [Authentication System](#authentication-system)
8. [AI Integration (Gemini)](#ai-integration-gemini)
9. [Product Data & Open Food Facts](#product-data--open-food-facts)
10. [How to Run the Project](#how-to-run-the-project)
11. [Environment Variables](#environment-variables)
12. [Interview Questions & Answers](#interview-questions--answers)

---

## What This Project Does

| Feature | Description |
|---|---|
| 📷 Live Barcode Scanner | Uses your device camera to decode barcodes in real-time |
| ⌨️ Manual Barcode Entry | Type a barcode number if camera is unavailable |
| 🛡️ Safety Score | Each product gets a score 0–100 (green/amber/red) |
| ⚠️ Ingredient Warnings | Highlights risky ingredients (high sugar, sodium, trans fats) |
| ✨ AI Summary | Google Gemini writes a plain-English consumer safety report |
| 🌐 Open Food Facts | Falls back to a public food database for unknown barcodes |
| 🔐 Authentication | Email/password + Google OAuth + GitHub OAuth (via Better Auth) |
| 📊 Full Analysis Page | Deep-dive page per product with AI, nutrition, allergens, ingredients |

---

## Tech Stack

### Frontend
| Technology | Version | Why Used |
|---|---|---|
| **React** | 19 | UI component framework |
| **TypeScript** | 6 | Type safety, better developer experience |
| **Vite** | 8 | Super-fast dev server and bundler |
| **React Router DOM** | 7 | Client-side routing between pages |
| **@zxing/browser** | 0.2.1 | Barcode/QR scanning via device camera |
| **Better Auth (client)** | 1.7 | Auth session management on the frontend |
| **Vanilla CSS** | — | All custom styles (no Tailwind) |

### Backend
| Technology | Version | Why Used |
|---|---|---|
| **Node.js + Express** | 5.x | REST API server |
| **Better Auth** | 1.7 | Authentication middleware (email, Google, GitHub) |
| **@google/genai** | 2.17 | Google Gemini AI SDK |
| **pg (node-postgres)** | 8 | PostgreSQL database driver |
| **Supabase** | Cloud | Hosted Postgres database for auth user storage |
| **dotenv** | 16 | Load environment variables from .env |
| **cors** | 2.8 | Allow cross-origin requests from the frontend |

---

## Project Structure

```
safe-scan/
├── frontend/                    # React + TypeScript + Vite
│   └── src/
│       ├── main.tsx             # React app entry point
│       ├── App.tsx              # Router + Navbar + Auth modal wiring
│       ├── App.css              # ALL styles (29 KB of custom CSS)
│       ├── lib/
│       │   └── auth-client.ts   # Better Auth client (signIn, signUp, useSession)
│       ├── data/
│       │   └── products.ts      # 12 curated products + helper functions
│       ├── components/
│       │   ├── BarcodeScanner.tsx  # Camera + ZXing decode loop
│       │   └── AuthModal.tsx       # Login/Register/OTP/Forgot Password modal
│       └── pages/
│           ├── home.tsx            # Landing page with hero section
│           ├── scanner.tsx         # Main scanning page + AI summarizer card
│           └── ProductAnalysis.tsx # Full analysis page (/analysis/:barcode)
│
└── backend/                     # Node.js + Express
    └── src/
        ├── server.js            # Express app setup, CORS, route mounting
        ├── auth.js              # Better Auth config (email, Google, GitHub, OTP)
        ├── routes/
        │   ├── ai.routes.js     # POST /api/ai/summarize
        │   └── product.routes.js # GET /api/products/:barcode
        ├── services/
        │   ├── ai.service.js    # Builds Gemini prompt, calls Gemini API
        │   └── product.service.js # Local lookup + Open Food Facts fallback
        └── data/
            └── products.js      # Same 12 products (server-side copy)
```

---

## Architecture & Data Flow

```
USER (Browser)
     │
     │  1. Camera feed → ZXing decodes barcode
     │
     ▼
FRONTEND (React @ localhost:5173)
     │
     ├── Barcode found in products.ts → Show result immediately (no API call)
     │
     └── User clicks "AI Summarise" or goes to /analysis/:barcode
              │
              │  2. POST /api/ai/summarize  { barcode: "..." }
              ▼
BACKEND (Express @ localhost:3000)
     │
     ├── findProductWithFallback(barcode)
     │       ├── Check local products.js → found? return it
     │       └── Not found? → fetch from Open Food Facts API → map data
     │
     └── summarizeProduct(product)
              │
              │  3. Call Gemini 2.5 Flash with structured prompt
              ▼
      GEMINI AI (Google Cloud)
              │
              │  4. Returns plain-English 3-paragraph safety summary
              ▼
BACKEND → FRONTEND → DISPLAYED TO USER
```

---

## How Barcode Scanning Works (Deep Dive)

This is the most important technical part. Let's go through it step by step.

### What is ZXing?

**ZXing** (pronounced "Zebra Crossing") is an open-source barcode scanning library originally written in Java by Google. The `@zxing/browser` package is a TypeScript/JavaScript port that works directly in the browser using the **MediaDevices API** (your camera).

It supports many barcode formats: EAN-13, EAN-8, QR Code, Code 128, UPC-A, UPC-E, Data Matrix, and more. Most food products use **EAN-13** (the 13-digit barcode).

---

### Step-by-Step: How BarcodeScanner.tsx Works

**Step 1 — Ask for Camera Permission**
```tsx
await BrowserMultiFormatReader.listVideoInputDevices()
```
This triggers the browser's "Allow camera access?" popup.
- On mobile → browser prefers the rear camera (better for barcodes)
- On desktop → uses the webcam
- If denied → caught in `catch` block, shows error UI

**Step 2 — Start the Decode Loop**
```tsx
const reader = new BrowserMultiFormatReader()
const controls = await reader.decodeFromVideoDevice(
  undefined,        // undefined = let browser pick the best camera
  videoRef.current, // the <video> HTML element
  (result, err) => {
    if (result) {
      onDetected(result.getText()) // e.g. "8901030894316"
    } else if (err && !(err instanceof NotFoundException)) {
      console.warn('ZXing decode error:', err)
    }
  }
)
```

What happens internally:
1. ZXing connects the camera stream to the `<video>` element
2. Every frame (~30fps), ZXing grabs an image from the video
3. Runs image processing: grayscale → thresholding → edge detection
4. Tries to detect barcode patterns in the image
5. If found → calls the callback with the decoded string
6. If not found → throws `NotFoundException` (this is NORMAL every frame — we ignore it)

**Step 3 — Debounce Repeat Scans**
```tsx
const handleDetected = useCallback((barcode: string) => {
  if (barcode === lastBarcode) return  // ignore same barcode
  setLastBarcode(barcode)
  setScannerActive(false)             // stop the camera
}, [lastBarcode])
```
Without this, scanning Maggi would call `handleDetected` 30 times per second, causing 30 API calls.

**Step 4 — Cleanup (React useEffect return)**
```tsx
return () => {
  cancelled = true
  try { controlsRef.current?.stop() } catch (_) { /* ignore */ }
  controlsRef.current = null
}
```
When the component unmounts:
- `cancelled = true` → any in-flight async operations abort early
- `controls.stop()` → kills the ZXing decode loop and releases the camera

Without this cleanup, the camera light stays ON and causes a memory leak!

---

### The Video Element

```tsx
<video
  ref={videoRef}
  id="barcode-video"
  playsInline   // CRITICAL for iOS Safari (prevents fullscreen takeover)
  muted         // required for autoplay to work in browsers
/>
```

- `playsInline`: On iOS Safari, without this, the video goes fullscreen
- `muted`: Browsers block autoplay of videos with audio unless the user has interacted first

---

### Barcode Format: EAN-13

Maggi barcode `8901030894316`:
- **890** = Country code (India, assigned by GS1)
- **1030894** = Company/manufacturer code
- **31** = Product code
- **6** = Check digit (calculated via Luhn algorithm)

ZXing automatically validates the check digit before returning a result.

---

### Why We Chose ZXing Over Alternatives

| Library | Approach | Pros | Cons |
|---|---|---|---|
| `@zxing/browser` ✅ | JavaScript (browser) | Works offline, free, open-source | Slightly slower than WASM |
| `quagga2` | JavaScript | Popular | Less actively maintained |
| `dynamsoft` | Commercial SDK | Very accurate | Paid |
| Native `BarcodeDetector` API | Browser native | Fastest | Not supported on Firefox |

---

## File-by-File Walkthrough

### `auth-client.ts`
Sets up the Better Auth client with named exports:
```ts
export const { signIn, signUp, signOut, useSession, verifyEmail } = authClient
```
`useSession()` is a React hook that returns the current logged-in user. Used in `App.tsx` to show/hide login button and protect routes.

---

### `products.ts`
A local in-memory database of 12 Indian and global products:
- Maggi, Amul Butter, Lay's, Dabur Honey, Nivea, Bournvita, Tata Salt, Paper Boat, Dairy Milk, Patanjali Ghee, Fortune Oil, Tulsi Tea
- Each product has: barcode, name, brand, category, ingredients[], allergens[], safetyScore (0–100), warnings[], certifications[], nutritionHighlights[]
- Helper functions:
  - `findByBarcode(barcode)` → lookup by barcode string
  - `safetyColour(score)` → returns 'green' | 'amber' | 'red'

---

### `App.tsx`
- Sets up React Router with 3 routes: `/`, `/scanner`, `/analysis/:barcode`
- `/scanner` and `/analysis/:barcode` are **protected routes** — redirect to `/?modal=login` if not logged in
- Renders the Navbar with dynamic Login/SignUp or user email + Sign Out
- `?modal=login` in URL auto-opens the AuthModal (used after OAuth redirect)

---

### `scanner.tsx`
The core page. Manages these states:
```ts
type PageState = 'scanning' | 'found' | 'not-found'
type SummaryState = 'idle' | 'loading' | 'done' | 'error'
```

| State | What the user sees |
|---|---|
| `scanning` | Live camera feed |
| `found` | Product card with safety badge, warnings, tags |
| `not-found` | Error card with the unrecognised barcode |

The AI Summariser card is on-demand — user clicks "Summarise" → POST to backend → Gemini response appears.

---

### `ProductAnalysis.tsx`
Full analysis page at `/analysis/:barcode`. Automatically fires the AI call on load via `useEffect`. Displays:
- Safety badge (colour coded)
- AI summary (3 paragraphs from Gemini)
- Warnings list
- Allergen tags
- Certification badges
- Nutrition grid
- Full ingredients list

---

### `server.js`
Express app with:
- CORS set to frontend URL only (with `credentials: true` for cookie-based auth)
- Better Auth mounted at `/api/auth/*` (handles login, signup, OAuth callbacks)
- Product routes at `/api/products`
- AI routes at `/api/ai`
- Health check at `/api/health`

> Better Auth must be mounted **before** `express.json()` because it reads the raw request body for signature verification.

---

### `auth.js`
Configures Better Auth with:
- Email/password auth with email verification via OTP
- Google OAuth + GitHub OAuth
- Custom signup validation hooks:
  - Name: letters and spaces only
  - Email: Gmail must end in `.com`
  - Password: >8 chars, must have letters AND numbers, no special characters

---

### `product.service.js`
Two-level product lookup:
1. **Local** → check `products.js` array (instant, no network)
2. **Open Food Facts** → `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`

The `mapOFFProduct()` function converts the Open Food Facts JSON into our clean Product schema. It calculates a safety score from Nutri-Score and NOVA group, extracts allergens, ingredients, nutrition, certifications, and assigns an emoji from the product category.

---

### `ai.service.js`
Builds a structured prompt for Gemini and calls the API:
```js
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
})
return response.text
```
The prompt instructs Gemini to write exactly 3 plain-English paragraphs: product overview, nutritional highlights, and SafeScan verdict.

---

## Authentication System

```
User clicks "Sign Up"
        ↓
AuthModal (tab: register)
        ↓
Better Auth client → POST /api/auth/sign-up/email
        ↓
Better Auth validates via hooks:
  - Name: letters only
  - Email: valid format
  - Password: alphanumeric, >8 chars
        ↓
User created in Supabase (PostgreSQL)
        ↓
OTP logged to console (dev) or emailed (prod)
        ↓
User enters OTP in AuthModal
        ↓
POST /api/auth/verify-email → session cookie set
        ↓
User is now logged in, useSession() returns user data
```

**Session management**: Better Auth uses HTTP-only cookies — the session token is never accessible to JavaScript (XSS protection).

**OAuth flow (Google/GitHub)**:
1. User clicks "Continue with Google"
2. Redirect to Google's consent screen
3. Google redirects back to `/api/auth/callback/google`
4. Better Auth creates/finds the user in Supabase
5. Redirect to `/?modal=login` → URL param triggers modal close + session loads

---

## AI Integration (Gemini)

### Why Gemini 2.5 Flash?
- Fast: Sub-second responses for short prompts
- Free tier: Generous quota for development
- Accurate: Good at following structured output instructions
- Google SDK: `@google/genai` is the official maintained SDK

### The Prompt Design
The prompt uses a **role + data + instructions** pattern:
- Role assignment: "You are SafeScan, an AI ingredient safety assistant"
- Structured data block: Product name, ingredients, nutrition, score injected between `--- PRODUCT DATA ---` markers
- Output format: "Write a 3-paragraph consumer-friendly summary"
- Negative rules: "Do NOT invent data", "Do NOT use markdown headers"

---

## Product Data & Open Food Facts

### Local Dataset (12 products)
Hand-curated with accurate real-world data. Demo barcodes:
- `8901030894316` → Maggi Masala
- `8902102000014` → Organic India Tulsi Tea
- `5000119314022` → Cadbury Dairy Milk

### Open Food Facts Fallback
Open Food Facts is a free, open-source food database with 3 million+ products globally. When a barcode isn't in our local data:
1. Backend calls the Open Food Facts API
2. Maps the response to our Product schema
3. Calculates safety score from Nutri-Score + NOVA group
4. AI summarizes the result

---

## How to Run the Project

### Prerequisites
- Node.js 20+
- A Supabase account (free tier works)
- A Google Gemini API key (free at aistudio.google.com)
- Google OAuth credentials (from Google Cloud Console)
- GitHub OAuth credentials (from GitHub Developer Settings)

### 1. Clone & Install
```bash
git clone <repo-url>
cd safe-scan

cd backend && npm install
cd ../frontend && npm install
```

### 2. Set Up Environment Variables
```bash
cp backend/.env.example backend/.env
# Fill in values
```

### 3. Run Both Servers
```bash
# Terminal 1 — Backend (port 3000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

### 4. Open the App
Visit: **http://localhost:5173**

---

## Environment Variables

```env
# backend/.env

DATABASE_URL=postgres://postgres:[password]@[host]:5432/postgres
BETTER_AUTH_SECRET=your-random-secret-32-chars-min
BETTER_AUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=AIza...
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
PORT=3000
```

---

---

# 🎓 Interview Questions & Answers

> These cover every major concept used in this project.

---

## React & Frontend

**Q1. What is the difference between `useRef` and `useState` in React, and why did you use `useRef` for the ZXing controls?**

**A:** `useState` causes a re-render every time it changes. `useRef` holds a mutable value that persists across renders but never causes a re-render. We use `useRef` for `controlsRef` (ZXing controls object) and `videoRef` (the video DOM element) because we don't want React to re-render when these change, and we need to hold references to DOM elements or imperative API objects. `controlsRef.current.stop()` is a side-effect operation, not state.

---

**Q2. Why did you use `useCallback` for `handleDetected` in scanner.tsx?**

**A:** `useCallback` memoizes a function so it's only recreated when its dependencies change. `handleDetected` is passed as a prop to `BarcodeScanner`. Without `useCallback`, a new function reference is created on every render, which would trigger the `useEffect` in `BarcodeScanner` (which depends on `onDetected`) on every render — restarting the camera unnecessarily. With `useCallback([lastBarcode])`, the function only changes when `lastBarcode` changes.

---

**Q3. How does the barcode debouncing work and why is it needed?**

**A:** ZXing fires the callback at ~30 frames per second. Without debouncing, scanning Maggi would call `handleDetected("8901030894316")` 30 times per second, causing 30 state updates. We solve this with a simple string comparison:
```tsx
if (barcode === lastBarcode) return  // bail early if same barcode
setLastBarcode(barcode)
setScannerActive(false)  // stop the camera after first detection
```

---

**Q4. What is the purpose of `playsInline` and `muted` on the video element?**

**A:** `playsInline` — on iOS Safari, without this attribute, video plays in a native fullscreen player. `playsInline` keeps the video inside the webpage element. `muted` — browsers block autoplay of videos with audio unless the user has interacted with the page. Since our camera feed has no audio, adding `muted` ensures the video stream starts automatically without requiring a user tap first.

---

**Q5. Explain how React Router's protected routes work in this project.**

**A:** We use conditional rendering in the route element:
```tsx
<Route
  path="/scanner"
  element={
    isPending ? null : session
      ? <Scanner />
      : <Navigate to="/?modal=login" replace />
  }
/>
```
- `isPending` → Better Auth is still loading session, show nothing to avoid flash
- `session` exists → render the protected component
- No session → redirect to home with `?modal=login` which auto-opens the login modal

---

**Q6. What is TypeScript and why use it over plain JavaScript?**

**A:** TypeScript is a superset of JavaScript that adds static type checking. Benefits in this project: the `Product` interface ensures every product has the right shape — if you forget `safetyScore`, TypeScript errors at compile time, not runtime. IDE autocompletion shows all fields. `type PageState = 'scanning' | 'found' | 'not-found'` (a union type) prevents accidentally setting state to `'scaning'` (typo). TypeScript catches bugs before they reach production.

---

**Q7. What is Vite and why is it used instead of Create React App?**

**A:** Vite is a modern build tool that uses ES modules during development (no bundling needed) and Rollup for production builds. Dev server starts in under 500ms vs CRA's 10–30 seconds. Hot Module Replacement updates only the changed module with no full page reload. Create React App is officially deprecated. Vite is the industry-standard choice for new React projects in 2024+.

---

**Q8. What is the difference between a controlled and uncontrolled component? Which is used for the manual barcode input?**

**A:** The manual barcode input is a controlled component:
```tsx
<input
  value={manualInput}
  onChange={e => setManualInput(e.target.value)}
/>
```
The input value is always synchronized with React state — React "owns" the value. An uncontrolled component would use a `ref` to read the DOM value only when needed. Controlled is preferred because it enables clearing the field programmatically (`setManualInput('')`) and pre-filling demo values.

---

## Backend & Node.js

**Q9. What is Express.js and how is the server structured?**

**A:** Express is a minimal Node.js web framework for building REST APIs. Our server order matters:
```js
app.use(cors(...))                     // 1. Allow cross-origin requests
app.all('/api/auth/*', toNodeHandler(auth)) // 2. Better Auth (before body parser!)
app.use('/api/products', productRoutes) // 3. Product lookup routes
app.use(express.json())                 // 4. Parse JSON bodies
app.use('/api/ai', aiRoutes)            // 5. AI summarize route
```
Better Auth must be before `express.json()` because it reads the raw request body.

---

**Q10. What is CORS and why is it needed?**

**A:** CORS (Cross-Origin Resource Sharing) is a browser security mechanism that blocks requests from one origin (localhost:5173) to a different origin (localhost:3000). Without the `cors` middleware, the browser would block all API calls from the frontend. `credentials: true` is required because Better Auth uses HTTP-only cookies for sessions — without this, the browser strips the cookie from cross-origin requests.

---

**Q11. What is the difference between `async/await` and `.then()/.catch()`?**

**A:** Both handle Promises. `async/await` is syntactic sugar over `.then()`:
```js
// .then() style
fetch(url).then(res => res.json()).then(data => ...).catch(err => ...)

// async/await style
try {
  const res = await fetch(url)
  const data = await res.json()
} catch (err) { ... }
```
`async/await` is more readable, especially with multiple sequential async operations.

---

**Q12. What is the fallback strategy used for the product lookup?**

**A:** We use a cascade/waterfall pattern:
```js
const local = findProductByBarcode(barcode)     // 1. Check local array (instant)
if (local) return { product: local, source: 'local' }

const external = await fetchFromOpenFoodFacts(barcode) // 2. Try Open Food Facts
if (external) return { product: external, source: 'open-food-facts' }

return { product: null, source: null }          // 3. Give up
```
This is the "local-first with remote fallback" pattern. Local products load instantly; real-world products covered via Open Food Facts.

---

**Q13. How does the safety score get calculated for Open Food Facts products?**

**A:** We use two food science rating systems:

**Nutri-Score** (A–E pan-European nutritional label):
- A → 90 points, B → 75, C → 58, D → 40, E → 22

**NOVA Group** (processing level 1–4):
- Group 1 (unprocessed): +8 bonus points
- Group 3 (processed): -5 penalty
- Group 4 (ultra-processed): -15 penalty

These two systems together give a holistic score covering nutritional quality AND processing level.

---

## Authentication & Security

**Q14. What is Better Auth and how does it differ from building auth from scratch?**

**A:** Better Auth is a TypeScript authentication library that handles password hashing (bcrypt), session management, CSRF protection, OAuth 2.0 flows, email verification, password reset, and database schema creation. Building this from scratch would take weeks and is error-prone, especially for OAuth and session security. Better Auth gives production-grade auth in a few configuration lines.

---

**Q15. What are HTTP-only cookies and why does Better Auth use them?**

**A:** An HTTP-only cookie cannot be read by JavaScript (`document.cookie` returns nothing). This protects against XSS (Cross-Site Scripting) attacks — even if an attacker injects malicious JavaScript, they cannot steal the session token because JavaScript can't access it. Better Auth stores session tokens in HTTP-only cookies automatically.

---

**Q16. Explain the OTP email verification flow.**

**A:** When a user signs up:
1. Better Auth generates a random verification token
2. Our `sendVerificationEmail` hook generates a 6-digit OTP: `Math.floor(100000 + Math.random() * 900000)`
3. We UPDATE the `verification` table in Supabase, replacing the token with the OTP
4. In production, we'd email this; in dev, we `console.log` it
5. User enters the OTP in the AuthModal
6. Better Auth verifies the OTP against the database
7. `autoSignInAfterVerification: true` → user is immediately logged in

---

**Q17. What is OAuth and how does the Google login flow work?**

**A:** OAuth 2.0 is an authorization protocol that lets users grant limited access to their accounts without sharing passwords.

Google OAuth flow:
1. User clicks "Continue with Google"
2. Redirect to Google's consent screen with our client ID and redirect URI
3. User approves, Google redirects back with an authorization code
4. Better Auth exchanges the code for an access token (server-to-server)
5. Better Auth fetches user's email/name from Google's userinfo endpoint
6. Creates/finds the user in Supabase, sets session cookie
7. Redirects to `/?modal=login` — URL param triggers modal close + session loads

---

**Q18. Why are there custom validation hooks in `auth.js`?**

**A:** Better Auth's hooks system lets you intercept requests before they're processed. We added:
- Name: `/^[a-zA-Z\s]+$/` — prevents symbols in usernames
- Email: Gmail must end in `.com` — filters obvious fake emails
- Password: Must have letters + numbers, no special chars — ensures predictable storage

These run server-side, so they can't be bypassed by disabling JavaScript.

---

## System Design & Architecture

**Q19. Why is the product data duplicated on both frontend and backend?**

**A:** Two different use cases:
- **Frontend**: Used for instant barcode lookup without any network call. Result appears in under 1ms as a JavaScript array lookup.
- **Backend**: Used by the AI route — when AI summarization is requested, the backend needs full product data to build the Gemini prompt.

In a production system, you'd have a single source of truth (the database), and both would query it.

---

**Q20. What is the problem if you don't clean up the ZXing scanner in `useEffect`?**

**A:** Without cleanup:
1. Camera stays on — the green camera indicator light stays lit
2. Memory leak — ZXing holds references to video stream and frame buffer that are never garbage collected
3. Multiple decode loops — if the component remounts, a new ZXing instance starts while the old one still runs, causing duplicate callbacks

The fix: return a cleanup function from `useEffect` that calls `controls.stop()` and sets `cancelled = true`.

---

**Q21. How would you scale this app to handle 10,000 concurrent users?**

**A:** Current limitations and solutions:
- Gemini API rate limits → Add Redis cache; if same barcode was summarized recently, return cached result
- Open Food Facts rate limits → Cache external API responses in Redis with a TTL
- Single Express server → Load balancer (AWS ALB / Nginx) in front of multiple Express instances
- Database connections → Use connection pooling (pgBouncer)
- Static assets → Serve built React app from a CDN (Cloudflare, AWS CloudFront)

---

**Q22. What is the difference between `import` and `require` in Node.js?**

**A:** Both files use `import` (ES modules) because `package.json` has `"type": "module"`. ESM is the modern standard:
- Supports tree-shaking (dead code elimination in bundlers)
- Works identically in browser and Node.js
- `import` is static (analyzed at parse time), `require` is dynamic (runs at runtime)

---

**Q23. What are the trade-offs of storing product data as a static TypeScript array vs. a database?**

**A:**

| Aspect | Static Array (current) | Database |
|---|---|---|
| Speed | Instant (no I/O) | Adds network latency |
| Scalability | Fixed at 12 products | Millions of products |
| Updates | Requires code deploy | Real-time via SQL |
| Search | O(n) linear scan | Indexed O(log n) |
| Cost | Free | Database hosting cost |

For a hackathon/demo, a static array is perfect. For production, you'd migrate to PostgreSQL or MongoDB.

---

## AI & LLM Concepts

**Q24. What is prompt engineering and how is it applied in this project?**

**A:** Prompt engineering is designing text prompts to get reliable, structured outputs from AI language models. Techniques used in `ai.service.js`:
- **Role assignment**: "You are SafeScan, an AI ingredient safety assistant" — gives the model context and a persona
- **Structured data injection**: Product data in a `--- PRODUCT DATA ---` block — clearly delimits facts from instructions
- **Output format specification**: "Write a 3-paragraph summary" with rules for each paragraph
- **Negative constraints**: "Do NOT invent data", "Do NOT diagnose medical conditions" — reduces hallucination
- **Style constraints**: "Use plain English", "no markdown headers" — enforces readable output

---

**Q25. What is Gemini 2.5 Flash and why was it chosen over other models?**

**A:** Gemini 2.5 Flash is Google's lightweight, fast language model optimized for speed and cost. We chose it because:
- Speed: Responds in 500ms–2s vs. Pro's 5–10s
- Cost: Cheaper per token
- Task complexity: Summarizing structured product data is a simple generation task that doesn't need the most powerful model
- Gemini Pro would be better for complex reasoning or long document analysis

---

**Q26. How does the AI service handle errors, and what could go wrong?**

**A:**
```js
try {
  const summary = await summarizeProduct(product)
  return res.status(200).json({ success: true, summary })
} catch (error) {
  return res.status(500).json({ success: false, error: 'Failed to generate summary' })
}
```
What can go wrong:
- Rate limit exceeded → Gemini returns 429; need exponential backoff + retry
- Network timeout → need `AbortSignal.timeout()`
- Empty response → should validate `response.text` before returning
- Content filtering → Gemini refuses if it thinks content is harmful; need a fallback message
- In production, add caching to avoid calling Gemini for the same product repeatedly

---

## Web Concepts

**Q27. What is the difference between localhost:5173 (frontend) and localhost:3000 (backend)? Why two separate servers?**

**A:** This is a decoupled architecture:
- **Frontend** (port 5173): Vite dev server — serves React HTML, CSS, JavaScript. Runs entirely in the browser after initial load.
- **Backend** (port 3000): Express server — handles API calls, database queries, AI calls. Never runs in the browser.

Benefits: Frontend and backend can be deployed independently (React on Vercel, backend on Cloud Run). Different scaling strategies. API keys and database credentials stay only on the server.

---

**Q28. What is the MediaDevices API and how does it relate to barcode scanning?**

**A:** The `MediaDevices` API is a browser Web API that provides access to input devices like cameras. ZXing uses it internally:
```js
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'environment' }  // 'environment' = rear camera on mobile
})
videoElement.srcObject = stream
```
This API requires HTTPS in production and a user permission prompt. Works on all modern browsers.

---

**Q29. What is the difference between `credentials: 'include'` and `credentials: 'same-origin'` in fetch()?**

**A:** `'same-origin'` (default) only sends cookies if the URL is the same origin as the page. `'include'` always sends cookies, even for cross-origin requests.

Since our frontend (port 5173) calls the backend (port 3000) — different origins — we need `credentials: 'include'` so Better Auth's session cookie is sent with the request. This pairs with the backend's `cors({ credentials: true })` setting.

---

**Q30. What is a React hook and what rules must you follow when using hooks?**

**A:** Hooks are functions that let you "hook into" React features (state, lifecycle, context) from functional components. Hooks used in this project: `useState`, `useEffect`, `useRef`, `useCallback`, `useParams`, `useNavigate`, `useSearchParams`, `useSession`.

**Rules of Hooks:**
1. Only call hooks at the top level — never inside loops, conditions, or nested functions
2. Only call hooks from React functions — not regular JavaScript functions

These rules exist because React uses the call order of hooks to associate state with the right hook. If you call a hook conditionally, the order changes between renders and React gets confused.

---

**Q31. How would you add a feature to save scan history for each user?**

**A:**

**Backend:**
- Add a `scan_history` table in Supabase: `(id, user_id, barcode, product_name, safety_score, scanned_at)`
- Add `POST /api/history` — saves a scan when it occurs
- Add `GET /api/history` — returns the user's scan history

**Frontend:**
- After `handleDetected` finds a product, call `POST /api/history`
- Add a `/history` page that calls `GET /api/history` and renders a list
- Add a link in the navbar

**Auth integration:**
- The `GET /api/history` route uses Better Auth's `auth.api.getSession()` to get the current user, then filters `scan_history` by `user_id`

---

## Summary of What You Learned in This Project

| Concept | Where You Used It |
|---|---|
| React functional components + hooks | `BarcodeScanner.tsx`, `scanner.tsx`, `App.tsx` |
| TypeScript interfaces and union types | `products.ts`, all `.tsx` files |
| useEffect cleanup (memory management) | `BarcodeScanner.tsx` |
| useCallback (memoization) | `scanner.tsx` handleDetected |
| useRef (DOM + mutable values) | `BarcodeScanner.tsx` videoRef, controlsRef |
| React Router (routing + protected routes) | `App.tsx` |
| Camera access via MediaDevices API | ZXing (under the hood) |
| Barcode decoding (ZXing) | `BarcodeScanner.tsx` |
| REST API design (Express) | `server.js`, all routes |
| Async/await and error handling | All services and pages |
| OAuth 2.0 flow | `auth.js` + Better Auth |
| HTTP-only cookies + CORS | `server.js`, `auth.js` |
| Prompt engineering for LLMs | `ai.service.js` |
| External API integration | `product.service.js` (Open Food Facts) |
| Local-first with remote fallback pattern | `product.service.js` |
| Environment variables + secrets management | `.env` files |
| Vite build tooling | `vite.config.ts` |

---

*Built with ❤️ as a learning project. SafeScan — Know what's in your food.*
