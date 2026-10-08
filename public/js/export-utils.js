/**
 * StockMatrix - Data Export & Dedicated Document Printing Engine
 * Generates official A4 Purchase Orders, Catalog Sheets, and Executive Reports
 */

/**
 * Universal standalone document printer
 * Opens a clean, dedicated print iframe isolated from any UI/theme artifacts
 */
function printStandaloneDocument(title, bodyHtml) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${escapeHtml(title)}</title>
            <style>
                @page {
                    size: A4 portrait;
                    margin: 8mm 8mm;
                }
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    background: #ffffff;
                    color: #000000;
                    font-size: 8.5pt;
                    line-height: 1.3;
                    padding: 0;
                }
                .doc-header {
                    border-bottom: 2px solid #000000;
                    padding-bottom: 6px;
                    margin-bottom: 10px;
                }
                .doc-header-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .doc-title {
                    font-size: 16pt;
                    font-weight: 800;
                    letter-spacing: -0.01em;
                    color: #000000;
                    text-transform: uppercase;
                }
                .doc-subtitle {
                    font-size: 8.5pt;
                    color: #4b5563;
                    margin-top: 2px;
                }
                .doc-meta {
                    text-align: right;
                    font-size: 8pt;
                    color: #1f2937;
                    line-height: 1.35;
                }
                table {
                    width: 100%;
                    table-layout: fixed;
                    border-collapse: collapse;
                    border: 1.5px solid #000000;
                    margin-top: 8px;
                    margin-bottom: 12px;
                    font-size: 8pt;
                }
                th {
                    background: #f1f5f9;
                    color: #000000;
                    border: 1px solid #000000;
                    padding: 6px 5px;
                    font-weight: 700;
                    text-align: left;
                    overflow-wrap: break-word;
                    word-break: break-word;
                    vertical-align: middle;
                }
                td {
                    border: 1px solid #000000;
                    padding: 5px 5px;
                    color: #000000;
                    vertical-align: middle;
                    background: #ffffff;
                    overflow-wrap: break-word;
                    word-break: break-word;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .font-bold { font-weight: 700; }
                .check-box {
                    font-family: monospace;
                    font-size: 10pt;
                    display: inline-block;
                }
                .badge {
                    display: inline-block;
                    border: 1px solid #64748b;
                    background: #f8fafc;
                    padding: 1px 4px;
                    border-radius: 3px;
                    font-size: 7.5pt;
                    font-weight: 600;
                }
                .kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                    margin-bottom: 10px;
                }
                .kpi-card {
                    border: 1.5px solid #000000;
                    padding: 5px 8px;
                    border-radius: 4px;
                    background: #ffffff;
                }
                .kpi-label {
                    font-size: 7.5pt;
                    font-weight: 700;
                    color: #374151;
                    text-transform: uppercase;
                }
                .kpi-value {
                    font-size: 11pt;
                    font-weight: 800;
                    color: #000000;
                    margin-top: 1px;
                }
                .signature-section {
                    margin-top: 24px;
                    display: flex;
                    justify-content: flex-end;
                    page-break-inside: avoid;
                }
                .sig-box {
                    border-top: 1px solid #000000;
                    width: 320px;
                    padding-top: 4px;
                    font-size: 8pt;
                    font-weight: 600;
                }
                .doc-footer {
                    margin-top: 14px;
                    padding-top: 6px;
                    border-top: 1px dashed #9ca3af;
                    display: flex;
                    justify-content: space-between;
                    font-size: 7.5pt;
                    color: #6b7280;
                }
                tr {
                    page-break-inside: avoid;
                }
            </style>
        </head>
        <body>
            ${bodyHtml}
        </body>
        </html>
    `);
    doc.close();

    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1500);
    }, 250);
}

/**
 * Print Official Purchase Order & Requisition Sheet
 */
function printPurchaseManifest() {
    const items = window.purchasingManifestItems || [];
    if (items.length === 0) {
        showToast('Purchasing cart is empty. Add products to print order manifest.', 'warning');
        return;
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const user = window.AppState?.currentUser?.username || 'admin';

    const rowsHtml = items.map((item, idx) => {
        return `
            <tr>
                <td class="text-center" style="font-weight:700;">${idx + 1}</td>
                <td style="font-weight:700;">${escapeHtml(item.brand || '')}</td>
                <td style="font-weight:600;">${escapeHtml(item.name || '')}</td>
                <td>${escapeHtml(item.color || 'Standard')}</td>
                <td style="font-size:7.5pt;">${escapeHtml(item.destinations || 'All Branches')}</td>
                <td style="font-weight:700;">${formatNumber(item.qty, item.unit)} ${escapeHtml(item.unit || '')}</td>
                <td style="text-align:right;">${item.price ? '$' + escapeHtml(item.price) : '___________'}</td>
                <td style="font-size:7.5pt;">${escapeHtml(item.notes || '')}</td>
                <td class="text-center" style="font-size:10pt; font-family:monospace;">☐</td>
                <td>&nbsp;</td>
            </tr>
        `;
    }).join('');

    const bodyHtml = `
        <div class="doc-header">
            <div class="doc-header-top">
                <div>
                    <h1 class="doc-title">PURCHASE ORDER</h1>
                </div>
                <div class="doc-meta">
                    <div><strong>Issued:</strong> ${dateFormatted} at ${timeFormatted}</div>
                    <div><strong>Requisitioner:</strong> ${escapeHtml(user)}</div>
                    <div><strong>Total Line Items:</strong> ${items.length}</div>
                </div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width:4%; text-align:center;">No</th>
                    <th style="width:11%;">Brand / Maker</th>
                    <th style="width:16%;">Product Name</th>
                    <th style="width:9%;">Color / Spec</th>
                    <th style="width:11%;">Destination</th>
                    <th style="width:9%;">Order Qty</th>
                    <th style="width:8%; text-align:right;">Price ($)</th>
                    <th style="width:14%;">Remarks</th>
                    <th style="width:6%; text-align:center;">Tick / X</th>
                    <th style="width:12%;">Comment</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>

        <div class="signature-section">
            <div class="sig-box">
                <div>Signature &amp; Date: ___________________________________</div>
            </div>
        </div>

        <div class="doc-footer">
            <div>StockMatrix Inventory Management System</div>
            <div>Official Purchasing Requisition Sheet</div>
        </div>
    `;

    printStandaloneDocument('Purchase_Order', bodyHtml);
}

/**
 * Print Official Business Executive Report
 */
function printExecutiveReport() {
    const data = window.reportsDataCache;
    if (!data) {
        showToast('No report data loaded. Please filter report first.', 'warning');
        return;
    }

    const kpis = data.kpis || {};
    const filters = data.filters || {};
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    let branchLabel = 'All Branches Combined';
    if (filters.branch !== 'all' && data.branches) {
        const b = data.branches.find(item => String(item.id) === String(filters.branch));
        if (b) branchLabel = `Branch: ${b.name}`;
    }
    const rangeLabel = filters.range ? (filters.range.charAt(0).toUpperCase() + filters.range.slice(1)) : 'Today';

    // 1. KPI grid
    const kpiHtml = `
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">Total Products</div>
                <div class="kpi-value">${kpis.totalProductsIndexed || 0} Products</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Total Sales Revenue</div>
                <div class="kpi-value">${formatCurrency(kpis.totalRevenue || 0)}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Total Purchases Cost</div>
                <div class="kpi-value">${formatCurrency(kpis.totalPurchaseCost || 0)}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Net Profit Earned</div>
                <div class="kpi-value" style="color:${(kpis.netRealizedProfit || 0) >= 0 ? '#059669' : '#dc2626'};">${formatCurrency(kpis.netRealizedProfit || 0)}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Current Stock Value</div>
                <div class="kpi-value">${formatCurrency(kpis.onHandAssetValuation || 0)}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Damaged Stock Loss</div>
                <div class="kpi-value" style="color:#dc2626;">${kpis.totalDamagedUnits || 0} Units (${formatCurrency(kpis.totalDamagedLoss || 0)})</div>
            </div>
        </div>
    `;

    // 2. Branch Performance Table
    const branches = Object.values(data.branchMetrics || {});
    let branchTableHtml = '';
    if (branches.length > 0) {
        let bRows = '';
        branches.forEach(b => {
            const bProfit = b.revenue - b.cogs;
            bRows += `
                <tr style="background:#f8fafc; font-weight:700;">
                    <td>🏢 ${escapeHtml(b.name)}</td>
                    <td class="text-right">${formatCurrency(b.revenue)}</td>
                    <td class="text-right">${formatCurrency(b.cogs)}</td>
                    <td class="text-right">${formatCurrency(bProfit)}</td>
                </tr>
            `;
            const prodKeys = Object.keys(b.products || {});
            prodKeys.forEach(pKey => {
                const p = b.products[pKey];
                const pProfit = p.total_revenue - p.total_cogs;
                bRows += `
                    <tr>
                        <td style="padding-left:24px;">↳ ${escapeHtml(p.brand)} - ${escapeHtml(p.name)}</td>
                        <td class="text-right">${formatCurrency(p.total_revenue)}</td>
                        <td class="text-right">${formatCurrency(p.total_cogs)}</td>
                        <td class="text-right font-bold">${formatCurrency(pProfit)}</td>
                    </tr>
                `;
            });
        });
        branchTableHtml = `
            <div style="font-weight:800; font-size:11pt; margin-top:12px; margin-bottom:4px;">1. Branch Performance Summary</div>
            <table>
                <thead>
                    <tr>
                        <th>Branch / Product</th>
                        <th class="text-right" style="width:120px;">Total Sales ($)</th>
                        <th class="text-right" style="width:120px;">Item Cost ($)</th>
                        <th class="text-right" style="width:120px;">Net Profit ($)</th>
                    </tr>
                </thead>
                <tbody>${bRows}</tbody>
            </table>
        `;
    }

    // 3. Damaged Goods Table
    const damagedList = data.damagedLedger || [];
    let damagedTableHtml = '';
    if (damagedList.length > 0) {
        const dRows = damagedList.map(r => `
            <tr>
                <td style="width:85px;">${r.date ? new Date(r.date).toISOString().split('T')[0] : '-'}</td>
                <td>🏢 ${escapeHtml(r.branch_name)}</td>
                <td>${escapeHtml(r.brand)} - ${escapeHtml(r.product_name)}</td>
                <td style="width:80px; font-weight:700; color:#dc2626;">-${formatNumber(r.quantity, r.symbol)} ${escapeHtml(r.symbol || '')}</td>
                <td>${escapeHtml(r.reason || '')}</td>
                <td style="width:80px;">${escapeHtml(r.reported_by || 'Admin')}</td>
                <td class="text-right font-bold" style="width:90px; color:#dc2626;">${formatCurrency(r.estimated_loss || 0)}</td>
            </tr>
        `).join('');
        damagedTableHtml = `
            <div style="font-weight:800; font-size:11pt; margin-top:14px; margin-bottom:4px;">2. Damaged &amp; Lost Products Report</div>
            <table>
                <thead>
                    <tr>
                        <th style="width:85px;">Date</th>
                        <th>Branch</th>
                        <th>Product</th>
                        <th style="width:80px;">Quantity</th>
                        <th>Reason / Notes</th>
                        <th style="width:80px;">Reported By</th>
                        <th class="text-right" style="width:90px;">Loss ($)</th>
                    </tr>
                </thead>
                <tbody>${dRows}</tbody>
            </table>
        `;
    }

    // 4. Remaining Stock Table
    const remainingList = data.remainingInventory || [];
    let remainingTableHtml = '';
    if (remainingList.length > 0) {
        const remRows = remainingList.map(item => `
            <tr>
                <td>🏢 ${escapeHtml(item.branch_name)}</td>
                <td>${escapeHtml(item.brand)} - ${escapeHtml(item.product_name)}</td>
                <td style="width:90px; font-weight:700;">${formatNumber(item.quantity, item.symbol)} ${escapeHtml(item.symbol || '')}</td>
                <td style="width:90px;">${parseFloat(item.quantity) <= 0 ? 'Out of Stock' : (parseFloat(item.quantity) <= parseFloat(item.min_stock_alert || 5) ? 'Low Stock' : 'Optimal')}</td>
            </tr>
        `).join('');
        remainingTableHtml = `
            <div style="font-weight:800; font-size:11pt; margin-top:14px; margin-bottom:4px;">3. Current Stock on Shelves</div>
            <table>
                <thead>
                    <tr>
                        <th>Branch</th>
                        <th>Product</th>
                        <th style="width:90px;">Stock Balance</th>
                        <th style="width:90px;">Status</th>
                    </tr>
                </thead>
                <tbody>${remRows}</tbody>
            </table>
        `;
    }

    const bodyHtml = `
        <div class="doc-header">
            <div class="doc-header-top">
                <div>
                    <h1 class="doc-title">EXECUTIVE BUSINESS INTELLIGENCE &amp; INVENTORY REPORT</h1>
                    <div class="doc-subtitle">Scope: ${escapeHtml(branchLabel)} · Timeline: ${escapeHtml(rangeLabel)}</div>
                </div>
                <div class="doc-meta">
                    <div><strong>Generated:</strong> ${dateFormatted} at ${timeFormatted}</div>
                    <div><strong>System:</strong> StockMatrix Executive Engine</div>
                </div>
            </div>
        </div>

        ${kpiHtml}
        ${branchTableHtml}
        ${damagedTableHtml}
        ${remainingTableHtml}

        <div class="doc-footer">
            <div>StockMatrix Business Intelligence</div>
            <div>Executive Management Report · Confidential</div>
        </div>
    `;

    printStandaloneDocument('Business_Executive_Report', bodyHtml);
}

/**
 * Print Official Product Catalog
 */
function printProductCatalog() {
    const products = window.productsCache || [];
    if (products.length === 0) {
        showToast('No products available to print.', 'warning');
        return;
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const rowsHtml = products.map(p => `
        <tr>
            <td style="width:50px; text-align:center;">#${p.id}</td>
            <td style="width:120px; font-weight:700;">${escapeHtml(p.brand)}</td>
            <td style="font-weight:600;">${escapeHtml(p.name)}</td>
            <td style="width:120px;">${p.type === 1 ? 'Electronics' : 'Construction'}</td>
            <td style="width:80px; font-weight:700;">${formatNumber(p.total_stock, p.unit_symbol)} ${escapeHtml(p.unit_symbol || p.unit_name || '')}</td>
            <td style="width:80px;">${escapeHtml(p.unit_symbol || p.unit_name || '-')}</td>
            <td style="width:80px;">${escapeHtml(p.color || 'Standard')}</td>
        </tr>
    `).join('');

    const bodyHtml = `
        <div class="doc-header">
            <div class="doc-header-top">
                <div>
                    <h1 class="doc-title">OFFICIAL PRODUCT CATALOG &amp; SPECIFICATIONS</h1>
                    <div class="doc-subtitle">Active Product Catalog, Categories &amp; Measuring Units</div>
                </div>
                <div class="doc-meta">
                    <div><strong>Date:</strong> ${dateFormatted}</div>
                    <div><strong>Total Active Products:</strong> ${products.length}</div>
                </div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width:50px; text-align:center;">ID</th>
                    <th style="width:120px;">Brand</th>
                    <th>Product Name</th>
                    <th style="width:120px;">Category</th>
                    <th style="width:80px;">Total Stock</th>
                    <th style="width:80px;">Unit</th>
                    <th style="width:80px;">Color / Spec</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>

        <div class="doc-footer">
            <div>StockMatrix Inventory Management System</div>
            <div>Product Catalog Report</div>
        </div>
    `;

    printStandaloneDocument('Product_Catalog_Report', bodyHtml);
}

/**
 * Download standard UTF-8 CSV file with proper escaping and Excel BOM
 */
function downloadCsv(filename, headers, rows) {
    if (!headers || !rows) return;

    const escapeCsvValue = (val) => {
        if (val === null || val === undefined) return '""';
        let str = String(val).replace(/"/g, '""');
        return `"${str}"`;
    };

    const csvContent = [
        headers.map(escapeCsvValue).join(','),
        ...rows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\r\n');

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
        'No',
        'Brand / Maker',
        'Product Name',
        'Color / Specification',
        'Destination',
        'Order Quantity',
        'Unit',
        'Price ($)',
        'Remarks',
        'Tick / X',
        'Comment'
    ];

    const rows = window.purchasingManifestItems.map((item, idx) => [
        idx + 1,
        item.brand || '',
        item.name || '',
        item.color || 'Standard',
        item.destinations || 'All Branches',
        item.qty || 0,
        item.unit || '',
        item.price || '',
        item.notes || '',
        item.checked ? 'Tick' : 'X',
        ''
    ]);

    downloadCsv('Purchase_Order', headers, rows);
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

// Attach all functions to window
window.printPurchaseManifest = printPurchaseManifest;
window.printExecutiveReport = printExecutiveReport;
window.printProductCatalog = printProductCatalog;
window.downloadCsv = downloadCsv;
window.exportPurchasingToExcel = exportPurchasingToExcel;
window.exportProductsToExcel = exportProductsToExcel;
window.exportExecutiveReportToExcel = exportExecutiveReportToExcel;
window.exportRemainingStockToExcel = exportRemainingStockToExcel;
window.exportDamagedReportToExcel = exportDamagedReportToExcel;
