/**
 * StockMatrix - Data Export & Document Processing Utilities
 * Supports clean CSV / Excel (.csv / .xls) and Print PDF formatting
 */

/**
 * Download standard UTF-8 CSV file with proper escaping and Excel BOM
 * @param {string} filename - Name of file without extension
 * @param {Array<string>} headers - Header row column titles
 * @param {Array<Array<any>>} rows - 2D data rows
 */
function downloadCsv(filename, headers, rows) {
    if (!headers || !rows) return;

    const escapeCsvValue = (val) => {
        if (val === null || val === undefined) return '""';
        let str = String(val).replace(/"/g, '""');
        if (str.search(/("|,|\n|\r)/g) >= 0 || str.startsWith('=') || str.startsWith('+') || str.startsWith('-')) {
            str = `"${str}"`;
        } else {
            str = `"${str}"`;
        }
        return str;
    };

    const csvContent = [
        headers.map(escapeCsvValue).join(','),
        ...rows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\r\n');

    // Add UTF-8 BOM so Excel opens special characters (kg, m², $, etc.) correctly
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export Purchasing Manifest / Requisition Sheet to Excel
 */
function exportPurchasingToExcel() {
    if (!window.purchasingManifestItems || window.purchasingManifestItems.length === 0) {
        showToast('Purchasing cart is empty. Add products to export.', 'warning');
        return;
    }

    const headers = [
        'Status (Checked)',
        'Brand / Maker',
        'Product Name',
        'Color / Specification',
        'Target Destination Branch(es)',
        'Order Quantity',
        'Measurement Unit',
        'Estimated Unit Price ($)',
        'Remarks / Supplier Notes'
    ];

    const rows = window.purchasingManifestItems.map(item => [
        item.checked ? '✓ Confirmed' : '☐ Pending',
        item.brand || '',
        item.name || '',
        item.color || 'Standard',
        item.destinations || 'All Branches',
        item.qty || 0,
        item.unit || '',
        item.price || '',
        item.notes || ''
    ]);

    downloadCsv('Purchase_Requisition_Manifest', headers, rows);
    showToast('Purchase report exported to Excel successfully!', 'success');
}

/**
 * Export Products Catalog Report to Excel
 */
function exportProductsToExcel() {
    if (!window.productsCache || window.productsCache.length === 0) {
        showToast('No products available to export.', 'warning');
        return;
    }

    const headers = [
        'Product ID',
        'Brand',
        'Product Name',
        'Category Type',
        'Base Counting Unit',
        'Total On-Hand Stock',
        'Low Stock Alert Threshold',
        'Color / Spec',
        'Description'
    ];

    const rows = window.productsCache.map(p => [
        p.id,
        p.brand || '',
        p.name || '',
        p.type === 1 ? 'Electronics Matrix' : 'Construction Supply',
        p.unit_symbol || p.unit_name || 'Units',
        p.total_stock || 0,
        p.min_stock_alert || 5,
        p.color || 'Standard',
        p.description || ''
    ]);

    downloadCsv('Product_Catalog_Report', headers, rows);
    showToast('Product catalog report exported to Excel successfully!', 'success');
}

/**
 * Export Business Report & Executive Insights to Excel
 */
function exportExecutiveReportToExcel() {
    if (!window.reportsDataCache) {
        showToast('No report data loaded. Please filter report first.', 'warning');
        return;
    }

    const data = window.reportsDataCache;
    const kpis = data.kpis || {};
    const filters = data.filters || {};

    const headers = [
        'Report Scope',
        'Time Period',
        'Total Products',
        'Total Sales Revenue ($)',
        'Total Purchases Cost ($)',
        'Cost of Items Sold (COGS) ($)',
        'Net Profit Earned ($)',
        'Current Shelf Stock Value ($)',
        'Damaged Units Lost',
        'Estimated Damaged Loss ($)'
    ];

    const rows = [[
        filters.branch === 'all' ? 'All Branches Combined' : `Branch ID: ${filters.branch}`,
        filters.range || 'Today',
        kpis.totalProductsIndexed || 0,
        kpis.totalRevenue || 0,
        kpis.totalPurchaseCost || 0,
        kpis.totalCogs || 0,
        kpis.netRealizedProfit || 0,
        kpis.onHandAssetValuation || 0,
        kpis.totalDamagedUnits || 0,
        kpis.totalDamagedLoss || 0
    ]];

    downloadCsv('Business_Executive_Summary_Report', headers, rows);
    showToast('Executive summary report exported to Excel successfully!', 'success');
}

/**
 * Export Current Shelf Stock Balances to Excel
 */
function exportRemainingStockToExcel() {
    if (!window.reportsDataCache || !window.reportsDataCache.remainingInventory) {
        showToast('No inventory report data available.', 'warning');
        return;
    }

    const items = window.reportsDataCache.remainingInventory;
    const headers = [
        'Branch Location',
        'Brand',
        'Product Name',
        'Category',
        'Remaining Quantity',
        'Unit',
        'Min Alert Threshold',
        'Stock Status'
    ];

    const rows = items.map(item => {
        const qty = parseFloat(item.quantity || 0);
        const minAlert = parseFloat(item.min_stock_alert || 5);
        let status = 'Optimal';
        if (qty <= 0) status = 'Out of Stock (0 Units)';
        else if (qty <= minAlert) status = `Critical Low Stock (<= ${minAlert})`;
        else if (qty >= minAlert * 3) status = 'Surplus';

        return [
            item.branch_name || '',
            item.brand || '',
            item.product_name || '',
            item.type === 1 ? 'Electronics' : 'Construction',
            qty,
            item.symbol || '',
            minAlert,
            status
        ];
    });

    downloadCsv('Current_Stock_On_Shelves_Report', headers, rows);
    showToast('Stock inventory report exported to Excel successfully!', 'success');
}

/**
 * Export Damaged & Lost Goods Report to Excel
 */
function exportDamagedReportToExcel() {
    if (!window.reportsDataCache || !window.reportsDataCache.damagedLedger) {
        showToast('No damaged stock report loaded.', 'warning');
        return;
    }

    const items = window.reportsDataCache.damagedLedger;
    if (items.length === 0) {
        showToast('No damaged stock records found for this period.', 'info');
        return;
    }

    const headers = [
        'Incident Date',
        'Branch Facility',
        'Brand',
        'Product Name',
        'Category',
        'Quantity Lost',
        'Measurement Unit',
        'Reason / Incident Details',
        'Reported By',
        'Estimated Loss Amount ($)'
    ];

    const rows = items.map(r => [
        r.date ? new Date(r.date).toISOString().split('T')[0] : '',
        r.branch_name || '',
        r.brand || '',
        r.product_name || '',
        r.type === 1 ? 'Electronics' : 'Construction',
        r.quantity || 0,
        r.symbol || '',
        r.reason || '',
        r.reported_by || 'Admin',
        r.estimated_loss || 0
    ]);

    downloadCsv('Damaged_And_Lost_Goods_Report', headers, rows);
    showToast('Damaged goods report exported to Excel successfully!', 'success');
}

// Attach to window object
window.downloadCsv = downloadCsv;
window.exportPurchasingToExcel = exportPurchasingToExcel;
window.exportProductsToExcel = exportProductsToExcel;
window.exportExecutiveReportToExcel = exportExecutiveReportToExcel;
window.exportRemainingStockToExcel = exportRemainingStockToExcel;
window.exportDamagedReportToExcel = exportDamagedReportToExcel;
