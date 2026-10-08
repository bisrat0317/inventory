/**
 * StockMatrix - Stock In & Stock Out Module
 */

let stockInProducts = [];
let stockOutProducts = [];
let selectedStockInProduct = null;
let selectedStockOutProduct = null;

/**
 * ============================================================================
 * STOCK IN VIEW LOGIC
 * ============================================================================
 */

async function loadStockInView() {
    try {
        const branchSelect = document.getElementById('stockInBranchSelect');
        const branchId = branchSelect?.value || '';

        // Default date to today
        const dateInput = document.getElementById('stockInDate');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

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
                if (data.pieceUnitId) unitSelect.value = data.pieceUnitId;
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
    selectedStockInProduct = null;
    const prodIdInput = document.getElementById('stockInProductId');
    if (prodIdInput) prodIdInput.value = '';
    const prodTrigger = document.getElementById('stockInProductTrigger');
    if (prodTrigger) prodTrigger.textContent = 'Click to select product...';
    loadStockInView();
}

function renderStockInProductOptions(products) {
    const list = document.getElementById('stockInOptionsList');
    if (!list) return;

    if (products.length === 0) {
        list.innerHTML = '<div class="search-select-option" style="color:var(--text-muted); cursor:default;">No matching products in this branch category</div>';
        return;
    }

    list.innerHTML = products.map(p => `
        <div class="search-select-option" onclick="selectStockInProduct(${p.id})">
            <div>
                <strong style="color:var(--text-primary);">${escapeHtml(p.brand)}</strong> - ${escapeHtml(p.name)}
                <span class="badge ${p.type === 1 ? 'badge-blue' : 'badge-emerald'}" style="font-size:10px; margin-left:6px;">
                    ${p.type === 1 ? 'Electronics Matrix' : 'Construction'}
                </span>
            </div>
            <div style="font-size:11.5px; color:var(--text-muted);">Base Unit: ${escapeHtml(p.unit_name || p.unit_symbol || 'N/A')}</div>
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
    
    // Auto-set unit to product's base unit
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
    const displayInput = document.getElementById('stockInConversionDisplay');
    const container = document.getElementById('stockInConversionContainer');
    const qtyInput = document.getElementById('stockInQuantity');

    // Adjust step and min attribute if unit is Piece / Box / Set
    if (qtyInput && unitId) {
        const u = (AppState.units || []).find(x => x.id == unitId);
        const isInt = u && /^(piece|pieces|box|boxes|set|sets|pack|packs|unit|units|carton|cartons|item|items|bag|bags|pcs|bx)$/i.test((u.name || u.symbol || '').trim());
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

    if (!selectedStockInProduct || !unitId || !factorInput || !displayInput) return;

    if (parseInt(unitId, 10) === parseInt(selectedStockInProduct.unit_id, 10)) {
        factorInput.value = '1';
        displayInput.value = '1.0 (Direct 1:1 Base Unit)';
        if (container) container.style.display = 'none';
    } else {
        try {
            const res = await fetch(`/api/stock/conversions/${selectedStockInProduct.id}`);
            const data = await res.json();
            const match = (data.conversions || []).find(c => c.unit_id == unitId);
            const factor = match ? parseFloat(match.factor) : 1.0;
            
            factorInput.value = factor;
            displayInput.value = `1 selected unit = ${factor} base (${selectedStockInProduct.unit_symbol || selectedStockInProduct.unit_name})`;
            if (container) container.style.display = 'block';
        } catch (err) {
            factorInput.value = '1';
            displayInput.value = '1.0';
        }
    }
}

function renderStockInInventoryTable(items) {
    const tbody = document.getElementById('stockInInventoryTableBody');
    if (!tbody) return;

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:28px; color:var(--text-muted);">
                    No live inventory records in this facility.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = items.map(item => {
        const unitName = item.unit_symbol || item.unit_name || '';
        return `
        <tr>
            <td style="font-family:var(--font-mono); color:var(--text-muted);">#${item.id}</td>
            <td><strong>${escapeHtml(item.brand)}</strong></td>
            <td style="font-weight:600;">${escapeHtml(item.name)}</td>
            <td><span class="badge ${item.type === 1 ? 'badge-blue' : 'badge-emerald'}">${item.type === 1 ? 'Electronics Matrix' : 'Construction'}</span></td>
            <td><span class="badge ${parseFloat(item.total_quantity) <= 5 ? 'badge-red font-bold' : 'badge-slate'}">${formatNumber(item.total_quantity, unitName)} ${escapeHtml(unitName)}</span></td>
            <td>
                ${item.color ? `<span style="width:12px; height:12px; border-radius:50%; background:${item.color}; display:inline-block; vertical-align:middle; margin-right:4px;"></span>${item.color}` : '<span style="color:var(--text-muted); font-size:12px;">Default</span>'}
            </td>
            <td style="font-size:12px; color:var(--text-muted);">${escapeHtml(item.description || '-')}</td>
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

        // Reset form inputs (preserve branch)
        document.getElementById('stockInQuantity').value = '';
        document.getElementById('stockInPurchasePrice').value = '';
        document.getElementById('stockInProductId').value = '';
        document.getElementById('stockInProductTrigger').textContent = 'Click to select product...';
        selectedStockInProduct = null;

        // Reload table
        loadStockInView();
    } catch (err) {
        showToast(err.message, 'error');
    }
}


/**
 * ============================================================================
 * STOCK OUT VIEW LOGIC (FIFO DISPATCH)
 * ============================================================================
 */

async function loadStockOutView() {
    try {
        const branchSelect = document.getElementById('stockOutBranchSelect');
        const branchId = branchSelect?.value || '';

        const dateInput = document.getElementById('stockOutDate');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

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
                if (data.pieceUnitId) unitSelect.value = data.pieceUnitId;
                updateStockOutConversion();
            }

            // Update branch name badge and inventory table
            const branchName = branchSelect?.selectedOptions[0]?.text || 'Selected Branch';
            const nameDisplay = document.getElementById('stockOutBranchNameDisplay');
            if (nameDisplay) nameDisplay.textContent = branchName;

            renderStockOutInventoryTable(data.inventory || []);
        }
    } catch (err) {
        console.error('Error loading stock out:', err);
        showToast(err.message, 'error');
    }
}

