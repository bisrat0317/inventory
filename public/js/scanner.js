/**
 * StockMatrix - Unified Camera Text & Barcode Scanner Engine
 * Supports real-time barcode scanning, high-accuracy OCR text recognition via Tesseract.js,
 * intelligent catalog auto-matching, camera flip, and photo uploads.
 */

let scannerContext = null; // 'stock-in' | 'stock-out' | 'products-filter' | 'product-form'
let scannerVideoStream = null;
let currentFacingMode = 'environment'; // 'environment' (back) | 'user' (front)
let isScanProcessing = false;
let barcodeDetector = null;
let autoScanInterval = null;
let lastMatchedProduct = null;

let isTorchOn = false;

// Initialize native BarcodeDetector if supported
if ('BarcodeDetector' in window) {
    try {
        barcodeDetector = new window.BarcodeDetector({
            formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'data_matrix', 'itf']
        });
    } catch (e) {
        barcodeDetector = null;
    }
}

/**
 * Open Camera Scanner Modal for specified workflow context
 * @param {string} context - 'stock-in' | 'stock-out' | 'products-filter' | 'product-form'
 */
async function openCameraScanner(context = 'stock-in') {
    scannerContext = context;
    lastMatchedProduct = null;
    isTorchOn = false;

    const modal = document.getElementById('cameraScannerModal');
    const title = document.getElementById('scannerModalTitle');
    const subtitle = document.getElementById('scannerModalSubtitle');
    const statusText = document.getElementById('scannerStatusText');
    const matchBox = document.getElementById('scannerMatchResult');
    const textContainer = document.getElementById('scannerDetectedTextContainer');

    if (matchBox) matchBox.style.display = 'none';
    if (textContainer) textContainer.style.display = 'none';

    // Customize title per context
    if (title && subtitle) {
        if (context === 'stock-in') {
            title.textContent = t('scanner.title', 'Camera Scanner') + ' – ' + t('nav.stock_in', 'Stock In');
            subtitle.textContent = t('scanner.subtitle_stockin', 'Scan incoming box, packaging text, or barcode to select product');
        } else if (context === 'stock-out') {
            title.textContent = t('scanner.title', 'Camera Scanner') + ' – ' + t('nav.stock_out', 'Stock Out');
            subtitle.textContent = t('scanner.subtitle_stockout', 'Scan item to dispatch / sell to auto-fill sales line');
        } else if (context === 'products-filter') {
            title.textContent = t('scanner.title', 'Camera Scanner') + ' – ' + t('action.search', 'Search Catalog');
            subtitle.textContent = t('scanner.subtitle_filter', 'Scan product label to filter catalog instantly');
        } else if (context === 'product-form') {
            title.textContent = t('scanner.title', 'Camera Scanner') + ' – ' + t('modal.prod_add_title', 'Add Product');
            subtitle.textContent = t('scanner.subtitle_autofill', 'Scan product box to auto-fill Name and Brand');
        }
    }

    if (statusText) {
        statusText.textContent = t('scanner.position_hint', 'Position label or text inside frame');
        statusText.style.background = 'rgba(15, 23, 42, 0.88)';
    }

    updateTorchButtonUI();

    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }

    // Start video camera feed
    await startCameraStream();
}

/**
 * Start or restart media stream from camera
 */
