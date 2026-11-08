// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'LIB/pdf.worker.min_2.12.313.js';

const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const fileSummaryCard = document.getElementById('fileSummaryCard');
const originalFileName = document.getElementById('originalFileName');
const originalFileSize = document.getElementById('originalFileSize');
const originalPageCount = document.getElementById('originalPageCount');
const presetContainer = document.getElementById('presetContainer');
const presetCards = document.querySelectorAll('.preset-card');
const progressBox = document.getElementById('progressBox');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');
const progressBarFill = document.getElementById('progressBarFill');
const resultCard = document.getElementById('resultCard');
const statOriginalSize = document.getElementById('statOriginalSize');
const statCompressedSize = document.getElementById('statCompressedSize');
const statReduction = document.getElementById('statReduction');
const actionBar = document.getElementById('actionBar');
const fileNameInput = document.getElementById('fileNameInput');
const compressBtn = document.getElementById('compressBtn');

let currentFile = null;
let currentArrayBuffer = null;
let totalPages = 0;
let selectedScale = 1.2;
let selectedQuality = 0.65;

// Drag & drop file upload
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

// Preset selection
presetCards.forEach(card => {
    card.addEventListener('click', () => {
        presetCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;

        selectedScale = parseFloat(card.dataset.scale);
        selectedQuality = parseFloat(card.dataset.quality);
    });
});

compressBtn.addEventListener('click', compressAndDownload);

function dataUrlToUint8Array(dataUrl) {
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function handleFile(file) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('Please select a valid PDF file.');
        return;
    }

    currentFile = file;
    fileSummaryCard.style.display = 'none';
    presetContainer.style.display = 'none';
    progressBox.style.display = 'none';
    resultCard.style.display = 'none';
    actionBar.style.display = 'none';

    try {
        currentArrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument(currentArrayBuffer.slice(0)).promise;
        totalPages = pdfDoc.numPages;

        if (totalPages === 0) {
            alert('The selected PDF file has no pages.');
            return;
        }

        originalFileName.textContent = file.name;
        originalFileSize.textContent = formatBytes(file.size);
        originalPageCount.textContent = totalPages;

        const baseName = file.name.replace(/\.[^/.]+$/, '');
        fileNameInput.value = `${baseName}_compressed.pdf`;

        fileSummaryCard.style.display = 'flex';
        presetContainer.style.display = 'block';
        actionBar.style.display = 'block';

    } catch (error) {
        console.error('Error loading PDF:', error);
        alert(`Failed to load PDF: ${error.message}`);
    }
}

async function compressAndDownload() {
    if (!currentArrayBuffer || totalPages === 0) return;

    compressBtn.disabled = true;
    compressBtn.textContent = 'Compressing...';
    resultCard.style.display = 'none';
    progressBox.style.display = 'block';

    progressBarFill.style.width = '0%';
    progressPercent.textContent = '0%';
    progressText.textContent = `Preparing document...`;

    try {
        const { PDFDocument } = PDFLib;
        const newPdf = await PDFDocument.create();
        const pdfDoc = await pdfjsLib.getDocument(currentArrayBuffer.slice(0)).promise;

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const pct = Math.round(((pageNum - 1) / totalPages) * 100);
            progressBarFill.style.width = `${pct}%`;
            progressPercent.textContent = `${pct}%`;
            progressText.textContent = `Compressing page ${pageNum} of ${totalPages}...`;

            // Give the browser time to update UI
            await new Promise(resolve => setTimeout(resolve, 20));

            const page = await pdfDoc.getPage(pageNum);
            const baseViewport = page.getViewport({ scale: 1.0 });
            const renderViewport = page.getViewport({ scale: selectedScale });

            const canvas = document.createElement('canvas');
            canvas.width = renderViewport.width;
            canvas.height = renderViewport.height;

            const ctx = canvas.getContext('2d');
            await page.render({
                canvasContext: ctx,
                viewport: renderViewport
            }).promise;

            const jpegDataUrl = canvas.toDataURL('image/jpeg', selectedQuality);
            const jpegBytes = dataUrlToUint8Array(jpegDataUrl);

            const embeddedJpg = await newPdf.embedJpg(jpegBytes);
            const newPage = newPdf.addPage([baseViewport.width, baseViewport.height]);

            newPage.drawImage(embeddedJpg, {
                x: 0,
                y: 0,
                width: baseViewport.width,
                height: baseViewport.height
            });
        }

        progressBarFill.style.width = '100%';
        progressPercent.textContent = '100%';
        progressText.textContent = 'Finalizing compressed PDF...';

        const compressedPdfBytes = await newPdf.save({ useObjectStreams: true });

        const originalBytes = currentFile.size;
        const compressedBytes = compressedPdfBytes.byteLength;
        const reductionRatio = Math.max(0, Math.round((1 - compressedBytes / originalBytes) * 100));

        statOriginalSize.textContent = formatBytes(originalBytes);
        statCompressedSize.textContent = formatBytes(compressedBytes);
        statReduction.textContent = `-${reductionRatio}% Reduction`;

        resultCard.style.display = 'block';

        let filename = fileNameInput ? fileNameInput.value.trim() : '';
        if (!filename) {
            filename = 'compressed.pdf';
        } else if (!filename.toLowerCase().endsWith('.pdf')) {
            filename += '.pdf';
        }

        const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error compressing PDF:', error);
        alert(`Failed to compress PDF: ${error.message}`);
    } finally {
        compressBtn.disabled = false;
        compressBtn.textContent = 'Compress & Download PDF';
        progressBox.style.display = 'none';
    }
}
