/**
 * StockMatrix - User Accounts & Role Permissions Management Module
 */

let accountsCache = [];
let availableBranchesCache = [];
let rolePermissionsCache = {
    roles: ['admin', 'manager', 'staff'],
    menus: [],
    permissions: { admin: {}, manager: {}, staff: {} }
};

/**
 * Load all user accounts & role permissions
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

        // Also load role navigation permissions matrix
        await loadRolePermissions();
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
 * Render Accounts table with edit, delete, and admin password reset
 */
function renderAccountsList() {
    const tbody = document.getElementById('accountsTableBody');
    if (!tbody) return;

    if (accountsCache.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state-cell" style="text-align:center; padding:32px; color:var(--text-muted);">
                    ${t('accounts.empty_state', 'No user accounts created yet. Click "Add New Account" above to get started.')}
                </td>
            </tr>
        `;
        return;
    }

    const currentUserId = AppState.currentUser?.id;

    tbody.innerHTML = accountsCache.map(acc => {
        let roleBadge = '';
        if (acc.role === 'admin') {
            roleBadge = `<span class="badge badge-purple font-bold">${t('role.admin', 'ADMIN')}</span>`;
        } else if (acc.role === 'manager') {
            roleBadge = `<span class="badge badge-blue">${t('role.manager', 'MANAGER')}</span>`;
        } else {
            roleBadge = `<span class="badge badge-slate">${t('role.staff', 'STAFF')}</span>`;
        }

        let branchScopeDisplay = '';
        if (acc.role === 'admin') {
            branchScopeDisplay = `<span style="color:var(--purple); font-weight:600;">⚡ ${t('dash.branch_filter_all', 'All Branches')}</span>`;
        } else if (acc.branch_names && acc.branch_names.trim()) {
            branchScopeDisplay = `<div style="font-size:13px; color:var(--text-secondary);">${escapeHtml(acc.branch_names)}</div>`;
        } else {
            branchScopeDisplay = `<span style="color:var(--danger); font-size:12px;">⚠️ ${t('accounts.no_branches', 'No Assigned Branches')}</span>`;
        }

        const dateStr = acc.created_at ? new Date(acc.created_at).toLocaleDateString() : '-';
        const isSelf = currentUserId && acc.id === currentUserId;

        return `
            <tr>
                <td data-label="${t('table.username', 'Username')}" class="card-main-title">
                    <div style="font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:6px;">
                        <span>👤</span>
                        <span>${escapeHtml(acc.username)}</span>
                        ${isSelf ? '<span class="badge badge-emerald" style="font-size:10px;">YOU</span>' : ''}
                    </div>
                    <div style="font-size:11.5px; color:var(--text-muted); font-family:var(--font-mono);">ID: #${acc.id}</div>
                </td>
                <td data-label="${t('table.email', 'Email Address')}" style="color:var(--text-secondary);">${escapeHtml(acc.email || 'None')}</td>
                <td data-label="${t('table.role', 'Role')}">${roleBadge}</td>
                <td data-label="${t('table.branches', 'Assigned Branches')}">${branchScopeDisplay}</td>
                <td data-label="${t('table.created', 'Date Created')}" style="font-size:13px; color:var(--text-muted);">${dateStr}</td>
                <td data-label="${t('table.actions', 'Actions')}" class="actions-cell">
                    <div style="display:inline-flex; gap:6px; width:100%; justify-content:flex-end; flex-wrap:wrap;">
                        <button class="btn btn-secondary" style="padding:5px 10px; font-size:12px; display:inline-flex; align-items:center; gap:4px;" onclick="openAdminResetPasswordModal(${acc.id}, '${escapeHtml(acc.username)}')" title="Reset Password for this User">
                            <span>🔑</span>
                            <span>${t('accounts.reset_pass_btn', 'Password')}</span>
                        </button>
                        <button class="btn btn-secondary" style="padding:5px 10px; font-size:12px;" onclick="openEditAccountModal(${acc.id})">${t('action.edit', 'Edit')}</button>
                        ${!isSelf ? `
                            <button class="btn btn-danger-outline" style="padding:5px 10px; font-size:12px;" onclick="deleteAccount(${acc.id}, '${escapeHtml(acc.username)}')">${t('action.delete', 'Delete')}</button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Load role menu permissions from backend
 */
async function loadRolePermissions() {
    try {
        const res = await fetch('/api/accounts/roles/permissions');
        if (!res.ok) throw new Error('Failed to fetch role permissions.');
        const data = await res.json();

        if (data.success) {
            rolePermissionsCache = {
                roles: data.roles || ['admin', 'manager', 'staff'],
                menus: data.menus || [],
                permissions: data.permissions || {}
            };
            renderRolePermissionsMatrix();
        }
    } catch (err) {
        console.error('Error loading role permissions:', err);
    }
}

/**
 * Render role permissions matrix table
 */
function renderRolePermissionsMatrix() {
    const tbody = document.getElementById('rolePermissionsTableBody');
    if (!tbody) return;

    const { menus, permissions } = rolePermissionsCache;

    if (!menus || menus.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">
                    Loading permissions matrix...
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = menus.map(menu => {
        const adminAllowed = permissions.admin ? (permissions.admin[menu.id] !== false) : true;
        const managerAllowed = permissions.manager ? Boolean(permissions.manager[menu.id]) : false;
        const staffAllowed = permissions.staff ? Boolean(permissions.staff[menu.id]) : false;
        const localizedLabel = t('nav.' + menu.id, menu.label);

        return `
            <tr>
                <td data-label="${t('accounts.th_menu', 'Menu / Module')}">
                    <div style="font-weight:600; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
                        <span style="font-size:16px;">${menu.icon || '📌'}</span>
                        <span>${escapeHtml(localizedLabel)}</span>
                    </div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
                        ${escapeHtml(menu.description || '')}
                    </div>
                </td>
                <td data-label="Admin Access" style="text-align:center;">
                    <label style="display:inline-flex; align-items:center; justify-content:center; cursor:pointer; padding:4px;">
                        <input type="checkbox" ${adminAllowed ? 'checked' : ''} ${menu.id === 'accounts' ? 'disabled title="Admin must retain Accounts access to prevent lockout"' : ''} onchange="handlePermissionToggle('admin', '${menu.id}', this.checked)" style="width:18px; height:18px; cursor:pointer; accent-color:var(--purple);">
                    </label>
                </td>
                <td data-label="Manager Access" style="text-align:center;">
                    <label style="display:inline-flex; align-items:center; justify-content:center; cursor:pointer; padding:4px;">
                        <input type="checkbox" ${managerAllowed ? 'checked' : ''} onchange="handlePermissionToggle('manager', '${menu.id}', this.checked)" style="width:18px; height:18px; cursor:pointer; accent-color:var(--primary);">
                    </label>
                </td>
                <td data-label="Staff Access" style="text-align:center;">
                    <label style="display:inline-flex; align-items:center; justify-content:center; cursor:pointer; padding:4px;">
                        <input type="checkbox" ${staffAllowed ? 'checked' : ''} onchange="handlePermissionToggle('staff', '${menu.id}', this.checked)" style="width:18px; height:18px; cursor:pointer; accent-color:var(--slate-500);">
                    </label>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Handle toggle of role permission checkbox
 */
async function handlePermissionToggle(role, menuId, isChecked) {
    if (!rolePermissionsCache.permissions[role]) {
        rolePermissionsCache.permissions[role] = {};
    }
    rolePermissionsCache.permissions[role][menuId] = isChecked;

    try {
        const res = await fetch('/api/accounts/roles/permissions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role,
                permissions: rolePermissionsCache.permissions[role]
            })
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || 'Failed to update role permissions.');
        }

        showToast(`Menu permission for '${role.toUpperCase()}' updated!`, 'success');

        // If updated role matches active session role, refresh navigation dynamically
        if (AppState.currentUser && AppState.currentUser.role === role) {
            const allowed = Object.keys(rolePermissionsCache.permissions[role]).filter(m => rolePermissionsCache.permissions[role][m]);
            AppState.currentUser.allowedMenus = allowed;
            buildNavigation(role, allowed);
        }
    } catch (err) {
        showToast(err.message, 'error');
        // Reload matrix to sync back with database state
        loadRolePermissions();
    }
}

