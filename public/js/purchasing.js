/**
 * StockMatrix - Purchasing Requisition Manifest Compiler
 */

let purchasingManifestItems = [];
let purchasingProductsCache = [];
let purchasingBranchesCache = [];
let selectedPurchasingProduct = null;

/**
 * Load Purchasing View Context
 */
async function loadPurchasingView() {
    try {
        // Set print date
        const printDate = document.getElementById('purchasingPrintTimestamp');
        if (printDate) {
            printDate.textContent = `Manifest Issued: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
        }

        // Fetch products and branches
        const [prodRes, repRes] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/reports')
        ]);

        const prodData = await prodRes.json();
        const repData = await repRes.json();

        if (prodData.success) {
            purchasingProductsCache = prodData.products || [];
            renderPurchasingProductOptions(purchasingProductsCache);
        }

        if (repData.success) {
            purchasingBranchesCache = repData.branches || [];
            populatePurchasingBranches(purchasingBranchesCache);
            renderPurchasingLowStockScanner(repData.lowStockAlerts || []);
        }

        renderPurchasingTable();
    } catch (err) {
        console.error('Error loading purchasing context:', err);
        showToast(err.message, 'error');
    }
}

/**
 * Populate destination branch multi-select
 */
function populatePurchasingBranches(branches) {
    const multiSelect = document.getElementById('purchasingBranchMultiSelect');
    if (!multiSelect) return;

    multiSelect.innerHTML = branches.map(b => 
        `<option value="${b.id}">${escapeHtml(b.name)}</option>`
    ).join('');
}

/**
 * Render searchable product dropdown options
 */
function renderPurchasingProductOptions(products) {
    const list = document.getElementById('purchasingOptionsList');
    if (!list) return;

    if (products.length === 0) {
        list.innerHTML = '<div class="search-select-option" style="color:var(--text-muted); cursor:default;">No matching products</div>';
        return;
    }

    list.innerHTML = products.map(p => `
        <div class="search-select-option" onclick="selectPurchasingProduct(${p.id})">
            <div>
                <strong style="color:var(--text-primary);">${escapeHtml(p.brand)}</strong> - ${escapeHtml(p.name)}
                <span class="badge ${p.type === 1 ? 'badge-blue' : 'badge-emerald'}" style="font-size:10px; margin-left:6px;">
                    ${p.type === 1 ? 'Electronics Matrix' : 'Construction'}
                </span>
            </div>
            <div style="font-size:11.5px; color:var(--text-muted);">Base Unit: ${escapeHtml(p.unit_symbol || p.unit_name || 'N/A')}</div>
        </div>
    `).join('');
}

function filterPurchasingProducts(query) {
    const q = query.toLowerCase().trim();
    const filtered = purchasingProductsCache.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
    renderPurchasingProductOptions(filtered);
}

function selectPurchasingProduct(productId) {
    const product = purchasingProductsCache.find(p => p.id === productId);
    if (!product) return;

    selectedPurchasingProduct = product;
    document.getElementById('purchasingProductId').value = product.id;
    document.getElementById('purchasingProductTrigger').textContent = `${product.brand} - ${product.name}`;

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
            qtyInput.min = '0.01';
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

    if (alerts.length === 0) {
        container.innerHTML = '<div style="padding:16px; text-align:center; color:var(--text-muted); font-size:13px;">✅ All facility branch inventories are within safe operating capacity.</div>';
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
                        🏢 <strong>${escapeHtml(item.branch_name)}</strong> · <span style="color:var(--danger); font-weight:700;">${formatNumber(current, sym)} ${escapeHtml(sym)} left</span>
                        <span style="color:var(--text-muted); font-size:11px;">(Min threshold: ${formatNumber(threshold, sym)} ${escapeHtml(sym)})</span>
                    </div>
                </div>
                <button class="btn btn-secondary" style="padding:4px 10px; font-size:12px;" onclick="addLowStockToPurchasing('${escapeHtml(item.brand)}', '${escapeHtml(item.product_name)}', '${escapeHtml(item.branch_name)}', ${threshold}, ${current}, '${escapeHtml(sym)}')">
                    🛒 Add to Cart
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Add Low Stock item to purchasing cart using product's configured minimum threshold
 */
function addLowStockToPurchasing(brand, name, branchName, minThreshold, currentStock, unitSymbol) {
    const threshold = parseFloat(minThreshold) || 5;
    const current = parseFloat(currentStock) || 0;
    const sym = unitSymbol || 'units';

    // Suggest quantity equal to the configured minimum threshold (or shortage delta)
    const suggestedQty = threshold > 0 ? threshold : 5;

    purchasingManifestItems.push({
        brand: brand,
        name: name,
        color: 'Standard',
        destinations: branchName,
        qty: suggestedQty,
        notes: `Low Stock Alert (${formatNumber(current, sym)} left, Min alert &le; ${formatNumber(threshold, sym)} ${sym})`,
        unit: sym
    });

    renderPurchasingTable();
    showToast(`Added ${brand} - ${name} (${formatNumber(suggestedQty, sym)} ${sym}) to purchasing cart.`, 'success');
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

    const branchMulti = document.getElementById('purchasingBranchMultiSelect');
    const selectedBranches = Array.from(branchMulti.selectedOptions).map(o => o.text);

    if (selectedBranches.length === 0) {
        showToast('Please choose at least one target branch.', 'error');
        return;
    }

    const qty = parseFloat(document.getElementById('purchasingQty').value);
    const color = document.getElementById('purchasingColor').value.trim() || 'Standard';
    const notes = document.getElementById('purchasingNotes').value.trim() || '-';
    const unit = selectedPurchasingProduct.unit_symbol || selectedPurchasingProduct.unit_name || '';

    purchasingManifestItems.push({
        brand: selectedPurchasingProduct.brand,
        name: selectedPurchasingProduct.name,
        color: color,
        destinations: selectedBranches.join(', '),
        qty: qty,
        notes: notes,
        unit: unit
    });

    // Reset form inputs
    document.getElementById('purchasingQty').value = '';
    document.getElementById('purchasingColor').value = '';
    document.getElementById('purchasingNotes').value = '';
    document.getElementById('purchasingProductId').value = '';
    document.getElementById('purchasingProductTrigger').textContent = 'Click to select product...';
    selectedPurchasingProduct = null;

    renderPurchasingTable();
    showToast('Product line added to purchasing cart.', 'success');
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
    document.getElementById('editPurchasingUnitDisplay').textContent = item.unit || 'units';
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

    purchasingManifestItems[index].qty = newQty;
    purchasingManifestItems[index].color = document.getElementById('editPurchasingColor').value.trim() || 'Standard';
    purchasingManifestItems[index].destinations = document.getElementById('editPurchasingDestinations').value.trim() || '-';
    purchasingManifestItems[index].notes = document.getElementById('editPurchasingNotes').value.trim() || '-';

    closeModal('editPurchasingModal');
    renderPurchasingTable();
    showToast('Cart item updated successfully!', 'success');
}

/**
 * Remove line item from manifest / cart
 */
function removePurchasingLine(index) {
    purchasingManifestItems.splice(index, 1);
    renderPurchasingTable();
}

/**
 * Render Active Purchasing Sheet Table / Cart
 */
function renderPurchasingTable() {
    const tbody = document.getElementById('purchasingManifestTableBody');
    const countBadge = document.getElementById('purchasingListCount');
    if (countBadge) countBadge.textContent = `${purchasingManifestItems.length} items`;

    if (!tbody) return;

    if (purchasingManifestItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; padding:36px; color:var(--text-muted);">
                    🛒 No line items in purchasing cart. Add items or scan low-stock alerts.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = purchasingManifestItems.map((item, idx) => `
        <tr>
            <td><strong>${escapeHtml(item.brand)}</strong></td>
            <td style="font-weight:600;">${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.color)}</td>
            <td style="color:var(--text-secondary); font-size:13px;">${escapeHtml(item.destinations)}</td>
            <td><strong style="color:var(--primary); font-size:13.5px;">${formatNumber(item.qty, item.unit)}</strong> ${escapeHtml(item.unit || '')}</td>
            <td style="font-size:12.5px; color:var(--text-muted);">${escapeHtml(item.notes)}</td>
            <td style="border-bottom:1px dashed var(--border-color);"></td>
            <td style="border-bottom:1px dashed var(--border-color);"></td>
            <td class="action-column" style="text-align:right; white-space:nowrap;">
                <button class="btn btn-secondary" style="padding:3px 8px; font-size:11.5px; margin-right:4px;" onclick="openEditPurchasingLine(${idx})" title="Edit line item">
                    ✏️ Edit
                </button>
                <button class="btn btn-danger-outline" style="padding:3px 8px; font-size:11.5px;" onclick="removePurchasingLine(${idx})" title="Remove from cart">
                    ✕ Remove
                </button>
            </td>
        </tr>
    `).join('');
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
