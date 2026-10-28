/**
 * StockMatrix - Purchasing Requisition & Order Manifest Module
 */

let purchasingManifestItems = [];
let purchasingProductsCache = [];
let purchasingBranchesCache = [];
let cachedLowStockAlerts = [];
let activePurchasingFilteredProducts = null;
let selectedPurchasingProduct = null;

const PURCHASING_DRAFT_KEY = 'stockmatrix_purchasing_manifest_draft';

// Expose globally for export utilities
window.purchasingManifestItems = purchasingManifestItems;

/**
 * Load Purchasing View Context
 */
async function loadPurchasingView() {
    try {
        // Restore from draft cache if memory array is empty
        if (purchasingManifestItems.length === 0) {
            loadPurchasingDraft();
        }

        updatePurchasingPrintHeader();

        // Fetch products and reports concurrently
        const [prodRes, repRes] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/reports')
        ]);

        const prodData = await prodRes.json();
        const repData = await repRes.json();

        if (prodData.success) {
            purchasingProductsCache = prodData.products || [];
            if (prodData.units && Array.isArray(prodData.units)) {
                AppState.units = prodData.units;
            }
            populatePurchasingUnitsDatalist();
        }

        if (repData.success) {
            purchasingBranchesCache = repData.branches || [];
            cachedLowStockAlerts = repData.lowStockAlerts || [];
            populatePurchasingBranches(purchasingBranchesCache);
        }

        // Apply active branch filter or display full catalog
        handlePurchasingBranchChange();

        renderPurchasingTable();
    } catch (err) {
        console.error('Error loading purchasing context:', err);
        showToast(err.message, 'error');
    }
}

/**
 * Update the printable header meta for Purchase Order
 */
function updatePurchasingPrintHeader() {
    const printDate = document.getElementById('purchasingPrintTimestamp');
    const printTotal = document.getElementById('purchasingPrintTotalItems');
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (printDate) {
        printDate.textContent = `Date: ${dateFormatted} at ${timeFormatted}`;
    }
    if (printTotal) {
        printTotal.textContent = `Total Line Items: ${purchasingManifestItems.length}`;
    }
}

/**
 * Populate destination branch selector and modals
 */
function populatePurchasingBranches(branches) {
    const branchSelect = document.getElementById('purchasingBranchSelect');
    if (branchSelect) {
        const currentVal = branchSelect.value;
        let html = '<option value="">-- All Shops / General Catalog --</option>';
        html += branches.map(b => {
            const typeLabel = b.type === 2 ? ' (Construction Supply)' : (b.type === 1 ? ' (Mobile Repair & Electronics)' : '');
            return `<option value="${b.id}">${escapeHtml(b.name)}${typeLabel}</option>`;
        }).join('');
        branchSelect.innerHTML = html;
        if (currentVal && Array.from(branchSelect.options).some(o => o.value == currentVal)) {
            branchSelect.value = currentVal;
        }
    }

    // Direct Stock In modal branch selector
    const directBranchSelect = document.getElementById('directStockInBranchSelect');
    if (directBranchSelect) {
        directBranchSelect.innerHTML = branches.map(b => {
            const typeLabel = b.type === 2 ? ' (Construction)' : (b.type === 1 ? ' (Electronics)' : '');
            return `<option value="${b.id}">${escapeHtml(b.name)}${typeLabel}</option>`;
        }).join('');
    }

    // Legacy multi-select if present
    const multiSelect = document.getElementById('purchasingBranchMultiSelect');
    if (multiSelect) {
        multiSelect.innerHTML = branches.map(b => 
            `<option value="${b.id}">${escapeHtml(b.name)}</option>`
        ).join('');
    }
}

/**
 * Populate Datalist with available measurement units
 */
function populatePurchasingUnitsDatalist() {
    const datalist = document.getElementById('purchasingUnitDatalist');
    if (!datalist) return;

    const unitSet = new Set(['pcs', 'piece', 'kg', 'meter', 'box', 'bag', 'sck', 'roll', 'liter', 'set', 'carton', 'qtl']);

    if (AppState.units && Array.isArray(AppState.units)) {
        AppState.units.forEach(u => {
            if (u.symbol) unitSet.add(u.symbol);
            if (u.name) unitSet.add(u.name);
        });
    }

    purchasingProductsCache.forEach(p => {
        if (p.unit_symbol) unitSet.add(p.unit_symbol);
        if (p.unit_name) unitSet.add(p.unit_name);
    });

    datalist.innerHTML = Array.from(unitSet).map(u => 
        `<option value="${escapeHtml(u)}"></option>`
    ).join('');
}