/**
 * Open Admin Reset / Set Password Modal for any user account
 */
function openAdminResetPasswordModal(userId, username) {
    const userIdInput = document.getElementById('adminResetPassUserId');
    const usernameLabel = document.getElementById('adminResetPassUsernameLabel');
    const newPassInput = document.getElementById('adminResetPassNew');

    if (userIdInput) userIdInput.value = userId;
    if (usernameLabel) usernameLabel.textContent = username;
    if (newPassInput) newPassInput.value = '';

    openModal('adminResetPasswordModal');
}

/**
 * Handle Admin Reset Password Submission
 */
async function handleAdminResetPasswordSubmit(e) {
    e.preventDefault();

    const userId = document.getElementById('adminResetPassUserId').value;
    const newPassword = document.getElementById('adminResetPassNew').value;
    const submitBtn = document.getElementById('adminResetPassSubmitBtn');

    if (!userId || !newPassword) {
        showToast('Please enter a new password.', 'error');
        return;
    }

    if (newPassword.trim().length < 6) {
        showToast('Password must be at least 6 characters long.', 'error');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving new password...';
    }

    try {
        const res = await fetch(`/api/accounts/${userId}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword })
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || 'Failed to set password.');
        }

        showToast(result.message || 'Password updated successfully.', 'success');
        closeModal('adminResetPasswordModal');
        document.getElementById('adminResetPasswordForm')?.reset();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '💾 Save New Password';
        }
    }
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

// Global exposure
window.loadAccounts = loadAccounts;
window.loadRolePermissions = loadRolePermissions;
window.renderRolePermissionsMatrix = renderRolePermissionsMatrix;
window.handlePermissionToggle = handlePermissionToggle;
window.openAdminResetPasswordModal = openAdminResetPasswordModal;
window.handleAdminResetPasswordSubmit = handleAdminResetPasswordSubmit;
window.openCreateAccountModal = openCreateAccountModal;
window.openEditAccountModal = openEditAccountModal;
window.handleAccountFormSubmit = handleAccountFormSubmit;
window.handleAccountRoleChange = handleAccountRoleChange;
window.deleteAccount = deleteAccount;

