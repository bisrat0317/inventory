/**
 * StockMatrix - Executive Intelligence & Reporting Module
 */

let financialBarChartInstance = null;
let salesTrendChartInstance = null;
let reportsDataCache = null;

/**
 * Handle timeline range change
 */
function handleReportsRangeChange() {
    const rangeType = document.getElementById('reportsRangeType')?.value;
    const startGroup = document.getElementById('reportsCustomStartGroup');
    const endGroup = document.getElementById('reportsCustomEndGroup');

    if (startGroup && endGroup) {
        if (rangeType === 'custom') {
            startGroup.style.display = 'block';
            endGroup.style.display = 'block';
        } else {
            startGroup.style.display = 'none';
            endGroup.style.display = 'none';
        }
    }

    loadExecutiveReports();
}

/**
 * Load reports data from backend
 */
async function loadExecutiveReports() {
    try {
        const branchSelect = document.getElementById('reportsBranchSelect');
        const rangeSelect = document.getElementById('reportsRangeType');
        const startInput = document.getElementById('reportsStartDate');
        const endInput = document.getElementById('reportsEndDate');

        const branchId = branchSelect?.value || 'all';
        const rangeType = rangeSelect?.value || 'today';
        const startDate = startInput?.value || '';
        const endDate = endInput?.value || '';

        const params = new URLSearchParams({
            branch_id: branchId,
            range_type: rangeType
        });

        if (rangeType === 'custom' && startDate) {
            params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
        }

        const res = await fetch(`/api/reports?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to load executive reports.');
        const data = await res.json();

        if (data.success) {
            reportsDataCache = data;

            // Populate branch scope dropdown
            if (branchSelect && branchSelect.options.length <= 1 && data.branches) {
                const currentVal = branchSelect.value;
                branchSelect.innerHTML = '<option value="all">All Branches Combined</option>' + 
                    data.branches.map(b => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join('');
                if (currentVal) branchSelect.value = currentVal;
            }

            renderKpis(data.kpis);
            renderFacilityMatrix(data.branchMetrics);
            renderLedgers(data.inboundLedger, data.outboundLedger);
            renderRemainingStock(data.remainingInventory);

            // Re-render charts if container is open
            const chartsWrapper = document.getElementById('analyticsChartsWrapper');
            if (chartsWrapper && chartsWrapper.style.display !== 'none') {
                renderReportCharts();
            }
        }
    } catch (err) {
        console.error('Error loading reports:', err);
        showToast(err.message, 'error');
    }
}

/**
 * Render Top KPI Cards
 */
function renderKpis(kpis) {
    if (!kpis) return;

    const skuElem = document.getElementById('kpiTotalSkus');
    const revElem = document.getElementById('kpiTotalRevenue');
    const costElem = document.getElementById('kpiTotalPurchaseCost');
    const valElem = document.getElementById('kpiOnHandValuation');
    const profitElem = document.getElementById('kpiNetProfit');

    if (skuElem) skuElem.textContent = `${kpis.totalProductsIndexed} SKUs`;
    if (revElem) revElem.textContent = formatCurrency(kpis.totalRevenue);
    if (costElem) costElem.textContent = formatCurrency(kpis.totalPurchaseCost);
    if (valElem) valElem.textContent = formatCurrency(kpis.onHandAssetValuation);

    if (profitElem) {
        profitElem.textContent = formatCurrency(kpis.netRealizedProfit);
        if (kpis.netRealizedProfit < 0) {
            profitElem.style.color = 'var(--danger)';
        } else {
            profitElem.style.color = 'var(--success)';
        }
    }
}

/**
 * Render Facility Matrix Table
 */
function renderFacilityMatrix(branchMetrics) {
    const tbody = document.getElementById('facilityMatrixTableBody');
    if (!tbody) return;

    const branches = Object.values(branchMetrics || {});
    if (branches.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--text-muted);">No operational facility data recorded.</td></tr>`;
        return;
    }

    let rowsHtml = '';

    branches.forEach(branch => {
        const prodKeys = Object.keys(branch.products || {});
        const branchProfit = branch.revenue - branch.cogs;

        // Branch Header Row
        rowsHtml += `
            <tr style="background:var(--surface-hover); font-weight:700;">
                <td style="color:var(--text-primary); font-size:14px;">
                    🏢 <strong>${escapeHtml(branch.name)}</strong>
                </td>
                <td>-</td>
                <td style="color:var(--primary); font-weight:700;">${formatCurrency(branch.revenue)}</td>
                <td style="color:var(--warning); font-weight:700;">${formatCurrency(branch.cogs)}</td>
                <td style="color:${branchProfit >= 0 ? 'var(--success)' : 'var(--danger)'}; font-weight:800;">
                    ${formatCurrency(branchProfit)}
                </td>
            </tr>
        `;

        // Product Subrows
        if (prodKeys.length === 0) {
            rowsHtml += `
                <tr>
                    <td colspan="5" style="padding-left:36px; font-size:12.5px; color:var(--text-muted); font-style:italic;">
                        No product dispatches or transactions recorded in this period.
                    </td>
                </tr>
            `;
        } else {
            prodKeys.forEach(pKey => {
                const prod = branch.products[pKey];
                const prodProfit = prod.total_revenue - prod.total_cogs;
                const marginPercent = prod.total_revenue > 0 ? ((prodProfit / prod.total_revenue) * 100).toFixed(1) + '%' : '0.0%';

                rowsHtml += `
                    <tr>
                        <td style="padding-left:36px; font-size:13px;">
                            <span style="color:var(--text-secondary); font-weight:500;">↳ ${escapeHtml(prod.brand)} - ${escapeHtml(prod.name)}</span>
                            <span class="badge ${prod.type === 1 ? 'badge-blue' : 'badge-emerald'}" style="font-size:10px; margin-left:6px;">
                                ${prod.type === 1 ? 'Electronics' : 'Construction'}
                            </span>
                        </td>
                        <td style="font-size:13px;">${formatNumber(prod.qty_sold)} ${escapeHtml(prod.symbol || '')}</td>
                        <td style="font-size:13px; color:var(--text-primary);">${formatCurrency(prod.total_revenue)}</td>
                        <td style="font-size:13px; color:var(--text-muted);">${formatCurrency(prod.total_cogs)}</td>
                        <td style="font-size:13px; font-weight:600; color:${prodProfit >= 0 ? 'var(--success)' : 'var(--danger)'};">
                            ${formatCurrency(prodProfit)} <span style="font-size:11px; opacity:0.8;">(${marginPercent})</span>
                        </td>
                    </tr>
                `;
            });
        }
    });

    tbody.innerHTML = rowsHtml;
}

/**
 * Render Split Ledgers (Stock In & Stock Out)
 */
function renderLedgers(inbound, outbound) {
    // Inbound
    const inTbody = document.getElementById('inboundLedgerTableBody');
    const inCount = document.getElementById('inboundLedgerCount');
    if (inCount) inCount.textContent = `${inbound?.length || 0} entries`;

    if (inTbody) {
        if (!inbound || inbound.length === 0) {
            inTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted);">No inbound stock recorded.</td></tr>';
        } else {
            inTbody.innerHTML = inbound.map(r => `
                <tr>
                    <td style="font-size:12px; font-family:var(--font-mono); color:var(--text-muted);">${r.date ? new Date(r.date).toISOString().split('T')[0] : '-'}</td>
                    <td style="font-size:13px;">${escapeHtml(r.branch_name)}</td>
                    <td style="font-size:13px; font-weight:500;">${escapeHtml(r.brand)} - ${escapeHtml(r.product_name)}</td>
                    <td style="font-size:13px;"><span class="badge badge-blue">+${formatNumber(r.quantity)} ${escapeHtml(r.symbol || '')}</span></td>
                    <td style="font-size:13px; font-weight:600; color:var(--info);">${formatCurrency(r.purchase_price)}</td>
                </tr>
            `).join('');
        }
    }

    // Outbound
    const outTbody = document.getElementById('outboundLedgerTableBody');
    const outCount = document.getElementById('outboundLedgerCount');
    if (outCount) outCount.textContent = `${outbound?.length || 0} entries`;

    if (outTbody) {
        if (!outbound || outbound.length === 0) {
            outTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted);">No sales dispatches recorded.</td></tr>';
        } else {
            outTbody.innerHTML = outbound.map(r => `
                <tr>
                    <td style="font-size:12px; font-family:var(--font-mono); color:var(--text-muted);">${r.date ? new Date(r.date).toISOString().split('T')[0] : '-'}</td>
                    <td style="font-size:13px;">${escapeHtml(r.branch_name)}</td>
                    <td style="font-size:13px; font-weight:500;">${escapeHtml(r.brand)} - ${escapeHtml(r.product_name)}</td>
                    <td style="font-size:13px;"><span class="badge badge-emerald">-${formatNumber(r.quantity)} ${escapeHtml(r.symbol || '')}</span></td>
                    <td style="font-size:13px; font-weight:600; color:var(--success);">${formatCurrency(r.sold_price)}</td>
                </tr>
            `).join('');
        }
    }
}

