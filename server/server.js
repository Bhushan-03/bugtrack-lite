
const authRoutes = require('./routes/auth')
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const dns = require('node:dns')

const bugRoutes = require('./routes/bugs')
const teamRoutes = require('./routes/teams')

const rateLimit = require('express-rate-limit')

dns.setServers(['8.8.8.8'])

require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
})


const teamJoinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many invitation attempts. Please try again in 15 minutes.',
  },
})


const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as local API tools.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error('Not allowed by CORS'))
    },
  })
)

app.use(express.json({ limit: '100kb' }))


app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/bugs', bugRoutes)
app.use('/api/teams/join', teamJoinLimiter)
app.use('/api/teams', teamRoutes)


app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BugTrack Lite API is running',
    database:
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
})

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing from the .env file')
    }

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from the .env file')
    }

    await mongoose.connect(process.env.MONGODB_URI)

    console.log('MongoDB Atlas connected successfully')

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Server startup failed:', error.message)
    process.exit(1)
  }
}

startServer()
