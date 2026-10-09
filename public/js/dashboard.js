/**
 * StockMatrix - Dashboard & Branch Operations Controller
 */

let activeBranchOpsId = null;

// Helpers if not globally loaded
function formatQuantity(q, unit = '') {
    if (typeof window.formatNumber === 'function') {
        return window.formatNumber(q, unit);
    }
    const val = parseFloat(q) || 0;
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);
}

function formatMoney(m) {
    const val = parseFloat(m) || 0;
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
}

/**
 * Render Main Dashboard Overview with Branch Cards
 */
async function renderDashboardView() {
    const container = document.getElementById('dashboardBranchesGrid');
    if (!container) return;

    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);">Loading operational overview...</div>`;

    try {
        const response = await fetch('/api/dashboard/overview');
        if (response.status === 401) {
            window.location.href = '/login.html';
            return;
        }
        if (!response.ok) {
            const errData = await response.json().catch(() => ({ message: 'Server response error' }));
            throw new Error(errData.message || 'Unable to retrieve dashboard metrics');
        }
        const data = await response.json();

        if (!data.success || !data.branchesOverview) {
            container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted); font-style:italic;">No branches found.</div>`;
            return;
        }

        if (data.branchesOverview.length === 0) {
            container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted); font-style:italic;">No operational branch facilities registered yet.</div>`;
            return;
        }

        container.innerHTML = data.branchesOverview.map(branch => {
            const lowStockClass = branch.lowStockCount > 0 ? 'badge-red' : 'badge-slate';
            const salesClass = branch.todaySales > 0 ? 'badge-emerald' : 'badge-slate';

            return `
                <div class="card" style="display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                        <div class="card-header" style="margin-bottom:14px; padding-bottom:12px;">
                            <div>
                                <h3 class="card-title" style="font-size:16px;">🏢 ${escapeHtml(branch.name)}</h3>
                                <p style="font-size:12.5px; color:var(--text-muted); margin-top:2px; display:flex; align-items:center; gap:4px;">
                                    📍 ${escapeHtml(branch.location || 'Location Unspecified')}
                                </p>
                            </div>
                        </div>

                        <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:13.5px;">
                                <span style="font-weight:600; color:var(--text-secondary); font-size:12px; text-transform:uppercase;">${t('dash.volume_balance', 'Volume Balance')}</span>
                                <span class="badge badge-slate" style="font-size:12px;">${formatQuantity(branch.totalProducts)} ${t('dash.units_count', 'units')}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:13.5px;">
                                <span style="font-weight:600; color:var(--text-secondary); font-size:12px; text-transform:uppercase;">${t('dash.kpi_low_stock', 'Low Stock Alerts')}</span>
                                <span class="badge ${lowStockClass}" style="font-size:12px;">${branch.lowStockCount} ${t('dash.lines_count', 'lines')}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:13.5px;">
                                <span style="font-weight:600; color:var(--text-secondary); font-size:12px; text-transform:uppercase;">${t('dash.today_revenue', "Today's Realized Revenue")}</span>
                                <span class="badge ${salesClass}" style="font-size:12px;">$${formatMoney(branch.todaySales)}</span>
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-secondary" style="width:100%; justify-content:center;" onclick="navigateTo('branch-ops/${branch.id}')">
                        <span>${t('dash.open_hub', 'Open Branch Control Hub')}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
            `;
        }).join('');

    } catch (err) {
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--danger);">Error loading dashboard metrics: ${escapeHtml(err.message)}</div>`;
    }
}

/**
 * Render Specific Branch Operations Hub
 */