function handleStockOutBranchChange() {
    selectedStockOutProduct = null;
    const prodIdInput = document.getElementById('stockOutProductId');
    if (prodIdInput) prodIdInput.value = '';
    const prodTrigger = document.getElementById('stockOutProductTrigger');
    if (prodTrigger) prodTrigger.textContent = 'Click to select product...';
    loadStockOutView();
}

function renderStockOutProductOptions(products) {
    const list = document.getElementById('stockOutOptionsList');
    if (!list) return;

    if (products.length === 0) {
        list.innerHTML = '<div class="search-select-option" style="color:var(--text-muted); cursor:default;">No matching products in this branch category</div>';
        return;
    }

    list.innerHTML = products.map(p => `
        <div class="search-select-option" onclick="selectStockOutProduct(${p.id})">
            <div>
                <strong style="color:var(--text-primary);">${escapeHtml(p.brand)}</strong> - ${escapeHtml(p.name)}
                <span class="badge ${p.type === 1 ? 'badge-blue' : 'badge-emerald'}" style="font-size:10px; margin-left:6px;">
                    ${p.type === 1 ? 'Electronics Matrix' : 'Construction'}
                </span>
            </div>
            <div style="font-size:11.5px; color:var(--text-muted);">Base Unit: ${escapeHtml(p.unit_name || p.unit_symbol || 'N/A')}</div>
        </div>
    `).join('');
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
}

