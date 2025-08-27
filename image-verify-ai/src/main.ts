type Detection = {
    bbox: [number, number, number, number];
    class: string;
    score: number;
};

let modelPromise: Promise<any> | null = null;

function ensureModelLoaded(): Promise<any> {
    if (!modelPromise) {
        const startedAt = performance.now();
        setStatus("Loading model…");
        modelPromise = cocoSsd.load().then((m: any) => {
            const ms = Math.round(performance.now() - startedAt);
            setStatus(`Model loaded in ${ms} ms. Ready.`);
            return m;
        });
    }
    return modelPromise;
}

const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const chooseBtn = document.getElementById('chooseBtn') as HTMLButtonElement;
const dropZone = document.getElementById('dropZone') as HTMLDivElement;
const imgEl = document.getElementById('preview') as HTMLImageElement;
const canvas = document.getElementById('overlay') as HTMLCanvasElement;
const itemsList = document.getElementById('itemsList') as HTMLUListElement;
const statusEl = document.getElementById('status') as HTMLDivElement;

chooseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) handleFile(file);
});

;['dragenter','dragover'].forEach(evt => {
    dropZone.addEventListener(evt, e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragging');
    });
});
;['dragleave','drop'].forEach(evt => {
    dropZone.addEventListener(evt, e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragging');
    });
});
dropZone.addEventListener('drop', e => {
    const dt = (e as DragEvent).dataTransfer;
    if (!dt) return;
    const file = dt.files && dt.files[0];
    if (file) handleFile(file);
});
dropZone.addEventListener('click', () => fileInput.click());
window.addEventListener('paste', e => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
        if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) { handleFile(file); break; }
        }
    }
});

imgEl.onload = () => {
    fitCanvasToImage();
};

function setStatus(msg: string) {
    statusEl.textContent = msg;
}

function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
        setStatus('Please upload an image file.');
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        imgEl.src = String(reader.result);
        // Run detection after the image renders
        imgEl.decode().then(() => detect());
    };
    reader.readAsDataURL(file);
}

async function detect() {
    if (!imgEl.naturalWidth) return;
    setStatus('Detecting…');
    const model = await ensureModelLoaded();
    const predictions = await model.detect(imgEl) as Detection[];
    drawDetections(predictions);
    listItems(predictions);
    const top = predictions.slice(0, 1)[0];
    if (top) {
        setStatus(`Found ${predictions.length} objects. Top: ${top.class} (${Math.round(top.score*100)}%)`);
    } else {
        setStatus('No objects detected.');
    }
}

function fitCanvasToImage() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = imgEl.naturalWidth;
    const height = imgEl.naturalHeight;
    // Fit image to container width while preserving aspect
    const container = canvas.parentElement as HTMLElement;
    const maxWidth = container.clientWidth || width;
    const scale = Math.min(1, maxWidth / width);
    const displayWidth = Math.round(width * scale);
    const displayHeight = Math.round(height * scale);

    imgEl.style.width = displayWidth + 'px';
    imgEl.style.height = displayHeight + 'px';

    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    canvas.width = Math.round(displayWidth * dpr);
    canvas.height = Math.round(displayHeight * dpr);
}

function drawDetections(preds: Detection[]) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2 * dpr;
    ctx.font = `${12 * dpr}px Inter, system-ui, sans-serif`;
    ctx.textBaseline = 'top';

    const displayWidth = parseInt(canvas.style.width || '0', 10) || imgEl.clientWidth;
    const naturalWidth = imgEl.naturalWidth || displayWidth;
    const scale = (displayWidth / naturalWidth) * dpr;

    for (const p of preds) {
        const [x, y, w, h] = p.bbox;
        const sx = Math.round(x * scale);
        const sy = Math.round(y * scale);
        const sw = Math.round(w * scale);
        const sh = Math.round(h * scale);
        const label = `${p.class} ${Math.round(p.score * 100)}%`;

        // Box
        ctx.strokeStyle = '#5b8cff';
        ctx.strokeRect(sx, sy, sw, sh);

        // Label background
        const paddingX = 4 * dpr;
        const paddingY = 2 * dpr;
        const metrics = ctx.measureText(label);
        const textW = metrics.width;
        const textH = 12 * dpr + paddingY * 2;
        ctx.fillStyle = 'rgba(11, 16, 32, 0.8)';
        ctx.fillRect(sx, sy - textH, textW + paddingX * 2, textH);

        // Label text
        ctx.fillStyle = '#e7ecff';
        ctx.fillText(label, sx + paddingX, sy - textH + paddingY);
    }
}

function listItems(preds: Detection[]) {
    itemsList.innerHTML = '';
    if (!preds.length) return;
    const counts = new Map<string, number>();
    for (const p of preds) {
        counts.set(p.class, (counts.get(p.class) || 0) + 1);
    }
    const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [label, count] of entries) {
        const li = document.createElement('li');
        const name = document.createElement('span');
        const qty = document.createElement('span');
        name.textContent = label;
        qty.textContent = String(count);
        li.appendChild(name);
        li.appendChild(qty);
        itemsList.appendChild(li);
    }
}

window.addEventListener('resize', () => {
    if (!imgEl.naturalWidth) return;
    fitCanvasToImage();
});


