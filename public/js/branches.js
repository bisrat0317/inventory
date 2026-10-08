/**
 * StockMatrix - Branch Management Module
 */

let branchesCache = [];

/**
 * Load all branch nodes
 */
async function loadBranches() {
    try {
        const res = await fetch('/api/branches');
        if (!res.ok) throw new Error('Failed to load branches.');
        const data = await res.json();

        if (data.success) {
            branchesCache = data.branches || [];
            AppState.branches = branchesCache;
            renderBranchesList();
        }
    } catch (err) {
        console.error('Error fetching branches:', err);
        showToast(err.message, 'error');
    }
}

/**
 * Render Branches table
 */
function renderBranchesList() {
    const tbody = document.getElementById('branchesTableBody');
    if (!tbody) return;

    if (branchesCache.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:32px; color:var(--text-muted);">
                    No branch locations added yet. Click "Add New Branch" above to get started.
                </td>
            </tr>
        `;
        return;
    }

    const userRole = AppState.currentUser?.role;
    const canManage = userRole === 'admin';

    tbody.innerHTML = branchesCache.map(b => {
        const unitsOnFloor = parseFloat(b.global_units_on_floor || 0);
        const categoryBadge = b.type === 2 
            ? '<span class="badge badge-emerald">Construction Supply</span>' 
            : '<span class="badge badge-blue">Mobile Repair & Electronics</span>';

        return `
            <tr>
                <td>
                    <div style="font-weight:700; font-size:15px; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
                        <span>🏢</span>
                        <span>${escapeHtml(b.name)}</span>
                    </div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">Branch ID #${b.id}</div>
                </td>
                <td>${categoryBadge}</td>
                <td style="color:var(--text-secondary);">
                    ${b.location ? `📍 ${escapeHtml(b.location)}` : '<span style="color:var(--text-muted);">No address set</span>'}
                </td>
                <td>
                    <span class="badge ${unitsOnFloor > 0 ? 'badge-blue' : 'badge-slate'}" style="font-size:13px; font-weight:600;">
                        ${formatNumber(unitsOnFloor)} Items in Stock
                    </span>
                </td>
                <td style="text-align:right;">
                    ${canManage ? `
                        <div style="display:inline-flex; gap:6px;">
                            <button class="btn btn-secondary" style="padding:4px 10px; font-size:12px;" onclick="openEditBranchModal(${b.id})">Edit</button>
                            <button class="btn btn-danger-outline" style="padding:4px 10px; font-size:12px;" onclick="deleteBranch(${b.id}, ${unitsOnFloor})">Delete Branch</button>
                        </div>
                    ` : '<span style="color:var(--text-muted); font-size:12px;">Admin Only</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Open Create Branch Modal
 */
function openCreateBranchModal() {
    const form = document.getElementById('branchForm');
    if (!form) return;
    form.reset();
    document.getElementById('branchFormId').value = '';
    document.getElementById('branchFormType').value = '1';
    document.getElementById('branchModalTitle').textContent = 'Add New Branch';
    document.getElementById('branchFormSubmitBtn').innerHTML = '💾 Save Branch';
    openModal('branchModal');
}

/**
 * Open Edit Branch Modal
 */
async function openEditBranchModal(id) {
    try {
        const res = await fetch(`/api/branches/${id}`);
        if (!res.ok) throw new Error('Could not fetch branch details.');
        const data = await res.json();

        if (data.success && data.branch) {
            document.getElementById('branchFormId').value = data.branch.id;
            document.getElementById('branchFormName').value = data.branch.name;
            document.getElementById('branchFormType').value = data.branch.type || 1;
            document.getElementById('branchFormLocation').value = data.branch.location || '';
            document.getElementById('branchModalTitle').textContent = `Edit Branch: ${data.branch.name}`;
            document.getElementById('branchFormSubmitBtn').innerHTML = '💾 Update Branch';
            openModal('branchModal');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

/**
 * Handle Branch Form Submit (Create or Update)
 */
async function handleBranchFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('branchFormId').value;
    const isEdit = Boolean(id);

    const payload = {
        name: document.getElementById('branchFormName').value.trim(),
        type: parseInt(document.getElementById('branchFormType').value, 10) || 1,
        location: document.getElementById('branchFormLocation').value.trim()
    };

    try {
        const url = isEdit ? `/api/branches/${id}` : '/api/branches';
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

        showToast(result.message || (isEdit ? 'Branch updated successfully.' : 'Branch added successfully.'), 'success');
        closeModal('branchModal');
        loadBranches();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

/**
 * Delete Branch
 */
async function deleteBranch(id, unitsOnFloor) {
    if (unitsOnFloor > 0) {
        alert(`❌ Cannot delete branch: This branch currently holds ${unitsOnFloor} items in stock. Please transfer or sell all items before deleting this branch.`);
        return;
    }

    if (!confirm('Are you sure you want to delete this branch?')) {
        return;
    }

    try {
        const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' });
        const result = await res.json();

        if (!res.ok || !result.success) {
            throw new Error(result.message || 'Delete branch failed.');
        }

        showToast(result.message || 'Branch deleted successfully.', 'success');
        loadBranches();
    } catch (err) {
        showToast(err.message, 'error');
    }
}
