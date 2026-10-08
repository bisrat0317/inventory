/**
 * StockMatrix - Product Catalog Module
 */

let productsCache = [];
let currentSortColumn = 'name';
let currentSortOrder = 'ASC';
let debounceTimer = null;

/**
 * Load products from backend
 */
async function loadProducts() {
    try {
        const name = document.getElementById('prodSearchName')?.value || '';
        const brand = document.getElementById('prodSearchBrand')?.value || '';
        const type = document.getElementById('prodFilterType')?.value || '';
        const unit = document.getElementById('prodFilterUnit')?.value || '';

        const params = new URLSearchParams({
            sort: currentSortColumn,
            order: currentSortOrder
        });

        if (name) params.append('name', name);
        if (brand) params.append('brand', brand);
        if (type) params.append('type', type);
        if (unit) params.append('unit', unit);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to load products.');

        const data = await res.json();
        if (data.success) {
            productsCache = data.products;
            if (data.units) {
                AppState.units = data.units;
                populateUnitDropdowns(data.units);
            }
            renderProductsList();
        }
    } catch (err) {
        console.error('Error fetching products:', err);
        showToast(err.message, 'error');
    }
}

/**
 * Populate unit dropdown filters and forms
 */
function populateUnitDropdowns(units) {
    const filterUnit = document.getElementById('prodFilterUnit');
    const formUnit = document.getElementById('prodFormUnit');

    if (filterUnit && filterUnit.options.length <= 1) {
        const currentVal = filterUnit.value;
        filterUnit.innerHTML = '<option value="">All Units</option>' + 
            units.map(u => `<option value="${u.id}">${u.name} (${u.symbol})</option>`).join('');
        filterUnit.value = currentVal;
    }

    if (formUnit) {
        const currentVal = formUnit.value;
        formUnit.innerHTML = units.map(u => `<option value="${u.id}">${u.name} (${u.symbol})</option>`).join('');
        if (currentVal) formUnit.value = currentVal;
    }
}

/**
 * Render Product Table rows
 */
function renderProductsList() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    if (!productsCache || productsCache.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:36px; color:var(--text-muted);">
                    No product profiles found matching active search criteria.
                </td>
            </tr>
        `;
        return;
    }

    const userRole = AppState.currentUser?.role;
    const canManage = userRole === 'admin' || userRole === 'manager';

    tbody.innerHTML = productsCache.map(p => {
        const categoryBadge = p.type === 1 
            ? '<span class="badge badge-blue">Electronics Matrix</span>' 
            : '<span class="badge badge-emerald">Construction Supply</span>';

        const colorSwatch = p.color 
            ? `<div style="display:flex; align-items:center; gap:6px;">
                 <span style="width:14px; height:14px; border-radius:50%; background:${p.color}; border:1px solid rgba(255,255,255,0.2); display:inline-block;"></span>
                 <span style="font-family:var(--font-mono); font-size:12px;">${p.color}</span>
               </div>` 
            : '<span style="color:var(--text-muted); font-size:12px;">Default</span>';

        const stockBadge = parseFloat(p.total_quantity) <= 5
            ? `<span class="badge badge-red font-bold">${formatNumber(p.total_quantity, p.unit_symbol || p.unit_name)}</span>`
            : `<span class="badge badge-slate">${formatNumber(p.total_quantity, p.unit_symbol || p.unit_name)}</span>`;

        return `
            <tr>
                <td style="font-family:var(--font-mono); font-weight:600; color:var(--text-muted);">#${p.id}</td>
                <td><strong style="color:var(--text-primary);">${escapeHtml(p.brand)}</strong></td>
                <td>
                    <div style="font-weight:600;">${escapeHtml(p.name)}</div>
                    ${p.description ? `<div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${escapeHtml(p.description)}</div>` : ''}
                </td>
                <td>${categoryBadge}</td>
                <td>${stockBadge}</td>
                <td style="font-weight:500;">${p.unit_symbol || p.unit_name || '-'}</td>
                <td>${colorSwatch}</td>
                <td style="text-align:right;">
                    ${canManage ? `
                        <div style="display:inline-flex; gap:6px;">
                            <button class="btn btn-secondary" style="padding:4px 10px; font-size:12px;" onclick="openEditProductModal(${p.id})">Edit</button>
                            <button class="btn btn-danger-outline" style="padding:4px 10px; font-size:12px;" onclick="deleteProduct(${p.id})">Delete</button>
                        </div>
                    ` : '<span style="color:var(--text-muted); font-size:12px;">View Only</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Filter debouncer
 */
function debounceProductFilter() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        loadProducts();
    }, 280);
}

/**
 * Reset all filter fields
 */
function resetProductFilters() {
    const name = document.getElementById('prodSearchName');
    const brand = document.getElementById('prodSearchBrand');
    const type = document.getElementById('prodFilterType');
    const unit = document.getElementById('prodFilterUnit');

    if (name) name.value = '';
    if (brand) brand.value = '';
    if (type) type.value = '';
    if (unit) unit.value = '';

    loadProducts();
}

/**
 * Sort column handler
 */