async function renderBranchOpsView(branchId) {
    activeBranchOpsId = branchId;

    const rangeType = document.getElementById('opsRangeType')?.value || 'today';
    const startDate = document.getElementById('opsStartDate')?.value || '';
    const endDate = document.getElementById('opsEndDate')?.value || '';

    let url = `/api/dashboard/branch/${branchId}?range_type=${encodeURIComponent(rangeType)}`;
    if (rangeType === 'custom' && startDate) {
        url += `&start_date=${encodeURIComponent(startDate)}`;
        if (endDate) url += `&end_date=${encodeURIComponent(endDate)}`;
    }

    try {
        const response = await fetch(url);
        if (response.status === 401) {
            window.location.href = '/login.html';
            return;
        }
        if (!response.ok) {
            const errData = await response.json().catch(() => ({ message: 'Server response error' }));
            throw new Error(errData.message || 'Unable to retrieve branch operations details');
        }
        const data = await response.json();

        if (!data.success || !data.branch) {
            showToast('Unable to load branch operations view.', 'error');
            navigateTo('dashboard');
            return;
        }

        // Update titles & subtitles
        document.getElementById('branchOpsTitle').textContent = data.branch.name;
        document.getElementById('branchOpsSubtitle').innerHTML = `📍 ${escapeHtml(data.branch.location || 'Location Unspecified')} Operational Hub`;
        document.getElementById('opsTimelineBadge').textContent = data.timelineTitle;
        document.getElementById('opsRangeSalesValue').textContent = `$${formatMoney(data.rangeSales)}`;

        // Render Live Shelf Balances Table
        const invTableBody = document.getElementById('opsInventoryTableBody');
        if (invTableBody) {
            if (data.inventory.length === 0) {
                invTableBody.innerHTML = `<tr><td colspan="3" class="empty-state-cell" style="text-align:center; color:var(--text-muted); font-style:italic; padding:24px;">No active inventory records at this branch.</td></tr>`;
            } else {
                invTableBody.innerHTML = data.inventory.map(row => {
                    const catBadge = row.type === 1 
                        ? `<span class="badge badge-blue">Electronics</span>` 
                        : `<span class="badge badge-amber">Construction</span>`;
                    return `
                        <tr>
                            <td class="card-main-title" data-label="Product Profile">
                                <div style="font-weight:700; color:var(--text-primary);">${escapeHtml(row.brand)} – ${escapeHtml(row.name)}</div>
                            </td>
                            <td data-label="Category">${catBadge}</td>
                            <td data-label="Shelf Balance">
                                <strong style="color:var(--primary); font-size:14px;">${formatQuantity(row.quantity)} ${escapeHtml(row.symbol || '')}</strong>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        // Render Low Stock Alerts List
        const lowStockList = document.getElementById('opsLowStockAlertsList');
        const lowStockCountBadge = document.getElementById('opsLowStockCount');
        if (lowStockList) {
            lowStockCountBadge.textContent = `${data.lowStockAlerts.length} items`;
            if (data.lowStockAlerts.length === 0) {
                lowStockList.innerHTML = `<div style="text-align:center; padding:18px; color:var(--success); font-weight:600; font-size:13px;">✓ All assets above baseline safety thresholds.</div>`;
            } else {
                lowStockList.innerHTML = data.lowStockAlerts.map(alert => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--danger-bg); border:1px solid var(--danger-border); border-radius:var(--radius-md); font-size:13.5px;">
                        <div>
                            <span style="font-weight:600; color:var(--text-primary);">${escapeHtml(alert.brand ? alert.brand + ' - ' : '')}${escapeHtml(alert.name)}</span>
                        </div>
                        <div style="text-align:right;">
                            <span style="color:var(--danger); font-weight:700;">${formatQuantity(alert.quantity)} ${escapeHtml(alert.symbol || '')}</span>
                            <div style="font-size:11px; color:var(--text-muted);">Threshold: &le; ${alert.min_stock_alert || 5} ${escapeHtml(alert.symbol || '')}</div>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Render Stock In Logs List
        const stockInList = document.getElementById('opsStockInList');
        if (stockInList) {
            if (data.stockInLogs.length === 0) {
                stockInList.innerHTML = `<div style="text-align:center; padding:18px; color:var(--text-muted); font-style:italic; font-size:13px;">No inbound records for this timeframe.</div>`;
            } else {
                stockInList.innerHTML = data.stockInLogs.map(log => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--surface); border:1px solid var(--border-color); border-left:4px solid var(--primary); border-radius:var(--radius-md); font-size:13px;">
                        <div>
                            <div style="font-weight:600; color:var(--text-primary);">${escapeHtml(log.name)}</div>
                            <small style="color:var(--text-muted);">Cost: $${formatMoney(log.purchase_price)}</small>
                            <div style="display:flex; gap:8px; margin-top:4px;">
                                <a href="javascript:void(0)" style="color:var(--primary); font-size:11.5px; font-weight:600;" onclick="openEditStockInModal(${log.id}, ${branchId}, '${escapeHtml(log.name)}', ${log.quantity}, ${log.purchase_price})">Edit</a>
                                <a href="javascript:void(0)" style="color:var(--danger); font-size:11.5px; font-weight:600;" onclick="handleDeleteStockIn(${log.id}, ${branchId})">Delete</a>
                            </div>
                        </div>
                        <span style="color:var(--primary); font-weight:700; font-size:13.5px;">+${formatQuantity(log.quantity)} ${escapeHtml(log.symbol || '')}</span>
                    </div>
                `).join('');
            }
        }

        // 4. Stock Out Logs List
        const stockOutList = document.getElementById('opsStockOutList');
        if (stockOutList) {
            if (data.stockOutLogs.length === 0) {
                stockOutList.innerHTML = `<div style="text-align:center; padding:18px; color:var(--text-muted); font-style:italic; font-size:13px;">No outbound sales for this timeframe.</div>`;
            } else {
                stockOutList.innerHTML = data.stockOutLogs.map(log => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--surface); border:1px solid var(--border-color); border-left:4px solid var(--success); border-radius:var(--radius-md); font-size:13px;">
                        <div>
                            <div style="font-weight:600; color:var(--text-primary);">${escapeHtml(log.name)}</div>
                            <small style="color:var(--text-muted);">Sold: $${formatMoney(log.sold_price)}</small>
                            <div style="display:flex; gap:8px; margin-top:4px;">
                                <a href="javascript:void(0)" style="color:var(--primary); font-size:11.5px; font-weight:600;" onclick="openEditStockOutModal(${log.id}, ${branchId}, '${escapeHtml(log.name)}', ${log.quantity}, ${log.sold_price})">Edit</a>
                                <a href="javascript:void(0)" style="color:var(--danger); font-size:11.5px; font-weight:600;" onclick="handleDeleteStockOut(${log.id}, ${branchId})">Delete</a>
                            </div>
                        </div>
                        <span style="color:var(--success); font-weight:700; font-size:13.5px;">-${formatQuantity(log.quantity)} ${escapeHtml(log.symbol || '')}</span>
                    </div>
                `).join('');
            }
        }

        // 5. Damaged Stock Logs List
        const damagedList = document.getElementById('opsDamagedList');
        if (damagedList) {
            if (!data.damagedLogs || data.damagedLogs.length === 0) {
                damagedList.innerHTML = `<div style="text-align:center; padding:18px; color:var(--text-muted); font-style:italic; font-size:13px;">No damaged items recorded for this timeframe.</div>`;
            } else {
                damagedList.innerHTML = data.damagedLogs.map(log => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--surface); border:1px solid var(--border-color); border-left:4px solid var(--danger); border-radius:var(--radius-md); font-size:13px;">
                        <div>
                            <div style="font-weight:600; color:var(--text-primary);">${escapeHtml(log.brand ? log.brand + ' - ' : '')}${escapeHtml(log.name)}</div>
                            <small style="color:var(--danger); font-weight:500;">Reason: ${escapeHtml(log.reason || 'Damaged')}</small>
                            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">By: ${escapeHtml(log.reported_by || 'Staff')}</div>
                            <div style="display:flex; gap:8px; margin-top:4px;">
                                <a href="javascript:void(0)" style="color:var(--danger); font-size:11.5px; font-weight:600;" onclick="handleDeleteDamaged(${log.id}, ${branchId})">Delete / Restore Stock</a>
                            </div>
                        </div>
                        <span style="color:var(--danger); font-weight:700; font-size:13.5px;">-${formatQuantity(log.quantity)} ${escapeHtml(log.symbol || '')}</span>
                    </div>
                `).join('');
            }
        }

    } catch (err) {
        showToast('Error loading branch operations: ' + err.message, 'error');
    }
}