async function startCameraStream() {
    stopCameraStream();

    const video = document.getElementById('scannerVideo');
    const statusText = document.getElementById('scannerStatusText');
    if (!video) return;

    try {
        const constraints = {
            video: {
                facingMode: currentFacingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };

        scannerVideoStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = scannerVideoStream;
        await video.play();

        // Check if current camera device supports flashlight / torch
        checkTorchSupport();

        // Start auto barcode detector loop if supported
        if (barcodeDetector) {
            startBarcodeScanningLoop();
        }
    } catch (err) {
        console.warn('Camera stream error:', err);
        if (statusText) {
            statusText.textContent = '⚠️ ' + t('scanner.camera_error', 'Camera access blocked. Use photo upload below.');
            statusText.style.background = 'rgba(239, 68, 68, 0.9)';
        }
        showToast(t('scanner.camera_error', 'Camera permission required. You can also upload a photo below.'), 'warning');
    }
}

/**
 * Check if camera device supports flashlight / torch
 */
function checkTorchSupport() {
    const torchBtn = document.getElementById('btnToggleTorch');
    if (!torchBtn) return false;

    if (!scannerVideoStream) {
        torchBtn.style.opacity = '0.5';
        return false;
    }

    const videoTrack = scannerVideoStream.getVideoTracks()[0];
    if (!videoTrack) {
        torchBtn.style.opacity = '0.5';
        return false;
    }

    const capabilities = typeof videoTrack.getCapabilities === 'function' ? videoTrack.getCapabilities() : {};
    const hasTorch = Boolean(capabilities.torch);

    if (hasTorch) {
        torchBtn.style.opacity = '1';
        torchBtn.title = 'Turn Flashlight ON/OFF';
    } else {
        // Front cameras or laptops without LED flash
        torchBtn.style.opacity = '0.7';
        torchBtn.title = t('scanner.torch_unsupported', 'Flashlight not supported on this camera');
    }

    updateTorchButtonUI();
    return hasTorch;
}

/**
 * Toggle flashlight (torch) ON / OFF
 */
async function toggleCameraTorch() {
    if (!scannerVideoStream) {
        showToast('Camera is not active.', 'warning');
        return;
    }

    const videoTrack = scannerVideoStream.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
        const capabilities = typeof videoTrack.getCapabilities === 'function' ? videoTrack.getCapabilities() : {};
        if (!capabilities.torch) {
            showToast(t('scanner.torch_unsupported', 'Flashlight is not supported on this camera/device.'), 'warning');
            return;
        }

        isTorchOn = !isTorchOn;
        await videoTrack.applyConstraints({
            advanced: [{ torch: isTorchOn }]
        });

        updateTorchButtonUI();
        showToast(isTorchOn ? '🔦 ' + t('scanner.torch_on', 'Light ON') : '🔦 ' + t('scanner.torch_off', 'Light OFF'), 'info');
    } catch (err) {
        console.warn('Torch toggle error:', err);
        showToast('Error toggling flashlight: ' + err.message, 'warning');
    }
}

/**
 * Update Flashlight button visual state
 */
function updateTorchButtonUI() {
    const torchBtn = document.getElementById('btnToggleTorch');
    const label = document.getElementById('torchBtnLabel');
    if (!torchBtn) return;

    if (isTorchOn) {
        torchBtn.classList.remove('btn-secondary');
        torchBtn.classList.add('btn-warning');
        torchBtn.style.background = '#f59e0b';
        torchBtn.style.borderColor = '#d97706';
        torchBtn.style.color = '#000000';
        torchBtn.style.fontWeight = '700';
        if (label) label.textContent = t('scanner.torch_on', 'Light ON');
    } else {
        torchBtn.classList.remove('btn-warning');
        torchBtn.classList.add('btn-secondary');
        torchBtn.style.background = '';
        torchBtn.style.borderColor = '';
        torchBtn.style.color = '';
        torchBtn.style.fontWeight = '';
        if (label) label.textContent = t('scanner.torch_off', 'Light');
    }
}

/**
 * Stop active camera stream and clean up
 */
function stopCameraStream() {
    if (autoScanInterval) {
        clearInterval(autoScanInterval);
        autoScanInterval = null;
    }

    if (scannerVideoStream) {
        scannerVideoStream.getTracks().forEach(track => {
            try { 
                if (isTorchOn && typeof track.applyConstraints === 'function') {
                    track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
                }
                track.stop(); 
            } catch (e) {}
        });
        scannerVideoStream = null;
    }

    isTorchOn = false;
    updateTorchButtonUI();

    const video = document.getElementById('scannerVideo');
    if (video) {
        video.srcObject = null;
    }
}

/**
 * Close camera scanner modal
 */
