/**
 * StockMatrix - Unified Application Core & Client Router
 */

// Global State
window.AppState = {
    currentUser: null,
    currentView: 'dashboard',
    theme: localStorage.getItem('stockmatrix_theme') || 'dark',
    units: [],
    branches: []
};

// Global String Escaper
window.escapeHtml = function(str) {
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

/**
 * Initialize theme immediately
 */
function initTheme() {
    const savedTheme = localStorage.getItem('stockmatrix_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    AppState.theme = savedTheme;
    updateThemeIcon();
}

/**
 * Toggle Light/Dark Mode
 */
function toggleTheme() {
    const newTheme = AppState.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('stockmatrix_theme', newTheme);
    AppState.theme = newTheme;
    updateThemeIcon();
    
    // Notify charts to re-render with new colors if reports active
    if (window.renderReportCharts && typeof window.renderReportCharts === 'function') {
        window.renderReportCharts();
    }
}

function updateThemeIcon() {
    const icon = document.getElementById('themeIcon');
    if (!icon) return;
    if (AppState.theme === 'light') {
        // Show moon icon for light mode (switch to dark)
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    } else {
        // Show sun icon for dark mode (switch to light)
        icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    }
}

/**
 * Mobile Drawer Controls
 */
function toggleMobileDrawer() {
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (!drawer || !overlay) return;

    drawer.classList.toggle('active');
    overlay.classList.toggle('active');
}

/**
 * Toast Notification Dispatcher
 */
function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
        iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
        iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else {
        iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `
        <div style="flex-shrink:0; display:flex; align-items:center;">${iconSvg}</div>
        <div style="flex:1; font-size:13.5px; font-weight:500;">${escapeHtml(message)}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Generic Modal Controls
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modals when clicking backdrop
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Close modals on Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
        
        document.querySelectorAll('.search-select-dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
});

/**
 * Client SPA Router & View Navigator
 */
function navigateTo(route, params = {}) {
    window.location.hash = route.startsWith('/') ? '#' + route : '#/' + route;
}

function handleRoute() {
    const hash = window.location.hash.slice(2) || 'dashboard';
    const parts = hash.split('/');
    const mainView = parts[0] || 'dashboard';
    const subParam = parts[1] || null;

    // Check user permission for restricted views
    const userRole = AppState.currentUser ? AppState.currentUser.role : null;
    if (userRole === 'staff') {
        if (['branches', 'accounts', 'reports', 'dashboard', 'purchasing'].includes(mainView)) {
            navigateTo('stock-in');
            return;
        }
    } else if (userRole === 'manager') {
        if (['branches', 'accounts'].includes(mainView)) {
            showToast('Access restricted: Managers cannot access user/branch system configuration.', 'error');
            navigateTo('dashboard');
            return;
        }
    }

    // Hide all view sections
    document.querySelectorAll('.app-view').forEach(view => {
        view.style.display = 'none';
    });

    // Update active tab in header & drawer
    document.querySelectorAll('.nav-tab, .drawer-link').forEach(tab => {
        tab.classList.remove('active');
        const href = tab.getAttribute('href');
        if (href === `#/${mainView}`) {
            tab.classList.add('active');
        }
    });

    // Close mobile drawer if open
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (drawer && overlay) {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
    }

    // Render corresponding view
    AppState.currentView = mainView;

    switch (mainView) {
        case 'dashboard':
            const dashView = document.getElementById('view-dashboard');
            if (dashView) {
                dashView.style.display = 'block';
                if (window.loadDashboardOverview) window.loadDashboardOverview();
            }
            break;

        case 'branch-ops':
            const opsView = document.getElementById('view-branch-ops');
            if (opsView) {
                opsView.style.display = 'block';
                if (window.loadBranchOperations && subParam) {
                    window.loadBranchOperations(subParam);
                } else if (window.loadBranchOperations) {
                    window.loadBranchOperations(1); // default branch
                }
            }
            break;

        case 'products':
            const prodView = document.getElementById('view-products');
            if (prodView) {
                prodView.style.display = 'block';
                if (window.loadProducts) window.loadProducts();
            }
            break;

        case 'stock-in':
            const stockInView = document.getElementById('view-stock-in');
            if (stockInView) {
                stockInView.style.display = 'block';
                if (window.loadStockInView) window.loadStockInView();
            }
            break;

        case 'stock-out':
            const stockOutView = document.getElementById('view-stock-out');
            if (stockOutView) {
                stockOutView.style.display = 'block';
                if (window.loadStockOutView) window.loadStockOutView();
            }
            break;

        case 'purchasing':
            const purchView = document.getElementById('view-purchasing');
            if (purchView) {
                purchView.style.display = 'block';
                if (window.loadPurchasingView) window.loadPurchasingView();
            }
            break;

        case 'reports':
            const repView = document.getElementById('view-reports');
            if (repView) {
                repView.style.display = 'block';
                if (window.loadExecutiveReports) window.loadExecutiveReports();
            }
            break;

        case 'branches':
            const branchView = document.getElementById('view-branches');
            if (branchView) {
                branchView.style.display = 'block';
                if (window.loadBranches) window.loadBranches();
            }
            break;

        case 'accounts':
            const accView = document.getElementById('view-accounts');
            if (accView) {
                accView.style.display = 'block';
                if (window.loadAccounts) window.loadAccounts();
            }
            break;

        default:
            navigateTo('dashboard');
            break;
    }
}

// Global Currency Formatter
window.formatCurrency = function(amount) {
    const val = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

// Global Number Formatter (handles piece/box integer display)
window.formatNumber = function(num, unit = '') {
    const val = parseFloat(num);
    if (isNaN(val)) return '0';

    const isIntegerUnit = typeof unit === 'string' && /^(piece|pieces|box|boxes|set|sets|pack|packs|unit|units|carton|cartons|item|items|bag|bags|pcs|bx)$/i.test(unit.trim());

    if (isIntegerUnit || Number.isInteger(val)) {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(val));
    }
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);
};

// Initialize on DOM Ready or immediately if already loaded
async function startApp() {
    initTheme();
    
    // Check authentication
    const user = await checkSession();
    if (user) {
        window.addEventListener('hashchange', handleRoute);
        handleRoute();
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}
