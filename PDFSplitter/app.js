// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'LIB/pdf.worker.min_2.12.313.js';

const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const controlsPanel = document.getElementById('controlsPanel');
const pageRangeInput = document.getElementById('pageRangeInput');
const selectAllBtn = document.getElementById('selectAllBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const invertBtn = document.getElementById('invertBtn');
const selectionCount = document.getElementById('selectionCount');
const thumbnailContainer = document.getElementById('thumbnailContainer');
const filenameGroup = document.getElementById('filenameGroup');
const fileNameInput = document.getElementById('fileNameInput');
const splitBtn = document.getElementById('splitBtn');

let currentFile = null;
let currentArrayBuffer = null;
let totalPages = 0;
let selectedPages = new Set();
let isUpdatingFromRange = false;

// Drag and drop event listeners
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

// Selection button listeners
selectAllBtn.addEventListener('click', () => {
    selectedPages.clear();
    for (let i = 1; i <= totalPages; i++) {
        selectedPages.add(i);
    }
    updateSelectionUI();
});

clearAllBtn.addEventListener('click', () => {
    selectedPages.clear();
    updateSelectionUI();
});

invertBtn.addEventListener('click', () => {
    const newSelected = new Set();
    for (let i = 1; i <= totalPages; i++) {
        if (!selectedPages.has(i)) {
            newSelected.add(i);
        }
    }
    selectedPages = newSelected;
    updateSelectionUI();
});

pageRangeInput.addEventListener('input', () => {
    isUpdatingFromRange = true;
    selectedPages = parsePageRange(pageRangeInput.value, totalPages);
    updateThumbnailsVisual();
    updateCounterAndButton();
    isUpdatingFromRange = false;
});

splitBtn.addEventListener('click', splitAndDownload);

async function handleFile(file) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('Please select a valid PDF file.');
        return;
    }

    currentFile = file;
    thumbnailContainer.innerHTML = '<p style="color:#6b7177; font-size:14px;">Loading pages and generating previews...</p>';
    controlsPanel.style.display = 'none';
    filenameGroup.style.display = 'none';
    splitBtn.style.display = 'none';

    try {
        currentArrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument(currentArrayBuffer.slice(0)).promise;
        totalPages = pdfDoc.numPages;

        if (totalPages === 0) {
            alert('The selected PDF file has no pages.');
            thumbnailContainer.innerHTML = '';
            return;
        }

        // Set default output filename based on uploaded file
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        fileNameInput.value = `${baseName}_extracted.pdf`;

        // Initialize selection (default: select all)
        selectedPages.clear();
        for (let i = 1; i <= totalPages; i++) {
            selectedPages.add(i);
        }

        thumbnailContainer.innerHTML = '';

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: 0.22 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            const thumbnailUrl = canvas.toDataURL();

            const thumbDiv = document.createElement('div');
            thumbDiv.className = 'thumbnail selected';
            thumbDiv.dataset.page = pageNum;
            thumbDiv.innerHTML = `
                <span class="page-number">#${pageNum}</span>
                <span class="check-indicator">&#10003;</span>
                <img src="${thumbnailUrl}" alt="Page ${pageNum}">
                <div class="page-label">Page ${pageNum}</div>
            `;

            thumbDiv.addEventListener('click', () => {
                togglePageSelection(pageNum);
            });

            thumbnailContainer.appendChild(thumbDiv);
        }

        controlsPanel.style.display = 'block';
        filenameGroup.style.display = 'block';
        splitBtn.style.display = 'inline-block';

        updateSelectionUI();

    } catch (error) {
        console.error('Error loading PDF:', error);
        alert(`Failed to load PDF: ${error.message}`);
        thumbnailContainer.innerHTML = '';
    }
}

function togglePageSelection(pageNum) {
    if (selectedPages.has(pageNum)) {
        selectedPages.delete(pageNum);
    } else {
        selectedPages.add(pageNum);
    }
    updateSelectionUI();
}

function updateSelectionUI() {
    updateThumbnailsVisual();
    updateCounterAndButton();
    if (!isUpdatingFromRange) {
        pageRangeInput.value = generatePageRangeString(selectedPages);
    }
}

function updateThumbnailsVisual() {
    const thumbnails = thumbnailContainer.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumb => {
        const pageNum = parseInt(thumb.dataset.page, 10);
        if (selectedPages.has(pageNum)) {
            thumb.classList.add('selected');
        } else {
            thumb.classList.remove('selected');
        }
    });
}

function updateCounterAndButton() {
    selectionCount.textContent = `${selectedPages.size} of ${totalPages} pages selected`;
    splitBtn.disabled = selectedPages.size === 0;
}

function parsePageRange(rangeStr, maxPage) {
    const pages = new Set();
    const cleanStr = rangeStr.trim();
    if (!cleanStr) return pages;

    const parts = cleanStr.split(',');
    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
            const [startStr, endStr] = trimmed.split('-');
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            if (!isNaN(start) && !isNaN(end)) {
                const low = Math.max(1, Math.min(start, end));
                const high = Math.min(maxPage, Math.max(start, end));
                for (let i = low; i <= high; i++) {
                    pages.add(i);
                }
            }
        } else {
            const single = parseInt(trimmed, 10);
            if (!isNaN(single) && single >= 1 && single <= maxPage) {
                pages.add(single);
            }
        }
    }
    return pages;
}

function generatePageRangeString(pageSet) {
    if (pageSet.size === 0) return '';
    const sorted = Array.from(pageSet).sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === end + 1) {
            end = sorted[i];
        } else {
            ranges.push(start === end ? `${start}` : `${start}-${end}`);
            start = sorted[i];
            end = sorted[i];
        }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    return ranges.join(', ');
}

async function splitAndDownload() {
    if (!currentArrayBuffer || selectedPages.size === 0) return;

    splitBtn.disabled = true;
    splitBtn.textContent = 'Extracting pages...';

    try {
        const { PDFDocument } = PDFLib;
        const originalPdf = await PDFDocument.load(currentArrayBuffer);
        const newPdf = await PDFDocument.create();

        // Convert 1-based page numbers to 0-based indices
        const pageIndices = Array.from(selectedPages)
            .sort((a, b) => a - b)
            .map(num => num - 1);

        const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
        copiedPages.forEach(page => newPdf.addPage(page));

        const newPdfBytes = await newPdf.save();

        let filename = fileNameInput ? fileNameInput.value.trim() : '';
        if (!filename) {
            filename = 'extracted.pdf';
        } else if (!filename.toLowerCase().endsWith('.pdf')) {
            filename += '.pdf';
        }

        const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error extracting PDF pages:', error);
        alert(`Failed to extract pages: ${error.message}`);
    } finally {
        splitBtn.disabled = selectedPages.size === 0;
        splitBtn.textContent = 'Extract Selected Pages';
    }
}
