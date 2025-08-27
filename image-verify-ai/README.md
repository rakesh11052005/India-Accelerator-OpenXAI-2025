# Image Verify AI (TypeScript, no backend)

This is a zero-backend web app that detects and lists objects in a user-uploaded image using TensorFlow.js COCO-SSD. All inference runs in the browser.

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Build TypeScript once or in watch mode:

```bash
npm run build
# or
npm run watch
```

3. Open `index.html` in your browser. No server required.

## Notes

- The page loads `tfjs` and `coco-ssd` from CDNs, while the UI and logic are authored in TypeScript and compiled to `dist/main.js`.
- No images leave your device.