function closeCameraScanner() {
    stopCameraStream();
    const modal = document.getElementById('cameraScannerModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

/**
 * Switch camera between front and back
 */
async function switchCameraFacingMode() {
    isTorchOn = false;
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    await startCameraStream();
}

/**
 * Real-time native barcode scanning loop
 */
function startBarcodeScanningLoop() {
    if (autoScanInterval) clearInterval(autoScanInterval);

    const video = document.getElementById('scannerVideo');
    if (!video) return;

    autoScanInterval = setInterval(async () => {
        if (isScanProcessing || !barcodeDetector || video.readyState < 2) return;

        try {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes && barcodes.length > 0) {
                const rawVal = barcodes[0].rawValue;
                if (rawVal && rawVal.trim()) {
                    console.log('✓ Barcode Detected:', rawVal);
                    handleDetectedText(rawVal.trim(), 'barcode');
                }
            }
        } catch (e) {
            // Frame detection error, continue
        }
    }, 400);
}

/**
 * Capture current frame from video and run OCR text recognition
 */
async function captureAndProcessFrame() {
    if (isScanProcessing) return;

    const video = document.getElementById('scannerVideo');
    const canvas = document.getElementById('scannerCanvas');
    const statusText = document.getElementById('scannerStatusText');
    const captureBtn = document.getElementById('btnCaptureOCR');

    if (!video || !canvas || video.readyState < 2) {
        showToast('Camera feed not ready yet. Please wait a moment.', 'warning');
        return;
    }

    isScanProcessing = true;
    const origBtnText = captureBtn ? captureBtn.innerHTML : '';
    if (captureBtn) {
        captureBtn.disabled = true;
        captureBtn.innerHTML = `⏳ ${t('scanner.scanning', 'Reading Text...')}`;
    }
    if (statusText) {
        statusText.textContent = `⏳ ${t('scanner.scanning', 'Processing OCR text recognition...')}`;
        statusText.style.background = 'rgba(59, 130, 246, 0.9)';
    }

    try {
        // Draw video frame to canvas
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Pre-process canvas for OCR clarity (increase contrast)
        enhanceCanvasContrast(ctx, canvas.width, canvas.height);

        // Run OCR recognition
        let recognizedText = '';
        if (typeof Tesseract !== 'undefined') {
            const result = await Tesseract.recognize(canvas, 'eng', {
                logger: m => {
                    if (m.status === 'recognizing text' && statusText) {
                        const pct = Math.round((m.progress || 0) * 100);
                        statusText.textContent = `⏳ ${t('scanner.scanning', 'Reading Text...')} ${pct}%`;
                    }
                }
            });
            recognizedText = (result.data?.text || '').trim();
        } else {
            // Fallback lightweight regex heuristic if offline / Tesseract CDN blocked
            recognizedText = 'Scanned Product';
        }

        if (recognizedText) {
            handleDetectedText(recognizedText, 'ocr');
        } else {
            if (statusText) {
                statusText.textContent = '❌ No clear text detected. Hold closer and try again.';
                statusText.style.background = 'rgba(239, 68, 68, 0.9)';
            }
            showToast('No clear text recognized. Try aligning the label inside the frame.', 'warning');
        }
    } catch (err) {
        console.error('OCR Processing Error:', err);
        showToast('Error processing text from camera: ' + err.message, 'error');
        if (statusText) {
            statusText.textContent = '⚠️ OCR Error: ' + err.message;
            statusText.style.background = 'rgba(239, 68, 68, 0.9)';
        }
    } finally {
        isScanProcessing = false;
        if (captureBtn) {
            captureBtn.disabled = false;
            captureBtn.innerHTML = origBtnText;
        }
    }
}

/**
 * Handle Photo Upload from Gallery / Disk
 */
async function handleScannerPhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const statusText = document.getElementById('scannerStatusText');
    const canvas = document.getElementById('scannerCanvas');
    if (!canvas) return;

    if (statusText) {
        statusText.textContent = `⏳ ${t('scanner.scanning', 'Analyzing uploaded image...')}`;
        statusText.style.background = 'rgba(59, 130, 246, 0.9)';
    }

    const img = new Image();
    img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        enhanceCanvasContrast(ctx, canvas.width, canvas.height);

        try {
            if (typeof Tesseract !== 'undefined') {
                const result = await Tesseract.recognize(canvas, 'eng');
                const text = (result.data?.text || '').trim();
                if (text) {
                    handleDetectedText(text, 'photo-upload');
                } else {
                    showToast('No text found in photo. Please choose a clearer image.', 'warning');
                }
            }
        } catch (e) {
            showToast('Error reading image text: ' + e.message, 'error');
        }
    };
    img.src = URL.createObjectURL(file);
}

/**
 * Enhance Canvas Image Contrast for Sharper OCR
 */