async function updateStockOutConversion() {
    const unitId = document.getElementById('stockOutUnitSelect')?.value;
    const factorInput = document.getElementById('stockOutConversionFactor');
    const displayInput = document.getElementById('stockOutConversionFactorDisplay');
    const container = document.getElementById('stockOutConversionBox');
    const qtyInput = document.getElementById('stockOutQuantity');

    // Adjust step and min attribute if unit is Piece / Box / Set
    if (qtyInput && unitId) {
        const u = (AppState.units || []).find(x => x.id == unitId);
        const isInt = u && /^(piece|pieces|box|boxes|set|sets|pack|packs|unit|units|carton|cartons|item|items|bag|bags|pcs|bx)$/i.test((u.name || u.symbol || '').trim());
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

    if (!selectedStockOutProduct || !unitId || !factorInput || !displayInput) return;

    if (parseInt(unitId, 10) === parseInt(selectedStockOutProduct.unit_id, 10)) {
        factorInput.value = '1';
        displayInput.value = '1.0 (Direct Base Unit)';
        if (container) container.style.display = 'none';
    } else {
        try {
            const res = await fetch(`/api/stock/conversions/${selectedStockOutProduct.id}`);
            const data = await res.json();
            const match = (data.conversions || []).find(c => c.unit_id == unitId);
            const factor = match ? parseFloat(match.factor) : 1.0;
            
            factorInput.value = factor;
            displayInput.value = `1 selected unit = ${factor} base (${selectedStockOutProduct.unit_symbol || selectedStockOutProduct.unit_name})`;
            if (container) container.style.display = 'block';
        } catch (err) {
            factorInput.value = '1';
            displayInput.value = '1.0';
        }
    }
}

function renderStockOutInventoryTable(items) {
    const tbody = document.getElementById('stockOutInventoryTableBody');
    if (!tbody) return;

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:28px; color:var(--text-muted);">
                    No live inventory on shelves in this branch facility.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = items.map(item => {
        const unitName = item.unit_symbol || item.unit_name || '';
        return `
        <tr>
            <td style="font-family:var(--font-mono); color:var(--text-muted);">#${item.id}</td>
            <td style="font-weight:600;">${escapeHtml(item.name)}</td>
            <td><strong>${escapeHtml(item.brand)}</strong></td>
            <td><span class="badge ${item.type === 1 ? 'badge-blue' : 'badge-emerald'}">${item.type === 1 ? 'Electronics Matrix' : 'Construction'}</span></td>
            <td>${escapeHtml(unitName)}</td>
            <td><span class="badge ${parseFloat(item.total_quantity) <= 5 ? 'badge-red font-bold' : 'badge-slate'}">${formatNumber(item.total_quantity, unitName)}</span></td>
            <td>
                ${item.color ? `<span style="width:12px; height:12px; border-radius:50%; background:${item.color}; display:inline-block; vertical-align:middle; margin-right:4px;"></span>${item.color}` : '<span style="color:var(--text-muted); font-size:12px;">Default</span>'}
            </td>
            <td style="font-size:12px; color:var(--text-muted);">${escapeHtml(item.description || '-')}</td>
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

    const payload = {
        branch_id: parseInt(document.getElementById('stockOutBranchSelect').value, 10),
        product_id: parseInt(productId, 10),
        quantity: parseFloat(document.getElementById('stockOutQuantity').value),
        unit_id: parseInt(document.getElementById('stockOutUnitSelect').value, 10),
        conversion_factor: parseFloat(document.getElementById('stockOutConversionFactor').value || 1),
        sold_price: parseFloat(document.getElementById('stockOutSoldPrice').value),
        date: document.getElementById('stockOutDate').value
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

        // Reset form inputs
        document.getElementById('stockOutQuantity').value = '';
        document.getElementById('stockOutSoldPrice').value = '';
        document.getElementById('stockOutProductId').value = '';
        document.getElementById('stockOutProductTrigger').textContent = 'Click to select product...';
        selectedStockOutProduct = null;

        // Reload table
        loadStockOutView();
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
});
