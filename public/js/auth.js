/**
 * StockMatrix - Authentication & Navigation Security Controller
 */

let currentUser = null;

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
        buildNavigation(currentUser.role);
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
 * Update user identity widgets in top header
 */
function updateUserUI(user) {
    const nameEl = document.getElementById('currentUserName');
    const roleEl = document.getElementById('currentUserRole');

    if (nameEl) nameEl.textContent = user.username;
    if (roleEl) {
        roleEl.textContent = user.role.toUpperCase();
        roleEl.className = `role-badge badge-${user.role === 'admin' ? 'purple' : user.role === 'manager' ? 'amber' : 'blue'}`;
    }
}

/**
 * Dynamically construct navigation tabs based on user role
 */
function buildNavigation(role) {
    const desktopNav = document.getElementById('desktopNavTabs');
    const mobileNav = document.getElementById('mobileNavLinks');

    const navItems = [];

    if (role === 'admin' || role === 'manager') {
        navItems.push({ id: 'dashboard', label: 'Dashboard', icon: '📊' });
        navItems.push({ id: 'products', label: 'Products', icon: '📦' });
        navItems.push({ id: 'stock-in', label: 'Stock In', icon: '📥' });
        navItems.push({ id: 'stock-out', label: 'Stock Out', icon: '📤' });
        navItems.push({ id: 'purchasing', label: 'Purchasing', icon: '🛒' });
    } else {
        // Staff
        navItems.push({ id: 'stock-in', label: 'Stock In', icon: '📥' });
        navItems.push({ id: 'stock-out', label: 'Stock Out', icon: '📤' });
    }

    if (role === 'admin' || role === 'manager') {
        navItems.push({ id: 'reports', label: 'Reports', icon: '📈' });
    }

    if (role === 'admin') {
        navItems.push({ id: 'branches', label: 'Branches', icon: '🏢' });
        navItems.push({ id: 'accounts', label: 'Accounts', icon: '👥' });
    }

    // Build Desktop Nav
    if (desktopNav) {
        desktopNav.innerHTML = navItems.map(item => `
            <a href="#/${item.id}" class="nav-tab" data-nav="${item.id}" onclick="navigateTo('${item.id}')">
                <span>${item.icon}</span>
                <span>${item.label}</span>
            </a>
        `).join('');
    }

    // Build Mobile Drawer Nav
    if (mobileNav) {
        mobileNav.innerHTML = navItems.map(item => `
            <a href="#/${item.id}" class="drawer-link" data-nav="${item.id}" onclick="navigateTo('${item.id}'); toggleMobileDrawer();">
                <span>${item.icon}</span>
                <span>${item.label}</span>
            </a>
        `).join('');
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
