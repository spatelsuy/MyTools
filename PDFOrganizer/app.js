// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'LIB/pdf.worker.min_2.12.313.js';

const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const toolbar = document.getElementById('toolbar');
const totalPagesCount = document.getElementById('totalPagesCount');
const reverseBtn = document.getElementById('reverseBtn');
const resetBtn = document.getElementById('resetBtn');
const thumbnailContainer = document.getElementById('thumbnailContainer');
const actionBar = document.getElementById('actionBar');
const fileNameInput = document.getElementById('fileNameInput');
const saveBtn = document.getElementById('saveBtn');
const statusMsg = document.getElementById('statusMsg');

let currentFile = null;
let currentArrayBuffer = null;
let originalPages = [];
let currentOrder = [];

// Drag & drop for file upload
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

// Toolbar buttons
reverseBtn.addEventListener('click', () => {
    if (currentOrder.length <= 1) return;
    currentOrder.reverse();
    renderCards();
    checkOrderChanged();
});

resetBtn.addEventListener('click', () => {
    currentOrder = [...originalPages];
    renderCards();
    checkOrderChanged();
});

saveBtn.addEventListener('click', saveRearrangedPDF);

async function handleFile(file) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        alert('Please select a valid PDF file.');
        return;
    }

    currentFile = file;
    thumbnailContainer.innerHTML = '<p style="color:#6b7177; font-size:14px;">Loading pages and rendering previews...</p>';
    toolbar.style.display = 'none';
    actionBar.style.display = 'none';

    try {
        currentArrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument(currentArrayBuffer.slice(0)).promise;
        const total = pdfDoc.numPages;

        if (total === 0) {
            alert('The selected PDF file has no pages.');
            thumbnailContainer.innerHTML = '';
            return;
        }

        const baseName = file.name.replace(/\.[^/.]+$/, '');
        fileNameInput.value = `${baseName}_rearranged.pdf`;

        originalPages = [];

        for (let pageNum = 1; pageNum <= total; pageNum++) {
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

            originalPages.push({
                originalPageNum: pageNum,
                thumbnailUrl: thumbnailUrl
            });
        }

        currentOrder = [...originalPages];
        totalPagesCount.textContent = total;

        toolbar.style.display = 'flex';
        actionBar.style.display = 'block';

        renderCards();
        checkOrderChanged();

    } catch (error) {
        console.error('Error loading PDF:', error);
        alert(`Failed to load PDF: ${error.message}`);
        thumbnailContainer.innerHTML = '';
    }
}

function renderCards() {
    thumbnailContainer.innerHTML = '';

    currentOrder.forEach((pageObj, index) => {
        const card = document.createElement('div');
        card.className = 'thumbnail-card';
        card.draggable = true;
        card.dataset.index = index;

        const isFirst = index === 0;
        const isLast = index === currentOrder.length - 1;

        card.innerHTML = `
            <div class="card-badges">
                <span class="pos-badge">Pos #${index + 1}</span>
                <span class="original-badge">Page ${pageObj.originalPageNum}</span>
            </div>
            <img src="${pageObj.thumbnailUrl}" alt="Original Page ${pageObj.originalPageNum}">
            <div class="card-controls">
                <button type="button" class="btn-nav btn-move-left" data-index="${index}" ${isFirst ? 'disabled' : ''} title="Move left">←</button>
                <button type="button" class="btn-nav btn-move-right" data-index="${index}" ${isLast ? 'disabled' : ''} title="Move right">→</button>
            </div>
        `;

        // Arrow button listeners
        const leftBtn = card.querySelector('.btn-move-left');
        const rightBtn = card.querySelector('.btn-move-right');

        leftBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (index > 0) {
                [currentOrder[index], currentOrder[index - 1]] = [currentOrder[index - 1], currentOrder[index]];
                renderCards();
                checkOrderChanged();
            }
        });

        rightBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (index < currentOrder.length - 1) {
                [currentOrder[index], currentOrder[index + 1]] = [currentOrder[index + 1], currentOrder[index]];
                renderCards();
                checkOrderChanged();
            }
        });

        // Drag & drop event listeners
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', index);
            setTimeout(() => card.classList.add('dragging'), 0);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });

        thumbnailContainer.appendChild(card);
    });

    setupContainerDragOver();
}

function setupContainerDragOver() {
    thumbnailContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        const draggingElement = document.querySelector('.thumbnail-card.dragging');
        if (!draggingElement) return;

        const afterElement = getDragAfterElement(thumbnailContainer, e.clientX, e.clientY);
        if (afterElement == null) {
            thumbnailContainer.appendChild(draggingElement);
        } else {
            thumbnailContainer.insertBefore(draggingElement, afterElement);
        }
    });

    thumbnailContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        // Read new order from DOM elements
        const cardElements = Array.from(thumbnailContainer.querySelectorAll('.thumbnail-card'));
        const newOrder = [];
        cardElements.forEach(card => {
            const oldIndex = parseInt(card.dataset.index, 10);
            newOrder.push(currentOrder[oldIndex]);
        });
        currentOrder = newOrder;
        renderCards();
        checkOrderChanged();
    });
}

function getDragAfterElement(container, x, y) {
    const draggableElements = [...container.querySelectorAll('.thumbnail-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offsetX = x - (box.left + box.width / 2);
        const offsetY = y - (box.top + box.height / 2);
        const distance = Math.hypot(offsetX, offsetY);

        // Check if cursor is before the element
        if (x < box.left + box.width / 2 && y < box.bottom) {
            if (closest == null || distance < closest.distance) {
                return { distance, element: child };
            }
        }
        return closest;
    }, null)?.element;
}

function checkOrderChanged() {
    let changed = false;
    if (currentOrder.length !== originalPages.length) {
        changed = true;
    } else {
        for (let i = 0; i < currentOrder.length; i++) {
            if (currentOrder[i].originalPageNum !== originalPages[i].originalPageNum) {
                changed = true;
                break;
            }
        }
    }

    if (changed) {
        saveBtn.disabled = false;
        statusMsg.textContent = 'Page order changed! Ready to save.';
        statusMsg.style.color = '#1f6f54';
    } else {
        saveBtn.disabled = true;
        statusMsg.textContent = 'Change the page order to enable save.';
        statusMsg.style.color = '#6b7177';
    }
}

async function saveRearrangedPDF() {
    if (!currentArrayBuffer || currentOrder.length === 0) return;

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving PDF...';

    try {
        const { PDFDocument } = PDFLib;
        const originalPdf = await PDFDocument.load(currentArrayBuffer);
        const newPdf = await PDFDocument.create();

        // Convert 1-based original page numbers to 0-based indices
        const pageIndices = currentOrder.map(pageObj => pageObj.originalPageNum - 1);

        const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
        copiedPages.forEach(page => newPdf.addPage(page));

        const newPdfBytes = await newPdf.save();

        let filename = fileNameInput ? fileNameInput.value.trim() : '';
        if (!filename) {
            filename = 'rearranged.pdf';
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
        console.error('Error saving rearranged PDF:', error);
        alert(`Failed to save rearranged PDF: ${error.message}`);
    } finally {
        checkOrderChanged();
        saveBtn.textContent = 'Save Rearranged PDF';
    }
}
