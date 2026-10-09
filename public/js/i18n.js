/**
 * StockMatrix - Unified Bilingual Internationalization (i18n) Engine
 * Supports English (en) and Amharic (am / አማርኛ)
 */

const STORAGE_LANG_KEY = 'stockmatrix_language';

const translations = {
    en: {
        // App Header & Branding
        'brand.name': 'StockMatrix',
        'brand.tagline': 'Unified Inventory & Operations Engine',
        'header.user_greeting': 'Hi,',
        'header.password': 'Password',
        'header.password_tooltip': 'Click to Change Password',
        'header.logout': 'Logout',
        'header.logout_tooltip': 'Sign Out',
        'header.theme_toggle': 'Toggle Dark/Light Mode',
        'header.lang_toggle': 'Switch Language (ቋንቋ ቀይር)',

        // Navigation Menus
        'nav.dashboard': 'Dashboard',
        'nav.products': 'Products',
        'nav.stock_in': 'Stock In',
        'nav.stock_out': 'Stock Out',
        'nav.purchasing': 'Purchasing',
        'nav.reports': 'Reports',
        'nav.branches': 'Branches',
        'nav.accounts': 'Accounts',

        // Roles
        'role.admin': 'ADMIN',
        'role.manager': 'MANAGER',
        'role.staff': 'STAFF',
        'role.admin_desc': 'Full System Access & Control',
        'role.manager_desc': 'Inventory, Analytics & Purchasing',
        'role.staff_desc': 'Stock In & Sales Dispatch Operations',

        // Categories
        'cat.electronics': 'Electronics Matrix',
        'cat.construction': 'Construction Supply',
        'cat.mobile_repair': 'Mobile Repair & Electronics',

        // Dashboard View
        'dash.title': 'Operational Hub Overview',
        'dash.subtitle': 'Live system telemetry, key financial metrics, and active warehouse balances.',
        'dash.branch_filter_all': '🌐 All Facility Branches',
        'dash.kpi_valuation': 'Total Inventory Valuation',
        'dash.kpi_valuation_hint': 'Current shelf value based on FIFO purchase lots',
        'dash.kpi_skus': 'Active SKU Profiles',
        'dash.kpi_skus_hint': 'Distinct catalog products in database',
        'dash.kpi_low_stock': 'Low Stock Warnings',
        'dash.kpi_low_stock_hint': 'Items below threshold at active facilities',
        'dash.kpi_profit': 'Net Operating Profit',
        'dash.kpi_profit_hint': 'Sales revenue minus cost of goods sold',
        'dash.chart_title': 'Inbound vs. Outbound Velocity',
        'dash.chart_subtitle': 'Real-time 6-month aggregate throughput',
        'dash.chart_inbound': 'Stock In (Intake)',
        'dash.chart_outbound': 'Stock Out (Dispatched)',
        'dash.recent_title': '⚡ Live Operational Activity Feed',
        'dash.recent_subtitle': 'Chronological audit trail of inventory deliveries and sales transactions',
        'dash.low_stock_title': '⚠️ Critical Low Stock Monitor',
        'dash.low_stock_subtitle': 'Branches with inventory balances below safety threshold',
        'dash.empty_recent': 'No recent inventory activity recorded yet.',
        'dash.empty_low_stock': '✅ All facility branch inventories are within safe operating capacity.',
        'dash.volume_balance': 'Volume Balance',
        'dash.today_revenue': "Today's Realized Revenue",
        'dash.open_hub': 'Open Branch Control Hub',
        'dash.lines_count': 'lines',
        'dash.units_count': 'units',

        // Common Table Headers
        'table.id': 'ID',
        'table.brand': 'Brand',
        'table.product': 'Product Name',
        'table.category': 'Category',
        'table.stock': 'Stock Level',
        'table.unit': 'Unit',
        'table.color': 'Color',
        'table.actions': 'Actions',
        'table.branch': 'Branch',
        'table.quantity': 'Quantity',
        'table.price': 'Price / Cost',
        'table.date': 'Date',
        'table.type': 'Description / Notes',
        'table.status': 'Status',
        'table.username': 'Username',
        'table.email': 'Email Address',
        'table.role': 'Role',
        'table.branches': 'Assigned Branches',
        'table.created': 'Date Created',

        // Common Buttons & Actions
        'action.save': 'Save',
        'action.cancel': 'Cancel',
        'action.close': 'Close',
        'action.edit': 'Edit',
        'action.delete': 'Delete',
        'action.add': 'Add New',
        'action.filter': 'Filter',
        'action.reset': 'Reset',
        'action.search': 'Search',
        'action.submit': 'Submit',
        'action.print': 'Print',
        'action.export_pdf': 'Export PDF',
        'action.export_excel': 'Export Excel',
        'action.save_draft': 'Save Draft',
        'action.reset_cart': 'Reset Cart',
        'action.add_to_cart': 'Add to Cart',
        'action.view_only': 'View Only',
        'action.apply': 'Apply Adjustments',

        // Products View
        'prod.title': 'Product Catalog',
        'prod.subtitle': 'Manage your product profiles, categories, brands, colors, and threshold alert levels.',
        'prod.add_btn': 'Add Product',
        'prod.archive_btn': 'Inactive / Deleted Products',
        'prod.search_name_placeholder': 'Search by name...',
        'prod.search_brand_placeholder': 'Search brand...',
        'prod.filter_all_types': 'All Categories',
        'prod.filter_type_1': 'Electronics Matrix',
        'prod.filter_type_2': 'Construction Supply',
        'prod.filter_all_units': 'All Units',
        'prod.reset_filters': 'Reset',
        'prod.empty_state': 'No product profiles found matching active search criteria.',

        // Stock In View
        'stockin.title': 'Stock In / Receiving Logistics',
        'stockin.subtitle': 'Log incoming purchases, multi-unit conversions, and batch inventory replenishments.',
        'stockin.record_btn': 'Record Inbound Shipment',
        'stockin.history_title': 'Inbound Deliveries',
        'stockin.history_subtitle': 'Historical ledger of verified warehouse shipments',
        'stockin.target_branch': 'Destination Branch Facility',
        'stockin.select_product': 'Search and Choose Product',
        'stockin.qty_received': 'Quantity Received',
        'stockin.batch_cost': 'Total Batch Cost Paid ($)',
        'stockin.unit_select': 'Counting Unit',
        'stockin.conversion_box_title': 'Packaging Conversion (Base Unit Multiplier)',
        'stockin.conversion_hint': 'Enter how many base units are contained in 1 selected package unit.',
        'stockin.delivery_date': 'Arrival Date',
        'stockin.btn_submit': 'Confirm & Receive Items',
        'stockin.th_stock_on_hand': 'Stock on Hand',

        // Stock Out View
        'stockout.title': 'Stock Out / Sales Dispatch',
        'stockout.subtitle': 'Process sales transactions and drain inventory using strict First-In First-Out (FIFO) allocation.',
        'stockout.record_btn': 'Record Sale / Dispatch',
        'stockout.history_title': 'Outbound Dispatches',
        'stockout.history_subtitle': 'Chronological record of verified customer sales transactions',
        'stockout.branch': 'Dispatching Branch Facility',
        'stockout.select_product': 'Search and Choose Product',
        'stockout.qty_dispatched': 'Number of Items',
        'stockout.sold_price': 'Total Money Received ($)',
        'stockout.btn_submit': 'Execute FIFO Sale Dispatch',
        'stockout.th_available_stock': 'Available Stock',
        'stockout.available_suffix': 'available',

        // Stock Helpers & Dual Units
        'stock.sck': 'sck',
        'stock.qtl': 'qtl',
        'stock.rolls': 'rolls',
        'stock.roll': 'roll',
        'stock.bkt': 'bkt',
        'stock.no_products_branch': 'No matching products in this branch category',
        'stock.no_live_inventory': 'No live inventory records in this facility.',
        'stock.no_live_shelf': 'No live inventory on shelves in this branch facility.',
        'general.default': 'Default',

        // Purchasing View
        'purchasing.title': 'Purchasing Requisition & Order Sheet',
        'purchasing.subtitle': 'Compile custom line items or auto-scan low stock alerts into a consolidated, print-ready A4 manifest sheet.',
        'purchasing.scanner_title': '⚠️ Low Stock Alerts (Threshold Scan)',
        'purchasing.scanner_subtitle': 'Branch items requiring replenishment (below minimum threshold)',
        'purchasing.form_title': 'Add Custom Product Line',
        'purchasing.destinations': 'Target Destination Branches',
        'purchasing.order_qty': 'Order Quantity',
        'purchasing.color_spec': 'Color / Spec',
        'purchasing.notes': 'Logistics / Supplier Notes',
        'purchasing.manifest_title': 'Active Purchasing Cart & Requisition Sheet',
        'purchasing.save_draft_btn': '💾 Save Draft',
        'purchasing.reset_cart_btn': '🗑️ Reset Cart',
        'purchasing.print_btn': '🖨️ Print / PDF Order Sheet',
        'purchasing.empty_cart': 'Your purchasing cart is empty. Add low-stock items from the scanner or select products manually.',

        // Damaged Goods
        'damaged.btn_register': '⚠️ Register Damaged / Lost Items',
        'damaged.title': '⚠️ Damaged / Lost Items',
        'damaged.subtitle': 'Goods written off due to breaks, expiration, or loss',
        'damaged.reason': 'Damage / Loss Reason',
        'damaged.notes': 'Additional Notes / Incident Details (Optional)',
        'damaged.date': 'Incident Date',
        'damaged.submit': '⚠️ Deduct from Shelf Stock',

        // Reports View
        'reports.title': 'Business Reports & Insights',
        'reports.subtitle': 'Track your sales, stock purchases, profits, damaged goods, and inventory at a glance.',
        'reports.toggle_charts': 'Toggle Charts',
        'reports.summary_excel': 'Summary Excel',
        'reports.stock_excel': 'Stock Excel',
        'reports.damaged_excel': 'Damaged Excel',
        'reports.print_report': 'Print Report',
        'reports.guide_title': '💡 How these report numbers work (Simple Guide)',
        'reports.guide_rev': 'Total Sales Revenue: Total cash collected from customer sales in this period.',
        'reports.guide_purch': 'Total Purchases: Total money spent buying new stock from suppliers in this period.',
        'reports.guide_profit': 'Net Profit: Actual profit earned (Sales Revenue minus Cost of Items Sold).',
        'reports.guide_stock_val': 'Current Stock Value: The estimated value of products currently sitting on your shelves.',
        'reports.guide_damaged': 'Damaged / Lost Stock: Goods written off due to breaks, expiry, or loss, with estimated loss cost.',
        'reports.branch_label': 'Branch Location',
        'reports.all_branches': 'All Branches Combined',
        'reports.time_period': 'Time Period',
        'reports.period_today': 'Today',
        'reports.period_weekly': 'This Week',
        'reports.period_monthly': 'This Month',
        'reports.period_yearly': 'This Year',
        'reports.period_custom': 'Custom Date Range',
        'reports.start_date': 'Start Date',
        'reports.end_date': 'End Date (Optional)',
        'reports.filter_btn': 'Filter Report',
        'reports.kpi_products': '📦 Total Products',
        'reports.kpi_sales': '💵 Total Sales Revenue',
        'reports.kpi_purchases': '🛒 Total Purchases',
        'reports.kpi_profit': '💰 Net Profit Earned',
        'reports.kpi_stock_value': '🏬 Current Stock Value',
        'reports.kpi_damaged': '⚠️ Damaged / Lost Stock',
        'reports.chart_financial': 'Financial Summary (Sales vs Cost vs Profit)',
        'reports.chart_daily': 'Daily Sales Trend',
        'reports.branch_summary_title': 'Branch Sales & Profit Summary',
        'reports.perf_breakdown': 'Performance Breakdown',
        'reports.th_branch_prod': 'Branch / Product',
        'reports.th_units_sold': 'Units Sold',
        'reports.th_total_sales': 'Total Sales',
        'reports.th_cogs': 'Cost of Items Sold',
        'reports.th_net_profit': 'Net Profit',
        'reports.damaged_title': 'Damaged & Lost Products Report',
        'reports.th_qty_lost': 'Quantity Lost',
        'reports.th_incident': 'Reason / Incident Details',
        'reports.th_reported_by': 'Reported By',
        'reports.th_est_loss': 'Estimated Loss',
        'reports.stock_in_history': '📥 Stock In History (Purchases)',
        'reports.stock_out_history': '📤 Stock Out History (Sales)',
        'reports.remaining_title': '🏬 Current Stock on Shelves',
        'reports.th_remaining_stock': 'Remaining Stock',
        'reports.th_stock_status': 'Stock Status',

        // Branches View
        'branches.title': 'Branch Management',
        'branches.subtitle': 'Add, view, and manage your warehouse and store branch locations.',
        'branches.add_btn': 'Add New Branch',
        'branches.table_name': 'Branch Name',
        'branches.table_category': 'Category',
        'branches.table_location': 'Location',
        'branches.table_items': 'Items In Stock',

        // Accounts View
        'accounts.title': 'User Accounts',
        'accounts.subtitle': 'Create and manage user accounts, assign roles, and set branch access permissions.',
        'accounts.add_btn': 'Add New Account',
        'accounts.permissions_title': '🛡️ Role Navigation & Menu Permissions',
        'accounts.permissions_subtitle': 'Configure which system modules and navigation menus are visible and accessible for each role.',
        'accounts.th_menu': 'Menu / Module',
        'accounts.reset_pass_btn': 'Password',

        // Modals
        'modal.prod_add_title': 'Add Product',
        'modal.prod_edit_title': 'Edit Product',
        'modal.prod_name': 'Product Name',
        'modal.prod_brand': 'Brand / Manufacturer',
        'modal.prod_unit': 'Unit of Measure',
        'modal.prod_desc': 'Description (Optional)',
        'modal.prod_color': 'Color (Optional)',
        'modal.prod_threshold': 'Low Stock Alert Threshold (in Base Units)',
        'modal.prod_threshold_hint': 'Trigger low stock warnings and purchasing manifests when branch stock drops below this value.',
        'modal.archive_title': 'Inactive / Deleted Products',
        'modal.archive_subtitle': 'Below are deleted or hidden products. You can restore them to active stock at any time.',
        'modal.branch_add_title': 'Add New Branch',
        'modal.branch_edit_title': 'Edit Branch',
        'modal.branch_name': 'Branch / Warehouse Name',
        'modal.branch_spec': 'Branch Category / Specialization',
        'modal.branch_location': 'Location / Address',
        'modal.acc_add_title': 'Add New Account',
        'modal.acc_edit_title': 'Edit User Account',
        'modal.acc_username': 'Username',
        'modal.acc_email': 'Email Address (Optional)',
        'modal.acc_pass': 'Account Password',
        'modal.acc_pass_help': 'Leave blank to keep existing password.',
        'modal.acc_role': 'Account Role',
        'modal.acc_branches': 'Assigned Branches',
        'modal.stockin_edit_title': 'Modify Inbound Delivery Batch',
        'modal.stockout_edit_title': 'Modify Outbound Sales Transaction',
        'modal.change_pass_title': '🔑 Change Your Password',
        'modal.change_pass_subtitle': 'Ensure your account remains secure by choosing a strong password (at least 6 characters).',
        'modal.old_pass': 'Current Password',
        'modal.new_pass': 'New Password',
        'modal.confirm_pass': 'Confirm New Password',
        'modal.pass_min_chars': 'Minimum 6 characters.',
        'modal.admin_reset_title': '🔑 Admin Reset User Password',
        'modal.admin_reset_hint': 'As an administrator, you can directly set or reset this account\'s password without knowing their old password.',

        // Login Page
        'login.heading': 'StockMatrix Engine',
        'login.subheading': 'Unified Enterprise Inventory & Logistics Hub',
        'login.username_label': 'Username',
        'login.username_placeholder': 'Enter username',
        'login.password_label': 'Password',
        'login.password_placeholder': '••••••••',
        'login.submit_btn': 'Sign In to System',
        'login.quick_roles': 'Quick Sign-In (Preloaded Test Roles)',
        'login.verifying': 'Verifying credentials...',
        'login.network_error': 'Network or server error. Please ensure the backend server is running.',

        // Messages & Toasts
        'msg.success': 'Operation completed successfully.',
        'msg.error': 'An error occurred.',
        'msg.cart_saved': '💾 Purchasing cart draft saved to local browser cache!',
        'msg.cart_cleared': 'Purchasing cart cleared and draft reset.',
        'msg.pass_updated': 'Password was changed successfully!',
        'msg.pass_mismatch': 'New password and confirmation password do not match.',
        'msg.pass_short': 'Password must be at least 6 characters long.'
    },
    am: {
        // App Header & Branding
        'brand.name': 'ስቶክማትሪክስ',
        'brand.tagline': 'የተቀናጀ የክምችት እና የንግድ አስተዳደር ሲስተም',
        'header.user_greeting': 'ሰላም፣',
        'header.password': 'የይለፍ ቃል',
        'header.password_tooltip': 'የይለፍ ቃልዎን ለመቀየር ይጫኑ',
        'header.logout': 'ውጣ',
        'header.logout_tooltip': 'ከሲስተሙ ውጣ',
        'header.theme_toggle': 'ገጽታ ቀይር (ጨለማ/ብርሃን)',
        'header.lang_toggle': 'Switch Language (ቋንቋ ቀይር)',

        // Navigation Menus
        'nav.dashboard': 'ዳሽቦርድ',
        'nav.products': 'ምርቶች',
        'nav.stock_in': 'ዕቃ ማስገቢያ',
        'nav.stock_out': 'ዕቃ ማውጫ',
        'nav.purchasing': 'ግዢ / ማዘዣ',
        'nav.reports': 'ሪፖርቶች',
        'nav.branches': 'ቅርንጫፎች',
        'nav.accounts': 'የተጠቃሚ መለያዎች',

        // Roles
        'role.admin': 'አስተዳዳሪ (ADMIN)',
        'role.manager': 'ስራ አስኪያጅ (MANAGER)',
        'role.staff': 'ሰራተኛ (STAFF)',
        'role.admin_desc': 'ሙሉ የሲስተም ፈቃድና ቁጥጥር',
        'role.manager_desc': 'የክምችት፣ የሪፖርት እና የግዢ አስተዳደር',
        'role.staff_desc': 'ዕቃ የማስገባት እና የመሸጥ ስራዎች',

        // Categories
        'cat.electronics': 'ኤሌክትሮኒክስ እና መለዋወጫ',
        'cat.construction': 'የግንባታ እቃዎች',
        'cat.mobile_repair': 'የሞባይል ጥገና እና ኤሌክትሮኒክስ',

        // Dashboard View
        'dash.title': 'የክምችት እና ንግድ ዋና ዳሽቦርድ',
        'dash.subtitle': 'የቀጥታ ስራዎች ክትትል፣ ቁልፍ የፋይናንስ መረጃዎች እና የመጋዘን የክምችት ሁኔታ።',
        'dash.branch_filter_all': '🌐 ሁሉም ቅርንጫፎች',
        'dash.kpi_valuation': 'ጠቅላላ የክምችት ዋጋ',
        'dash.kpi_valuation_hint': 'በመጋዘን ውስጥ ያሉ ዕቃዎች ጠቅላላ የወጣባቸው ወጪ',
        'dash.kpi_skus': 'የተመዘገቡ ምርቶች ብዛት',
        'dash.kpi_skus_hint': 'በሲስተሙ የተመዘገቡ ልዩ ልዩ ምርቶች ብዛት',
        'dash.kpi_low_stock': 'የአነስተኛ ክምችት ማስጠንቀቂያ',
        'dash.kpi_low_stock_hint': 'ከማስጠንቀቂያ ጣሪያ በታች የሆኑ ዕቃዎች ብዛት',
        'dash.kpi_profit': 'የተጣራ የንግድ ትርፍ',
        'dash.kpi_profit_hint': 'የሽያጭ ገቢ ሲቀነስ የተሸጡ ዕቃዎች የግዢ ወጪ (COGS)',
        'dash.chart_title': 'የዕቃ ግቢ እና ወጪ ንጽጽር',
        'dash.chart_subtitle': 'የባለፉት 6 ወራት አጠቃላይ የዕቃዎች እንቅስቃሴ',
        'dash.chart_inbound': 'የገቡ ዕቃዎች (ግቢ)',
        'dash.chart_outbound': 'የተሸጡ/የወጡ ዕቃዎች',
        'dash.recent_title': '⚡ የቀጥታ የቅርብ ጊዜ እንቅስቃሴዎች',
        'dash.recent_subtitle': 'የዕቃ ማስገቢያ እና ሽያጭ የጊዜ ቅደም ተከተል ታሪክ',
        'dash.low_stock_title': '⚠️ የአነስተኛ ክምችት ማስጠንቀቂያዎች ሰንጠረዥ',
        'dash.low_stock_subtitle': 'የክምችት መጠናቸው ያነሱና ማዘዣ የሚያስፈልጋቸው ቅርንጫፎች',
        'dash.empty_recent': 'እስካሁን ምንም የተመዘገበ እንቅስቃሴ የለም።',
        'dash.empty_low_stock': '✅ በሁሉም ቅርንጫፎች በቂ ክምችት ይገኛል።',
        'dash.volume_balance': 'ጠቅላላ የክምችት መጠን',
        'dash.today_revenue': 'የዛሬ የተገኘ ገቢ',
        'dash.open_hub': 'የቅርንጫፍ መቆጣጠሪያ ክፈት',
        'dash.lines_count': 'ምርቶች',
        'dash.units_count': 'ፍሬ/መለኪያ',

        // Common Table Headers
        'table.id': 'መለያ ቁጥር',
        'table.brand': 'ብራንድ / አምራች',
        'table.product': 'የምርት ስም',
        'table.category': 'ምድብ',
        'table.stock': 'የክምችት መጠን',
        'table.unit': 'መለኪያ',
        'table.color': 'ቀለም',
        'table.actions': 'እርምጃዎች',
        'table.branch': 'ቅርንጫፍ',
        'table.quantity': 'መጠን',
        'table.price': 'ዋጋ / ወጪ',
        'table.date': 'ቀን',
        'table.type': 'ዝርዝር / ማስታወሻ',
        'table.status': 'ሁኔታ',
        'table.username': 'የተጠቃሚ ስም',
        'table.email': 'ኢሜይል አድራሻ',
        'table.role': 'ሚና',
        'table.branches': 'የተመደቡ ቅርንጫፎች',
        'table.created': 'የተፈጠረበት ቀን',

        // Common Buttons & Actions
        'action.save': 'አስቀምጥ',
        'action.cancel': 'ሰርዝ',
        'action.close': 'ዝጋ',
        'action.edit': 'አስተካክል',
        'action.delete': 'አስወግድ',
        'action.add': 'አዲስ መዝግብ',
        'action.filter': 'አጣራ',
        'action.reset': 'አድስ',
        'action.search': 'ፈልግ',
        'action.submit': 'አረጋግጥ',
        'action.print': 'አትም',
        'action.export_pdf': 'በPDF አውርድ',
        'action.export_excel': 'በExcel አውርድ',
        'action.save_draft': 'ረቂቅ አስቀምጥ',
        'action.reset_cart': 'ሁሉንም አፅዳ',
        'action.add_to_cart': 'ወደ ቅርጫት ጨምር',
        'action.view_only': 'ለዕይታ ብቻ',
        'action.apply': 'ማስተካከያ ተግብር',

        // Products View
        'prod.title': 'የምርት ዝርዝር እና ካታሎግ',
        'prod.subtitle': 'የምርት መገለጫዎችን፣ ምድቦችን፣ ብራንዶችን፣ ቀለሞችን እና የአነስተኛ ክምችት ገደቦችን ያስተዳድሩ።',
        'prod.add_btn': 'አዲስ ምርት መዝግብ',
        'prod.archive_btn': 'የተሰረዙ/የቦዘኑ ምርቶች',
        'prod.search_name_placeholder': 'በምርት ስም ፈልግ...',
        'prod.search_brand_placeholder': 'በብራንድ/አምራች አጣራ...',
        'prod.filter_all_types': 'ሁሉም ምድቦች',
        'prod.filter_type_1': 'ኤሌክትሮኒክስ እና መለዋወጫ',
        'prod.filter_type_2': 'የግንባታ እቃዎች',
        'prod.filter_all_units': 'ሁሉም መለኪያዎች',
        'prod.reset_filters': 'ማጣሪያውን አፅዳ',
        'prod.empty_state': 'የተፈለገውን መስፈርት የሚያሟላ ምንም ምርት አልተገኘም።',

        // Stock In View
        'stockin.title': 'ዕቃ ማስገቢያ (ግቢ ርክክብ)',
        'stockin.subtitle': 'የገቡ ዕቃዎችን፣ የግዢ ወጪዎችን እና የጥቅል መለኪያ መቀየሪያዎችን መዝግብ።',
        'stockin.record_btn': 'አዲስ ገቢ ዕቃ መዝግብ',
        'stockin.history_title': 'የገቡ ዕቃዎች ታሪክ ሰንጠረዥ',
        'stockin.history_subtitle': 'የተረጋገጡ የመጋዘን ገቢ ርክክቦች ታሪክ',
        'stockin.target_branch': 'ተቀባይ መጋዘን / ቅርንጫፍ',
        'stockin.select_product': 'የሚገባውን ምርት ይፈልጉ እና ይምረጡ',
        'stockin.qty_received': 'የገባው መጠን',
        'stockin.batch_cost': 'ጠቅላላ የግዢ ዋጋ ($)',
        'stockin.unit_select': 'የጥቅል / መለኪያ አይነት',
        'stockin.conversion_box_title': 'የጥቅል መለኪያ ማባዣ (ወደ መነሻ መለኪያ መቀየሪያ)',
        'stockin.conversion_hint': 'በአንድ የተመረጠ ጥቅል ውስጥ ስንት መነሻ መለኪያ እንዳለ ያስገቡ።',
        'stockin.delivery_date': 'የገባበት ቀን',
        'stockin.btn_submit': '📥 ገቢ ዕቃ መዝግብ',
        'stockin.th_stock_on_hand': 'በመጋዘን ያለ ክምችት',

        // Stock Out View
        'stockout.title': 'ዕቃ ማውጫ (ሽያጭ እና ስርጭት)',
        'stockout.subtitle': 'የሽያጭ ትዕዛዞችን ያከናውኑ እና የቀደመ ገቢ የቀደመ ወጪ (FIFO) ትርፍን በቅጽበት አስሉ።',
        'stockout.record_btn': 'አዲስ ሽያጭ መዝግብ',
        'stockout.history_title': 'የተሸጡ ዕቃዎች ታሪክ ሰንጠረዥ',
        'stockout.history_subtitle': 'የተረጋገጡ የደንበኞች ሽያጭ እና ስርጭት ታሪክ',
        'stockout.branch': 'አከፋፋይ ቅርንጫፍ',
        'stockout.select_product': 'የሚሸጠውን ምርት ይፈልጉ እና ይምረጡ',
        'stockout.qty_dispatched': 'የተሸጠው መጠን',
        'stockout.sold_price': 'ጠቅላላ የተሸጠበት ዋጋ ($)',
        'stockout.btn_submit': '📤 ሽያጭ መዝግብ እና ዕቃ አስወጣ',
        'stockout.th_available_stock': 'ለመሸጥ ዝግጁ ክምችት',
        'stockout.available_suffix': 'ዝግጁ',

        // Stock Helpers & Dual Units
        'stock.sck': 'ጆንያ',
        'stock.qtl': 'ኩንታል',
        'stock.rolls': 'ጥቅል',
        'stock.roll': 'ጥቅል',
        'stock.bkt': 'ባልዲ',
        'stock.no_products_branch': 'በዚህ ቅርንጫፍ ምድብ ውስጥ የሚዛመድ ምርት አልተገኘም',
        'stock.no_live_inventory': 'በዚህ መጋዘን ውስጥ የተመዘገበ የክምችት መረጃ የለም።',
        'stock.no_live_shelf': 'በዚህ ቅርንጫፍ መደርደሪያ ላይ ምንም ዝግጁ ክምችት የለም።',
        'general.default': 'መደበኛ',

        // Purchasing View
        'purchasing.title': 'የግዢ ማዘዣ እና እቅድ (Purchasing)',
        'purchasing.subtitle': 'የግዢ ማዘዣዎችን ያዘጋጁ፣ ረቂቆችን ያስቀምጡ እና ለአቅራቢዎች የተጠቃለለ ማዘዣ ያትሙ።',
        'purchasing.scanner_title': '⚠️ የአነስተኛ ክምችት ፈጣን ፈላጊ',
        'purchasing.scanner_subtitle': 'በቅርንጫፎች ውስጥ ያለቁ ወይም ያነሱ እቃዎች ዝርዝር',
        'purchasing.form_title': '➕ እቃ ወደ ግዢ ቅርጫት ጨምር',
        'purchasing.destinations': 'መዳረሻ ቅርንጫፎች (ከአንድ በላይ መምረጥ ይቻላል)',
        'purchasing.order_qty': 'የሚታዘዘው መጠን',
        'purchasing.color_spec': 'ቀለም / ሞዴል / ዝርዝር መረጃ (አማራጭ)',
        'purchasing.notes': 'ለአቅራቢው የሚሰጥ ማስታወሻ (አማራጭ)',
        'purchasing.manifest_title': '📋 የተጠቃለለ የግዢ ማዘዣ ዝርዝር',
        'purchasing.save_draft_btn': '💾 ረቂቅ አስቀምጥ',
        'purchasing.reset_cart_btn': '🗑️ ሁሉንም አፅዳ',
        'purchasing.print_btn': '🖨️ የግዢ ማዘዣውን አትም',
        'purchasing.empty_cart': 'የግዢ ቅርጫትዎ ባዶ ነው። ከላይ ካለው አነስተኛ ክምችት ፈላጊ ወይም በቀጥታ በመምረጥ እቃ ይጨምሩ።',

        // Damaged Goods
        'damaged.btn_register': '⚠️ የተበላሸ / የጠፋ ዕቃ መዝግብ',
        'damaged.title': '⚠️ የተበላሸ / የጠፋ ዕቃ',
        'damaged.subtitle': 'በመሰበር፣ በማለፍ ወይም በመጥፋት የተሰረዙ ዕቃዎች',
        'damaged.reason': 'የጉዳቱ / መጥፋቱ ምክንያት',
        'damaged.notes': 'ተጨማሪ ማብራሪያ / ዝርዝር (አማራጭ)',
        'damaged.date': 'የተከሰተበት ቀን',
        'damaged.submit': '⚠️ ከክምችት ቀንስ',

        // Reports View
        'reports.title': 'የንግድ ሪፖርቶች እና ትንታኔዎች',
        'reports.subtitle': 'የሽያጭ፣ የግዢ፣ የትርፍ፣ የተበላሹ እቃዎች እና የክምችት መረጃዎችን በአንድ ቦታ ይከታተሉ።',
        'reports.toggle_charts': 'ቻርቶችን አሳይ/ደብቅ',
        'reports.summary_excel': 'የማጠቃለያ Excel',
        'reports.stock_excel': 'የክምችት Excel',
        'reports.damaged_excel': 'የተበላሹ ዕቃዎች Excel',
        'reports.print_report': 'ሪፖርት አትም',
        'reports.guide_title': '💡 እነዚህ የሪፖርት ቁጥሮች እንዴት እንደሚሰሩ (ቀላል መመሪያ)',
        'reports.guide_rev': 'ጠቅላላ የሽያጭ ገቢ: በዚህ ጊዜ ውስጥ ከደንበኞች ሽያጭ የተሰበሰበ ጠቅላላ ገንዘብ።',
        'reports.guide_purch': 'ጠቅላላ ግዢዎች: በዚህ ጊዜ ውስጥ አዳዲስ እቃዎችን ከአቅራቢዎች ለመግዛት የወጣ ጠቅላላ ወጪ።',
        'reports.guide_profit': 'የተጣራ ትርፍ: የተገኘው ትክክለኛ ትርፍ (የሽያጭ ገቢ ሲቀነስ የተሸጡ ዕቃዎች የግዢ ወጪ)።',
        'reports.guide_stock_val': 'የቀሪ ክምችት ዋጋ: በመጋዘን ውስጥ በክምችት ላይ የሚገኙ እቃዎች ጠቅላላ የወጣባቸው ዋጋ።',
        'reports.guide_damaged': 'የተበላሸ/የጠፋ ክምችት: በመሰበር፣ በማለፍ ወይም በመጥፋት ምክንያት የተሰረዙ እቃዎች እና የወጣባቸው ኪሳራ።',
        'reports.branch_label': 'የቅርንጫፍ ቦታ',
        'reports.all_branches': 'ሁሉም ቅርንጫፎች ተደምረው',
        'reports.time_period': 'የጊዜ ገደብ',
        'reports.period_today': 'የዛሬ',
        'reports.period_weekly': 'የዚህ ሳምንት',
        'reports.period_monthly': 'የዚህ ወር',
        'reports.period_yearly': 'የዚህ ዓመት',
        'reports.period_custom': 'የተመረጠ የቀን ገደብ',
        'reports.start_date': 'መነሻ ቀን',
        'reports.end_date': 'መድረሻ ቀን (አማራጭ)',
        'reports.filter_btn': 'ሪፖርት አጣራ',
        'reports.kpi_products': '📦 ጠቅላላ ምርቶች',
        'reports.kpi_sales': '💵 ጠቅላላ የሽያጭ ገቢ',
        'reports.kpi_purchases': '🛒 ጠቅላላ የግዢ ወጪ',
        'reports.kpi_profit': '💰 የተገኘ የተጣራ ትርፍ',
        'reports.kpi_stock_value': '🏬 የቀሪ ክምችት ዋጋ',
        'reports.kpi_damaged': '⚠️ የተበላሹ / የጠፉ ዕቃዎች',
        'reports.chart_financial': 'የፋይናንስ ማጠቃለያ (ሽያጭ፣ ወጪ እና ትርፍ)',
        'reports.chart_daily': 'የዕለታዊ ሽያጭ ጉዞ',
        'reports.branch_summary_title': 'የቅርንጫፎች የሽያጭ እና ትርፍ ማጠቃለያ',
        'reports.perf_breakdown': 'የአፈጻጸም ዝርዝር',
        'reports.th_branch_prod': 'ቅርንጫፍ / ምርት',
        'reports.th_units_sold': 'የተሸጡ ብዛት',
        'reports.th_total_sales': 'ጠቅላላ ሽያጭ',
        'reports.th_cogs': 'የተሸጡ ዕቃዎች ወጪ',
        'reports.th_net_profit': 'የተጣራ ትርፍ',
        'reports.damaged_title': 'የተበላሹ እና የጠፉ ምርቶች ሪፖርት',
        'reports.th_qty_lost': 'የጠፋ/የተበላሸ መጠን',
        'reports.th_incident': 'የጉዳቱ ምክንያት / ዝርዝር',
        'reports.th_reported_by': 'ሪፖርት ያደረገው',
        'reports.th_est_loss': 'የኪሳራ ግምት',
        'reports.stock_in_history': '📥 የገቡ ዕቃዎች ታሪክ (ግዢዎች)',
        'reports.stock_out_history': '📤 የወጡ ዕቃዎች ታሪክ (ሽያጭ)',
        'reports.remaining_title': '🏬 በመጋዘን ውስጥ ያለ ቀሪ ክምችት',
        'reports.th_remaining_stock': 'ቀሪ የክምችት መጠን',
        'reports.th_stock_status': 'የክምችት ሁኔታ',

        // Branches View
        'branches.title': 'የቅርንጫፎች አስተዳደር',
        'branches.subtitle': 'የመጋዘን እና የሱቅ ቅርንጫፎችን ይመዝግቡ፣ ይመልከቱ እና ያስተዳድሩ።',
        'branches.add_btn': 'አዲስ ቅርንጫፍ መዝግብ',
        'branches.table_name': 'የቅርንጫፍ ስም',
        'branches.table_category': 'ምድብ',
        'branches.table_location': 'አድራሻ / ቦታ',
        'branches.table_items': 'በክምችት ያሉ ዕቃዎች',

        // Accounts View
        'accounts.title': 'የተጠቃሚ መለያዎች',
        'accounts.subtitle': 'የተጠቃሚዎችን መለያ ይፍጠሩ፣ ሚናዎችን ይመድቡ እና የቅርንጫፍ ፈቃዶችን ያስተካክሉ።',
        'accounts.add_btn': 'አዲስ ተጠቃሚ ፍጠር',
        'accounts.permissions_title': '🛡️ የተጠቃሚ ሚና እና የገጽ ፈቃዶች',
        'accounts.permissions_subtitle': 'እያንዳንዱ የስራ ሚና ማየትና መጠቀም የሚችላቸውን ገጾችና ክፍሎች ይወስኑ።',
        'accounts.th_menu': 'ገጽ / ክፍል',
        'accounts.reset_pass_btn': 'የይለፍ ቃል',

        // Modals
        'modal.prod_add_title': 'አዲስ ምርት መመዝገቢያ',
        'modal.prod_edit_title': 'የምርት መረጃ ማስተካከያ',
        'modal.prod_name': 'የምርት ስም',
        'modal.prod_brand': 'ብራንድ / አምራች',
        'modal.prod_unit': 'የመለኪያ አይነት',
        'modal.prod_desc': 'ዝርዝር መግለጫ (አማራጭ)',
        'modal.prod_color': 'ቀለም (አማራጭ)',
        'modal.prod_threshold': 'የአነስተኛ ክምችት ማስጠንቀቂያ ጣሪያ',
        'modal.prod_threshold_hint': 'የቅርንጫፉ ክምችት ከዚህ ቁጥር በታች ሲወርድ ማስጠንቀቂያ ይሰጣል እንዲሁም ወደ ግዢ ማዘዣ ይገባል።',
        'modal.archive_title': 'የተሰረዙ/የቦዘኑ ምርቶች',
        'modal.archive_subtitle': 'ከዚህ በታች የተሰረዙ ምርቶች ይገኛሉ። በማንኛውም ጊዜ ወደ ስራ መመለስ ይችላሉ።',
        'modal.branch_add_title': 'አዲስ ቅርንጫፍ መዝግብ',
        'modal.branch_edit_title': 'የቅርንጫፍ መረጃ አስተካክል',
        'modal.branch_name': 'የቅርንጫፍ / መጋዘን ስም',
        'modal.branch_spec': 'የቅርንጫፍ ምድብ / የስራ መስክ',
        'modal.branch_location': 'አድራሻ / ያለበት ቦታ',
        'modal.acc_add_title': 'አዲስ የተጠቃሚ መለያ ፍጠር',
        'modal.acc_edit_title': 'የተጠቃሚ መለያ አስተካክል',
        'modal.acc_username': 'የተጠቃሚ ስም',
        'modal.acc_email': 'ኢሜይል አድራሻ (አማራጭ)',
        'modal.acc_pass': 'የመለያ የይለፍ ቃል',
        'modal.acc_pass_help': 'የድሮውን ይለፍ ቃል ላለመቀየር ባዶ ይተዉት።',
        'modal.acc_role': 'የተጠቃሚ ሚና',
        'modal.acc_branches': 'የተመደቡ ቅርንጫፎች',
        'modal.stockin_edit_title': 'የገቢ ዕቃ መዝገብ አስተካክል',
        'modal.stockout_edit_title': 'የወጣ ዕቃ/ሽያጭ መዝገብ አስተካክል',
        'modal.change_pass_title': '🔑 የይለፍ ቃልዎን ይቀይሩ',
        'modal.change_pass_subtitle': 'የመለያዎን ደህንነት ለመጠበቅ ጠንካራ የይለፍ ቃል (ቢያንስ 6 ፊደላት/ቁጥሮች) ይጠቀሙ።',
        'modal.old_pass': 'የአሁኑ የይለፍ ቃል',
        'modal.new_pass': 'አዲስ የይለፍ ቃል',
        'modal.confirm_pass': 'አዲሱን የይለፍ ቃል ያረጋግጡ',
        'modal.pass_min_chars': 'ቢያንስ 6 ፊደላት ወይም ቁጥሮች።',
        'modal.admin_reset_title': '🔑 የተጠቃሚን የይለፍ ቃል ቀይር (አስተዳዳሪ)',
        'modal.admin_reset_hint': 'እንደ ሲስተም አስተዳዳሪ የድሮውን የይለፍ ቃል ሳያስፈልግዎት አዲስ የይለፍ ቃል በቀጥታ መመደብ ይችላሉ።',

        // Login Page
        'login.heading': 'ስቶክማትሪክስ',
        'login.subheading': 'የተቀናጀ የክምችት እና የሎጂስቲክስ አስተዳደር ሲስተም',
        'login.username_label': 'የተጠቃሚ ስም',
        'login.username_placeholder': 'የተጠቃሚ ስምዎን ያስገቡ',
        'login.password_label': 'የይለፍ ቃል',
        'login.password_placeholder': '••••••••',
        'login.submit_btn': 'ወደ ሲስተሙ ግባ',
        'login.quick_roles': 'ፈጣን መግቢያ (ለሙከራ የተዘጋጁ መለያዎች)',
        'login.verifying': 'መረጃ በመረጋገጥ ላይ...',
        'login.network_error': 'የሰርቨር ወይም የኔትወርክ ስህተት። እባክዎ ሰርቨሩ እየሰራ መሆኑን ያረጋግጡ።',

        // Messages & Toasts
        'msg.success': 'ስራው በተሳካ ሁኔታ ተጠናቋል!',
        'msg.error': 'ስህተት ተፈጥሯል!',
        'msg.cart_saved': '💾 የግዢ ረቂቁ በኮምፒውተርዎ ላይ ተቀምጧል!',
        'msg.cart_cleared': 'የግዢ ቅርጫቱ ጸድቷል።',
        'msg.pass_updated': 'የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል!',
        'msg.pass_mismatch': 'አዲሱ የይለፍ ቃል እና ማረጋገጫው አይመሳሰሉም።',
        'msg.pass_short': 'የይለፍ ቃል ቢያንስ 6 ፊደላት ወይም ቁጥሮች መሆን አለበት።'
    }
};

