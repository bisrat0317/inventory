const db = require('../config/db');

/**
 * Executive Intelligence Reporting Controller with Realtime FIFO Valuation
 */
async function getExecutiveReports(req, res, next) {
    try {
        const { branch_id, range_type, start_date, end_date } = req.query;
        const filterBranch = branch_id || 'all';
        const filterRange = range_type || 'today';

        // 1. Formulate date filters
        let dateConditionIn = "1=1";
        let dateConditionOut = "1=1";
        const paramsIn = [];
        const paramsOut = [];
        let pIdxIn = 1;
        let pIdxOut = 1;

        if (filterRange === 'today') {
            dateConditionIn = `si.date = CURRENT_DATE`;
            dateConditionOut = `so.date = CURRENT_DATE`;
        } else if (filterRange === 'weekly') {
            dateConditionIn = `EXTRACT(WEEK FROM si.date) = EXTRACT(WEEK FROM CURRENT_DATE) AND EXTRACT(YEAR FROM si.date) = EXTRACT(YEAR FROM CURRENT_DATE)`;
            dateConditionOut = `EXTRACT(WEEK FROM so.date) = EXTRACT(WEEK FROM CURRENT_DATE) AND EXTRACT(YEAR FROM so.date) = EXTRACT(YEAR FROM CURRENT_DATE)`;
        } else if (filterRange === 'monthly') {
            dateConditionIn = `EXTRACT(MONTH FROM si.date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM si.date) = EXTRACT(YEAR FROM CURRENT_DATE)`;
            dateConditionOut = `EXTRACT(MONTH FROM so.date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM so.date) = EXTRACT(YEAR FROM CURRENT_DATE)`;
        } else if (filterRange === 'yearly') {
            dateConditionIn = `EXTRACT(YEAR FROM si.date) = EXTRACT(YEAR FROM CURRENT_DATE)`;
            dateConditionOut = `EXTRACT(YEAR FROM so.date) = EXTRACT(YEAR FROM CURRENT_DATE)`;
        } else if (filterRange === 'custom' && start_date) {
            if (end_date) {
                dateConditionIn = `si.date BETWEEN $${pIdxIn++} AND $${pIdxIn++}`;
                paramsIn.push(start_date, end_date);
                dateConditionOut = `so.date BETWEEN $${pIdxOut++} AND $${pIdxOut++}`;
                paramsOut.push(start_date, end_date);
            } else {
                dateConditionIn = `si.date = $${pIdxIn++}`;
                paramsIn.push(start_date);
                dateConditionOut = `so.date = $${pIdxOut++}`;
                paramsOut.push(start_date);
            }
        }

        // 2. Formulate branch filter
        let branchConditionIn = "1=1";
        let branchConditionOut = "1=1";
        let branchConditionInv = "1=1";
        const invParams = [];

        if (filterBranch !== 'all') {
            const bId = parseInt(filterBranch, 10);
            branchConditionIn = `si.branch_id = $${pIdxIn++}`;
            paramsIn.push(bId);
            branchConditionOut = `so.branch_id = $${pIdxOut++}`;
            paramsOut.push(bId);
            branchConditionInv = `bi.branch_id = $1`;
            invParams.push(bId);
        }

        // 3. Total active SKUs
        const totalProductsRes = await db.query('SELECT COUNT(id) AS count FROM products WHERE is_deleted = 0');
        const totalProductsIndexed = parseInt(totalProductsRes.rows[0]?.count || 0, 10);

        // 4. Branches list
        const branchesRes = await db.query('SELECT id, name FROM branches ORDER BY name ASC');
        const branchesList = branchesRes.rows;

        // 5. Query Stock In records (ordered ASC for FIFO queue building)
        const stockInQuery = `
            SELECT si.id, si.date, si.branch_id, si.product_id, si.quantity, si.purchase_price,
                   p.name AS product_name, p.brand, p.type, u.symbol, b.name AS branch_name
            FROM stock_in si
            JOIN products p ON si.product_id = p.id
            LEFT JOIN units u ON p.unit_id = u.id
            JOIN branches b ON si.branch_id = b.id
            WHERE ${dateConditionIn} AND ${branchConditionIn}
            ORDER BY si.date ASC, si.id ASC
        `;
        const stockInRes = await db.query(stockInQuery, paramsIn);

        // 6. Query Stock Out records (ordered ASC for FIFO queue draining)
        const stockOutQuery = `
            SELECT so.id AS stock_out_id, so.date, so.branch_id, so.product_id, so.quantity, so.sold_price,
                   p.name AS product_name, p.brand, p.type, u.symbol, b.name AS branch_name
            FROM stock_out so
            JOIN products p ON so.product_id = p.id
            LEFT JOIN units u ON p.unit_id = u.id
            JOIN branches b ON so.branch_id = b.id
            WHERE ${dateConditionOut} AND ${branchConditionOut}
            ORDER BY so.date ASC, so.id ASC
        `;
        const stockOutRes = await db.query(stockOutQuery, paramsOut);

        // 7. FIFO ENGINE & METRICS CALCULATION
        const fifoQueues = {};
        let totalPurchaseCost = 0;
        const branchMetrics = {};
        const trendData = {};

        branchesList.forEach(br => {
            branchMetrics[br.id] = {
                id: br.id,
                name: br.name,
                revenue: 0,
                purchase_cost: 0,
                cogs: 0,
                products: {}
            };
        });

        const inboundRecords = [];
        stockInRes.rows.forEach(row => {
            const purchaseTotal = parseFloat(row.purchase_price);
            totalPurchaseCost += purchaseTotal;

            const prodKey = `${row.brand} ${row.product_name}`;
            const qtyIn = parseFloat(row.quantity);
            const unitCost = qtyIn > 0 ? (purchaseTotal / qtyIn) : 0;

            if (branchMetrics[row.branch_id]) {
                branchMetrics[row.branch_id].purchase_cost += purchaseTotal;

                if (!branchMetrics[row.branch_id].products[prodKey]) {
                    branchMetrics[row.branch_id].products[prodKey] = {
                        name: row.product_name,
                        brand: row.brand,
                        type: row.type,
                        symbol: row.symbol,
                        qty_sold: 0,
                        total_revenue: 0,
                        total_cogs: 0,
                        total_purchase_cost: 0
                    };
                }
                branchMetrics[row.branch_id].products[prodKey].total_purchase_cost += purchaseTotal;
            }

            if (!fifoQueues[prodKey]) {
                fifoQueues[prodKey] = [];
            }
            fifoQueues[prodKey].push({
                qty: qtyIn,
                unit_cost: unitCost
            });

            inboundRecords.push(row);
        });

        let totalRevenue = 0;
        let totalCogs = 0;
        const outboundRecords = [];

        stockOutRes.rows.forEach(row => {
            const saleRevenue = parseFloat(row.sold_price);
            totalRevenue += saleRevenue;

            const prodKey = `${row.brand} ${row.product_name}`;
            const qtySold = parseFloat(row.quantity);
            let calculatedCogs = 0;

            if (branchMetrics[row.branch_id]) {
                branchMetrics[row.branch_id].revenue += saleRevenue;

                if (!branchMetrics[row.branch_id].products[prodKey]) {
                    branchMetrics[row.branch_id].products[prodKey] = {
                        name: row.product_name,
                        brand: row.brand,
                        type: row.type,
                        symbol: row.symbol,
                        qty_sold: 0,
                        total_revenue: 0,
                        total_cogs: 0,
                        total_purchase_cost: 0
                    };
                }
                branchMetrics[row.branch_id].products[prodKey].qty_sold += qtySold;
                branchMetrics[row.branch_id].products[prodKey].total_revenue += saleRevenue;
            }

            // Drain FIFO batches
            if (fifoQueues[prodKey] && fifoQueues[prodKey].length > 0) {
                let remainingToDeduct = qtySold;
                while (remainingToDeduct > 0 && fifoQueues[prodKey].length > 0) {
                    const currentBatch = fifoQueues[prodKey][0];
                    if (currentBatch.qty <= remainingToDeduct) {
                        calculatedCogs += currentBatch.qty * currentBatch.unit_cost;
                        remainingToDeduct -= currentBatch.qty;
                        fifoQueues[prodKey].shift();
                    } else {
                        calculatedCogs += remainingToDeduct * currentBatch.unit_cost;
                        currentBatch.qty -= remainingToDeduct;
                        remainingToDeduct = 0;
                    }
                }
            }

            totalCogs += calculatedCogs;
            if (branchMetrics[row.branch_id]) {
                branchMetrics[row.branch_id].cogs += calculatedCogs;
                branchMetrics[row.branch_id].products[prodKey].total_cogs += calculatedCogs;
            }

            // Trend chart points
            const dateStr = row.date.toISOString ? row.date.toISOString().split('T')[0] : String(row.date);
            trendData[dateStr] = (trendData[dateStr] || 0) + saleRevenue;

            outboundRecords.push(row);
        });

        // Compute on-hand valuation from remaining FIFO batches
        let onHandAssetValuation = 0;
        Object.values(fifoQueues).forEach(batches => {
            batches.forEach(b => {
                onHandAssetValuation += b.qty * b.unit_cost;
            });
        });

        const netRealizedProfit = totalRevenue - totalCogs;

        // 8. Low Stock Items (based on product min_stock_alert)
        const lowStockQuery = `
            SELECT b.name AS branch_name, p.name AS product_name, p.brand, bi.quantity, u.symbol,
                   COALESCE(p.min_stock_alert, 5)::numeric(12, 2) AS min_stock_alert
            FROM branch_inventory bi
            JOIN products p ON bi.product_id = p.id
            LEFT JOIN units u ON p.unit_id = u.id
            JOIN branches b ON bi.branch_id = b.id
            WHERE bi.quantity <= COALESCE(p.min_stock_alert, 5) AND p.is_deleted = 0 AND ${branchConditionInv}
            ORDER BY b.name, p.name
        `;
        const lowStockRes = await db.query(lowStockQuery, invParams);

        // 9. Remaining Product Stock Inventory table
        const remainingStockQuery = `
            SELECT p.id AS product_id, p.name AS product_name, p.brand, p.type, u.symbol, b.name AS branch_name, bi.quantity,
                   COALESCE(p.min_stock_alert, 5)::numeric(12, 2) AS min_stock_alert
            FROM branch_inventory bi
            JOIN products p ON bi.product_id = p.id
            LEFT JOIN units u ON p.unit_id = u.id
            JOIN branches b ON bi.branch_id = b.id
            WHERE p.is_deleted = 0 AND ${branchConditionInv}
            ORDER BY b.name ASC, p.brand ASC, p.name ASC
        `;
        const remainingStockRes = await db.query(remainingStockQuery, invParams);

        return res.json({
            success: true,
            filters: {
                branch: filterBranch,
                range: filterRange,
                startDate: start_date,
                endDate: end_date
            },
            kpis: {
                totalProductsIndexed,
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                totalPurchaseCost: parseFloat(totalPurchaseCost.toFixed(2)),
                onHandAssetValuation: parseFloat(onHandAssetValuation.toFixed(2)),
                netRealizedProfit: parseFloat(netRealizedProfit.toFixed(2)),
                totalCogs: parseFloat(totalCogs.toFixed(2))
            },
            branchMetrics: branchMetrics,
            salesTrend: trendData,
            trendData: trendData,
            inboundLedger: inboundRecords.reverse(),
            outboundLedger: outboundRecords.reverse(),
            lowStockAlerts: lowStockRes.rows,
            remainingInventory: remainingStockRes.rows,
            onHandInventory: remainingStockRes.rows,
            branches: branchesList,
            availableBranches: branchesList
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Purchasing Manifest Compiler Data
 */
async function getPurchasingManifestData(req, res, next) {
    try {
        // Products
        const productsRes = await db.query('SELECT id, name, brand FROM products WHERE is_deleted = 0 ORDER BY brand ASC, name ASC');

        // Branches
        const branchesRes = await db.query('SELECT id, name FROM branches ORDER BY name ASC');

        // Low stock items (based on min_stock_alert)
        const lowStockQuery = `
            SELECT bi.branch_id, bi.product_id, bi.quantity AS current_stock,
                   b.name AS branch_name, p.name AS product_name, p.brand, u.symbol,
                   COALESCE(p.min_stock_alert, 5)::numeric(12, 2) AS min_stock_alert
            FROM branch_inventory bi
            JOIN branches b ON b.id = bi.branch_id
            JOIN products p ON p.id = bi.product_id
            LEFT JOIN units u ON u.id = p.unit_id
            WHERE bi.quantity <= COALESCE(p.min_stock_alert, 5) AND p.is_deleted = 0
            ORDER BY b.name ASC, p.name ASC
        `;
        const lowStockRes = await db.query(lowStockQuery);

        return res.json({
            success: true,
            products: productsRes.rows,
            branches: branchesRes.rows,
            lowStockItems: lowStockRes.rows
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getExecutiveReports,
    getPurchasingManifestData
};