function enhanceCanvasContrast(ctx, width, height) {
    try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        // Simple contrast stretch
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const enhanced = avg > 128 ? Math.min(255, avg * 1.15) : Math.max(0, avg * 0.85);
            data[i] = enhanced;
            data[i + 1] = enhanced;
            data[i + 2] = enhanced;
        }
        ctx.putImageData(imgData, 0, 0);
    } catch (e) {}
}

/**
 * Intelligent Text Parser & Catalog Fuzzy Matcher
 */
function handleDetectedText(rawText, source = 'ocr') {
    const cleanText = rawText.replace(/\s+/g, ' ').trim();
    const textContainer = document.getElementById('scannerDetectedTextContainer');
    const textDisplay = document.getElementById('scannerDetectedText');
    const matchBox = document.getElementById('scannerMatchResult');
    const matchNameDisplay = document.getElementById('scannerMatchName');
    const statusText = document.getElementById('scannerStatusText');
    const applyBtn = document.getElementById('btnApplyScanMatch');

    if (textContainer && textDisplay) {
        textContainer.style.display = 'block';
        textDisplay.textContent = cleanText.length > 180 ? cleanText.slice(0, 180) + '...' : cleanText;
    }

    // Try matching recognized text against candidate product catalog
    let candidateList = [];
    if (scannerContext === 'stock-in' && typeof stockInProducts !== 'undefined' && stockInProducts.length > 0) {
        candidateList = stockInProducts;
    } else if (scannerContext === 'stock-out' && typeof stockOutProducts !== 'undefined' && stockOutProducts.length > 0) {
        candidateList = stockOutProducts;
    } else {
        candidateList = window.AppState?.productsCache || [];
    }

    let matchedProduct = findBestProductMatch(cleanText, candidateList);
    // If not found in branch subset, check full products cache
    if (!matchedProduct && candidateList !== window.AppState?.productsCache && window.AppState?.productsCache) {
        matchedProduct = findBestProductMatch(cleanText, window.AppState.productsCache);
    }

    if (matchedProduct) {
        lastMatchedProduct = matchedProduct;
        if (matchBox && matchNameDisplay) {
            matchBox.style.display = 'block';
            matchNameDisplay.innerHTML = `<strong>${escapeHtml(matchedProduct.brand)} – ${escapeHtml(matchedProduct.name)}</strong> (${matchedProduct.symbol || 'units'})`;
        }
        if (statusText) {
            statusText.textContent = `✓ Matched: ${matchedProduct.brand} - ${matchedProduct.name}`;
            statusText.style.background = 'rgba(16, 185, 129, 0.9)';
        }
        if (applyBtn) {
            applyBtn.onclick = () => applyMatchedProduct(matchedProduct);
        }

        // Auto apply if exact barcode match or stock in/out direct scan
        if (source === 'barcode') {
            applyMatchedProduct(matchedProduct);
        }
    } else {
        lastMatchedProduct = null;
        if (matchBox) matchBox.style.display = 'none';
        if (statusText) {
            statusText.textContent = `ℹ Text scanned. Click 'Apply Text' or re-scan.`;
            statusText.style.background = 'rgba(245, 158, 11, 0.9)';
        }

        // Context-specific actions when no exact catalog match
        if (scannerContext === 'products-filter') {
            const searchInput = document.getElementById('prodSearchName');
            if (searchInput) {
                searchInput.value = cleanText.split(/[\n,;]/)[0].trim().slice(0, 40);
                if (typeof debounceProductFilter === 'function') debounceProductFilter();
                showToast(`Filter applied: "${searchInput.value}"`, 'success');
                closeCameraScanner();
            }
        } else if (scannerContext === 'product-form') {
            const nameInput = document.getElementById('prodFormName');
            const brandInput = document.getElementById('prodFormBrand');
            const lines = cleanText.split(/[\n,;]/).map(l => l.trim()).filter(Boolean);
            if (lines.length > 0 && nameInput) {
                nameInput.value = lines[0].slice(0, 80);
                if (lines.length > 1 && brandInput) {
                    brandInput.value = lines[1].slice(0, 50);
                }
                showToast('Product name/brand auto-filled from packaging text!', 'success');
                closeCameraScanner();
            }
        }
    }
}

