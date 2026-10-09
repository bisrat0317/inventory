const ALL_SYSTEM_MENUS = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'stock-in', label: 'Stock In', icon: '📥' },
    { id: 'stock-out', label: 'Stock Out', icon: '📤' },
    { id: 'purchasing', label: 'Purchasing', icon: '🛒' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'branches', label: 'Branches', icon: '🏢' },
    { id: 'accounts', label: 'Accounts', icon: '👥' }
];

/**
 * Check active session and configure user permissions
 */
async function checkSession() {
    try {
        const response = await fetch('/api/auth/session');
        if (!response.ok) {
            window.location.href = '/login.html';
            return null;
        }

        const data = await response.json();
        if (!data.success || !data.user) {
            window.location.href = '/login.html';
            return null;
        }

        currentUser = data.user;
        if (window.AppState) {
            window.AppState.currentUser = data.user;
        }

        updateUserUI(currentUser);
        buildNavigation(currentUser.role, currentUser.allowedMenus);
        return currentUser;
    } catch (err) {
        console.error('Session verification error:', err);
        window.location.href = '/login.html';
        return null;
    }
}

// Alias for compatibility
const checkAuth = checkSession;

/**
 * Update user identity widgets in top header and mobile drawer
 */
function updateUserUI(user) {
    const nameEl = document.getElementById('currentUserName');
    const roleEl = document.getElementById('currentUserRole');
    const drawerNameEl = document.getElementById('drawerUserName');
    const drawerRoleEl = document.getElementById('drawerUserRole');

    if (nameEl) nameEl.textContent = user.username;
    if (drawerNameEl) drawerNameEl.textContent = user.username;

    if (roleEl) {
        roleEl.textContent = user.role.toUpperCase();
        roleEl.className = `role-badge badge-${user.role === 'admin' ? 'purple' : user.role === 'manager' ? 'amber' : 'blue'}`;
    }
    if (drawerRoleEl) {
        drawerRoleEl.textContent = user.role.toUpperCase();
    }
}

/**
 * Dynamically construct navigation tabs based on user role and permitted menus
 */
function buildNavigation(role, allowedMenus = null) {
    const desktopNav = document.getElementById('desktopNavTabs');
    const mobileNav = document.getElementById('mobileNavLinks');

    let navItems = [];

    if (Array.isArray(allowedMenus) && allowedMenus.length > 0) {
        navItems = ALL_SYSTEM_MENUS.filter(m => allowedMenus.includes(m.id));
    } else {
        // Fallback default role menus
        if (role === 'admin') {
            navItems = [...ALL_SYSTEM_MENUS];
        } else if (role === 'manager') {
            navItems = ALL_SYSTEM_MENUS.filter(m => !['branches', 'accounts'].includes(m.id));
        } else {
            navItems = ALL_SYSTEM_MENUS.filter(m => ['stock-in', 'stock-out'].includes(m.id));
        }
    }

    // Build Desktop Nav
    if (desktopNav) {
        desktopNav.innerHTML = navItems.map(item => {
            const key = 'nav.' + item.id.replace(/-/g, '_');
            const label = typeof window.t === 'function' ? window.t(key, item.label) : item.label;
            return `
                <a href="#/${item.id}" class="nav-tab" data-nav="${item.id}" onclick="navigateTo('${item.id}')">
                    <span>${item.icon}</span>
                    <span>${label}</span>
                </a>
            `;
        }).join('');
    }

    // Build Mobile Drawer Nav
    if (mobileNav) {
        mobileNav.innerHTML = navItems.map(item => {
            const key = 'nav.' + item.id.replace(/-/g, '_');
            const label = typeof window.t === 'function' ? window.t(key, item.label) : item.label;
            return `
                <a href="#/${item.id}" class="drawer-link" data-nav="${item.id}" onclick="navigateTo('${item.id}'); toggleMobileDrawer();">
                    <span>${item.icon}</span>
                    <span>${label}</span>
                </a>
            `;
        }).join('');
    }
}

/**
 * Open self-service change password modal
 */
function openChangePasswordModal() {
    const form = document.getElementById('changePasswordForm');
    if (form) form.reset();
    openModal('changePasswordModal');
}

/**
 * Handle self-service change password submission
 */
async function handleChangePasswordSubmit(e) {
    e.preventDefault();

    const oldPassword = document.getElementById('changePassOld').value;
    const newPassword = document.getElementById('changePassNew').value;
    const confirmPassword = document.getElementById('changePassConfirm').value;
    const submitBtn = document.getElementById('changePassSubmitBtn');

    if (newPassword.length < 6) {
        showToast('New password must be at least 6 characters long.', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('New password and confirmation password do not match.', 'error');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating password...';
    }

    try {
        const res = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPassword, newPassword, confirmPassword })
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
            throw new Error(result.message || 'Failed to change password.');
        }

        showToast(result.message || 'Your password was changed successfully!', 'success');
        closeModal('changePasswordModal');
        document.getElementById('changePasswordForm')?.reset();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '💾 Update Password';
        }
    }
}

/**
 * Handle user logout
 */
async function handleLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login.html';
    } catch (e) {
        window.location.href = '/login.html';
    }
}

// Global exposure
window.openChangePasswordModal = openChangePasswordModal;
window.handleChangePasswordSubmit = handleChangePasswordSubmit;
window.buildNavigation = buildNavigation;
