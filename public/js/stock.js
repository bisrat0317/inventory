/**
 * StockMatrix - Stock In & Stock Out Module
 */

let stockInProducts = [];
let stockOutProducts = [];
let selectedStockInProduct = null;
let selectedStockOutProduct = null;
let stockOutConversionsMap = {};

/**
 * ============================================================================
 * HELPER: DUAL-UNIT STOCK FORMATTER
 * ============================================================================
 */
function formatDualStock(quantity, unitSymbol = '', unitName = '') {
    const qty = parseFloat(quantity) || 0;
    const sym = (unitSymbol || unitName || '').toLowerCase().trim();
    const badgeClass = qty <= 5 ? 'badge-red font-bold' : 'badge-slate';

    const baseDisplay = `<span class="badge ${badgeClass}">${formatNumber(qty, unitSymbol || unitName)} ${escapeHtml(unitSymbol || unitName || '')}</span>`;

    // Weight helper: kg -> Sack (50kg) & Quintal (100kg)
    if ((sym === 'kg' || sym === 'kilogram') && qty >= 50) {
        const scks = (qty / 50).toFixed(1).replace(/\.0$/, '');
        const qtls = (qty / 100).toFixed(2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1');
        return `
            <div style="display:inline-flex; flex-direction:column; gap:2px;">
                <div>${baseDisplay}</div>
                <div style="font-size:11px; color:var(--text-muted); font-weight:500;">
                    &asymp; ${scks} ${t('stock.sck', 'sck')} (${qtls} ${t('stock.qtl', 'qtl')})
                </div>
            </div>
        `;
    }

    // Length helper: meter -> Roll (100m)
    if ((sym === 'm' || sym === 'meter' || sym === 'meters') && qty >= 100) {
        const rolls = (qty / 100).toFixed(1).replace(/\.0$/, '');
        return `
            <div style="display:inline-flex; flex-direction:column; gap:2px;">
                <div>${baseDisplay}</div>
                <div style="font-size:11px; color:var(--text-muted); font-weight:500;">
                    &asymp; ${rolls} ${t('stock.rolls', 'rolls')} (100m/${t('stock.roll', 'roll')})
                </div>
            </div>
        `;
    }

    // Liquid helper: Liter -> Bucket (20L)
    if ((sym === 'l' || sym === 'liter' || sym === 'liters') && qty >= 20) {
        const buckets = (qty / 20).toFixed(1).replace(/\.0$/, '');
        return `
            <div style="display:inline-flex; flex-direction:column; gap:2px;">
                <div>${baseDisplay}</div>
                <div style="font-size:11px; color:var(--text-muted); font-weight:500;">
                    &asymp; ${buckets} ${t('stock.bkt', 'bkt')} (20L/${t('stock.bkt', 'bkt')})
                </div>
            </div>
        `;
    }

    return baseDisplay;
}

/**
 * ============================================================================
 * FORM RESET HELPERS
 * ============================================================================
 */

function resetStockInForm() {
    selectedStockInProduct = null;
    const prodId = document.getElementById('stockInProductId');
    if (prodId) prodId.value = '';
    const trigger = document.getElementById('stockInProductTrigger');
    if (trigger) trigger.textContent = 'Click to select product...';
    const searchInput = document.getElementById('stockInSearchInput');
    if (searchInput) searchInput.value = '';
    const qty = document.getElementById('stockInQuantity');
    if (qty) qty.value = '';
    const price = document.getElementById('stockInPurchasePrice');
    if (price) price.value = '';
    const convFactor = document.getElementById('stockInConversionFactor');
    if (convFactor) convFactor.value = '1';
    const convBox = document.getElementById('stockInConversionContainer');
    if (convBox) convBox.style.display = 'none';
    const dateInput = document.getElementById('stockInDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
}

function resetStockOutForm() {
    selectedStockOutProduct = null;
    const prodId = document.getElementById('stockOutProductId');
    if (prodId) prodId.value = '';
    const trigger = document.getElementById('stockOutProductTrigger');
    if (trigger) trigger.textContent = 'Click to select product...';
    const searchInput = document.getElementById('stockOutSearchInput');
    if (searchInput) searchInput.value = '';
    const qty = document.getElementById('stockOutQuantity');
    if (qty) qty.value = '';
    const price = document.getElementById('stockOutSoldPrice');
    if (price) price.value = '';
    const convFactor = document.getElementById('stockOutConversionFactor');
    if (convFactor) convFactor.value = '1';
    const convBox = document.getElementById('stockOutConversionBox');
    if (convBox) convBox.style.display = 'none';
    const dateInput = document.getElementById('stockOutDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    const notice = document.getElementById('stockOutAvailableNotice');
    if (notice) notice.style.display = 'none';
}

/**
 * ============================================================================
 * STOCK IN VIEW LOGIC
 * ============================================================================
 */

async function loadStockInView(preserveForm = false) {
    try {
        if (!preserveForm) {
            resetStockInForm();
        }

        const branchSelect = document.getElementById('stockInBranchSelect');
        const branchId = branchSelect?.value || '';

        const res = await fetch(`/api/stock/in/init?branch_id=${branchId}`);
        if (res.status === 401) {
            window.location.href = '/login.html';
            return;
        }
        if (!res.ok) {
            const errData = await res.json().catch(() => ({ message: 'Server error' }));
            throw new Error(errData.message || 'Failed to load stock in initialization context.');
        }
        const data = await res.json();

        if (data.success) {
            stockInProducts = data.products || [];
            AppState.units = data.units || [];

            // Populate branch selector
            if (branchSelect) {
                const currentVal = branchSelect.value;
                branchSelect.innerHTML = data.permittedBranches.map(b => 
                    `<option value="${b.id}" ${b.id == data.selectedBranchId ? 'selected' : ''}>${escapeHtml(b.name)}</option>`
                ).join('');
                if (currentVal && Array.from(branchSelect.options).some(o => o.value == currentVal)) {
                    branchSelect.value = currentVal;
                }
            }

            // Populate product search dropdown options
            renderStockInProductOptions(stockInProducts);

            // Populate unit selector
            const unitSelect = document.getElementById('stockInUnitSelect');
            if (unitSelect) {
                unitSelect.innerHTML = AppState.units.map(u => 
                    `<option value="${u.id}">${escapeHtml(u.name)} (${escapeHtml(u.symbol)})</option>`
                ).join('');
                if (data.pieceUnitId && !unitSelect.value) unitSelect.value = data.pieceUnitId;
                updateStockInConversion();
            }

            // Update branch name badge and inventory table
            const branchName = branchSelect?.selectedOptions[0]?.text || 'Selected Branch';
            const nameDisplay = document.getElementById('stockInBranchNameDisplay');
            if (nameDisplay) nameDisplay.textContent = branchName;

            renderStockInInventoryTable(data.inventory || []);
        }
    } catch (err) {
        console.error('Error loading stock in:', err);
        showToast(err.message, 'error');
    }
}

function handleStockInBranchChange() {
    resetStockInForm();
    loadStockInView(true);
}

function renderStockInProductOptions(products) {
    const list = document.getElementById('stockInOptionsList');
    if (!list) return;

    if (products.length === 0) {
        list.innerHTML = `<div class="search-select-option" style="color:var(--text-muted); cursor:default;">${t('stock.no_products_branch', 'No matching products in this branch category')}</div>`;
        return;
    }

    list.innerHTML = products.map(p => `
        <div class="search-select-option" onclick="selectStockInProduct(${p.id})">
            <div>
                <strong style="color:var(--text-primary);">${escapeHtml(p.brand)}</strong> - ${escapeHtml(p.name)}
                <span class="badge ${p.type === 1 ? 'badge-blue' : 'badge-emerald'}" style="font-size:10px; margin-left:6px;">
                    ${p.type === 1 ? t('cat.electronics', 'Electronics') : t('cat.construction', 'Construction')}
                </span>
            </div>
            <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">
                ${t('modal.prod_unit', 'Base Unit')}: ${escapeHtml(p.unit_name || p.unit_symbol || 'N/A')}
                ${p.color ? ` &bull; ${t('table.color', 'Color')}: <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${p.color}; vertical-align:middle;"></span> ${escapeHtml(p.color)}` : ''}
            </div>
        </div>
    `).join('');
}

function filterStockInProducts(query) {
    const q = query.toLowerCase().trim();
    const filtered = stockInProducts.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
    renderStockInProductOptions(filtered);
}

function selectStockInProduct(productId) {
    const product = stockInProducts.find(p => p.id === productId);
    if (!product) return;

    selectedStockInProduct = product;
    document.getElementById('stockInProductId').value = product.id;
    document.getElementById('stockInProductTrigger').textContent = `${product.brand} - ${product.name}`;
    
    // Set unit to product's base unit
    const unitSelect = document.getElementById('stockInUnitSelect');
    if (unitSelect && product.unit_id) {
        unitSelect.value = product.unit_id;
    }

    // Close dropdown
    const dropdown = document.getElementById('stockInProductDropdown');
    if (dropdown) dropdown.classList.remove('active');

    updateStockInConversion();
}

async function updateStockInConversion() {
    const unitId = document.getElementById('stockInUnitSelect')?.value;
    const factorInput = document.getElementById('stockInConversionFactor');
    const container = document.getElementById('stockInConversionContainer');
    const prefix = document.getElementById('stockInConversionPrefix');
    const suffix = document.getElementById('stockInBaseUnitSuffix');
    const qtyInput = document.getElementById('stockInQuantity');
    const unitSelect = document.getElementById('stockInUnitSelect');

    // Adjust step and min attribute if unit is integer-based
    if (qtyInput && unitId) {
        const u = (AppState.units || []).find(x => x.id == unitId);
        const isInt = u && /^(piece|pieces|box|boxes|set|sets|pack|packs|unit|units|carton|cartons|item|items|bag|bags|pcs|bx|sck|sack)$/i.test((u.name || u.symbol || '').trim());
        if (isInt) {
            qtyInput.step = '1';
            qtyInput.min = '1';
            qtyInput.placeholder = 'Enter whole quantity (e.g. 10)';
        } else {
            qtyInput.step = 'any';
            qtyInput.min = '0.0001';
            qtyInput.placeholder = 'Enter quantity';
        }
    }

    if (!selectedStockInProduct || !unitId || !factorInput) return;

    const baseUnitName = selectedStockInProduct.unit_symbol || selectedStockInProduct.unit_name || 'base units';
    const selectedUnitObj = (AppState.units || []).find(u => u.id == unitId);
    const selectedUnitName = selectedUnitObj ? (selectedUnitObj.symbol || selectedUnitObj.name) : 'selected unit';

    if (parseInt(unitId, 10) === parseInt(selectedStockInProduct.unit_id, 10)) {
        factorInput.value = '1';
        if (container) container.style.display = 'none';
    } else {
        if (container) container.style.display = 'block';
        if (prefix) prefix.textContent = `1 ${selectedUnitName} =`;
        if (suffix) suffix.textContent = `${baseUnitName}`;

        // Check if there is already a saved conversion for this product
        try {
            const res = await fetch(`/api/stock/conversions/${selectedStockInProduct.id}`);
            const data = await res.json();
            const match = (data.conversions || []).find(c => c.unit_id == unitId);
            if (match && match.factor) {
                factorInput.value = parseFloat(match.factor);
            } else if (!factorInput.value || parseFloat(factorInput.value) <= 0 || factorInput.value === '1') {
                factorInput.value = '1';
            }
        } catch (err) {
            if (!factorInput.value || parseFloat(factorInput.value) <= 0) {
                factorInput.value = '1';
            }
        }
    }
}

function onStockInFactorInput() {
    // User freely types conversion factor
}

let stockInInventoryCache = [];
let stockOutInventoryCache = [];

function renderStockInInventoryTable(items) {
    if (items) stockInInventoryCache = items;
    const currentItems = items || stockInInventoryCache || [];
    const tbody = document.getElementById('stockInInventoryTableBody');
    if (!tbody) return;

    if (currentItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state-cell" style="text-align:center; padding:28px; color:var(--text-muted);">
                    ${t('stock.no_live_inventory', 'No live inventory records in this facility.')}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = currentItems.map(item => {
        const unitSymbol = item.unit_symbol || item.unit_name || '';
        return `
        <tr>
            <td data-label="${t('table.id', 'ID')}" style="font-family:var(--font-mono); color:var(--text-muted);">#${item.id}</td>
            <td data-label="${t('table.brand', 'Brand')}"><strong>${escapeHtml(item.brand)}</strong></td>
            <td class="card-main-title" data-label="${t('table.product', 'Product')}" style="font-weight:700;">${escapeHtml(item.name)}</td>
            <td data-label="${t('table.category', 'Category')}"><span class="badge ${item.type === 1 ? 'badge-blue' : 'badge-emerald'}">${item.type === 1 ? t('cat.electronics', 'Electronics') : t('cat.construction', 'Construction')}</span></td>
            <td data-label="${t('stockin.th_stock_on_hand', 'Stock on Hand')}"><strong style="color:var(--primary);">${formatDualStock(item.total_quantity, unitSymbol, item.unit_name)}</strong></td>
            <td data-label="${t('table.color', 'Color')}">
                ${item.color ? `<span style="width:12px; height:12px; border-radius:50%; background:${item.color}; display:inline-block; vertical-align:middle; margin-right:4px;"></span>${item.color}` : `<span style="color:var(--text-muted); font-size:12px;">${t('general.default', 'Default')}</span>`}
            </td>
            <td data-label="${t('table.desc', 'Description')}" style="font-size:12px; color:var(--text-muted);">${escapeHtml(item.description || '-')}</td>
        </tr>
    `}).join('');
}

async function handleStockInSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('stockInProductId').value;
    if (!productId) {
        showToast('Please search and select a product first.', 'error');
        return;
    }

    const payload = {
        branch_id: parseInt(document.getElementById('stockInBranchSelect').value, 10),
        product_id: parseInt(productId, 10),
        quantity: parseFloat(document.getElementById('stockInQuantity').value),
        unit_id: parseInt(document.getElementById('stockInUnitSelect').value, 10),
        conversion_factor: parseFloat(document.getElementById('stockInConversionFactor').value || 1),
        purchase_price: parseFloat(document.getElementById('stockInPurchasePrice').value),
        date: document.getElementById('stockInDate').value
    };

    try {
        const res = await fetch('/api/stock/in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || 'Stock In failed.');
        }

        showToast(result.message || 'Stock received successfully!', 'success');

        resetStockInForm();
        loadStockInView(true);
    } catch (err) {
        showToast(err.message, 'error');
    }
}


/**
 * ============================================================================
 * STOCK OUT VIEW LOGIC (FIFO DISPATCH)
 * ============================================================================
 */

async function loadStockOutView(preserveForm = false) {
    try {
        if (!preserveForm) {
            resetStockOutForm();
        }

        const branchSelect = document.getElementById('stockOutBranchSelect');
        const branchId = branchSelect?.value || '';

        const res = await fetch(`/api/stock/out/init?branch_id=${branchId}`);
        if (res.status === 401) {
            window.location.href = '/login.html';
            return;
        }
        if (!res.ok) {
            const errData = await res.json().catch(() => ({ message: 'Server error' }));
            throw new Error(errData.message || 'Failed to load stock out initialization context.');
        }
        const data = await res.json();

        if (data.success) {
            stockOutProducts = data.products || [];
            AppState.units = data.units || [];
            stockOutConversionsMap = data.conversions || {};

            // Populate branch selector
            if (branchSelect) {
                const currentVal = branchSelect.value;
                branchSelect.innerHTML = data.permittedBranches.map(b => 
                    `<option value="${b.id}" ${b.id == data.selectedBranchId ? 'selected' : ''}>${escapeHtml(b.name)}</option>`
                ).join('');
                if (currentVal && Array.from(branchSelect.options).some(o => o.value == currentVal)) {
                    branchSelect.value = currentVal;
                }
            }

            // Populate product search dropdown options
            renderStockOutProductOptions(stockOutProducts);

            // Populate unit selector
            const unitSelect = document.getElementById('stockOutUnitSelect');
            if (unitSelect) {
                unitSelect.innerHTML = AppState.units.map(u => 
                    `<option value="${u.id}">${escapeHtml(u.name)} (${escapeHtml(u.symbol)})</option>`
                ).join('');
                if (data.pieceUnitId && !unitSelect.value) unitSelect.value = data.pieceUnitId;
                updateStockOutConversion();
            }

            // Update branch name badge and inventory table
            const branchName = branchSelect?.selectedOptions[0]?.text || 'Selected Branch';
            const nameDisplay = document.getElementById('stockOutBranchNameDisplay');
            if (nameDisplay) nameDisplay.textContent = branchName;

            renderStockOutInventoryTable(data.inventory || []);

            // If a product is already selected, refresh available stock indicator
            if (selectedStockOutProduct) {
                const updatedProduct = stockOutProducts.find(p => p.id === selectedStockOutProduct.id);
                if (updatedProduct) {
                    selectedStockOutProduct = updatedProduct;
                }
                updateStockOutAvailableDisplay();
            }
        }
    } catch (err) {
        console.error('Error loading stock out:', err);
        showToast(err.message, 'error');
    }
}

function handleStockOutBranchChange() {
    resetStockOutForm();
    loadStockOutView(true);
}

function renderStockOutProductOptions(products) {
    const list = document.getElementById('stockOutOptionsList');
    if (!list) return;

    if (products.length === 0) {
        list.innerHTML = `<div class="search-select-option" style="color:var(--text-muted); cursor:default;">${t('stock.no_products_branch', 'No matching products in this branch category')}</div>`;
        return;
    }

    list.innerHTML = products.map(p => {
        const qty = parseFloat(p.branch_quantity || 0);
        const unit = p.unit_symbol || p.unit_name || '';
        const minAlert = parseFloat(p.min_stock_alert !== undefined ? p.min_stock_alert : 5);
        const qtyBadge = qty <= 0 
            ? `<span class="badge badge-red" style="font-size:10px; margin-left:6px;">${t('prod.stock_out', 'Out of Stock')}</span>`
            : `<span class="badge ${qty <= minAlert ? 'badge-amber font-bold' : 'badge-emerald'}" style="font-size:10px; margin-left:6px;">${formatNumber(qty, unit)} ${escapeHtml(unit)} ${t('stockout.available_suffix', 'available')}</span>`;

        return `
            <div class="search-select-option" onclick="selectStockOutProduct(${p.id})">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:var(--text-primary);">${escapeHtml(p.brand)}</strong> - ${escapeHtml(p.name)}
                        <span class="badge ${p.type === 1 ? 'badge-blue' : 'badge-emerald'}" style="font-size:10px; margin-left:4px;">
                            ${p.type === 1 ? t('cat.electronics', 'Electronics') : t('cat.construction', 'Construction')}
                        </span>
                    </div>
                    <div>${qtyBadge}</div>
                </div>
                <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">
                    ${t('modal.prod_unit', 'Base Unit')}: ${escapeHtml(p.unit_name || p.unit_symbol || 'N/A')}
                    ${p.color ? ` &bull; ${t('table.color', 'Color')}: <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${p.color}; vertical-align:middle;"></span> ${escapeHtml(p.color)}` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function filterStockOutProducts(query) {
    const q = query.toLowerCase().trim();
    const filtered = stockOutProducts.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
    renderStockOutProductOptions(filtered);
}

function selectStockOutProduct(productId) {
    const product = stockOutProducts.find(p => p.id === productId);
    if (!product) return;

    selectedStockOutProduct = product;
    document.getElementById('stockOutProductId').value = product.id;
    document.getElementById('stockOutProductTrigger').textContent = `${product.brand} - ${product.name}`;

    const unitSelect = document.getElementById('stockOutUnitSelect');
    if (unitSelect && product.unit_id) {
        unitSelect.value = product.unit_id;
    }

    const dropdown = document.getElementById('stockOutProductDropdown');
    if (dropdown) dropdown.classList.remove('active');

    updateStockOutConversion();
    updateStockOutAvailableDisplay();
}

function updateStockOutAvailableDisplay() {
    const notice = document.getElementById('stockOutAvailableNotice');
    const badge = document.getElementById('stockOutAvailableBadge');
    const qtyInput = document.getElementById('stockOutQuantity');
    if (!notice || !badge) return;

    if (!selectedStockOutProduct) {
        notice.style.display = 'none';
        return;
    }

    const baseQty = parseFloat(selectedStockOutProduct.branch_quantity || 0);
    const factor = parseFloat(document.getElementById('stockOutConversionFactor')?.value || 1);
    const unitSelect = document.getElementById('stockOutUnitSelect');
    const selectedUnitObj = (AppState.units || []).find(u => u.id == unitSelect?.value);
    const selectedUnitName = selectedUnitObj ? (selectedUnitObj.symbol || selectedUnitObj.name) : 'selected unit';
    const baseUnitName = selectedStockOutProduct.unit_symbol || selectedStockOutProduct.unit_name || 'units';

    const qtyInSelectedUnit = factor > 0 ? (baseQty / factor) : baseQty;

    notice.style.display = 'flex';

    if (baseQty <= 0) {
        badge.className = 'badge badge-red font-bold';
        badge.textContent = `0 ${baseUnitName} (Out of Stock in this Branch)`;
        if (qtyInput) {
            qtyInput.max = '0';
        }
    } else {
        const minAlert = parseFloat(selectedStockOutProduct.min_stock_alert !== undefined ? selectedStockOutProduct.min_stock_alert : 5);
        badge.className = baseQty <= minAlert ? 'badge badge-amber font-bold' : 'badge badge-emerald font-bold';
        if (factor !== 1 && factor > 0) {
            badge.textContent = `${formatNumber(qtyInSelectedUnit, selectedUnitName)} ${selectedUnitName} (${formatNumber(baseQty, baseUnitName)} ${baseUnitName} in shelf stock)`;
        } else {
            badge.textContent = `${formatNumber(baseQty, baseUnitName)} ${baseUnitName} available on shelf`;
        }
        if (qtyInput) {
            qtyInput.max = String(qtyInSelectedUnit);
        }
    }

    const costPaidBadge = document.getElementById('stockOutCostPaidBadge');
    if (costPaidBadge) {
        const unitCost = parseFloat(selectedStockOutProduct.unit_purchase_cost || 0);
        if (unitCost > 0) {
            costPaidBadge.style.display = 'inline-block';
            costPaidBadge.textContent = `🏷️ ${t('stockout.cost_paid_prefix', 'Cost Paid')}: ${formatCurrency(unitCost)} / ${baseUnitName}`;
        } else {
            costPaidBadge.style.display = 'none';
        }
    }
}

async function updateStockOutConversion() {
    const unitId = document.getElementById('stockOutUnitSelect')?.value;
    const factorInput = document.getElementById('stockOutConversionFactor');
    const container = document.getElementById('stockOutConversionBox');
    const prefix = document.getElementById('stockOutConversionPrefix');
    const suffix = document.getElementById('stockOutBaseUnitSuffix');
    const qtyInput = document.getElementById('stockOutQuantity');

    // Adjust step and min attribute if unit is integer-based
    if (qtyInput && unitId) {
        const u = (AppState.units || []).find(x => x.id == unitId);
        const isInt = u && /^(piece|pieces|box|boxes|set|sets|pack|packs|unit|units|carton|cartons|item|items|bag|bags|pcs|bx|sck|sack)$/i.test((u.name || u.symbol || '').trim());
        if (isInt) {
            qtyInput.step = '1';
            qtyInput.min = '1';
            qtyInput.placeholder = 'Enter whole quantity (e.g. 10)';
        } else {
            qtyInput.step = 'any';
            qtyInput.min = '0.0001';
            qtyInput.placeholder = 'Enter quantity';
        }
    }

    if (!selectedStockOutProduct || !unitId || !factorInput) return;

    const baseUnitName = selectedStockOutProduct.unit_symbol || selectedStockOutProduct.unit_name || 'base units';
    const selectedUnitObj = (AppState.units || []).find(u => u.id == unitId);
    const selectedUnitName = selectedUnitObj ? (selectedUnitObj.symbol || selectedUnitObj.name) : 'selected unit';

    if (parseInt(unitId, 10) === parseInt(selectedStockOutProduct.unit_id, 10)) {
        factorInput.value = '1';
        if (container) container.style.display = 'none';
        updateStockOutAvailableDisplay();
    } else {
        if (container) container.style.display = 'block';
        if (prefix) prefix.textContent = `1 ${selectedUnitName} =`;
        if (suffix) suffix.textContent = `${baseUnitName}`;

        const convKey = `${selectedStockOutProduct.id}_${unitId}_${selectedStockOutProduct.unit_id}`;
        if (stockOutConversionsMap[convKey]) {
            factorInput.value = stockOutConversionsMap[convKey];
        } else {
            try {
                const res = await fetch(`/api/stock/conversions/${selectedStockOutProduct.id}`);
                const data = await res.json();
                const match = (data.conversions || []).find(c => c.unit_id == unitId);
                if (match && match.factor) {
                    factorInput.value = parseFloat(match.factor);
                } else if (!factorInput.value || parseFloat(factorInput.value) <= 0 || factorInput.value === '1') {
                    factorInput.value = '1';
                }
            } catch (err) {
                if (!factorInput.value || parseFloat(factorInput.value) <= 0) {
                    factorInput.value = '1';
                }
            }
        }
        updateStockOutAvailableDisplay();
    }
}

function onStockOutFactorInput() {
    updateStockOutAvailableDisplay();
}

function renderStockOutInventoryTable(items) {
    if (items) stockOutInventoryCache = items;
    const currentItems = items || stockOutInventoryCache || [];
    const tbody = document.getElementById('stockOutInventoryTableBody');
    if (!tbody) return;

    if (currentItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state-cell" style="text-align:center; padding:28px; color:var(--text-muted);">
                    ${t('stock.no_live_shelf', 'No live inventory on shelves in this branch facility.')}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = currentItems.map(item => {
        const unitSymbol = item.unit_symbol || item.unit_name || '';
        const unitCost = parseFloat(item.unit_purchase_cost || 0);
        return `
        <tr>
            <td data-label="${t('table.id', 'ID')}" style="font-family:var(--font-mono); color:var(--text-muted);">#${item.id}</td>
            <td class="card-main-title" data-label="${t('table.product', 'Product')}" style="font-weight:700;">${escapeHtml(item.name)}</td>
            <td data-label="${t('table.brand', 'Brand')}"><strong>${escapeHtml(item.brand)}</strong></td>
            <td data-label="${t('table.category', 'Category')}"><span class="badge ${item.type === 1 ? 'badge-blue' : 'badge-emerald'}">${item.type === 1 ? t('cat.electronics', 'Electronics') : t('cat.construction', 'Construction')}</span></td>
            <td data-label="${t('modal.prod_unit', 'Unit')}">${escapeHtml(unitSymbol)}</td>
            <td data-label="${t('stockout.th_available_stock', 'Available Stock')}"><strong style="color:var(--success);">${formatDualStock(item.quantity, unitSymbol, item.unit_name)}</strong></td>
            <td data-label="${t('stockout.th_cost_paid', 'Unit Cost Paid')}"><strong style="color:var(--warning); font-size:13px;">${unitCost > 0 ? formatCurrency(unitCost) : '-'}</strong></td>
            <td data-label="${t('table.color', 'Color')}">
                ${item.color ? `<span style="width:12px; height:12px; border-radius:50%; background:${item.color}; display:inline-block; vertical-align:middle; margin-right:4px;"></span>${item.color}` : `<span style="color:var(--text-muted); font-size:12px;">${t('general.default', 'Default')}</span>`}
            </td>
            <td data-label="${t('table.desc', 'Description')}" style="font-size:12px; color:var(--text-muted);">${escapeHtml(item.description || '-')}</td>
        </tr>
    `}).join('');
}

async function handleStockOutSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('stockOutProductId').value;
    if (!productId) {
        showToast('Please search and select a product first.', 'error');
        return;
    }

    const branchId = parseInt(document.getElementById('stockOutBranchSelect').value, 10);
    const quantity = parseFloat(document.getElementById('stockOutQuantity').value);
    const unitId = parseInt(document.getElementById('stockOutUnitSelect').value, 10);
    const factor = parseFloat(document.getElementById('stockOutConversionFactor').value || 1);
    const soldPrice = parseFloat(document.getElementById('stockOutSoldPrice').value);
    const date = document.getElementById('stockOutDate').value;

    // Client-side available stock pre-check
    if (selectedStockOutProduct) {
        const availableBaseStock = parseFloat(selectedStockOutProduct.branch_quantity || 0);
        const requestedBaseQuantity = quantity * factor;
        if (requestedBaseQuantity > availableBaseStock) {
            const unitLabel = selectedStockOutProduct.unit_symbol || selectedStockOutProduct.unit_name || 'units';
            showToast(`Cannot dispatch: Insufficient stock! Available: ${formatNumber(availableBaseStock, unitLabel)} ${unitLabel}, Requested: ${formatNumber(requestedBaseQuantity, unitLabel)} ${unitLabel}.`, 'error');
            return;
        }
    }

    const payload = {
        branch_id: branchId,
        product_id: parseInt(productId, 10),
        quantity: quantity,
        unit_id: unitId,
        conversion_factor: factor,
        sold_price: soldPrice,
        date: date
    };

    try {
        const res = await fetch('/api/stock/out', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || 'FIFO Stock Out failed.');
        }

        showToast(result.message || 'Sale dispatched via FIFO successfully!', 'success');

        resetStockOutForm();
        loadStockOutView(true);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

/**
 * ============================================================================
 * DAMAGED / LOST STOCK LOGIC
 * ============================================================================
 */

let damagedProducts = [];
let selectedDamagedProduct = null;

async function openDamagedStockModal(preferredBranchId = null, preferredProductId = null) {
    try {
        const branchSelect = document.getElementById('damagedBranchSelect');
        const activeBranch = preferredBranchId || branchSelect?.value || '';

        const res = await fetch(`/api/stock/out/init?branch_id=${activeBranch}`);
        const data = await res.json();

        if (data.success) {
            damagedProducts = data.products || [];
            AppState.units = data.units || [];

            // Populate branch selector
            if (branchSelect) {
                branchSelect.innerHTML = data.permittedBranches.map(b => 
                    `<option value="${b.id}" ${b.id == (preferredBranchId || data.selectedBranchId) ? 'selected' : ''}>${escapeHtml(b.name)}</option>`
                ).join('');
            }

            // Populate unit selector
            const unitSelect = document.getElementById('damagedUnitSelect');
            if (unitSelect) {
                unitSelect.innerHTML = AppState.units.map(u => 
                    `<option value="${u.id}">${escapeHtml(u.name)} (${escapeHtml(u.symbol)})</option>`
                ).join('');
                if (data.pieceUnitId && !unitSelect.value) unitSelect.value = data.pieceUnitId;
            }

            renderDamagedProductOptions(damagedProducts);

            // Reset inputs
            selectedDamagedProduct = null;
            document.getElementById('damagedProductId').value = '';
            document.getElementById('damagedProductTrigger').textContent = 'Click to select damaged product...';
            document.getElementById('damagedQuantity').value = '';
            document.getElementById('damagedConversionFactor').value = '1';
            document.getElementById('damagedConversionBox').style.display = 'none';
            document.getElementById('damagedAvailableNotice').style.display = 'none';
            document.getElementById('damagedDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('damagedReasonSelect').value = 'Broken / Shattered during handling';
            document.getElementById('damagedReasonNotes').value = '';

            if (preferredProductId) {
                selectDamagedProduct(preferredProductId);
            }

            openModal('damagedStockModal');
        }
    } catch (err) {
        showToast('Error opening damaged stock register: ' + err.message, 'error');
    }
}

async function handleDamagedBranchChange() {
    const branchId = document.getElementById('damagedBranchSelect')?.value;
    if (!branchId) return;

    try {
        const res = await fetch(`/api/stock/out/init?branch_id=${branchId}`);
        const data = await res.json();
        if (data.success) {
            damagedProducts = data.products || [];
            renderDamagedProductOptions(damagedProducts);

            // Reset selected product
            selectedDamagedProduct = null;
            document.getElementById('damagedProductId').value = '';
            document.getElementById('damagedProductTrigger').textContent = 'Click to select damaged product...';
            document.getElementById('damagedAvailableNotice').style.display = 'none';
            document.getElementById('damagedConversionBox').style.display = 'none';
        }
    } catch (err) {
        console.error('Error switching damaged branch:', err);
    }
}

function renderDamagedProductOptions(products) {
    const list = document.getElementById('damagedOptionsList');
    if (!list) return;

    if (products.length === 0) {
        list.innerHTML = `<div class="search-select-option" style="color:var(--text-muted); cursor:default;">${t('stock.no_products_branch', 'No matching products in this branch')}</div>`;
        return;
    }

    list.innerHTML = products.map(p => {
        const qty = parseFloat(p.branch_quantity || 0);
        const unit = p.unit_symbol || p.unit_name || '';

        return `
            <div class="search-select-option" onclick="selectDamagedProduct(${p.id})">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:var(--text-primary);">${escapeHtml(p.brand)}</strong> - ${escapeHtml(p.name)}
                        <span class="badge ${p.type === 1 ? 'badge-blue' : 'badge-emerald'}" style="font-size:10px; margin-left:4px;">
                            ${p.type === 1 ? t('cat.electronics', 'Electronics') : t('cat.construction', 'Construction')}
                        </span>
                    </div>
                    <span class="badge ${qty <= 0 ? 'badge-red' : 'badge-emerald'}" style="font-size:10px;">
                        ${formatNumber(qty, unit)} ${escapeHtml(unit)} ${t('stockout.available_suffix', 'in stock')}
                    </span>
                </div>
                <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">
                    ${t('modal.prod_unit', 'Base Unit')}: ${escapeHtml(p.unit_name || p.unit_symbol || 'N/A')}
                </div>
            </div>
        `;
    }).join('');
}

function filterDamagedProducts(query) {
    const q = query.toLowerCase().trim();
    const filtered = damagedProducts.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
    renderDamagedProductOptions(filtered);
}

function selectDamagedProduct(productId) {
    const product = damagedProducts.find(p => p.id === productId);
    if (!product) return;

    selectedDamagedProduct = product;
    document.getElementById('damagedProductId').value = product.id;
    document.getElementById('damagedProductTrigger').textContent = `${product.brand} - ${product.name}`;

    const unitSelect = document.getElementById('damagedUnitSelect');
    if (unitSelect && product.unit_id) {
        unitSelect.value = product.unit_id;
    }

    const dropdown = document.getElementById('damagedProductDropdown');
    if (dropdown) dropdown.classList.remove('active');

    updateDamagedConversion();
    updateDamagedAvailableDisplay();
}

function updateDamagedAvailableDisplay() {
    const notice = document.getElementById('damagedAvailableNotice');
    const badge = document.getElementById('damagedAvailableBadge');
    const qtyInput = document.getElementById('damagedQuantity');
    if (!notice || !badge) return;

    if (!selectedDamagedProduct) {
        notice.style.display = 'none';
        return;
    }

    const baseQty = parseFloat(selectedDamagedProduct.branch_quantity || 0);
    const factor = parseFloat(document.getElementById('damagedConversionFactor')?.value || 1);
    const unitSelect = document.getElementById('damagedUnitSelect');
    const selectedUnitObj = (AppState.units || []).find(u => u.id == unitSelect?.value);
    const selectedUnitName = selectedUnitObj ? (selectedUnitObj.symbol || selectedUnitObj.name) : 'selected unit';
    const baseUnitName = selectedDamagedProduct.unit_symbol || selectedDamagedProduct.unit_name || 'units';

    const qtyInSelectedUnit = factor > 0 ? (baseQty / factor) : baseQty;

    notice.style.display = 'flex';

    if (baseQty <= 0) {
        badge.className = 'badge badge-red font-bold';
        badge.textContent = `0 ${baseUnitName} on shelf (Out of Stock)`;
        if (qtyInput) qtyInput.max = '0';
    } else {
        badge.className = 'badge badge-slate font-bold';
        if (factor !== 1 && factor > 0) {
            badge.textContent = `${formatNumber(qtyInSelectedUnit, selectedUnitName)} ${selectedUnitName} (${formatNumber(baseQty, baseUnitName)} ${baseUnitName} on shelf)`;
        } else {
            badge.textContent = `${formatNumber(baseQty, baseUnitName)} ${baseUnitName} on shelf`;
        }
        if (qtyInput) qtyInput.max = String(qtyInSelectedUnit);
    }
}

async function updateDamagedConversion() {
    const unitId = document.getElementById('damagedUnitSelect')?.value;
    const factorInput = document.getElementById('damagedConversionFactor');
    const container = document.getElementById('damagedConversionBox');
    const prefix = document.getElementById('damagedConversionPrefix');
    const suffix = document.getElementById('damagedBaseUnitSuffix');
    const qtyInput = document.getElementById('damagedQuantity');

    if (qtyInput && unitId) {
        const u = (AppState.units || []).find(x => x.id == unitId);
        const isInt = u && /^(piece|pieces|box|boxes|set|sets|pack|packs|unit|units|carton|cartons|item|items|bag|bags|pcs|bx|sck|sack)$/i.test((u.name || u.symbol || '').trim());
        if (isInt) {
            qtyInput.step = '1';
            qtyInput.min = '1';
            qtyInput.placeholder = 'e.g. 2';
        } else {
            qtyInput.step = 'any';
            qtyInput.min = '0.0001';
            qtyInput.placeholder = '0.00';
        }
    }

    if (!selectedDamagedProduct || !unitId || !factorInput) return;

    const baseUnitName = selectedDamagedProduct.unit_symbol || selectedDamagedProduct.unit_name || 'base units';
    const selectedUnitObj = (AppState.units || []).find(u => u.id == unitId);
    const selectedUnitName = selectedUnitObj ? (selectedUnitObj.symbol || selectedUnitObj.name) : 'selected unit';

    if (parseInt(unitId, 10) === parseInt(selectedDamagedProduct.unit_id, 10)) {
        factorInput.value = '1';
        if (container) container.style.display = 'none';
        updateDamagedAvailableDisplay();
    } else {
        if (container) container.style.display = 'block';
        if (prefix) prefix.textContent = `1 ${selectedUnitName} =`;
        if (suffix) suffix.textContent = `${baseUnitName}`;

        try {
            const res = await fetch(`/api/stock/conversions/${selectedDamagedProduct.id}`);
            const data = await res.json();
            const match = (data.conversions || []).find(c => c.unit_id == unitId);
            if (match && match.factor) {
                factorInput.value = parseFloat(match.factor);
            } else if (!factorInput.value || parseFloat(factorInput.value) <= 0 || factorInput.value === '1') {
                factorInput.value = '1';
            }
        } catch (err) {
            if (!factorInput.value || parseFloat(factorInput.value) <= 0) {
                factorInput.value = '1';
            }
        }
        updateDamagedAvailableDisplay();
    }
}

function onDamagedFactorInput() {
    updateDamagedAvailableDisplay();
}

async function handleDamagedStockSubmit(e) {
    e.preventDefault();

    const productId = document.getElementById('damagedProductId').value;
    if (!productId) {
        showToast('Please search and select a damaged product.', 'error');
        return;
    }

    const branchId = parseInt(document.getElementById('damagedBranchSelect').value, 10);
    const quantity = parseFloat(document.getElementById('damagedQuantity').value);
    const unitId = parseInt(document.getElementById('damagedUnitSelect').value, 10);
    const factor = parseFloat(document.getElementById('damagedConversionFactor').value || 1);
    const date = document.getElementById('damagedDate').value;
    const presetReason = document.getElementById('damagedReasonSelect').value;
    const customNotes = document.getElementById('damagedReasonNotes').value.trim();
    const reasonText = customNotes ? `${presetReason} - ${customNotes}` : presetReason;

    // Available shelf check
    if (selectedDamagedProduct) {
        const availableBase = parseFloat(selectedDamagedProduct.branch_quantity || 0);
        const reqBase = quantity * factor;
        if (reqBase > availableBase) {
            const unitLbl = selectedDamagedProduct.unit_symbol || selectedDamagedProduct.unit_name || 'units';
            showToast(`Cannot register damage: Exceeds shelf stock! Available: ${formatNumber(availableBase, unitLbl)} ${unitLbl}, Attempted: ${formatNumber(reqBase, unitLbl)} ${unitLbl}.`, 'error');
            return;
        }
    }

    const payload = {
        branch_id: branchId,
        product_id: parseInt(productId, 10),
        quantity: quantity,
        unit_id: unitId,
        conversion_factor: factor,
        reason: reasonText,
        date: date
    };

    try {
        const res = await fetch('/api/stock/damaged', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || 'Failed to record damaged stock.');
        }

        showToast(result.message || 'Damaged stock registered and subtracted successfully!', 'success');
        closeModal('damagedStockModal');

        // Refresh views
        if (AppState.currentView === 'stock-in' && window.loadStockInView) {
            loadStockInView(true);
        } else if (AppState.currentView === 'stock-out' && window.loadStockOutView) {
            loadStockOutView(true);
        } else if (AppState.currentView === 'branch-ops' && window.renderBranchOpsView && window.activeBranchOpsId) {
            renderBranchOpsView(window.activeBranchOpsId);
        } else if (AppState.currentView === 'dashboard' && window.loadDashboardOverview) {
            loadDashboardOverview();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

/**
 * ============================================================================
 * INTER-BRANCH STOCK TRANSFER LOGIC
 * ============================================================================
 */

let transferProducts = [];
let selectedTransferProduct = null;
let transferPermittedBranches = [];

async function openStockTransferModal(preferredFromBranchId = null, preferredProductId = null) {
    try {
        const fromSelect = document.getElementById('transferFromBranchSelect');

        // Fetch branch and product data
        const activeBranch = preferredFromBranchId || fromSelect?.value || '';
        const res = await fetch(`/api/stock/out/init?branch_id=${activeBranch}`);
        const data = await res.json();

        if (!data.success) {
            throw new Error(data.message || 'Could not load branch information.');
        }

        transferProducts = data.products || [];
        transferPermittedBranches = data.permittedBranches || [];
        AppState.units = data.units || [];

        const activeFromId = preferredFromBranchId ? parseInt(preferredFromBranchId, 10) : data.selectedBranchId;

        // Populate Source branch selector
        if (fromSelect) {
            fromSelect.innerHTML = transferPermittedBranches.map(b => 
                `<option value="${b.id}" ${b.id === activeFromId ? 'selected' : ''}>${escapeHtml(b.name)}</option>`
            ).join('');
        }

        // Populate Destination branch selector (excluding the selected source branch)
        populateTransferToBranches(activeFromId);

        // Populate Unit selector
        const unitSelect = document.getElementById('transferUnitSelect');
        if (unitSelect) {
            unitSelect.innerHTML = AppState.units.map(u => 
                `<option value="${u.id}">${escapeHtml(u.name)} (${escapeHtml(u.symbol)})</option>`
            ).join('');
            if (data.pieceUnitId) unitSelect.value = data.pieceUnitId;
        }

        renderTransferProductOptions(transferProducts);

        // Reset inputs
        selectedTransferProduct = null;
        document.getElementById('transferProductId').value = '';
        document.getElementById('transferProductTrigger').textContent = 'Click to select product to transfer...';
        document.getElementById('transferQuantity').value = '';
        document.getElementById('transferConversionFactor').value = '1';
        document.getElementById('transferConversionBox').style.display = 'none';
        document.getElementById('transferAvailableNotice').style.display = 'none';
        document.getElementById('transferDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('transferNotes').value = '';

        if (preferredProductId) {
            selectTransferProduct(preferredProductId);
        }

        openModal('stockTransferModal');
    } catch (err) {
        showToast('Error opening stock transfer: ' + err.message, 'error');
    }
}

function populateTransferToBranches(sourceBranchId) {
    const toSelect = document.getElementById('transferToBranchSelect');
    if (!toSelect) return;

    const candidateBranches = transferPermittedBranches.filter(b => b.id !== parseInt(sourceBranchId, 10));
    if (candidateBranches.length === 0) {
        toSelect.innerHTML = '<option value="">No other facility available</option>';
        return;
    }

    toSelect.innerHTML = candidateBranches.map(b => 
        `<option value="${b.id}">${escapeHtml(b.name)}</option>`
    ).join('');
}

async function handleTransferSourceBranchChange() {
    const fromId = parseInt(document.getElementById('transferFromBranchSelect')?.value, 10);
    if (!fromId) return;

    populateTransferToBranches(fromId);

    try {
        const res = await fetch(`/api/stock/out/init?branch_id=${fromId}`);
        const data = await res.json();
        if (data.success) {
            transferProducts = data.products || [];
            renderTransferProductOptions(transferProducts);

            selectedTransferProduct = null;
            document.getElementById('transferProductId').value = '';
            document.getElementById('transferProductTrigger').textContent = 'Click to select product to transfer...';
            document.getElementById('transferAvailableNotice').style.display = 'none';
            document.getElementById('transferConversionBox').style.display = 'none';
        }
    } catch (err) {
        console.error('Error switching source branch in transfer:', err);
    }
}

function renderTransferProductOptions(products) {
    const list = document.getElementById('transferOptionsList');
    if (!list) return;

    if (products.length === 0) {
        list.innerHTML = `<div class="search-select-option" style="color:var(--text-muted); cursor:default;">No products in source branch</div>`;
        return;
    }

    list.innerHTML = products.map(p => {
        const qty = parseFloat(p.branch_quantity || 0);
        const unit = p.unit_symbol || p.unit_name || '';

        return `
            <div class="search-select-option" onclick="selectTransferProduct(${p.id})">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:var(--text-primary);">${escapeHtml(p.brand)}</strong> - ${escapeHtml(p.name)}
                        <span class="badge ${p.type === 1 ? 'badge-blue' : 'badge-emerald'}" style="font-size:10px; margin-left:4px;">
                            ${p.type === 1 ? 'Electronics' : 'Construction'}
                        </span>
                    </div>
                    <span class="badge ${qty <= 0 ? 'badge-red' : 'badge-emerald'}" style="font-size:10px;">
                        ${formatNumber(qty, unit)} ${escapeHtml(unit)} in stock
                    </span>
                </div>
                <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">
                    Base Unit: ${escapeHtml(p.unit_name || p.unit_symbol || 'N/A')}
                </div>
            </div>
        `;
    }).join('');
}

function filterTransferProducts(query) {
    const q = query.toLowerCase().trim();
    const filtered = transferProducts.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
    renderTransferProductOptions(filtered);
}

function selectTransferProduct(productId) {
    const product = transferProducts.find(p => p.id === productId);
    if (!product) return;

    selectedTransferProduct = product;
    document.getElementById('transferProductId').value = product.id;
    document.getElementById('transferProductTrigger').textContent = `${product.brand} - ${product.name}`;

    const unitSelect = document.getElementById('transferUnitSelect');
    if (unitSelect && product.unit_id) {
        unitSelect.value = product.unit_id;
    }

    const dropdown = document.getElementById('transferProductDropdown');
    if (dropdown) dropdown.classList.remove('active');

    updateTransferConversion();
    updateTransferAvailableDisplay();
}

function updateTransferAvailableDisplay() {
    const notice = document.getElementById('transferAvailableNotice');
    const badge = document.getElementById('transferAvailableBadge');
    const qtyInput = document.getElementById('transferQuantity');
    if (!notice || !badge) return;

    if (!selectedTransferProduct) {
        notice.style.display = 'none';
        return;
    }

    const baseQty = parseFloat(selectedTransferProduct.branch_quantity || 0);
    const factor = parseFloat(document.getElementById('transferConversionFactor')?.value || 1);
    const unitSelect = document.getElementById('transferUnitSelect');
    const selectedUnitObj = (AppState.units || []).find(u => u.id == unitSelect?.value);
    const selectedUnitName = selectedUnitObj ? (selectedUnitObj.symbol || selectedUnitObj.name) : 'selected unit';
    const baseUnitName = selectedTransferProduct.unit_symbol || selectedTransferProduct.unit_name || 'units';

    const qtyInSelectedUnit = factor > 0 ? (baseQty / factor) : baseQty;

    notice.style.display = 'flex';

    if (baseQty <= 0) {
        badge.className = 'badge badge-red font-bold';
        badge.textContent = `0 ${baseUnitName} on shelf (Out of Stock)`;
        if (qtyInput) qtyInput.max = '0';
    } else {
        badge.className = 'badge badge-emerald font-bold';
        if (factor !== 1 && factor > 0) {
            badge.textContent = `${formatNumber(qtyInSelectedUnit, selectedUnitName)} ${selectedUnitName} (${formatNumber(baseQty, baseUnitName)} ${baseUnitName} on shelf)`;
        } else {
            badge.textContent = `${formatNumber(baseQty, baseUnitName)} ${baseUnitName} on shelf`;
        }
        if (qtyInput) qtyInput.max = String(qtyInSelectedUnit);
    }
}

async function updateTransferConversion() {
    const unitId = document.getElementById('transferUnitSelect')?.value;
    const factorInput = document.getElementById('transferConversionFactor');
    const container = document.getElementById('transferConversionBox');
    const prefix = document.getElementById('transferConversionPrefix');
    const suffix = document.getElementById('transferBaseUnitSuffix');
    const qtyInput = document.getElementById('transferQuantity');

    if (qtyInput && unitId) {
        const u = (AppState.units || []).find(x => x.id == unitId);
        const isInt = u && /^(piece|pieces|box|boxes|set|sets|pack|packs|unit|units|carton|cartons|item|items|bag|bags|pcs|bx|sck|sack)$/i.test((u.name || u.symbol || '').trim());
        if (isInt) {
            qtyInput.step = '1';
            qtyInput.min = '1';
            qtyInput.placeholder = 'e.g. 10';
        } else {
            qtyInput.step = 'any';
            qtyInput.min = '0.0001';
            qtyInput.placeholder = '0.00';
        }
    }

    if (!selectedTransferProduct || !unitId || !factorInput) return;

    const baseUnitName = selectedTransferProduct.unit_symbol || selectedTransferProduct.unit_name || 'base units';
    const selectedUnitObj = (AppState.units || []).find(u => u.id == unitId);
    const selectedUnitName = selectedUnitObj ? (selectedUnitObj.symbol || selectedUnitObj.name) : 'selected unit';

    if (parseInt(unitId, 10) === parseInt(selectedTransferProduct.unit_id, 10)) {
        factorInput.value = '1';
        if (container) container.style.display = 'none';
        updateTransferAvailableDisplay();
    } else {
        if (container) container.style.display = 'block';
        if (prefix) prefix.textContent = `1 ${selectedUnitName} =`;
        if (suffix) suffix.textContent = `${baseUnitName}`;

        try {
            const res = await fetch(`/api/stock/conversions/${selectedTransferProduct.id}`);
            const data = await res.json();
            const match = (data.conversions || []).find(c => c.unit_id == unitId);
            if (match && match.factor) {
                factorInput.value = parseFloat(match.factor);
            } else if (!factorInput.value || parseFloat(factorInput.value) <= 0 || factorInput.value === '1') {
                factorInput.value = '1';
            }
        } catch (err) {
            if (!factorInput.value || parseFloat(factorInput.value) <= 0) {
                factorInput.value = '1';
            }
        }
        updateTransferAvailableDisplay();
    }
}

function onTransferFactorInput() {
    updateTransferAvailableDisplay();
}

function onTransferQtyInput() {
    updateTransferAvailableDisplay();
}

async function handleStockTransferSubmit(e) {
    e.preventDefault();

    const fromBranchId = parseInt(document.getElementById('transferFromBranchSelect')?.value, 10);
    const toBranchId = parseInt(document.getElementById('transferToBranchSelect')?.value, 10);
    const productId = parseInt(document.getElementById('transferProductId')?.value, 10);
    const quantity = parseFloat(document.getElementById('transferQuantity')?.value);
    const unitId = parseInt(document.getElementById('transferUnitSelect')?.value, 10);
    const factor = parseFloat(document.getElementById('transferConversionFactor')?.value || 1);
    const date = document.getElementById('transferDate')?.value;
    const notes = document.getElementById('transferNotes')?.value.trim();

    if (!productId) {
        showToast('Please search and select a product to transfer.', 'error');
        return;
    }

    if (!fromBranchId || !toBranchId) {
        showToast('Please select both source and destination branches.', 'error');
        return;
    }

    if (fromBranchId === toBranchId) {
        showToast('Source and destination branches must be different!', 'error');
        return;
    }

    if (isNaN(quantity) || quantity <= 0) {
        showToast('Please enter a valid positive transfer quantity.', 'error');
        return;
    }

    // Shelf stock check
    if (selectedTransferProduct) {
        const availableBase = parseFloat(selectedTransferProduct.branch_quantity || 0);
        const reqBase = quantity * factor;
        if (reqBase > availableBase) {
            const unitLbl = selectedTransferProduct.unit_symbol || selectedTransferProduct.unit_name || 'units';
            showToast(`Transfer exceeds shelf inventory! Available: ${formatNumber(availableBase, unitLbl)} ${unitLbl}, Attempted: ${formatNumber(reqBase, unitLbl)} ${unitLbl}.`, 'error');
            return;
        }
    }

    const payload = {
        from_branch_id: fromBranchId,
        to_branch_id: toBranchId,
        product_id: productId,
        unit_id: unitId,
        quantity: quantity,
        conversion_factor: factor,
        notes: notes,
        date: date
    };

    try {
        const res = await fetch('/api/stock/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || 'Transfer failed.');
        }

        showToast(result.message || 'Stock successfully transferred between branches!', 'success');
        closeModal('stockTransferModal');

        // Refresh active views
        if (AppState.currentView === 'stock-out' && window.loadStockOutView) {
            loadStockOutView(true);
        } else if (AppState.currentView === 'stock-in' && window.loadStockInView) {
            loadStockInView(true);
        } else if (AppState.currentView === 'dashboard' && window.loadDashboardOverview) {
            loadDashboardOverview();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Global Trigger toggles for custom search selects
document.addEventListener('click', (e) => {
    // Stock In Trigger
    const inTrigger = document.getElementById('stockInProductTrigger');
    const inDropdown = document.getElementById('stockInProductDropdown');
    if (inTrigger && inDropdown) {
        if (inTrigger.contains(e.target)) {
            inDropdown.classList.toggle('active');
            if (inDropdown.classList.contains('active')) {
                document.getElementById('stockInSearchInput')?.focus();
            }
        } else if (!inDropdown.contains(e.target)) {
            inDropdown.classList.remove('active');
        }
    }

    // Stock Out Trigger
    const outTrigger = document.getElementById('stockOutProductTrigger');
    const outDropdown = document.getElementById('stockOutProductDropdown');
    if (outTrigger && outDropdown) {
        if (outTrigger.contains(e.target)) {
            outDropdown.classList.toggle('active');
            if (outDropdown.classList.contains('active')) {
                document.getElementById('stockOutSearchInput')?.focus();
            }
        } else if (!outDropdown.contains(e.target)) {
            outDropdown.classList.remove('active');
        }
    }

    // Damaged Stock Trigger
    const damTrigger = document.getElementById('damagedProductTrigger');
    const damDropdown = document.getElementById('damagedProductDropdown');
    if (damTrigger && damDropdown) {
        if (damTrigger.contains(e.target)) {
            damDropdown.classList.toggle('active');
            if (damDropdown.classList.contains('active')) {
                document.getElementById('damagedSearchInput')?.focus();
            }
        } else if (!damDropdown.contains(e.target)) {
            damDropdown.classList.remove('active');
        }
    }

    // Transfer Stock Trigger
    const transTrigger = document.getElementById('transferProductTrigger');
    const transDropdown = document.getElementById('transferProductDropdown');
    if (transTrigger && transDropdown) {
        if (transTrigger.contains(e.target)) {
            transDropdown.classList.toggle('active');
            if (transDropdown.classList.contains('active')) {
                document.getElementById('transferSearchInput')?.focus();
            }
        } else if (!transDropdown.contains(e.target)) {
            transDropdown.classList.remove('active');
        }
    }
});

// Expose table renderers and transfer handlers for reactive i18n and global triggers
window.renderStockInInventoryTable = renderStockInInventoryTable;
window.renderStockOutInventoryTable = renderStockOutInventoryTable;
window.openStockTransferModal = openStockTransferModal;
window.handleTransferSourceBranchChange = handleTransferSourceBranchChange;
window.selectTransferProduct = selectTransferProduct;
window.filterTransferProducts = filterTransferProducts;
window.updateTransferConversion = updateTransferConversion;
window.onTransferFactorInput = onTransferFactorInput;
window.onTransferQtyInput = onTransferQtyInput;
window.handleStockTransferSubmit = handleStockTransferSubmit;
window.openDamagedStockModal = openDamagedStockModal;
window.handleDamagedStockSubmit = handleDamagedStockSubmit;
window.handleDamagedBranchChange = handleDamagedBranchChange;
window.selectDamagedProduct = selectDamagedProduct;
window.filterDamagedProducts = filterDamagedProducts;
window.updateDamagedConversion = updateDamagedConversion;
window.onDamagedFactorInput = onDamagedFactorInput;