function sortProducts(column) {
    if (currentSortColumn === column) {
        currentSortOrder = currentSortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
        currentSortColumn = column;
        currentSortOrder = 'ASC';
    }
    loadProducts();
}

/**
 * Color picker and text input sync
 */
function syncColorPicker(hex) {
    const picker = document.getElementById('prodFormColorPicker');
    if (picker && /^#[0-9A-F]{6}$/i.test(hex)) {
        picker.value = hex;
    }
}

function syncColorText(hex) {
    const text = document.getElementById('prodFormColorText');
    if (text) {
        text.value = hex;
    }
}

/**
 * Ensure units are available in AppState
 */
async function ensureUnitsLoaded() {
    if (!AppState.units || AppState.units.length === 0) {
        try {
            const res = await fetch('/api/products/units');
            const data = await res.json();
            if (data.success && data.units) {
                AppState.units = data.units;
                populateUnitDropdowns(data.units);
            }
        } catch (e) {
            console.error('Error loading units:', e);
        }
    } else {
        populateUnitDropdowns(AppState.units);
    }
}

/**
 * Open Create Product Modal
 */
async function openCreateProductModal() {
    const form = document.getElementById('productForm');
    if (!form) return;
    form.reset();
    document.getElementById('productFormId').value = '';
    document.getElementById('productModalTitle').textContent = 'Add Product';
    document.getElementById('productFormSubmitBtn').innerHTML = '💾 Save Product';
    document.getElementById('prodFormColorPicker').value = '#000000';
    document.getElementById('prodFormColorText').value = '';

    await ensureUnitsLoaded();
    openModal('productModal');
}

/**
 * Open Edit Product Modal
 */
async function openEditProductModal(id) {
    try {
        await ensureUnitsLoaded();
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Could not fetch product details.');
        const data = await res.json();
        
        if (data.success && data.product) {
            const p = data.product;
            document.getElementById('productFormId').value = p.id;
            document.getElementById('prodFormName').value = p.name;
            document.getElementById('prodFormType').value = p.type;
            document.getElementById('prodFormBrand').value = p.brand;
            document.getElementById('prodFormDesc').value = p.description || '';
            
            const color = p.color || '';
            document.getElementById('prodFormColorText').value = color;
            document.getElementById('prodFormColorPicker').value = (color.startsWith('#') && color.length === 7) ? color : '#000000';

            document.getElementById('prodFormUnit').value = p.unit_id;
            document.getElementById('productModalTitle').textContent = `Edit Product: ${p.name}`;
            document.getElementById('productFormSubmitBtn').innerHTML = '💾 Update Product';

            openModal('productModal');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

/**
 * Handle Product Form Submit (Create or Update)
 */
async function handleProductFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('productFormId').value;
    const isEdit = Boolean(id);

    const colorVal = document.getElementById('prodFormColorText').value.trim();

    const payload = {
        name: document.getElementById('prodFormName').value.trim(),
        type: parseInt(document.getElementById('prodFormType').value, 10),
        brand: document.getElementById('prodFormBrand').value.trim(),
        unit_id: parseInt(document.getElementById('prodFormUnit').value, 10),
        description: document.getElementById('prodFormDesc').value.trim(),
        color: colorVal || null
    };

    try {
        const url = isEdit ? `/api/products/${id}` : '/api/products';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || 'Operation failed.');
        }

        showToast(result.message || (isEdit ? 'Product updated successfully.' : 'Product created successfully.'), 'success');
        closeModal('productModal');
        loadProducts();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

/**
 * Archive / Delete Product
 */
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        const result = await res.json();

        if (!res.ok || !result.success) {
            throw new Error(result.message || 'Delete failed.');
        }

        showToast(result.message || 'Product deleted successfully.', 'success');
        loadProducts();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

/**
 * Open Archived Products Modal
 */
async function openArchiveViewModal() {
    try {
        const res = await fetch('/api/products?include_deleted=true');
        if (!res.ok) throw new Error('Failed to load inactive products.');
        const data = await res.json();

        const archived = (data.products || []).filter(p => p.is_deleted === 1);
        const tbody = document.getElementById('archivedProductsTableBody');
        if (!tbody) return;

        if (archived.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:28px; color:var(--text-muted);">
                        No inactive or deleted products found.
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = archived.map(p => `
                <tr>
                    <td style="font-family:var(--font-mono); color:var(--text-muted);">#${p.id}</td>
                    <td><strong>${escapeHtml(p.brand)}</strong></td>
                    <td>${escapeHtml(p.name)}</td>
                    <td>${p.type === 1 ? 'Electronics' : 'Construction'}</td>
                    <td>${p.unit_symbol || p.unit_name || '-'}</td>
                    <td style="text-align:right;">
                        <button class="btn btn-primary" style="padding:3px 10px; font-size:12px;" onclick="restoreProduct(${p.id})">
                            Restore to Active Stock
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        openModal('archiveModal');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

/**
 * Restore archived product
 */
async function restoreProduct(id) {
    try {
        const res = await fetch(`/api/products/${id}/restore`, { method: 'POST' });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message || 'Restore failed.');

        showToast(result.message || 'Product restored to active stock.', 'success');
        closeModal('archiveModal');
        loadProducts();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