/**
 * Handle Shop / Branch selection and dynamically filter products by category:
 * If Construction branch (type=2) -> Show Construction materials only.
 * If Electronics branch (type=1) -> Show Electronics only.
 */
function handlePurchasingBranchChange() {
    const branchSelect = document.getElementById('purchasingBranchSelect');
    const badge = document.getElementById('purchasingBranchFilterBadge');
    const countBadge = document.getElementById('purchasingProductCountBadge');
    const selectedBranchId = branchSelect ? branchSelect.value : '';

    let filtered = purchasingProductsCache;
    let selectedBranch = null;

    if (selectedBranchId) {
        selectedBranch = purchasingBranchesCache.find(b => b.id == selectedBranchId);
    }

    if (selectedBranch) {
        const branchType = parseInt(selectedBranch.type, 10);
        if (branchType === 2) {
            // Construction Supply: Filter products of type 2 (Construction) or 0 (General)
            filtered = purchasingProductsCache.filter(p => p.type === 2 || p.type === 0);
            if (badge) {
                badge.style.display = 'inline-block';
                badge.className = 'badge badge-emerald';
                badge.style.background = 'rgba(16, 185, 129, 0.15)';
                badge.style.color = '#10B981';
                badge.style.border = '1px solid rgba(16, 185, 129, 0.35)';
                badge.innerHTML = `🏗️ Filtered: Construction Materials Only (${filtered.length} products for ${escapeHtml(selectedBranch.name)})`;
            }
            if (countBadge) {
                countBadge.className = 'badge badge-emerald';
                countBadge.textContent = `${filtered.length} Construction Products`;
            }
        } else if (branchType === 1) {
            // Mobile Repair & Electronics: Filter products of type 1 (Electronics) or 0 (General)
            filtered = purchasingProductsCache.filter(p => p.type === 1 || p.type === 0);
            if (badge) {
                badge.style.display = 'inline-block';
                badge.className = 'badge badge-blue';
                badge.style.background = 'rgba(59, 130, 246, 0.15)';
                badge.style.color = '#3B82F6';
                badge.style.border = '1px solid rgba(59, 130, 246, 0.35)';
                badge.innerHTML = `📱 Filtered: Electronics & Parts Only (${filtered.length} products for ${escapeHtml(selectedBranch.name)})`;
            }
            if (countBadge) {
                countBadge.className = 'badge badge-blue';
                countBadge.textContent = `${filtered.length} Electronics Products`;
            }
        } else {
            if (badge) badge.style.display = 'none';
            if (countBadge) {
                countBadge.className = 'badge badge-slate';
                countBadge.textContent = `${filtered.length} Products`;
            }
        }
    } else {
        if (badge) badge.style.display = 'none';
        if (countBadge) {
            countBadge.className = 'badge badge-slate';
            countBadge.textContent = `All Products (${purchasingProductsCache.length})`;
        }
    }

    // Reset selected product if it does not match the active branch filter
    if (selectedPurchasingProduct && !filtered.some(p => p.id === selectedPurchasingProduct.id)) {
        selectedPurchasingProduct = null;
        const idInput = document.getElementById('purchasingProductId');
        if (idInput) idInput.value = '';
        const trigger = document.getElementById('purchasingProductTrigger');
        if (trigger) trigger.textContent = 'Click to select product...';
        const unitInput = document.getElementById('purchasingUnitInput');
        if (unitInput) unitInput.value = '';
    }

    activePurchasingFilteredProducts = filtered;
    renderPurchasingProductOptions(filtered);

    // Filter low stock scanner list
    if (selectedBranch && cachedLowStockAlerts.length > 0) {
        const branchAlerts = cachedLowStockAlerts.filter(a => 
            a.branch_id == selectedBranch.id || 
            (a.branch_name && a.branch_name.toLowerCase() === selectedBranch.name.toLowerCase())
        );
        renderPurchasingLowStockScanner(branchAlerts);
    } else {
        renderPurchasingLowStockScanner(cachedLowStockAlerts);
    }
}

/**
 * Render searchable product dropdown options
 */
function renderPurchasingProductOptions(products) {
    const list = document.getElementById('purchasingOptionsList');
    if (!list) return;

    if (products.length === 0) {
        list.innerHTML = '<div class="search-select-option" style="color:var(--text-muted); cursor:default;">No matching products in this category</div>';
        return;
    }

    list.innerHTML = products.map(p => `
        <div class="search-select-option" onclick="selectPurchasingProduct(${p.id})">
            <div>
                <strong style="color:var(--text-primary);">${escapeHtml(p.brand)}</strong> - ${escapeHtml(p.name)}
                <span class="badge ${p.type === 2 ? 'badge-emerald' : 'badge-blue'}" style="font-size:10px; margin-left:6px;">
                    ${p.type === 2 ? '🏗️ Construction' : '📱 Electronics'}
                </span>
            </div>
            <div style="font-size:11.5px; color:var(--text-muted);">Base Unit: ${escapeHtml(p.unit_symbol || p.unit_name || 'N/A')}</div>
        </div>
    `).join('');
}