/**
 * Get active language code ('en' | 'am')
 */
function getActiveLanguage() {
    try {
        const saved = localStorage.getItem(STORAGE_LANG_KEY);
        if (saved === 'am' || saved === 'en') {
            return saved;
        }
    } catch (e) {}
    return 'en';
}

/**
 * Translate a key with optional fallback
 */
function t(key, fallback = null) {
    const lang = getActiveLanguage();
    if (translations[lang] && translations[lang][key] !== undefined) {
        return translations[lang][key];
    }
    if (translations.en && translations.en[key] !== undefined) {
        return translations.en[key];
    }
    return fallback !== null ? fallback : key;
}

/**
 * Update UI texts throughout DOM for current language
 */
function applyTranslations(lang = null) {
    const activeLang = lang || getActiveLanguage();
    document.documentElement.lang = activeLang;
    
    if (activeLang === 'am') {
        document.body.classList.add('lang-am');
    } else {
        document.body.classList.remove('lang-am');
    }

    // Translate all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            const translated = t(key);
            if (translated) {
                // If element contains an icon or child elements, preserve SVG/icon if marked
                const icon = el.querySelector('svg, i, .btn-icon');
                if (icon) {
                    const textSpan = el.querySelector('.i18n-text') || el;
                    if (textSpan !== el) {
                        textSpan.textContent = translated;
                    } else {
                        el.childNodes.forEach(node => {
                            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                                node.textContent = ' ' + translated;
                            }
                        });
                    }
                } else {
                    el.textContent = translated;
                }
            }
        }
    });

    // Translate inputs with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) {
            el.placeholder = t(key, el.placeholder);
        }
    });

    // Translate tooltips/titles with data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (key) {
            el.title = t(key, el.title);
        }
    });

    // Update Language Toggle Buttons active states
    document.querySelectorAll('.lang-btn').forEach(btn => {
        const btnLang = btn.getAttribute('data-lang');
        if (btnLang === activeLang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Re-build navigation tabs with active language
    if (typeof window.buildNavigation === 'function' && window.AppState?.currentUser) {
        window.buildNavigation(window.AppState.currentUser.role, window.AppState.currentUser.allowedMenus);
    }
}

/**
 * Set and switch active language
 */
function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'am') lang = 'en';
    try {
        localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch (e) {}

    applyTranslations(lang);

    // If on Dashboard, re-render charts or summaries if needed
    if (typeof window.renderDashboardSummary === 'function' && window.AppState?.dashboardData) {
        window.renderDashboardSummary();
    }
    // If on Products, update table
    if (typeof window.renderProductsList === 'function') {
        window.renderProductsList();
    }
    // If on Branches, update table
    if (typeof window.renderBranchesList === 'function') {
        window.renderBranchesList();
    }
    // If on Accounts, update tables
    if (typeof window.renderAccountsList === 'function') {
        window.renderAccountsList();
    }
    if (typeof window.renderRolePermissionsMatrix === 'function') {
        window.renderRolePermissionsMatrix();
    }
    // If on Purchasing, update table headers & low stock
    if (typeof window.renderPurchasingManifestTable === 'function') {
        window.renderPurchasingManifestTable();
    }
    if (typeof window.renderPurchasingLowStockList === 'function') {
        window.renderPurchasingLowStockList();
    }
    // If on Stock In / Stock Out, update inventory tables
    if (typeof window.renderStockInInventoryTable === 'function') {
        window.renderStockInInventoryTable();
    }
    if (typeof window.renderStockOutInventoryTable === 'function') {
        window.renderStockOutInventoryTable();
    }
    // If on Reports, re-render report table rows
    if (typeof window.loadExecutiveReports === 'function' && window.reportsDataCache) {
        if (typeof window.renderFacilityMatrix === 'function') window.renderFacilityMatrix(window.reportsDataCache.branchMetrics);
        if (typeof window.renderDamagedLedger === 'function') window.renderDamagedLedger(window.reportsDataCache.damagedLedger);
        if (typeof window.renderLedgers === 'function') window.renderLedgers(window.reportsDataCache.inboundLedger, window.reportsDataCache.outboundLedger);
        if (typeof window.renderRemainingStock === 'function') window.renderRemainingStock(window.reportsDataCache.remainingInventory);
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
});

// Expose globally
window.t = t;
window.getActiveLanguage = getActiveLanguage;
window.setLanguage = setLanguage;
window.applyTranslations = applyTranslations;
