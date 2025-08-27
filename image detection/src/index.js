import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
// Ollama removed per request; client does on-device analysis now

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 3000

const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now()
    const ext = path.extname(file.originalname)
    const base = path.basename(file.originalname, ext)
    cb(null, `${base}-${timestamp}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
})

app.use(express.static(path.join(__dirname, '..', 'public')))

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

// Removed Ollama health endpoint

app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded. Field name must be "image".' })
    }
    // Analysis is done in-browser (OpenCV). Keep endpoint for compatibility.
    res.json({ summary: 'Client-side analysis performed.', objects: [], model: 'on-device' })
  } catch (error) {
    console.error('Analyze error:', error)
    res.status(500).json({ error: 'Failed to analyze image', details: String(error?.message || error) })
  }
})

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})



