/**
 * StockMatrix - Unified Database & Excel Backup Module
 * Handles manual SQL & Excel downloads, on-demand email dispatch, and automated schedule configuration.
 */

let isSendingEmailBackup = false;

/**
 * Fetch and populate backup settings (recipient email, schedule frequency, last backup timestamp)
 */
async function loadBackupSettings() {
    const freqSelect = document.getElementById('backupScheduleFreqSelect');
    const scheduleEmailInput = document.getElementById('backupScheduleEmailInput');
    const instantEmailInput = document.getElementById('backupInstantEmailInput');
    const lastStatusBadge = document.getElementById('backupLastStatusBadge');

    if (!freqSelect || !scheduleEmailInput) return;

    try {
        const response = await fetch('/api/backup/settings');
        if (response.status === 403 || response.status === 401) {
            // Staff or unauthorized, hide configuration controls if desired
            return;
        }
        if (!response.ok) return;

        const data = await response.json();
        if (data.success && data.settings) {
            const s = data.settings;
            freqSelect.value = s.schedule_frequency || 'disabled';
            scheduleEmailInput.value = s.recipient_email || '';
            if (instantEmailInput && !instantEmailInput.value) {
                instantEmailInput.value = s.recipient_email || '';
            }

            if (lastStatusBadge) {
                if (s.last_backup_at) {
                    const lastDate = new Date(s.last_backup_at).toLocaleString();
                    lastStatusBadge.innerHTML = `✓ <span data-i18n="backup.last_sent">Last Backup:</span> <strong>${escapeHtml(lastDate)}</strong>`;
                    lastStatusBadge.style.color = 'var(--success)';
                } else {
                    lastStatusBadge.innerHTML = `ℹ <span data-i18n="backup.no_backups">No automatic backups dispatched yet</span>`;
                    lastStatusBadge.style.color = 'var(--text-muted)';
                }
            }
        }
    } catch (err) {
        console.warn('Unable to load backup configuration:', err.message);
    }
}

/**
 * Trigger On-Demand Email Backup
 */
async function triggerEmailBackupNow() {
    if (isSendingEmailBackup) return;

    const emailInput = document.getElementById('backupInstantEmailInput');
    const recipientEmail = (emailInput?.value || '').trim();
    const btn = document.getElementById('btnSendBackupEmailNow');

    if (!recipientEmail || !recipientEmail.includes('@')) {
        showToast(t('backup.prompt_email', 'Please enter a valid recipient email address.'), 'error');
        if (emailInput) emailInput.focus();
        return;
    }

    isSendingEmailBackup = true;
    const origBtnHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm" style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; margin-right:6px;"></span> ${t('backup.sending', 'Exporting & Sending Email...')}`;
    }

    try {
        const response = await fetch('/api/backup/email-now', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient_email: recipientEmail })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to send backup via email');
        }

        showToast(t('backup.email_success', 'Backup database and Excel workbook sent to your email successfully!'), 'success');
        await loadBackupSettings();
    } catch (err) {
        showToast(err.message || 'Error dispatching backup email', 'error');
    } finally {
        isSendingEmailBackup = false;
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origBtnHtml;
        }
    }
}

/**
 * Save Automated Schedule & Email Configuration
 */
async function saveBackupScheduleSettings() {
    const freqSelect = document.getElementById('backupScheduleFreqSelect');
    const emailInput = document.getElementById('backupScheduleEmailInput');

    const schedule_frequency = freqSelect?.value || 'disabled';
    const recipient_email = (emailInput?.value || '').trim();

    if (schedule_frequency !== 'disabled' && (!recipient_email || !recipient_email.includes('@'))) {
        showToast(t('backup.prompt_schedule_email', 'Please enter a valid recipient email address for the automated schedule.'), 'error');
        if (emailInput) emailInput.focus();
        return;
    }

    try {
        const response = await fetch('/api/backup/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                schedule_frequency,
                recipient_email
            })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to save backup settings');
        }

        showToast(t('backup.success_schedule', 'Automated backup schedule settings saved successfully.'), 'success');
        await loadBackupSettings();
    } catch (err) {
        showToast(err.message || 'Error saving backup settings', 'error');
    }
}

/**
 * Scroll smoothly to Backup Management section in Reports view
 */
function scrollToBackupSection() {
    const section = document.getElementById('backupManagementSection');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        section.style.transition = 'box-shadow 0.4s ease';
        section.style.boxShadow = '0 0 0 3px var(--primary)';
        setTimeout(() => {
            section.style.boxShadow = '';
        }, 1500);
    }
}

// Auto-load backup settings on page load
document.addEventListener('DOMContentLoaded', () => {
    loadBackupSettings();
});

// Expose functions globally
window.loadBackupSettings = loadBackupSettings;
window.triggerEmailBackupNow = triggerEmailBackupNow;
window.saveBackupScheduleSettings = saveBackupScheduleSettings;
window.scrollToBackupSection = scrollToBackupSection;