/**
 * Filter products in search box respecting branch filter
 */
function filterPurchasingProducts(query) {
    const baseList = activePurchasingFilteredProducts || purchasingProductsCache;
    const q = (query || '').toLowerCase().trim();
    if (!q) {
        renderPurchasingProductOptions(baseList);
        return;
    }
    const filtered = baseList.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
    renderPurchasingProductOptions(filtered);
}

/**
 * Select a product from the custom search select
 */
function selectPurchasingProduct(productId) {
    const product = purchasingProductsCache.find(p => p.id === productId);
    if (!product) return;

    selectedPurchasingProduct = product;
    document.getElementById('purchasingProductId').value = product.id;
    document.getElementById('purchasingProductTrigger').textContent = `${product.brand} - ${product.name}`;

    // Auto-fill measurement unit input
    const unitInput = document.getElementById('purchasingUnitInput');
    if (unitInput) {
        unitInput.value = product.unit_symbol || product.unit_name || 'pcs';
    }

    const qtyInput = document.getElementById('purchasingQty');
    if (qtyInput) {
        const uName = (product.unit_name || product.unit_symbol || '');
        const isInt = /^(piece|pieces|box|boxes|set|sets|pack|packs|unit|units|carton|cartons|item|items|bag|bags|pcs|bx)$/i.test(uName.trim());
        if (isInt) {
            qtyInput.step = '1';
            qtyInput.min = '1';
            qtyInput.placeholder = 'e.g. 10 (Whole count)';
        } else {
            qtyInput.step = 'any';
            qtyInput.min = '0.001';
            qtyInput.placeholder = '0';
        }
    }

    if (product.color) {
        document.getElementById('purchasingColor').value = product.color;
    }

    const dropdown = document.getElementById('purchasingProductDropdown');
    if (dropdown) dropdown.classList.remove('active');
}

/**
 * Render Low Stock System Scanner list (< min_stock_alert units)
 */