function handleBranchOpsFilterChange() {
    const rangeType = document.getElementById('opsRangeType').value;
    const startGroup = document.getElementById('opsCustomStartGroup');
    const endGroup = document.getElementById('opsCustomEndGroup');

    if (rangeType === 'custom') {
        startGroup.style.display = 'block';
        endGroup.style.display = 'block';
    } else {
        startGroup.style.display = 'none';
        endGroup.style.display = 'none';
    }

    if (activeBranchOpsId) {
        renderBranchOpsView(activeBranchOpsId);
    }
}

/* Modals for Edit Stock In & Stock Out */
function openEditStockInModal(id, branchId, name, qty, price) {
    document.getElementById('editStockInId').value = id;
    document.getElementById('editStockInBranchId').value = branchId;
    document.getElementById('editStockInProdName').textContent = name;
    document.getElementById('editStockInQty').value = qty;
    document.getElementById('editStockInPrice').value = price;
    openModal('editStockInModal');
}

async function handleEditStockInSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editStockInId').value;
    const branchId = document.getElementById('editStockInBranchId').value;
    const quantity = document.getElementById('editStockInQty').value;
    const purchase_price = document.getElementById('editStockInPrice').value;

    try {
        const res = await fetch(`/api/dashboard/stock-in/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity, purchase_price })
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            closeModal('editStockInModal');
            renderBranchOpsView(branchId);
        } else {
            showToast(data.message || 'Update failed', 'error');
        }
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

async function handleDeleteStockIn(id, branchId) {
    if (!confirm('Are you sure you want to remove this stock-in log? Corresponding inventory will be deducted from shelf balances.')) {
        return;
    }

    try {
        const res = await fetch(`/api/dashboard/stock-in/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            renderBranchOpsView(branchId);
        } else {
            showToast(data.message || 'Deletion prevented', 'error');
        }
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

function openEditStockOutModal(id, branchId, name, qty, price) {
    document.getElementById('editStockOutId').value = id;
    document.getElementById('editStockOutBranchId').value = branchId;
    document.getElementById('editStockOutProdName').textContent = name;
    document.getElementById('editStockOutQty').value = qty;
    document.getElementById('editStockOutPrice').value = price;
    openModal('editStockOutModal');
}

async function handleEditStockOutSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editStockOutId').value;
    const branchId = document.getElementById('editStockOutBranchId').value;
    const quantity = document.getElementById('editStockOutQty').value;
    const sold_price = document.getElementById('editStockOutPrice').value;

    try {
        const res = await fetch(`/api/dashboard/stock-out/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity, sold_price })
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            closeModal('editStockOutModal');
            renderBranchOpsView(branchId);
        } else {
            showToast(data.message || 'Update failed', 'error');
        }
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

async function handleDeleteStockOut(id, branchId) {
    if (!confirm('Are you sure you want to remove this sales dispatch? The item quantities will be restored back onto inventory shelves.')) {
        return;
    }

    try {
        const res = await fetch(`/api/dashboard/stock-out/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            renderBranchOpsView(branchId);
        } else {
            showToast(data.message || 'Deletion prevented', 'error');
        }
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

async function handleDeleteDamaged(id, branchId) {
    if (!confirm('Are you sure you want to remove this damaged stock entry? The item quantity will be restored back to shelf inventory.')) {
        return;
    }

    try {
        const res = await fetch(`/api/dashboard/damaged/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            renderBranchOpsView(branchId);
        } else {
            showToast(data.message || 'Deletion prevented', 'error');
        }
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

// Window Globals / Aliases
window.loadDashboardOverview = renderDashboardView;
window.renderDashboardView = renderDashboardView;
window.loadBranchOperations = renderBranchOpsView;
window.renderBranchOpsView = renderBranchOpsView;
