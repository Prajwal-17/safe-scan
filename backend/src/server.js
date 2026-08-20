import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth.js'
import aiRoutes from "./routes/ai.routes.js";

const app = express()
const PORT = process.env.PORT || 3000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// ── CORS 
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,        // required for auth session cookies
}))

// ── Better Auth
// Must be mounted BEFORE express.json() — Better Auth reads raw request body
app.all('/api/auth/*splat', toNodeHandler(auth))

// ── Body parser (for your own routes) 
app.use(express.json())

//AI routes
app.use("/api/ai", aiRoutes)

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'safescan-api',
    timestamp: new Date().toISOString(),
  })
})

// ── 404 fallback 
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// ── Start server 
app.listen(PORT, () => {
  console.log(`SafeScan API running on http://localhost:${PORT}`)
})
