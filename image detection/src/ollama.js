import fs from 'fs/promises'
import path from 'path'
import fetch from 'node-fetch'

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'

function buildPrompt() {
  return `You are a vision assistant. Analyze the provided image and return strictly valid JSON with this shape:
{
  "summary": string,          // 1-2 concise sentences describing the image
  "objects": string[]         // flat list of the main visible objects
}
Rules:
- Do not include any extra keys.
- Use lowercase nouns for objects.
- If uncertain about an object, omit it.
`}

export async function analyzeImageWithOllama({ imagePath, model = 'llama3.2-vision' }) {
  const absPath = path.resolve(imagePath)
  const imageBuffer = await fs.readFile(absPath)
  const base64 = imageBuffer.toString('base64')

  const prompt = buildPrompt()

  const body = {
    model,
    prompt,
    images: [base64],
    stream: false,
    options: {
      temperature: 0.2
    }
  }

  const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Ollama request failed: ${response.status} ${response.statusText} ${text}`)
  }

  const data = await response.json()

  const rawOutput = data.response || ''
  let parsed
  try {
    // try direct JSON
    parsed = JSON.parse(rawOutput)
  } catch {
    // try to extract JSON block
    const match = rawOutput.match(/\{[\s\S]*\}/)
    if (match) {
      parsed = JSON.parse(match[0])
    } else {
      throw new Error('Model did not return JSON')
    }
  }

  const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : ''
  const objects = Array.isArray(parsed.objects) ? parsed.objects.map(o => String(o).toLowerCase().trim()).filter(Boolean) : []

  return { summary, objects, model }
}



