// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'LIB/pdf.worker.min_2.12.313.js';

const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const workspace = document.getElementById('workspace');
const actionBar = document.getElementById('actionBar');
const previewCanvas = document.getElementById('previewCanvas');
const previewInfo = document.getElementById('previewInfo');
const fileNameInput = document.getElementById('fileNameInput');
const downloadBtn = document.getElementById('downloadBtn');

// Form controls
const watermarkText = document.getElementById('watermarkText');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontSizeVal = document.getElementById('fontSizeVal');
const opacitySlider = document.getElementById('opacitySlider');
const opacityVal = document.getElementById('opacityVal');
const angleSlider = document.getElementById('angleSlider');
const angleVal = document.getElementById('angleVal');
const watermarkColor = document.getElementById('watermarkColor');
const colorDots = document.querySelectorAll('.color-dot');

let currentFile = null;
let currentArrayBuffer = null;
let basePageCanvas = null;
let totalPages = 0;
let previewScale = 1.0;

// Drag & Drop
dropArea.addEventListener('click', () => fileInput.click());

dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('highlight');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('highlight');
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('highlight');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        handleFile(fileInput.files[0]);
    }
});

// Event listeners for real-time preview updates
watermarkText.addEventListener('input', redrawPreview);

fontSizeSlider.addEventListener('input', () => {
    fontSizeVal.textContent = `${fontSizeSlider.value}px`;
    redrawPreview();
});

opacitySlider.addEventListener('input', () => {
    opacityVal.textContent = `${opacitySlider.value}%`;
    redrawPreview();
});

angleSlider.addEventListener('input', () => {
    angleVal.textContent = `${angleSlider.value}°`;
    redrawPreview();
});

watermarkColor.addEventListener('input', redrawPreview);

colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
        watermarkColor.value = dot.dataset.color;
        redrawPreview();
    });
});

downloadBtn.addEventListener('click', applyWatermarkAndDownload);

async function handleFile(file) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('Please select a valid PDF file.');
        return;
    }

    currentFile = file;
    workspace.style.display = 'none';
    actionBar.style.display = 'none';

    try {
        currentArrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument(currentArrayBuffer.slice(0)).promise;
        totalPages = pdfDoc.numPages;

        if (totalPages === 0) {
            alert('The selected PDF file has no pages.');
            return;
        }

        const baseName = file.name.replace(/\.[^/.]+$/, '');
        fileNameInput.value = `${baseName}_watermarked.pdf`;

        // Render page 1 to base canvas for preview
        const page = await pdfDoc.getPage(1);
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        // Calculate a responsive preview scale (max width ~500px)
        const targetWidth = Math.min(500, window.innerWidth - 80);
        previewScale = targetWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale: previewScale });

        basePageCanvas = document.createElement('canvas');
        basePageCanvas.width = viewport.width;
        basePageCanvas.height = viewport.height;
        const baseCtx = basePageCanvas.getContext('2d');

        await page.render({
            canvasContext: baseCtx,
            viewport: viewport
        }).promise;

        previewCanvas.width = viewport.width;
        previewCanvas.height = viewport.height;

        previewInfo.textContent = `Page 1 of ${totalPages} (${Math.round(unscaledViewport.width)} × ${Math.round(unscaledViewport.height)} pt)`;

        workspace.style.display = 'grid';
        actionBar.style.display = 'block';

        redrawPreview();

    } catch (error) {
        console.error('Error loading PDF for watermarking:', error);
        alert(`Failed to load PDF: ${error.message}`);
    }
}

function redrawPreview() {
    if (!basePageCanvas) return;

    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    // Draw the original base page
    ctx.drawImage(basePageCanvas, 0, 0);

    const text = watermarkText.value.trim();
    if (!text) return;

    const size = parseInt(fontSizeSlider.value, 10) * previewScale;
    const opacity = parseInt(opacitySlider.value, 10) / 100;
    const angle = parseInt(angleSlider.value, 10);
    const color = watermarkColor.value;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cx = previewCanvas.width / 2;
    const cy = previewCanvas.height / 2;

    ctx.translate(cx, cy);
    // Canvas rotation is clockwise for positive radians
    // PDF coordinates have Y going up, Canvas has Y going down; so angle sign matches visual expectation
    ctx.rotate((-angle * Math.PI) / 180);
    ctx.fillText(text, 0, 0);
    ctx.restore();
}

function hexToRgb01(hex) {
    const cleanHex = hex.replace('#', '');
    const num = parseInt(cleanHex, 16);
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;
    return { r, g, b };
}

async function applyWatermarkAndDownload() {
    if (!currentArrayBuffer) return;

    const text = watermarkText.value.trim();
    if (!text) {
        alert('Please enter watermark text.');
        return;
    }

    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Applying watermark...';

    try {
        const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.load(currentArrayBuffer);
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const fontSize = parseInt(fontSizeSlider.value, 10);
        const opacity = parseInt(opacitySlider.value, 10) / 100;
        const angle = parseInt(angleSlider.value, 10);
        const { r, g, b } = hexToRgb01(watermarkColor.value);

        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        const rad = (angle * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const pages = pdfDoc.getPages();

        pages.forEach(page => {
            const { width, height } = page.getSize();
            const cx = width / 2;
            const cy = height / 2;

            // Center calculation for rotated text:
            // Text origin (bottom-left) relative to center of text box
            const halfW = textWidth / 2;
            const halfH = textHeight / 2;

            const dx = halfW * cos - halfH * sin;
            const dy = halfW * sin + halfH * cos;

            page.drawText(text, {
                x: cx - dx,
                y: cy - dy,
                size: fontSize,
                font: font,
                color: rgb(r, g, b),
                opacity: opacity,
                rotate: degrees(angle)
            });
        });

        const watermarkedPdfBytes = await pdfDoc.save();

        let filename = fileNameInput ? fileNameInput.value.trim() : '';
        if (!filename) {
            filename = 'watermarked.pdf';
        } else if (!filename.toLowerCase().endsWith('.pdf')) {
            filename += '.pdf';
        }

        const blob = new Blob([watermarkedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error applying watermark:', error);
        alert(`Failed to apply watermark: ${error.message}`);
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'Apply Watermark & Download';
    }
}
