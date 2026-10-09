/**
 * StockMatrix - Unified Bilingual Internationalization (i18n) Engine
 * Supports English (en) and Amharic (am / አማርኛ)
 */

const STORAGE_LANG_KEY = 'stockmatrix_language';

const translations = {
    en: {
        // App Header & Branding
        'brand.name': 'MEDEBER',
        'brand.tagline': 'Shop & Inventory System',
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
        'reports.revenue': 'Realized Sales Revenue',
        'reports.inventory_title': 'Live Shelf Balances',
        'reports.period_7d': 'Current Week',
        'reports.period_month': 'Current Month',
        'reports.period_all': 'Start Target Date',

        // Backup & Email Export
        'backup.title': 'Database & Excel System Backups',
        'backup.subtitle': 'Download SQL database dumps, multi-sheet Excel workbooks, or send automated backups to your email.',
        'backup.download_db': '📥 Download SQL Database Dump',
        'backup.download_excel': '📊 Download Complete Excel Workbook (.xlsx)',
        'backup.email_backup_now': '📧 Send Backup to Email Now',
        'backup.email_settings': '⚙️ Backup Email Settings',
        'backup.recipient_email': 'Recipient Email Address',
        'backup.auto_schedule': 'Automated Schedule',
        'backup.schedule_disabled': 'Disabled (Manual Only)',
        'backup.schedule_daily': 'Daily (Every midnight)',
        'backup.schedule_weekly': 'Weekly (Every Sunday)',
        'backup.save_settings': 'Save Backup Settings',
        'backup.sending': 'Exporting & sending backup via email...',
        'backup.email_success': 'Backup database and Excel workbook sent to your email successfully!',
        'backup.last_sent': 'Last Backup:',
        'backup.no_backups': 'No automatic backups dispatched yet',
        'backup.prompt_email': 'Please enter a valid recipient email address.',
        'backup.prompt_schedule_email': 'Please enter a valid recipient email address for the automated schedule.',
        'backup.success_schedule': 'Automated backup schedule settings saved successfully.',

        // Camera Scanner & OCR
        'scanner.title': 'Camera Scanner',
        'scanner.subtitle': 'Point camera at product label, text, or barcode',
        'scanner.subtitle_stockin': 'Scan incoming box, packaging text, or barcode to select product',
        'scanner.subtitle_stockout': 'Scan item to dispatch / sell to auto-fill sales line',
        'scanner.subtitle_filter': 'Scan product label to filter catalog instantly',
        'scanner.subtitle_autofill': 'Scan product box to auto-fill Name and Brand',
        'scanner.scan_btn': 'Scan Label',
        'scanner.scan_search': 'Scan to Search',
        'scanner.scan_autofill': 'Scan Packaging to Auto-Fill',
        'scanner.position_hint': 'Position label or text inside frame',
        'scanner.matched_product': 'Matched Product in Catalog',
        'scanner.apply_btn': 'Apply & Select Product',
        'scanner.capture_btn': 'Capture & Scan',
        'scanner.scanning': 'Reading Text...',
        'scanner.camera_error': 'Camera permission required. You can also upload a photo below.',

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
        'login.heading': 'MEDEBER',
        'login.subheading': 'Shop & Inventory System',
        'login.username_label': 'Username',
        'login.username_placeholder': 'Enter username',
        'login.password_label': 'Password',
        'login.password_placeholder': '••••••••',
        'login.submit_btn': 'Sign In to System',
        'login.quick_roles': 'Quick Sign-In (Preloaded Test Roles)',
        'login.verifying': 'Verifying credentials...',
        'login.network_error': 'Network or server error. Please ensure the backend server is running.',

        // Camera Scanner
        'scanner.title': 'Camera Scanner',
        'scanner.subtitle': 'Point camera at product label, packaging text, or barcode',
        'scanner.subtitle_stockin': 'Scan incoming box, packaging text, or barcode to select product',
        'scanner.subtitle_stockout': 'Scan item to dispatch / sell to auto-fill sales line',
        'scanner.subtitle_filter': 'Scan product label to filter catalog instantly',
        'scanner.subtitle_autofill': 'Scan product box to auto-fill Name and Brand',
        'scanner.scan_search': 'Scan to Search',
        'scanner.scan_autofill': 'Scan Packaging to Auto-Fill',
        'scanner.scan_btn': 'Scan Label',
        'scanner.matched_product': 'Matched Product in Catalog',
        'scanner.apply_btn': 'Apply & Select Product',
        'scanner.capture_btn': 'Capture & Scan',
        'scanner.scanning': 'Reading Text...',
        'scanner.position_hint': 'Position label or text inside frame',
        'scanner.camera_error': 'Camera permission required. You can also upload a photo below.'
    },
    am: {
        // App Header & Branding
        'brand.name': 'መደብር',
        'brand.tagline': 'የሱቅ እና የክምችት አስተዳደር ሲስተም',
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
        'reports.revenue': 'የተገኘ የሽያጭ ገቢ',
        'reports.inventory_title': 'በመጋዘን/ሱቅ ያለ የቀጥታ ክምችት',
        'reports.period_7d': 'የዚህ ሳምንት',
        'reports.period_month': 'የዚህ ወር',
        'reports.period_all': 'የመጀመሪያ ቀን',

        // Backup & Email Export
        'backup.title': 'የዳታቤዝ እና የExcel ዳታ መጠባበቂያ (Backup)',
        'backup.subtitle': 'የSQL ዳታቤዝ ፋይሎችን፣ የተሟሉ የExcel ሰንጠረዦችን በቀጥታ ያውርዱ ወይም በኢሜይል እንዲላክልዎ ያድርጉ።',
        'backup.download_db': '📥 የSQL ዳታቤዝ ዳታ አውርድ',
        'backup.download_excel': '📊 የተሟላ የExcel ሰንጠረዥ አውርድ (.xlsx)',
        'backup.email_backup_now': '📧 መጠባበቂያውን አሁን በኢሜይል ላክ',
        'backup.email_settings': '⚙️ የኢሜይል መጠባበቂያ ቅንብሮች',
        'backup.recipient_email': 'መጠባበቂያው የሚላክበት የኢሜይል አድራሻ',
        'backup.auto_schedule': 'አውቶማቲክ የመላኪያ ጊዜ',
        'backup.schedule_disabled': 'አቦዝን (በእጅ ሲታዘዝ ብቻ)',
        'backup.schedule_daily': 'በየቀኑ (እኩለ ሌሊት ላይ)',
        'backup.schedule_weekly': 'በየሳምንቱ (እሁድ እሁድ)',
        'backup.save_settings': 'ቅንብሮችን መዝግብ',
        'backup.sending': 'መጠባበቂያው እየተዘጋጀ እና በኢሜይል እየተላከ ነው...',
        'backup.email_success': 'የዳታቤዝ እና የExcel መጠባበቂያው በተሳካ ሁኔታ ወደ ኢሜይልዎ ተልኳል!',
        'backup.last_sent': 'የመጨረሻው ባክአፕ:',
        'backup.no_backups': 'እስካሁን የተላከ ራስ-ሰር ባክአፕ የለም',
        'backup.prompt_email': 'እባክዎ ትክክለኛ የኢሜይል አድራሻ ያስገቡ።',
        'backup.prompt_schedule_email': 'እባክዎ ለራስ-ሰር መርሐግብሩ ትክክለኛ የኢሜይል አድራሻ ያስገቡ።',
        'backup.success_schedule': 'የራስ-ሰር ባክአፕ መርሐግብር ቅንብሮች በተሳካ ሁኔታ ተመዝግበዋል።',

        // Camera Scanner & OCR
        'scanner.title': 'የካሜራ ስካነር',
        'scanner.subtitle': 'የምርት ስም፣ ጽሑፍ ወይም ባርኮድ በካሜራ ይቃኙ',
        'scanner.subtitle_stockin': 'የዕቃውን ካርቶን ወይም ሌብል በመቃኘት ምርቱን ይምረጡ',
        'scanner.subtitle_stockout': 'የሚሸጠውን ዕቃ በመቃኘት በቀጥታ ለሽያጭ ያዘጋጁ',
        'scanner.subtitle_filter': 'የምርቱን ሌብል በመቃኘት በቀጥታ ፈልግ',
        'scanner.subtitle_autofill': 'የምርቱን ካርቶን ጽሑፍ አንብበህ ስም እና ብራንድ ሙላ',
        'scanner.scan_btn': 'በካሜራ ቃኝ',
        'scanner.scan_search': 'በካሜራ ፈልግ',
        'scanner.scan_autofill': 'ከካሜራ ጽሑፍ አንብብ',
        'scanner.position_hint': 'የምርቱን ጽሑፍ በክፈፉ ውስጥ ያስገቡ',
        'scanner.matched_product': 'በካታሎግ ውስጥ የተገኘ ምርት',
        'scanner.apply_btn': 'ምርቱን ምረጥ',
        'scanner.capture_btn': 'ፎቶ አንሳና ቃኝ',
        'scanner.scanning': 'ጽሑፉ እየተነበበ ነው...',
        'scanner.camera_error': 'የካሜራ ፈቃድ ያስፈልጋል። ከታች ፎቶ መጫንም ይችላሉ።',

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
        'login.heading': 'መደብር',
        'login.subheading': 'የሱቅ እና የክምችት አስተዳደር ሲስተም',
        'login.username_label': 'የተጠቃሚ ስም',
        'login.username_placeholder': 'የተጠቃሚ ስምዎን ያስገቡ',
        'login.password_label': 'የይለፍ ቃል',
        'login.password_placeholder': '••••••••',
        'login.submit_btn': 'ወደ ሲስተሙ ግባ',
        'login.quick_roles': 'ፈጣን መግቢያ (ለሙከራ የተዘጋጁ መለያዎች)',
        'login.verifying': 'መረጃ በመረጋገጥ ላይ...',
        'login.network_error': 'የሰርቨር ወይም የኔትወርክ ስህተት። እባክዎ ሰርቨሩ እየሰራ መሆኑን ያረጋግጡ።',

        // Camera Scanner
        'scanner.title': 'የካሜራ ስካነር',
        'scanner.subtitle': 'ካሜራውን ወደ ምርቱ ሌብል፣ ማሸጊያ ጽሑፍ ወይም ባርኮድ ያነጣጥሩ',
        'scanner.subtitle_stockin': 'ምርቱን ለመምረጥ የማሸጊያ ጽሑፍ ወይም ባርኮድ ይቃኙ',
        'scanner.subtitle_stockout': 'ለሽያጭ ወይም ለማውጣት ዕቃውን ወይም ባርኮዱን ይቃኙ',
        'scanner.subtitle_filter': 'ካታሎጉን ለማጣራት የምርት ሌብል ይቃኙ',
        'scanner.subtitle_autofill': 'ስም እና ብራንድ በራስ-ሰር ለመሙላት ማሸጊያ ይቃኙ',
        'scanner.scan_search': 'በስካን ፈልግ',
        'scanner.scan_autofill': 'ማሸጊያ በመቃኘት ራስ-ሰር ሙላ',
        'scanner.scan_btn': 'ሌብል ቅዳ',
        'scanner.matched_product': 'በሲስተሙ የተገኘ ተመሳሳይ ምርት',
        'scanner.apply_btn': 'ምርቱን ምረጥና ተግብር',
        'scanner.capture_btn': 'ፎቶ አንሳና ቃኝ',
        'scanner.scanning': 'ጽሑፍ በማንበብ ላይ...',
        'scanner.position_hint': 'ሌብሉን ወይም ጽሑፉን በፍሬሙ ውስጥ ያስተካክሉ',
        'scanner.camera_error': 'የካሜራ ፈቃድ ያስፈልጋል። ከታች ፎቶ መስቀልም ይችላሉ።'
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