function renderPurchasingLowStockScanner(alerts) {
    const container = document.getElementById('purchasingLowStockList');
    if (!container) return;

    if (!alerts || alerts.length === 0) {
        container.innerHTML = `<div style="padding:16px; text-align:center; color:var(--text-muted); font-size:13px;">${t('dash.empty_low_stock', '✅ All facility branch inventories are within safe operating capacity.')}</div>`;
        return;
    }

    container.innerHTML = alerts.map(item => {
        const threshold = parseFloat(item.min_stock_alert !== undefined ? item.min_stock_alert : 5);
        const current = parseFloat(item.quantity || item.current_stock || 0);
        const sym = item.symbol || 'units';

        return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--surface); border:1px solid var(--border-color); border-left:3px solid var(--danger); border-radius:var(--radius-md);">
                <div>
                    <div style="font-weight:600; font-size:13.5px; color:var(--text-primary);">
                        ${escapeHtml(item.brand)} - ${escapeHtml(item.product_name)}
                    </div>
                    <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
                        🏢 <strong>${escapeHtml(item.branch_name)}</strong> · <span style="color:var(--danger); font-weight:700;">${formatNumber(current, sym)} ${escapeHtml(sym)}</span>
                        <span style="color:var(--text-muted); font-size:11px;">(Min: &le; ${formatNumber(threshold, sym)} ${escapeHtml(sym)})</span>
                    </div>
                </div>
                <button class="btn btn-secondary" style="padding:4px 10px; font-size:12px;" onclick="addLowStockToPurchasing('${escapeHtml(item.brand)}', '${escapeHtml(item.product_name)}', '${escapeHtml(item.branch_name)}', ${threshold}, ${current}, '${escapeHtml(sym)}')">
                    🛒 ${t('action.add_to_cart', 'Add to Cart')}
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Helper to add or merge product item into purchasingManifestItems
 */
function addOrMergePurchasingItem(itemData) {
    const brand = (itemData.brand || '').trim();
    const name = (itemData.name || '').trim();
    const color = (itemData.color || 'Standard').trim();
    const newQty = parseFloat(itemData.qty) || 0;
    const unit = (itemData.unit || 'pcs').trim();
    const newDestinations = (itemData.destinations || '')
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);

    const existingIndex = purchasingManifestItems.findIndex(item => 
        (item.brand || '').trim().toLowerCase() === brand.toLowerCase() &&
        (item.name || '').trim().toLowerCase() === name.toLowerCase() &&
        (item.color || 'Standard').trim().toLowerCase() === color.toLowerCase() &&
        (item.unit || '').trim().toLowerCase() === unit.toLowerCase()
    );

    if (existingIndex >= 0) {
        // Merge into existing row
        const existing = purchasingManifestItems[existingIndex];
        existing.qty = (parseFloat(existing.qty) || 0) + newQty;

        // Merge destination branches without duplicates
        const currentDests = (existing.destinations || '')
            .split(',')
            .map(d => d.trim())
            .filter(Boolean);

        const combinedDests = Array.from(new Set([...currentDests, ...newDestinations]));
        existing.destinations = combinedDests.join(', ') || 'All Branches';

        // Keep productId and targetBranchId
        if (!existing.productId && itemData.productId) existing.productId = itemData.productId;
        if (!existing.targetBranchId && itemData.targetBranchId) existing.targetBranchId = itemData.targetBranchId;

        // Merge notes if distinct
        if (itemData.notes && itemData.notes.trim()) {
            if (!existing.notes) {
                existing.notes = itemData.notes.trim();
            } else if (!existing.notes.includes(itemData.notes.trim())) {
                existing.notes = `${existing.notes}; ${itemData.notes.trim()}`;
            }
        }

        if (itemData.price && !existing.price) {
            existing.price = itemData.price;
        }

        autoSavePurchasingDraft();
        updatePurchasingPrintHeader();
        renderPurchasingTable();

        showToast(`Merged into 1 row: "${brand} - ${name}" quantity updated to ${formatNumber(existing.qty, existing.unit)} ${existing.unit} (Branches: ${existing.destinations}).`, 'success');
        return;
    }

    // Add new line item
    purchasingManifestItems.push({
        checked: false,
        productId: itemData.productId || (selectedPurchasingProduct ? selectedPurchasingProduct.id : null),
        targetBranchId: itemData.targetBranchId || null,
        brand: brand,
        name: name,
        color: color,
        destinations: newDestinations.join(', ') || 'All Branches',
        qty: newQty,
        price: itemData.price || '',
        notes: itemData.notes || '',
        unit: unit
    });

    autoSavePurchasingDraft();
    updatePurchasingPrintHeader();
    renderPurchasingTable();
    showToast(`Added "${brand} - ${name}" (${formatNumber(newQty, unit)} ${unit}) to purchasing cart.`, 'success');
}

/**
 * Auto-save draft to browser cache
 */
function autoSavePurchasingDraft() {
    try {
        localStorage.setItem(PURCHASING_DRAFT_KEY, JSON.stringify(purchasingManifestItems));
    } catch (e) {
        console.warn('LocalStorage save error:', e);
    }
}

/**
 * Manually save purchasing cart draft
 */
function savePurchasingDraft(manual = true) {
    autoSavePurchasingDraft();
    if (manual) {
        showToast('💾 Purchasing cart draft saved to local browser cache!', 'success');
    }
}

/**
 * Load draft from browser cache
 */
function loadPurchasingDraft() {
    try {
        const raw = localStorage.getItem(PURCHASING_DRAFT_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                purchasingManifestItems = parsed;
                window.purchasingManifestItems = purchasingManifestItems;
                return true;
            }
        }
    } catch (e) {
        console.warn('LocalStorage load error:', e);
    }
    return false;
}

/**
 * Reset / Clear all items in purchasing cart draft
 */
function resetPurchasingManifest() {
    if (purchasingManifestItems.length === 0) {
        showToast('Purchasing cart is already empty.', 'info');
        return;
    }

    if (!confirm('Are you sure you want to clear all items from the purchasing cart draft?')) {
        return;
    }

    purchasingManifestItems = [];
    window.purchasingManifestItems = purchasingManifestItems;
    localStorage.removeItem(PURCHASING_DRAFT_KEY);
    updatePurchasingPrintHeader();
    renderPurchasingTable();
    showToast('Purchasing cart cleared and draft reset.', 'success');
}

/**
 * Add Low Stock item to purchasing cart using product's configured minimum threshold
 */
