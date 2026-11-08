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
const resultTitle = document.getElementById('resultTitle');
const statOriginalSize = document.getElementById('statOriginalSize');
const statCompressedSize = document.getElementById('statCompressedSize');
const statReduction = document.getElementById('statReduction');
const resultNote = document.getElementById('resultNote');
const downloadAnywayContainer = document.getElementById('downloadAnywayContainer');
const actionBar = document.getElementById('actionBar');
const fileNameInput = document.getElementById('fileNameInput');
const compressBtn = document.getElementById('compressBtn');

let currentFile = null;
let currentArrayBuffer = null;
let totalPages = 0;
let selectedMode = 'raster';
let selectedScale = 0.9;
let selectedQuality = 0.50;
let selectedMaxDim = 1000;

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

        selectedMode = card.dataset.mode;
        selectedScale = parseFloat(card.dataset.scale);
        selectedQuality = parseFloat(card.dataset.quality);
        selectedMaxDim = parseInt(card.dataset.maxdim, 10);
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
        let compressedPdfBytes;

        if (selectedMode === 'stream') {
            progressText.textContent = 'Optimizing PDF object streams...';
            progressBarFill.style.width = '50%';
            progressPercent.textContent = '50%';

            await new Promise(resolve => setTimeout(resolve, 30));

            const originalPdf = await PDFDocument.load(currentArrayBuffer);
            compressedPdfBytes = await originalPdf.save({ useObjectStreams: true });

            progressBarFill.style.width = '100%';
            progressPercent.textContent = '100%';
        } else {
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

                // Calculate optimal scale without blowing up dimension caps
                let scale = selectedScale;
                const maxDim = Math.max(baseViewport.width, baseViewport.height);
                if (selectedMaxDim > 0 && maxDim * scale > selectedMaxDim) {
                    scale = selectedMaxDim / maxDim;
                }

                const renderViewport = page.getViewport({ scale: scale });

                const canvas = document.createElement('canvas');
                canvas.width = Math.round(renderViewport.width);
                canvas.height = Math.round(renderViewport.height);

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

            compressedPdfBytes = await newPdf.save({ useObjectStreams: true });
        }

        const originalBytes = currentFile.size;
        const compressedBytes = compressedPdfBytes.byteLength;

        statOriginalSize.textContent = formatBytes(originalBytes);
        statCompressedSize.textContent = formatBytes(compressedBytes);
        downloadAnywayContainer.innerHTML = '';

        let filename = fileNameInput ? fileNameInput.value.trim() : '';
        if (!filename) {
            filename = 'compressed.pdf';
        } else if (!filename.toLowerCase().endsWith('.pdf')) {
            filename += '.pdf';
        }

        function triggerDownload(bytes, name) {
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        if (compressedBytes < originalBytes) {
            const reductionRatio = Math.round((1 - compressedBytes / originalBytes) * 100);
            resultCard.className = 'result-card success';
            resultTitle.textContent = 'Compression Successful!';
            statReduction.className = 'reduction-badge';
            statReduction.textContent = `-${reductionRatio}% Reduction`;
            resultNote.textContent = 'Your compressed PDF was generated and downloaded successfully.';

            triggerDownload(compressedPdfBytes, filename);
        } else {
            resultCard.className = 'result-card warning';
            resultTitle.textContent = 'Document Already Optimized';
            statReduction.className = 'reduction-badge no-reduction';
            statReduction.textContent = 'No Reduction Possible';

            resultNote.innerHTML = `<strong>Notice:</strong> Your original document is already highly compact vector text and cannot be reduced further with this setting without quality loss. <strong>No file was downloaded</strong> to prevent storing a larger file. For text-heavy documents, try selecting <em>Lossless Stream Optimization</em>.`;

            const downloadAnywayBtn = document.createElement('button');
            downloadAnywayBtn.type = 'button';
            downloadAnywayBtn.className = 'btn-download-anyway';
            downloadAnywayBtn.textContent = `Download Larger Version Anyway (${formatBytes(compressedBytes)})`;
            downloadAnywayBtn.addEventListener('click', () => {
                triggerDownload(compressedPdfBytes, filename);
            });
            downloadAnywayContainer.appendChild(downloadAnywayBtn);
        }

        resultCard.style.display = 'block';

    } catch (error) {
        console.error('Error compressing PDF:', error);
        alert(`Failed to compress PDF: ${error.message}`);
    } finally {
        compressBtn.disabled = false;
        compressBtn.textContent = 'Compress & Download PDF';
        progressBox.style.display = 'none';
    }
}
