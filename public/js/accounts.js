/**
 * StockMatrix - User Accounts Management Module
 */

let accountsCache = [];
let availableBranchesCache = [];

/**
 * Load all user accounts
 */
async function loadAccounts() {
    try {
        const res = await fetch('/api/accounts');
        if (!res.ok) throw new Error('Failed to load accounts list.');
        const data = await res.json();

        if (data.success) {
            accountsCache = data.accounts || [];
            availableBranchesCache = data.availableBranches || [];
            renderAccountsList();
        }
    } catch (err) {
        console.error('Error loading accounts:', err);
        showToast(err.message, 'error');
    }
}

/**
 * Ensure branches are loaded for checkboxes
 */
async function ensureBranchesLoaded() {
    if (!availableBranchesCache || availableBranchesCache.length === 0) {
        try {
            const res = await fetch('/api/branches');
            const data = await res.json();
            if (data.success && data.branches) {
                availableBranchesCache = data.branches;
            }
        } catch (e) {
            console.error('Error loading branches for accounts:', e);
        }
    }
}

/**
 * Render Accounts table
 */
function renderAccountsList() {
    const tbody = document.getElementById('accountsTableBody');
    if (!tbody) return;

    if (accountsCache.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">
                    No user accounts created yet. Click "Add New Account" above to get started.
                </td>
            </tr>
        `;
        return;
    }

    const currentUserId = AppState.currentUser?.id;

    tbody.innerHTML = accountsCache.map(acc => {
        let roleBadge = '';
        if (acc.role === 'admin') {
            roleBadge = '<span class="badge badge-purple font-bold">ADMIN (ALL ACCESS)</span>';
        } else if (acc.role === 'manager') {
            roleBadge = '<span class="badge badge-blue">MANAGER</span>';
        } else {
            roleBadge = '<span class="badge badge-slate">STAFF</span>';
        }

        let branchScopeDisplay = '';
        if (acc.role === 'admin') {
            branchScopeDisplay = '<span style="color:var(--purple); font-weight:600;">⚡ All Branches</span>';
        } else if (acc.branch_names && acc.branch_names.trim()) {
            branchScopeDisplay = `<div style="font-size:13px; color:var(--text-secondary);">${escapeHtml(acc.branch_names)}</div>`;
        } else {
            branchScopeDisplay = '<span style="color:var(--danger); font-size:12px;">⚠️ No Assigned Branches</span>';
        }

        const dateStr = acc.created_at ? new Date(acc.created_at).toLocaleDateString() : '-';
        const isSelf = currentUserId && acc.id === currentUserId;

        return `
            <tr>
                <td>
                    <div style="font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:6px;">
                        <span>👤</span>
                        <span>${escapeHtml(acc.username)}</span>
                        ${isSelf ? '<span class="badge badge-emerald" style="font-size:10px;">YOU</span>' : ''}
                    </div>
                    <div style="font-size:11.5px; color:var(--text-muted); font-family:var(--font-mono);">ID: #${acc.id}</div>
                </td>
                <td style="color:var(--text-secondary);">${escapeHtml(acc.email || 'None')}</td>
                <td>${roleBadge}</td>
                <td>${branchScopeDisplay}</td>
                <td style="font-size:13px; color:var(--text-muted);">${dateStr}</td>
                <td style="text-align:right;">
                    <div style="display:inline-flex; gap:6px;">
                        <button class="btn btn-secondary" style="padding:4px 10px; font-size:12px;" onclick="openEditAccountModal(${acc.id})">Edit</button>
                        ${!isSelf ? `
                            <button class="btn btn-danger-outline" style="padding:4px 10px; font-size:12px;" onclick="deleteAccount(${acc.id}, '${escapeHtml(acc.username)}')">Delete</button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Role selector toggle for branch assignment box
 */
function handleAccountRoleChange(role) {
    const selectorGroup = document.getElementById('accountBranchesSelectorGroup');
    if (!selectorGroup) return;

    if (role === 'admin') {
        selectorGroup.style.display = 'none';
    } else {
        selectorGroup.style.display = 'block';
    }
}

/**
 * Populate branch assignment checkbox matrix
 */
function populateBranchCheckboxes(selectedIds = []) {
    const container = document.getElementById('accountBranchesCheckboxList');
    if (!container) return;

    if (availableBranchesCache.length === 0) {
        container.innerHTML = '<span style="color:var(--text-muted); font-size:12px;">No branches available to assign.</span>';
        return;
    }

    container.innerHTML = availableBranchesCache.map(b => {
        const isChecked = selectedIds.includes(b.id) || selectedIds.includes(String(b.id));
        return `
            <label style="display:flex; align-items:center; gap:8px; margin-bottom:6px; cursor:pointer; font-size:13.5px;">
                <input type="checkbox" name="accountBranches" value="${b.id}" ${isChecked ? 'checked' : ''} style="cursor:pointer;">
                <span>${escapeHtml(b.name)}</span>
            </label>
        `;
    }).join('');
}

/**
 * Open Create Account Modal
 */
async function openCreateAccountModal() {
    const form = document.getElementById('accountForm');
    if (!form) return;
    form.reset();
    document.getElementById('accountFormId').value = '';
    document.getElementById('accountModalTitle').textContent = 'Add New Account';
    document.getElementById('accountFormPassword').required = true;
    document.getElementById('accountFormPasswordHelp').style.display = 'none';

    document.getElementById('accountFormRole').value = 'staff';
    handleAccountRoleChange('staff');
    
    await ensureBranchesLoaded();
    populateBranchCheckboxes([]);

    openModal('accountModal');
}

/**
 * Open Edit Account Modal
 */
async function openEditAccountModal(id) {
    try {
        await ensureBranchesLoaded();
        const res = await fetch(`/api/accounts/${id}`);
        if (!res.ok) throw new Error('Could not fetch account details.');
        const data = await res.json();

        if (data.success && data.account) {
            const acc = data.account;
            document.getElementById('accountFormId').value = acc.id;
            document.getElementById('accountFormUsername').value = acc.username;
            document.getElementById('accountFormEmail').value = acc.email || '';
            document.getElementById('accountFormPassword').value = '';
            document.getElementById('accountFormPassword').required = false;
            document.getElementById('accountFormPasswordHelp').style.display = 'block';

            document.getElementById('accountFormRole').value = acc.role;
            handleAccountRoleChange(acc.role);

            const selectedBranchIds = (acc.branch_ids || []).map(Number);
            populateBranchCheckboxes(selectedBranchIds);

            document.getElementById('accountModalTitle').textContent = `Edit Account: ${acc.username}`;
            openModal('accountModal');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

/**
 * Handle Account Form Submit (Create or Update)
 */
async function handleAccountFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('accountFormId').value;
    const isEdit = Boolean(id);

    const role = document.getElementById('accountFormRole').value;
    const selectedBranches = [];
    if (role !== 'admin') {
        const checkboxes = document.querySelectorAll('input[name="accountBranches"]:checked');
        checkboxes.forEach(cb => selectedBranches.push(parseInt(cb.value, 10)));
    }

    const payload = {
        username: document.getElementById('accountFormUsername').value.trim(),
        email: document.getElementById('accountFormEmail').value.trim(),
        role: role,
        branches: selectedBranches
    };

    const password = document.getElementById('accountFormPassword').value;
    if (password) {
        payload.password = password;
    }

    try {
        const url = isEdit ? `/api/accounts/${id}` : '/api/accounts';
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

        showToast(result.message || (isEdit ? 'Account updated successfully.' : 'Account created successfully.'), 'success');
        closeModal('accountModal');
        loadAccounts();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

/**
 * Delete User Account
 */
async function deleteAccount(id, username) {
    if (!confirm(`Are you sure you want to delete user account '${username}'?`)) {
        return;
    }

    try {
        const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
        const result = await res.json();

        if (!res.ok || !result.success) {
            throw new Error(result.message || 'Deletion failed.');
        }

        showToast(result.message || 'Account deleted successfully.', 'success');
        loadAccounts();
    } catch (err) {
        showToast(err.message, 'error');
    }
}