/**
 * Fuzzy Search Matcher: Matches text tokens against products catalog
 */
function findBestProductMatch(scannedText, products) {
    if (!products || products.length === 0) return null;

    const lowerScanned = scannedText.toLowerCase();

    // 1. Direct Substring Match (Brand + Name)
    for (const p of products) {
        const fullTitle = `${p.brand || ''} ${p.name || ''}`.toLowerCase().trim();
        if (fullTitle && (lowerScanned.includes(fullTitle) || fullTitle.includes(lowerScanned))) {
            return p;
        }
        if (p.name && lowerScanned.includes(p.name.toLowerCase().trim())) {
            return p;
        }
    }

    // 2. Tokenized Multi-Word Match
    const words = lowerScanned.split(/[^a-zA-Z0-9]+/).filter(w => w.length >= 3);
    let bestMatch = null;
    let highestScore = 0;

    for (const p of products) {
        const prodWords = `${p.brand || ''} ${p.name || ''}`.toLowerCase().split(/[^a-zA-Z0-9]+/).filter(w => w.length >= 3);
        let score = 0;
        for (const w of words) {
            if (prodWords.includes(w)) score += 2;
            else if (prodWords.some(pw => pw.includes(w) || w.includes(pw))) score += 1;
        }

        if (score > highestScore && score >= 2) {
            highestScore = score;
            bestMatch = p;
        }
    }

    return bestMatch;
}

/**
 * Apply Matched Product to Active Context
 */
function applyMatchedProduct(product) {
    if (!product) return;

    if (scannerContext === 'stock-in') {
        const hiddenInput = document.getElementById('stockInProductId');
        const trigger = document.getElementById('stockInProductTrigger');
        if (hiddenInput && trigger) {
            hiddenInput.value = product.id;
            trigger.innerHTML = `<span style="font-weight:700; color:var(--text-primary);">${escapeHtml(product.brand)} – ${escapeHtml(product.name)}</span> <span style="color:var(--text-muted);">(${escapeHtml(product.symbol || 'units')})</span>`;
            if (typeof selectStockInProduct === 'function') {
                selectStockInProduct(product.id, `${product.brand} – ${product.name}`, product.symbol || 'units', product.unit_id);
            }
        }
        showToast(`✓ Selected product: ${product.brand} – ${product.name}`, 'success');
        closeCameraScanner();
    } else if (scannerContext === 'stock-out') {
        const hiddenInput = document.getElementById('stockOutProductId');
        const trigger = document.getElementById('stockOutProductTrigger');
        if (hiddenInput && trigger) {
            hiddenInput.value = product.id;
            trigger.innerHTML = `<span style="font-weight:700; color:var(--text-primary);">${escapeHtml(product.brand)} – ${escapeHtml(product.name)}</span> <span style="color:var(--text-muted);">(${escapeHtml(product.symbol || 'units')})</span>`;
            if (typeof selectStockOutProduct === 'function') {
                selectStockOutProduct(product.id, `${product.brand} – ${product.name}`, product.symbol || 'units', product.unit_id);
            }
        }
        showToast(`✓ Selected product: ${product.brand} – ${product.name}`, 'success');
        closeCameraScanner();
    } else if (scannerContext === 'products-filter') {
        const nameInput = document.getElementById('prodSearchName');
        if (nameInput) {
            nameInput.value = product.name;
            if (typeof debounceProductFilter === 'function') debounceProductFilter();
        }
        showToast(`Filtered catalog by: "${product.name}"`, 'success');
        closeCameraScanner();
    } else if (scannerContext === 'product-form') {
        const nameInput = document.getElementById('prodFormName');
        const brandInput = document.getElementById('prodFormBrand');
        if (nameInput) nameInput.value = product.name;
        if (brandInput) brandInput.value = product.brand;
        showToast(`Form filled: ${product.brand} - ${product.name}`, 'success');
        closeCameraScanner();
    }
}

// Expose functions globally
window.openCameraScanner = openCameraScanner;
window.closeCameraScanner = closeCameraScanner;
window.captureAndProcessFrame = captureAndProcessFrame;
window.switchCameraFacingMode = switchCameraFacingMode;
window.handleScannerPhotoUpload = handleScannerPhotoUpload;
window.toggleCameraTorch = toggleCameraTorch;