/**
 * Render Remaining Stock Inventory Table
 */
function renderRemainingStock(items) {
    const tbody = document.getElementById('reportsRemainingInventoryTableBody');
    if (!tbody) return;

    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:24px; color:var(--text-muted);">No inventory found.</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => {
        const qty = parseFloat(item.quantity || 0);
        let evalBadge = '';
        if (qty <= 0) {
            evalBadge = '<span class="badge badge-red font-bold">DEPLETED (0 Units)</span>';
        } else if (qty < 5) {
            evalBadge = '<span class="badge badge-red">CRITICAL LOW STOCK</span>';
        } else if (qty < 20) {
            evalBadge = '<span class="badge badge-blue">OPTIMAL</span>';
        } else {
            evalBadge = '<span class="badge badge-emerald">SURPLUS</span>';
        }

        return `
            <tr>
                <td style="font-weight:600; color:var(--text-primary);">🏢 ${escapeHtml(item.branch_name)}</td>
                <td>
                    <strong style="color:var(--text-primary);">${escapeHtml(item.brand)}</strong> - ${escapeHtml(item.product_name)}
                    <span class="badge ${item.type === 1 ? 'badge-blue' : 'badge-emerald'}" style="font-size:10px; margin-left:4px;">
                        ${item.type === 1 ? 'Electronics' : 'Construction'}
                    </span>
                </td>
                <td>
                    <strong style="font-size:14px;">${formatNumber(qty, item.symbol)}</strong> ${escapeHtml(item.symbol || '')}
                </td>
                <td>${evalBadge}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Toggle Analytics Visualizer (Chart.js)
 */
function toggleAnalyticsVisualizer() {
    const wrapper = document.getElementById('analyticsChartsWrapper');
    if (!wrapper) return;

    if (wrapper.style.display === 'none' || !wrapper.style.display) {
        wrapper.style.display = 'block';
        renderReportCharts();
    } else {
        wrapper.style.display = 'none';
    }
}

/**
 * Render Chart.js Graphs
 */
function renderReportCharts() {
    if (!reportsDataCache || typeof Chart === 'undefined') return;

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

    // 1. Financial Bar Chart
    const barCanvas = document.getElementById('financialBarCanvas');
    if (barCanvas) {
        if (financialBarChartInstance) financialBarChartInstance.destroy();

        const kpis = reportsDataCache.kpis || {};
        financialBarChartInstance = new Chart(barCanvas, {
            type: 'bar',
            data: {
                labels: ['Topline Revenue', 'Cost Basis (COGS)', 'Realized Profit'],
                datasets: [{
                    label: 'USD ($)',
                    data: [kpis.totalRevenue || 0, kpis.totalCogs || 0, kpis.netRealizedProfit || 0],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.75)',
                        'rgba(245, 158, 11, 0.75)',
                        kpis.netRealizedProfit >= 0 ? 'rgba(16, 185, 129, 0.75)' : 'rgba(239, 68, 68, 0.75)'
                    ],
                    borderColor: [
                        '#3b82f6',
                        '#f59e0b',
                        kpis.netRealizedProfit >= 0 ? '#10b981' : '#ef4444'
                    ],
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: { color: textColor },
                        grid: { display: false }
                    },
                    y: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }

    // 2. Daily Sales Trend Line Chart
    const trendCanvas = document.getElementById('salesTrendCanvas');
    if (trendCanvas) {
        if (salesTrendChartInstance) salesTrendChartInstance.destroy();

        const trendObj = reportsDataCache.trendData || {};
        const labels = Object.keys(trendObj);
        const values = Object.values(trendObj);

        salesTrendChartInstance = new Chart(trendCanvas, {
            type: 'line',
            data: {
                labels: labels.length > 0 ? labels : ['Today'],
                datasets: [{
                    label: 'Sales Revenue ($)',
                    data: values.length > 0 ? values : [0],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4,
                    pointBackgroundColor: '#10b981'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: { color: textColor },
                        grid: { display: false }
                    },
                    y: {
                        ticks: { color: textColor },
                        grid: { color: gridColor },
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

window.renderReportCharts = renderReportCharts;
