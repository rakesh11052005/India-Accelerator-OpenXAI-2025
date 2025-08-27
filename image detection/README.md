# Image Analyzer (On-Device, No AI)

Upload an image and get a concise summary plus a list of detected regions/objects using on-device image processing in the browser (OpenCV.js). No AI/LLM or external services required.

## Prerequisites
- Node.js 18+
  (No external AI dependencies.)

## Setup
```bash
npm install
```

## Run
```bash
npm run dev
# or
npm start
```

Open `http://localhost:3000` and upload or drag-drop an image.

## Configure
- Environment variables:
  - `PORT` (default `3000`)
  (No model configuration needed.)

## API
POST `/api/analyze` (form-data)
- field `image`: the image file (endpoint preserved for compatibility; analysis runs client-side)

Response JSON
```json
{
  "summary": "string",
  "objects": ["string"],
  "model": "on-device"
}
```

## Notes
- Files are stored in `uploads/` and not served publicly.
- Keep images < 10MB by default (config in `src/index.js`).
  (No model involved; analysis is heuristic-based using OpenCV.)

## Troubleshooting
- Windows path or permission issues: run your shell as Administrator.