function addLowStockToPurchasing(brand, name, branchName, minThreshold, currentStock, unitSymbol) {
    const threshold = parseFloat(minThreshold) || 5;
    const current = parseFloat(currentStock) || 0;
    const sym = unitSymbol || 'units';
    const suggestedQty = threshold > 0 ? threshold : 5;

    const prod = purchasingProductsCache.find(p => 
        p.name.toLowerCase().trim() === (name || '').toLowerCase().trim() && 
        p.brand.toLowerCase().trim() === (brand || '').toLowerCase().trim()
    );
    const br = purchasingBranchesCache.find(b => 
        b.name.toLowerCase().trim() === (branchName || '').toLowerCase().trim()
    );

    addOrMergePurchasingItem({
        productId: prod ? prod.id : null,
        targetBranchId: br ? br.id : null,
        brand: brand,
        name: name,
        color: 'Standard',
        destinations: branchName,
        qty: suggestedQty,
        price: '',
        notes: `Low Stock Alert (${formatNumber(current, sym)} left, Min alert: ${formatNumber(threshold, sym)} ${sym})`,
        unit: sym
    });
}

/**
 * Add Custom Line item to purchasing manifest / cart
 */
function handlePurchasingAddLine(e) {
    e.preventDefault();

    if (!selectedPurchasingProduct) {
        showToast('Please search and select a product profile first.', 'error');
        return;
    }

    const branchSelect = document.getElementById('purchasingBranchSelect');
    let destinationText = 'All Branches';
    let targetBranchId = null;

    if (branchSelect && branchSelect.value) {
        targetBranchId = parseInt(branchSelect.value, 10);
        const b = purchasingBranchesCache.find(x => x.id === targetBranchId);
        if (b) destinationText = b.name;
    }

    const qty = parseFloat(document.getElementById('purchasingQty').value);
    if (isNaN(qty) || qty <= 0) {
        showToast('Please enter a valid positive order quantity.', 'error');
        return;
    }

    const unitInput = document.getElementById('purchasingUnitInput');
    const unit = (unitInput && unitInput.value.trim()) || selectedPurchasingProduct.unit_symbol || selectedPurchasingProduct.unit_name || 'pcs';
    const color = document.getElementById('purchasingColor').value.trim() || 'Standard';
    const price = document.getElementById('purchasingPrice') ? document.getElementById('purchasingPrice').value.trim() : '';
    const notes = document.getElementById('purchasingNotes').value.trim() || '';

    addOrMergePurchasingItem({
        productId: selectedPurchasingProduct.id,
        targetBranchId: targetBranchId,
        brand: selectedPurchasingProduct.brand,
        name: selectedPurchasingProduct.name,
        color: color,
        destinations: destinationText,
        qty: qty,
        price: price,
        notes: notes,
        unit: unit
    });

    // Reset form inputs
    document.getElementById('purchasingQty').value = '';
    if (unitInput) unitInput.value = '';
    document.getElementById('purchasingColor').value = '';
    if (document.getElementById('purchasingPrice')) document.getElementById('purchasingPrice').value = '';
    document.getElementById('purchasingNotes').value = '';
    document.getElementById('purchasingProductId').value = '';
    document.getElementById('purchasingProductTrigger').textContent = 'Click to select product...';
    selectedPurchasingProduct = null;
}

/**
 * Toggle checkmark / tick status for an item
 */
function togglePurchasingCheck(index) {
    if (purchasingManifestItems[index]) {
        purchasingManifestItems[index].checked = !purchasingManifestItems[index].checked;
        autoSavePurchasingDraft();
        renderPurchasingTable();
    }
}

/**
 * Update item price in purchasing sheet
 */
function updatePurchasingPrice(index, val) {
    if (purchasingManifestItems[index]) {
        purchasingManifestItems[index].price = val;
        autoSavePurchasingDraft();
    }
}

/**
 * Update item remark/notes in purchasing sheet
 */
function updatePurchasingRemark(index, val) {
    if (purchasingManifestItems[index]) {
        purchasingManifestItems[index].notes = val;
        autoSavePurchasingDraft();
    }
}

/**
 * Open Modal to Edit Line item in Purchasing Cart
 */
function openEditPurchasingLine(index) {
    const item = purchasingManifestItems[index];
    if (!item) return;

    document.getElementById('editPurchasingIndex').value = index;
    document.getElementById('editPurchasingProdTitle').textContent = `${item.brand} - ${item.name}`;
    document.getElementById('editPurchasingQty').value = item.qty;
    
    const editUnit = document.getElementById('editPurchasingUnit');
    if (editUnit) editUnit.value = item.unit || 'pcs';
    const editPrice = document.getElementById('editPurchasingPrice');
    if (editPrice) editPrice.value = item.price || '';

    document.getElementById('editPurchasingColor').value = item.color || '';
    document.getElementById('editPurchasingDestinations').value = item.destinations || '';
    document.getElementById('editPurchasingNotes').value = item.notes || '';

    openModal('editPurchasingModal');
}

/**
 * Save Edited Line Item in Purchasing Cart
 */
function handleEditPurchasingSave(e) {
    e.preventDefault();
    const index = parseInt(document.getElementById('editPurchasingIndex').value, 10);
    if (isNaN(index) || !purchasingManifestItems[index]) {
        closeModal('editPurchasingModal');
        return;
    }

    const newQty = parseFloat(document.getElementById('editPurchasingQty').value);
    if (isNaN(newQty) || newQty <= 0) {
        showToast('Please specify a positive valid quantity.', 'error');
        return;
    }

    const editUnit = document.getElementById('editPurchasingUnit');
    const editPrice = document.getElementById('editPurchasingPrice');

    purchasingManifestItems[index].qty = newQty;
    if (editUnit) purchasingManifestItems[index].unit = editUnit.value.trim() || 'pcs';
    if (editPrice) purchasingManifestItems[index].price = editPrice.value.trim();
    purchasingManifestItems[index].color = document.getElementById('editPurchasingColor').value.trim() || 'Standard';
    purchasingManifestItems[index].destinations = document.getElementById('editPurchasingDestinations').value.trim() || '-';
    purchasingManifestItems[index].notes = document.getElementById('editPurchasingNotes').value.trim() || '';

    window.purchasingManifestItems = purchasingManifestItems;
    autoSavePurchasingDraft();
    closeModal('editPurchasingModal');
    renderPurchasingTable();
    showToast('Cart item updated successfully!', 'success');
}

/**
 * Remove line item from manifest / cart
 */
function removePurchasingLine(index) {
    purchasingManifestItems.splice(index, 1);
    window.purchasingManifestItems = purchasingManifestItems;
    autoSavePurchasingDraft();
    updatePurchasingPrintHeader();
    renderPurchasingTable();
}

/**
 * Open Modal to directly send a purchase item to Stock In
 */
function openDirectStockInModal(index) {
    const item = purchasingManifestItems[index];
    if (!item) return;

    // Resolve product
    let product = null;
    if (item.productId) {
        product = purchasingProductsCache.find(p => p.id === item.productId);
    }
    if (!product) {
        product = purchasingProductsCache.find(p => 
            p.name.toLowerCase().trim() === (item.name || '').toLowerCase().trim() &&
            p.brand.toLowerCase().trim() === (item.brand || '').toLowerCase().trim()
        );
    }

    if (!product) {
        showToast('Product profile not found in active catalog.', 'error');
        return;
    }

    document.getElementById('directStockInIndex').value = index;
    document.getElementById('directStockInProductId').value = product.id;
    document.getElementById('directStockInProductName').value = `${product.brand} - ${product.name} (${product.type === 2 ? 'Construction' : 'Electronics'})`;
    document.getElementById('directStockInQty').value = item.qty;

    // Calculate total batch cost if price provided
    const unitPrice = parseFloat(item.price) || 0;
    const totalCost = unitPrice > 0 ? (unitPrice * parseFloat(item.qty)).toFixed(2) : '';
    document.getElementById('directStockInCost').value = totalCost;
    document.getElementById('directStockInDate').value = new Date().toISOString().split('T')[0];

    // Branch options
    const branchSelect = document.getElementById('directStockInBranchSelect');
    if (branchSelect) {
        branchSelect.innerHTML = purchasingBranchesCache.map(b => 
            `<option value="${b.id}">${escapeHtml(b.name)} ${b.type === 2 ? '(Construction)' : '(Electronics)'}</option>`
        ).join('');

        if (item.targetBranchId) {
            branchSelect.value = item.targetBranchId;
        } else if (item.destinations) {
            const matchBranch = purchasingBranchesCache.find(b => 
                item.destinations.toLowerCase().includes(b.name.toLowerCase())
            );
            if (matchBranch) branchSelect.value = matchBranch.id;
        }
    }

    // Units selector
    const unitSelect = document.getElementById('directStockInUnitSelect');
    const units = AppState.units && AppState.units.length > 0 ? AppState.units : [];
    if (unitSelect) {
        if (units.length > 0) {
            unitSelect.innerHTML = units.map(u => 
                `<option value="${u.id}" ${u.id === product.unit_id ? 'selected' : ''}>${escapeHtml(u.name)} (${escapeHtml(u.symbol)})</option>`
            ).join('');

            // Match if cart item unit matches a unit symbol
            if (item.unit) {
                const matchedUnit = units.find(u => 
                    u.symbol.toLowerCase() === item.unit.toLowerCase() || 
                    u.name.toLowerCase() === item.unit.toLowerCase()
                );
                if (matchedUnit) {
                    unitSelect.value = matchedUnit.id;
                }
            }
        } else {
            unitSelect.innerHTML = `<option value="${product.unit_id || 1}">${escapeHtml(product.unit_name || product.unit_symbol || 'pcs')}</option>`;
        }
    }

    updateDirectStockInConversion();
    openModal('directStockInModal');
}

/**
 * Update packaging conversion display in Direct Stock In modal
 */
function updateDirectStockInConversion() {
    const prodId = parseInt(document.getElementById('directStockInProductId').value, 10);
    const product = purchasingProductsCache.find(p => p.id === prodId);
    const unitSelect = document.getElementById('directStockInUnitSelect');
    const convBox = document.getElementById('directStockInConversionBox');
    const convFactorInput = document.getElementById('directStockInConversionFactor');
    const convPrefix = document.getElementById('directStockInConversionPrefix');
    const baseSuffix = document.getElementById('directStockInBaseUnitSuffix');

    if (!product || !unitSelect || !convBox) return;

    const selectedUnitId = parseInt(unitSelect.value, 10);
    const baseUnitId = product.unit_id;
    const baseUnitName = product.unit_symbol || product.unit_name || 'units';

    const selectedUnitObj = (AppState.units || []).find(u => u.id === selectedUnitId);
    const selectedUnitName = selectedUnitObj ? (selectedUnitObj.symbol || selectedUnitObj.name) : 'package';

    if (selectedUnitId && baseUnitId && selectedUnitId !== baseUnitId) {
        convBox.style.display = 'block';
        if (convPrefix) convPrefix.textContent = `1 ${selectedUnitName} =`;
        if (baseSuffix) baseSuffix.textContent = baseUnitName;
        if (!convFactorInput.value || parseFloat(convFactorInput.value) <= 0) {
            convFactorInput.value = '1';
        }
    } else {
        convBox.style.display = 'none';
        if (convFactorInput) convFactorInput.value = '1';
    }
}

/**
 * Submit Direct Stock In: Creates a verified Stock In ledger entry directly from purchase cart item
 */
async function handleDirectStockInSubmit(e) {
    e.preventDefault();

    const index = parseInt(document.getElementById('directStockInIndex').value, 10);
    const branchId = parseInt(document.getElementById('directStockInBranchSelect').value, 10);
    const productId = parseInt(document.getElementById('directStockInProductId').value, 10);
    const qty = parseFloat(document.getElementById('directStockInQty').value);
    const unitId = parseInt(document.getElementById('directStockInUnitSelect').value, 10);
    const cost = parseFloat(document.getElementById('directStockInCost').value) || 0;
    const date = document.getElementById('directStockInDate').value;
    const conversionFactor = parseFloat(document.getElementById('directStockInConversionFactor').value) || 1.0;

    if (!branchId || !productId || !unitId || isNaN(qty) || qty <= 0) {
        showToast('Please fill all required stock-in fields with valid values.', 'error');
        return;
    }

    try {
        const payload = {
            branch_id: branchId,
            product_id: productId,
            unit_id: unitId,
            quantity: qty,
            purchase_price: cost,
            date: date,
            conversion_factor: conversionFactor
        };

        const res = await fetch('/api/stock/in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.message || 'Failed to execute direct Stock In.');
        }

        showToast('📥 Item directly received into branch live inventory!', 'success');
        closeModal('directStockInModal');

        // Remove the received item from the purchasing cart draft
        if (!isNaN(index) && purchasingManifestItems[index]) {
            purchasingManifestItems.splice(index, 1);
            window.purchasingManifestItems = purchasingManifestItems;
            autoSavePurchasingDraft();
            updatePurchasingPrintHeader();
            renderPurchasingTable();
        }
    } catch (err) {
        console.error('Direct Stock In error:', err);
        showToast(err.message, 'error');
    }
}

/**
 * Render Active Purchasing Sheet Table / Cart
 */
function renderPurchasingTable() {
    const tbody = document.getElementById('purchasingManifestTableBody');
    const countBadge = document.getElementById('purchasingListCount');
    if (countBadge) countBadge.textContent = `${purchasingManifestItems.length} ${t('table.stock', 'items')}`;

    if (!tbody) return;

    if (purchasingManifestItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state-cell" style="text-align:center; padding:36px; color:var(--text-muted);">
                    🛒 ${t('purchasing.empty_cart', 'No line items in purchasing cart. Add items or scan low-stock alerts.')}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = purchasingManifestItems.map((item, idx) => {
        return `
            <tr>
                <td data-label="#" style="font-weight:700; color:var(--text-muted); font-size:12px;">
                    #${idx + 1}
                </td>
                <td data-label="${t('table.brand', 'Brand')}"><strong style="color:var(--text-primary);">${escapeHtml(item.brand)}</strong></td>
                <td class="card-main-title" data-label="${t('table.product', 'Product Name')}" style="font-weight:700; color:var(--text-primary); font-size:14.5px;">${escapeHtml(item.name)}</td>
                <td data-label="${t('purchasing.color_spec', 'Color / Spec')}" style="color:var(--text-secondary); font-size:12.5px;">${escapeHtml(item.color || 'Standard')}</td>
                <td data-label="${t('table.branches', 'Destination(s)')}" style="color:var(--text-secondary); font-size:12.5px;">${escapeHtml(item.destinations || 'All Branches')}</td>
                <td data-label="${t('purchasing.order_qty', 'Order Qty')}"><strong style="color:var(--primary); font-size:13.5px;">${formatNumber(item.qty, item.unit)}</strong> <span style="color:var(--text-secondary); font-size:12px;">${escapeHtml(item.unit || '')}</span></td>
                <td data-label="${t('table.price', 'Unit Price ($)')}" style="min-width:85px;">
                    <input type="text" class="form-control" style="padding:4px 8px; font-size:13px; height:32px; width:100%;" placeholder="$ Price" value="${escapeHtml(item.price || '')}" onchange="updatePurchasingPrice(${idx}, this.value)">
                </td>
                <td data-label="${t('table.type', 'Remarks / Notes')}">
                    <input type="text" class="form-control" style="padding:4px 8px; font-size:13px; height:32px; width:100%; min-width:120px;" placeholder="Add remarks..." value="${escapeHtml(item.notes || '')}" onchange="updatePurchasingRemark(${idx}, this.value)">
                </td>
                <td class="action-column" data-label="${t('table.actions', 'Actions')}" style="text-align:right; white-space:nowrap;">
                    <div style="display:flex; gap:6px; width:100%; justify-content:flex-end;">
                        <button class="btn btn-success" style="padding:6px 10px; font-size:12px; white-space:nowrap;" onclick="openDirectStockInModal(${idx})" title="Directly receive this item into branch stock in">
                            📥 ${t('purchasing.direct_stockin', 'Send to Stock In')}
                        </button>
                        <button class="btn btn-secondary" style="padding:6px 10px; font-size:12px;" onclick="openEditPurchasingLine(${idx})" title="Edit line item">
                            ✏️ ${t('action.edit', 'Edit')}
                        </button>
                        <button class="btn btn-danger-outline" style="padding:6px 10px; font-size:12px;" onclick="removePurchasingLine(${idx})" title="Remove from cart">
                            ✕ ${t('action.delete', 'Remove')}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Global Trigger toggle for Purchasing custom search select
document.addEventListener('click', (e) => {
    const purchTrigger = document.getElementById('purchasingProductTrigger');
    const purchDropdown = document.getElementById('purchasingProductDropdown');
    if (purchTrigger && purchDropdown) {
        if (purchTrigger.contains(e.target)) {
            purchDropdown.classList.toggle('active');
            if (purchDropdown.classList.contains('active')) {
                document.getElementById('purchasingSearchInput')?.focus();
            }
        } else if (!purchDropdown.contains(e.target)) {
            purchDropdown.classList.remove('active');
        }
    }
});

// Attach handlers to window for HTML accessibility
window.loadPurchasingView = loadPurchasingView;
window.handlePurchasingBranchChange = handlePurchasingBranchChange;
window.handlePurchasingAddLine = handlePurchasingAddLine;
window.addLowStockToPurchasing = addLowStockToPurchasing;
window.addOrMergePurchasingItem = addOrMergePurchasingItem;
window.savePurchasingDraft = savePurchasingDraft;
window.loadPurchasingDraft = loadPurchasingDraft;
window.resetPurchasingManifest = resetPurchasingManifest;
window.togglePurchasingCheck = togglePurchasingCheck;
window.updatePurchasingPrice = updatePurchasingPrice;
window.updatePurchasingRemark = updatePurchasingRemark;
window.openEditPurchasingLine = openEditPurchasingLine;
window.handleEditPurchasingSave = handleEditPurchasingSave;
window.removePurchasingLine = removePurchasingLine;
window.filterPurchasingProducts = filterPurchasingProducts;
window.selectPurchasingProduct = selectPurchasingProduct;
window.openDirectStockInModal = openDirectStockInModal;
window.updateDirectStockInConversion = updateDirectStockInConversion;
window.handleDirectStockInSubmit = handleDirectStockInSubmit;
