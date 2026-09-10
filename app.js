/**
 * BudgetPro - Vanilla JS Application
 * Replicating React functionality for Google Apps Script deployment
 */

// --- State Management ---
const state = {
    transactions: [
        { id: '1', name: 'משכורת 1', amount: 10000, type: 'fixed_income', date: '2026-03-10', desc: 'העברה בנקאית', isRecurring: true, frequency: 'monthly', category: 'משכורת' },
        { id: '2', name: 'משכורת 2', amount: 10000, type: 'fixed_income', date: '2026-03-10', desc: 'הפקדה חודשית', isRecurring: true, frequency: 'monthly', category: 'משכורת' },
        { id: '3', name: 'שכר דירה', amount: 7350, type: 'fixed_expense', date: '2026-03-11', desc: 'העברה בנקאית', isRecurring: true, frequency: 'monthly', category: 'מגורים' },
        { id: '4', name: 'חשבון מים', amount: 245, type: 'fixed_expense', date: '2026-03-15', desc: 'מקורות', isRecurring: true, frequency: 'monthly', category: 'מגורים' },
        { id: '6', name: 'חשמל', amount: 500, type: 'fixed_expense', date: '2026-03-21', desc: 'חברת החשמל', alert: true, isRecurring: true, frequency: 'bi-monthly', isVariablePrice: true, lastMonthAmount: 480, category: 'מגורים' },
        { id: '7', name: 'נטפליקס', amount: 155, type: 'fixed_expense', date: '2026-03-10', desc: 'מנוי חודשי', isRecurring: true, frequency: 'monthly', category: 'פנאי' },
        { id: '8', name: 'ארנונה', amount: 500, type: 'fixed_expense', date: '2026-03-11', desc: 'עירייה', isRecurring: true, frequency: 'bi-monthly', category: 'מגורים' },
    ],
    savingsGoals: [
        { 
            id: '1', 
            name: 'טיול לחו״ל', 
            target: 15000, 
            current: 9750, 
            icon: 'flight_takeoff', 
            color: 'bg-blue-400', 
            container: 'bg-blue-50', 
            onContainer: 'text-blue-900', 
            note: 'חיסכון לטיול בקיץ',
            startDate: '2026-03-01',
            durationMonths: 12,
            depositDay: 10,
            monthlyAmount: 1250
        },
        { 
            id: '2', 
            name: 'חיסכון לילדים', 
            target: 100000, 
            current: 42000, 
            icon: 'family_restroom', 
            color: 'bg-purple-400', 
            container: 'bg-purple-50', 
            onContainer: 'text-purple-900',
            startDate: '2026-01-01',
            durationMonths: 120,
            depositDay: 1,
            monthlyAmount: 833
        },
    ],
    accountBalances: [
        { id: '1', name: 'חשבון עו״ש עיקרי', amount: 100000, type: 'checking', lastUpdated: new Date().toISOString() },
        { id: '2', name: 'קופת גמל להשקעה', amount: 10000, type: 'savings', lastUpdated: new Date().toISOString() },
    ],
    settings: {
        userName: 'יונתן',
        cycleStartDay: 1,
        startMonth: 3,
        startYear: 2026,
        autoRecalculate: true,
        profileImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8tz1rrtsBZ2k9ahQ2gh5R7J9VY1PCZwgQw-WPcE9dbFnPneV3zSgVGp9svoETdhHPP44ajJ2uTs1aQaH3RWmA6TK-ByEWnrlbmi6am1TaFnnwakExMp95akuzKjlavEQkTWWesTNyR8OwEK3GjJ3U9b3IofMqtGYkFtviWx6G34ZOeG5np-vl1kNcCr4QykXSoIakaC1nIJeAsy_jxpTUywU6iQMDzJcGKVy8_SopP-gAQHotii8iMcbjCRyIUbnh9UMBxtYtwwo',
        scriptUrl: '',
        secretKey: '',
        inviteMessageStyle: 'short'
    },
    categories: [
        { name: 'מזון', icon: 'restaurant' },
        { name: 'פנאי', icon: 'sports_esports' },
        { name: 'תחבורה', icon: 'directions_car' },
        { name: 'בריאות', icon: 'medical_services' },
        { name: 'קניות', icon: 'shopping_bag' },
        { name: 'מגורים', icon: 'home' },
        { name: 'חינוך', icon: 'school' },
        { name: 'מתנות', icon: 'redeem' },
        { name: 'ביטוח', icon: 'verified_user' },
        { name: 'משכורת', icon: 'payments' },
        { name: 'הפרשות לחסכון', icon: 'savings' },
        { name: 'אחר', icon: 'category' }
    ],
    activeHomeChart: 'category', // 'category' or 'trend'
    currentPath: window.location.hash.replace('#', '') || '/',
    isLoading: false,
    loadingCount: 0,
    loadingMessage: 'טוען נתונים...',
    saveQueueSize: 0,
    quickAddLastHandled: '',
    partnerInviteExpanded: false,
    onboardingStep: 0,
    onboardingData: {
        name: '',
        profileType: '',
        invitePartner: '',
        partnerPhone: '',
        cycleStartDay: 1,
        checkingBalance: '',
        fixedIncome: '',
        spouseSalary: '',
        fixedExpense: ''
    },
    error: null,
    reminderModalOpen: false,
    forecastTooltipOpen: null,
    goalRecurringSyncDone: false
};

const ONBOARDING_DONE_KEY = 'budget_onboarding_completed_v1';
const ONBOARDING_DRAFT_KEY = 'budget_onboarding_draft_v1';
const PERF_LOGS_ENABLED = true;
let saveQueuePromise = Promise.resolve();

function perfNow() {
    if (typeof performance !== 'undefined' && performance.now) return performance.now();
    return Date.now();
}

function perfLog(label, startedAt, extra = '') {
    if (!PERF_LOGS_ENABLED) return;
    const took = (perfNow() - startedAt).toFixed(1);
    console.log(`[PERF] ${label}: ${took}ms${extra ? ` | ${extra}` : ''}`);
}

// --- Constants ---
const PASTEL_COLORS = [
    { name: 'כחול', color: 'bg-blue-400', container: 'bg-blue-50', onContainer: 'text-blue-900' },
    { name: 'ירוק', color: 'bg-emerald-400', container: 'bg-emerald-50', onContainer: 'text-emerald-900' },
    { name: 'אדום', color: 'bg-rose-400', container: 'bg-rose-50', onContainer: 'text-rose-900' },
    { name: 'סגול', color: 'bg-purple-400', container: 'bg-purple-50', onContainer: 'text-purple-900' },
    { name: 'ורוד', color: 'bg-pink-400', container: 'bg-pink-50', onContainer: 'text-pink-900' },
    { name: 'כתום', color: 'bg-orange-400', container: 'bg-orange-50', onContainer: 'text-orange-900' },
    { name: 'צהוב', color: 'bg-amber-400', container: 'bg-amber-50', onContainer: 'text-amber-900' },
    { name: 'תכלת', color: 'bg-cyan-400', container: 'bg-cyan-50', onContainer: 'text-cyan-900' },
    { name: 'אינדיגו', color: 'bg-indigo-400', container: 'bg-indigo-50', onContainer: 'text-indigo-900' },
    { name: 'ליים', color: 'bg-lime-400', container: 'bg-lime-50', onContainer: 'text-lime-900' },
];

const TRANSACTION_TYPES = {
    fixed_income: { label: 'הכנסה קבועה', icon: 'payments', color: 'text-emerald-600' },
    variable_income: { label: 'הכנסה משתנה', icon: 'add_card', color: 'text-emerald-600' },
    fixed_expense: { label: 'הוצאה קבועה', icon: 'account_balance_wallet', color: 'text-rose-600' },
    variable_expense: { label: 'הוצאה משתנה', icon: 'shopping_cart', color: 'text-rose-600' },
    savings_deposit: { label: 'הפרשות לחסכון', icon: 'savings', color: 'text-blue-600' }
};

const FREQUENCIES = {
    'monthly': { label: 'חודשי', months: 1 },
    'bi-monthly': { label: 'דו-חודשי', months: 2 },
    'quarterly': { label: 'רבעוני', months: 3 },
    'semi-annually': { label: 'חצי-שנתי', months: 6 },
    'annually': { label: 'שנתי', months: 12 }
};

// --- Utility Functions ---
function formatCurrency(amount, showSymbol = true) {
    const formatted = new Intl.NumberFormat('he-IL', {
        style: showSymbol ? 'currency' : 'decimal',
        currency: 'ILS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
    return formatted;
}

function formatDateLocal(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function escapeHtmlAttr(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function getLoginPrefillFromHash() {
    const rawHash = window.location.hash || '';
    const clean = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
    const parts = clean.split('?');
    const path = parts[0] || '/';
    if (path !== '/login') return { scriptUrl: '', secretKey: '' };

    const params = new URLSearchParams(parts[1] || '');
    return {
        scriptUrl: params.get('scriptUrl') || '',
        secretKey: params.get('secretKey') || '',
        backend: params.get('backend') || '',
        inviteToken: params.get('inviteToken') || ''
    };
}

function getHashParams() {
    const rawHash = window.location.hash || '';
    const clean = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
    const parts = clean.split('?');
    return new URLSearchParams(parts[1] || '');
}

function parseDateLocal(dateStr) {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function normalizeInstallmentsTotal(value) {
    const n = Math.round(Number(value) || 0);
    return n > 1 ? n : 0;
}

function getInstallmentStatus(transaction, monthIndex, year) {
    const total = normalizeInstallmentsTotal(transaction?.installmentsTotal);
    const enabled = !!(transaction && transaction.isInstallments && total > 0);
    if (!enabled) {
        return { enabled: false, active: false, index: 0, total: 0, startDate: null };
    }

    const startDate = parseDateLocal(transaction.installmentsStartDate || transaction.date);
    const monthsDiff = (year - startDate.getFullYear()) * 12 + (monthIndex - startDate.getMonth());
    const index = monthsDiff + 1;
    const active = monthsDiff >= 0 && monthsDiff < total;

    return { enabled: true, active, index, total, startDate };
}

function getInstallmentBadgeText(transaction, monthIndex, year) {
    const status = getInstallmentStatus(transaction, monthIndex, year);
    if (!status.enabled || !status.active) return '';
    return `${status.index} מתוך ${status.total}`;
}

function formatTransactionNameWithInstallment(transaction, monthIndex, year) {
    const badge = getInstallmentBadgeText(transaction, monthIndex, year);
    if (!badge) return String(transaction?.name || '');
    return `${String(transaction?.name || '')} (${badge})`;
}

function compareTransactionsByDateDesc(a, b) {
    const aTime = parseDateLocal(a?.date).getTime();
    const bTime = parseDateLocal(b?.date).getTime();
    if (bTime !== aTime) return bTime - aTime;

    const aId = String(a?.id || '');
    const bId = String(b?.id || '');
    return bId.localeCompare(aId, 'en', { numeric: true, sensitivity: 'base' });
}

function getGoalRemainingMonths(goal) {
    const target = Number(goal?.target) || 0;
    const current = Number(goal?.current) || 0;
    const monthly = Number(goal?.monthlyAmount) || 0;
    const remainingAmount = Math.max(0, target - current);

    if (remainingAmount <= 0) return 0;
    if (monthly <= 0) return Number(goal?.durationMonths) || 120;
    return Math.ceil(remainingAmount / monthly);
}

function getGoalEstimatedEndDate(goal, fromDate = new Date()) {
    const monthsRemaining = getGoalRemainingMonths(goal);
    const endDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    endDate.setMonth(endDate.getMonth() + monthsRemaining);
    return endDate;
}

function getCycleDates(date = new Date()) {
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    
    let cycleStart = new Date(currentYear, currentMonth, state.settings.cycleStartDay);
    if (date < cycleStart) {
        cycleStart.setMonth(cycleStart.getMonth() - 1);
    }
    
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setMonth(cycleEnd.getMonth() + 1);
    
    return { start: cycleStart, end: cycleEnd };
}

function getFilteredTransactions(filterType, date = new Date()) {
    const { start, end } = getCycleDates(date);
    const cycleMonth = start.getMonth();
    const cycleYear = start.getFullYear();

    function appliesByFrequencyForCycle(transaction) {
        const freq = String(transaction?.frequency || 'monthly');
        const base = parseDateLocal(transaction?.date);
        const monthsDiff = (cycleYear - base.getFullYear()) * 12 + (cycleMonth - base.getMonth());
        if (monthsDiff < 0) return false;
        if (freq === 'monthly') return true;
        if (freq === 'bi-monthly') return monthsDiff % 2 === 0;
        if (freq === 'quarterly') return monthsDiff % 3 === 0;
        if (freq === 'semi-annually') return monthsDiff % 6 === 0;
        if (freq === 'annually' || freq === 'annual') return monthsDiff % 12 === 0;
        return true;
    }

    function toCycleDate(originalDate) {
        const base = parseDateLocal(originalDate);
        const requestedDay = base.getDate();
        const maxDay = new Date(cycleYear, cycleMonth + 1, 0).getDate();
        const day = Math.min(requestedDay, maxDay);
        return formatDateLocal(new Date(cycleYear, cycleMonth, day));
    }

    // Build current cycle transactions:
    // - One-time transactions: only if date is inside cycle.
    // - Recurring transactions: included by frequency even if original date was months ago.
    let baseFiltered = [];
    state.transactions.forEach((t) => {
        if (!t) return;
        if (t.type === 'savings_deposit' && t.amount === 0 && t.goalId) return;

        const installmentStatus = getInstallmentStatus(t, cycleMonth, cycleYear);
        if (installmentStatus.enabled) {
            if (!installmentStatus.active) return;
            baseFiltered.push({
                ...t,
                isRecurring: true,
                frequency: 'monthly',
                date: toCycleDate(t.installmentsStartDate || t.date),
                installmentCurrent: installmentStatus.index,
                installmentTotal: installmentStatus.total
            });
            return;
        }

        const tDate = parseDateLocal(t.date);
        const inRange = tDate >= start && tDate < end;
        if (!t.isRecurring) {
            if (inRange) baseFiltered.push(t);
            return;
        }

        if (!appliesByFrequencyForCycle(t)) return;
        if (t.type === 'savings_deposit' && t.goalId) {
            const skippedCycles = getSkippedCycleSetFromTransaction(t);
            const currentCycleKey = `${cycleYear}-${String(cycleMonth + 1).padStart(2, '0')}`;
            if (skippedCycles.has(currentCycleKey)) return;
        }

        baseFiltered.push({
            ...t,
            date: toCycleDate(t.date)
        });
    });

    // Guard against legacy duplicate recurring savings rows for the same goal.
    // Keep only the latest occurrence per goal in the current filtered set.
    const dedupedFromEnd = [];
    const seenRecurringSavingsGoal = new Set();
    for (let i = baseFiltered.length - 1; i >= 0; i--) {
        const t = baseFiltered[i];
        const isGoalRecurringSavings = !!(
            t &&
            t.type === 'savings_deposit' &&
            t.isRecurring &&
            String(t.goalId || '').trim()
        );
        if (isGoalRecurringSavings) {
            const key = String(t.goalId).trim();
            if (seenRecurringSavingsGoal.has(key)) continue;
            seenRecurringSavingsGoal.add(key);
        }
        dedupedFromEnd.push(t);
    }

    let allTransactions = dedupedFromEnd.reverse();

    if (filterType === 'income') {
        allTransactions = allTransactions.filter(t => t.type === 'fixed_income' || t.type === 'variable_income');
    } else if (filterType === 'expense') {
        allTransactions = allTransactions.filter(t => t.type === 'fixed_expense' || t.type === 'variable_expense');
    } else if (filterType === 'fixed') {
        allTransactions = allTransactions.filter(t => t.type === 'fixed_income' || t.type === 'fixed_expense');
    } else if (filterType === 'variable') {
        allTransactions = allTransactions.filter(t => t.type === 'variable_income' || t.type === 'variable_expense');
    } else if (filterType === 'savings') {
        allTransactions = allTransactions.filter(t => t.type === 'savings_deposit');
    }

    return allTransactions;
}

// --- Navigation & Routing ---
function navigate(path) {
    window.location.hash = path;
}

window.addEventListener('hashchange', () => {
    state.currentPath = window.location.hash.replace('#', '') || '/';
    render();
});

// --- Rendering Engine ---
function render() {
    const renderStart = perfNow();
    const app = document.getElementById('app');
    const onboardingCompleted = localStorage.getItem(ONBOARDING_DONE_KEY) === '1';
    
    if (!onboardingCompleted && state.currentPath !== '/onboarding') {
        navigate('/onboarding');
        return;
    }

    if (onboardingCompleted && state.currentPath === '/onboarding') {
        navigate('/');
        return;
    }

    if (state.currentPath === '/onboarding') {
        app.innerHTML = renderOnboarding();
        return;
    }

    // Check authentication
    const isAuthenticated = !!(state.settings.scriptUrl && state.settings.secretKey);
    
    if (!isAuthenticated && state.currentPath !== '/login') {
        navigate('/login');
        return;
    }

    if (isAuthenticated && state.currentPath === '/login') {
        navigate('/');
        return;
    }

    if (state.currentPath === '/login') {
        app.innerHTML = renderLogin();
        setTimeout(() => {
            resolveInviteTokenIfPresent();
        }, 0);
        return;
    }

    const title = getPageTitle(state.currentPath);
    
    app.innerHTML = `
        <div class="min-h-screen bg-background text-on-surface">
            ${renderTopAppBar(title)}
            <main id="main-content" class="max-w-2xl mx-auto px-4 pt-24 pb-32">
                ${renderPage(state.currentPath)}
            </main>
            ${renderBottomNavBar()}
            ${renderLoadingOverlay()}
        </div>
    `;

    // Re-attach event listeners and initialize charts if needed
    attachEventListeners();
    initCharts();
    handleQuickAddFromHash();
    checkVariableExpenseReminders();
    perfLog('render()', renderStart, `path=${state.currentPath}`);
}

function getReminderStorageKey(transactionId, yearMonth) {
    return `budget_var_expense_reminder_${transactionId}_${yearMonth}`;
}

function getCurrentCycleKey(date = new Date()) {
    const { start } = getCycleDates(date);
    return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
}

function getSkippedCycleSetFromTransaction(tx) {
    const raw = String(tx?.cycleDate || '').trim();
    if (!raw.startsWith('skip:')) return new Set();
    return new Set(
        raw
            .slice(5)
            .split(',')
            .map((v) => String(v || '').trim())
            .filter(Boolean)
    );
}

function buildSkippedCycleValue(set) {
    const arr = Array.from(set).sort();
    if (!arr.length) return '';
    return `skip:${arr.join(',')}`;
}

function getGoalRecurringDepositTransaction(goalId) {
    return state.transactions.find((t) =>
        t &&
        t.type === 'savings_deposit' &&
        t.isRecurring &&
        String(t.goalId || '') === String(goalId || '')
    ) || null;
}

function buildGoalRecurringDepositTransaction(goal, existingId = '') {
    const safeDay = Math.max(1, Math.min(28, Number(goal.depositDay) || 1));
    const startDateRaw = goal.startDate || formatDateLocal(new Date());
    const startDate = parseDateLocal(startDateRaw);
    const y = startDate.getFullYear();
    const m = startDate.getMonth();
    const maxDay = new Date(y, m + 1, 0).getDate();
    const date = formatDateLocal(new Date(y, m, Math.min(safeDay, maxDay)));

    return {
        id: existingId || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: `הפקדה: ${goal.name}`,
        amount: Number(goal.monthlyAmount) || 0,
        type: 'savings_deposit',
        date: date,
        category: 'הפרשות לחסכון',
        isRecurring: true,
        frequency: 'monthly',
        goalId: goal.id,
        desc: 'הפקדה חודשית מיעד חיסכון'
    };
}

function shouldHaveGoalRecurringDeposit(goal) {
    if (!goal) return false;
    return !!(goal.id && goal.startDate && Number(goal.monthlyAmount) > 0 && Number(goal.depositDay) >= 1);
}

function syncRecurringDepositWithGoal(goal, isEdit) {
    const existing = getGoalRecurringDepositTransaction(goal.id);
    const shouldHave = shouldHaveGoalRecurringDeposit(goal);

    if (!shouldHave) {
        if (existing) {
            state.transactions = state.transactions.filter((t) => String(t.id) !== String(existing.id));
            saveDataToGAS('deleteTransaction', { id: existing.id });
        }
        return;
    }

    const tx = buildGoalRecurringDepositTransaction(goal, existing ? existing.id : '');
    if (existing || isEdit) {
        state.transactions = state.transactions.map((t) => (String(t.id) === String(tx.id) ? { ...t, ...tx } : t));
        saveDataToGAS('updateTransaction', tx);
    } else {
        state.transactions.push(tx);
        saveDataToGAS('addTransaction', tx);
    }
}

function ensureGoalRecurringTransactionsSyncedOnce() {
    if (state.goalRecurringSyncDone) return;
    state.goalRecurringSyncDone = true;

    state.savingsGoals.forEach((goal) => {
        const existing = getGoalRecurringDepositTransaction(goal.id);
        if (!existing && shouldHaveGoalRecurringDeposit(goal)) {
            const tx = buildGoalRecurringDepositTransaction(goal);
            state.transactions.push(tx);
            saveDataToGAS('addTransaction', tx);
        }
    });
}

function getNextMonthSameDay(dateStr) {
    const base = parseDateLocal(dateStr);
    const y = base.getFullYear();
    const m = base.getMonth();
    const d = base.getDate();
    const maxDayNextMonth = new Date(y, m + 2, 0).getDate();
    const next = new Date(y, m + 1, Math.min(d, maxDayNextMonth));
    return formatDateLocal(next);
}

function checkVariableExpenseReminders() {
    const basePath = state.currentPath.split('?')[0];
    if (basePath === '/login' || basePath === '/onboarding') return;
    if (state.reminderModalOpen) return;

    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer || !modalContainer.classList.contains('hidden')) return;

    const today = new Date();
    const todayDay = today.getDate();
    const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const cycleStart = getCycleDates(today).start;
    const cycleMonth = cycleStart.getMonth();
    const cycleYear = cycleStart.getFullYear();

    const due = state.transactions
        .filter((t) => t && t.type === 'variable_expense' && t.isRecurring && t.alert && t.date)
        .filter((t) => {
            const installmentStatus = getInstallmentStatus(t, cycleMonth, cycleYear);
            return !installmentStatus.enabled || installmentStatus.active;
        })
        .filter((t) => {
            const d = parseDateLocal(t.date);
            return d.getDate() === todayDay;
        })
        .filter((t) => localStorage.getItem(getReminderStorageKey(t.id, yearMonth)) !== '1')
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'he'));

    if (!due.length) return;
    state.reminderModalOpen = true;
    renderVariableExpenseReminderModal(due[0], yearMonth);
}

function renderVariableExpenseReminderModal(transaction, yearMonth) {
    const html = `
        <div class="space-y-5">
            <div class="flex items-start justify-between">
                <div>
                    <h2 class="text-2xl font-black text-primary">תזכורת הוצאה משתנה</h2>
                    <p class="text-sm text-on-surface-variant mt-1">שים/י לב, הגיע מועד עדכון ההוצאה:</p>
                </div>
                <button onclick="acknowledgeVariableExpenseReminder('${transaction.id}', '${yearMonth}', false)" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="bg-surface-variant/20 rounded-2xl p-4 space-y-1">
                <p class="font-extrabold text-lg">${transaction.name}</p>
                <p class="text-on-surface-variant text-sm">תאריך נוכחי: ${transaction.date}</p>
                <p class="text-rose-600 font-extrabold text-xl">${formatCurrency(transaction.amount)}</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onclick="acknowledgeVariableExpenseReminder('${transaction.id}', '${yearMonth}', false)" class="h-12 rounded-xl bg-surface-variant/40 font-bold">
                    אישור בלבד
                </button>
                <button onclick="acknowledgeVariableExpenseReminder('${transaction.id}', '${yearMonth}', true)" class="h-12 rounded-xl bg-primary text-white font-bold">
                    אישור + עדכון לחודש הבא
                </button>
            </div>
        </div>
    `;
    openModal(html);
}

function acknowledgeVariableExpenseReminder(transactionId, yearMonth, moveToNextMonth) {
    localStorage.setItem(getReminderStorageKey(transactionId, yearMonth), '1');
    state.reminderModalOpen = false;

    if (moveToNextMonth) {
        const tx = state.transactions.find((t) => String(t.id) === String(transactionId));
        if (tx) {
            const updated = { ...tx, date: getNextMonthSameDay(tx.date) };
            state.transactions = state.transactions.map((t) => (String(t.id) === String(transactionId) ? updated : t));
            saveDataToGAS('updateTransaction', updated);
        }
    }

    closeModal();
    render();
}

function renderLoadingOverlay() {
    if (!state.isLoading) return '';
    return `
        <div class="fixed inset-0 z-[100] bg-black/35 backdrop-blur-sm flex items-center justify-center p-6">
            <div class="bg-white rounded-3xl shadow-2xl px-8 py-7 max-w-xs w-full text-center">
                <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-sm font-bold text-on-surface">${state.loadingMessage || 'טוען נתונים...'}</p>
            </div>
        </div>
    `;
}

function startLoading(message) {
    state.loadingCount = (state.loadingCount || 0) + 1;
    state.isLoading = true;
    if (message) state.loadingMessage = message;
    render();
}

function stopLoading() {
    state.loadingCount = Math.max(0, (state.loadingCount || 0) - 1);
    state.isLoading = state.loadingCount > 0;
    if (!state.isLoading) {
        state.loadingMessage = 'טוען נתונים...';
    }
    render();
}

function getPageTitle(path) {
    switch (path) {
        case '/settings': return 'הגדרות';
        case '/savings': return 'חסכונות';
        case '/forecast': return 'תחזית';
        case '/transactions': return 'עסקאות';
        default: return '';
    }
}

function renderTopAppBar(title) {
    return `
        <header class="fixed top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-md z-40 border-b border-surface-variant/30 px-4">
            <div class="max-w-2xl mx-auto h-full flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
                        <img src="${state.settings.profileImage}" alt="Profile" class="w-full h-full object-cover">
                    </div>
                    <div>
                        <h1 class="text-lg font-bold text-primary leading-tight">BudgetPro</h1>
                        <p class="text-xs text-on-surface-variant">שלום, ${state.settings.userName}</p>
                    </div>
                </div>
                ${title ? `<h2 class="text-lg font-semibold absolute left-1/2 -translate-x-1/2">${title}</h2>` : ''}
                <div class="flex items-center gap-2">
                    <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50 transition-colors">
                        <span class="material-symbols-outlined text-on-surface-variant">notifications</span>
                    </button>
                    <button onclick="navigate('/settings')" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50 transition-colors">
                        <span class="material-symbols-outlined text-on-surface-variant">settings</span>
                    </button>
                </div>
            </div>
        </header>
    `;
}

function renderBottomNavBar() {
    const items = [
        { path: '/', icon: 'home', label: 'בית' },
        { path: '/transactions', icon: 'list_alt', label: 'עסקאות' },
        { path: '/savings', icon: 'savings', label: 'חסכונות' },
        { path: '/forecast', icon: 'trending_up', label: 'תחזית' },
    ];

    return `
        <nav class="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-surface-variant/30 z-40 safe-area-bottom">
            <div class="max-w-2xl mx-auto flex justify-around items-center h-16">
                ${items.map(item => {
                    const isActive = state.currentPath === item.path;
                    return `
                        <button onclick="navigate('${item.path}')" class="flex flex-col items-center justify-center gap-1 w-full h-full transition-all ${isActive ? 'text-primary' : 'text-on-surface-variant'}">
                            <div class="relative">
                                <span class="material-symbols-outlined text-[24px] ${isActive ? 'font-fill' : ''}">${item.icon}</span>
                                ${isActive ? '<div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>' : ''}
                            </div>
                            <span class="text-[10px] font-medium">${item.label}</span>
                        </button>
                    `;
                }).join('')}
            </div>
        </nav>
    `;
}

function renderPage(path) {
    const basePath = path.split('?')[0];
    switch (basePath) {
        case '/': return renderHome();
        case '/transactions': return renderTransactions();
        case '/savings': return renderSavings();
        case '/forecast': return renderForecast();
        case '/settings': return renderSettings();
        default: return renderHome();
    }
}

// --- Page Renderers ---

function renderHome() {
    const { start, end } = getCycleDates();
    const currentTransactions = getFilteredTransactions('all');
    
    const income = currentTransactions
        .filter(t => t.type === 'fixed_income' || t.type === 'variable_income')
        .reduce((sum, t) => sum + t.amount, 0);
        
    const expenses = currentTransactions
        .filter(t => t.type === 'fixed_expense' || t.type === 'variable_expense')
        .reduce((sum, t) => sum + t.amount, 0);
        
    const savings = currentTransactions
        .filter(t => t.type === 'savings_deposit')
        .reduce((sum, t) => sum + t.amount, 0);
        
    const remainingToSpend = income - expenses - savings;
    const totalAssets = state.accountBalances.reduce((sum, acc) => sum + acc.amount, 0);

    return `
        <div class="space-y-6">
            <!-- Balance Card -->
            <div class="bg-primary rounded-3xl p-6 text-on-primary shadow-lg shadow-primary/20 relative overflow-hidden mt-4">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div class="relative z-10">
                    <p class="text-sm opacity-80 mb-1">יתרה שנותרה לבזבוז החודש</p>
                    <h2 class="text-3xl font-bold mb-1">${formatCurrency(remainingToSpend)}</h2>
                    <p class="text-[10px] opacity-60 mb-6">סה״כ נכסים: ${formatCurrency(totalAssets)}</p>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                            <p class="text-[10px] opacity-80 uppercase tracking-wider mb-1">הכנסות החודש</p>
                            <p class="text-lg font-bold">${formatCurrency(income)}</p>
                        </div>
                        <div class="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                            <p class="text-[10px] opacity-80 uppercase tracking-wider mb-1">הוצאות והפרשות</p>
                            <p class="text-lg font-bold">${formatCurrency(expenses + savings)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="grid grid-cols-4 gap-2">
                <button onclick="renderTransactionModal({ type: 'variable_income' })" class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-variant/30 hover:bg-surface-variant/50 transition-colors">
                    <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <span class="material-symbols-outlined">add</span>
                    </div>
                    <span class="text-xs font-semibold">הכנסה</span>
                </button>
                <button onclick="renderTransactionModal({ type: 'variable_expense' })" class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-variant/30 hover:bg-surface-variant/50 transition-colors">
                    <div class="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                        <span class="material-symbols-outlined">remove</span>
                    </div>
                    <span class="text-xs font-semibold">הוצאה</span>
                </button>
                <button onclick="renderSavingsActionModal()" class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-variant/30 hover:bg-surface-variant/50 transition-colors">
                    <div class="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                        <span class="material-symbols-outlined">savings</span>
                    </div>
                    <span class="text-xs font-semibold">חיסכון</span>
                </button>
                <button onclick="renderAccountModal()" class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-variant/30 hover:bg-surface-variant/50 transition-colors">
                    <div class="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                        <span class="material-symbols-outlined">account_balance</span>
                    </div>
                    <span class="text-xs font-semibold">חשבון</span>
                </button>
            </div>

            <!-- Savings Goals -->
            <section>
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-2xl font-bold">החסכונות שלי</h3>
                    <button onclick="navigate('/savings')" class="text-sm text-primary font-medium">נהל הכל</button>
                </div>
                <div class="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
                    ${state.savingsGoals.map(goal => {
                        const progress = (goal.current / goal.target) * 100;
                        return `
                        <div onclick="renderSavingsModal(${JSON.stringify(goal).replace(/"/g, '&quot;')})" class="min-w-[200px] ${goal.container} rounded-3xl p-4 flex flex-col gap-3 cursor-pointer hover:scale-[1.02] transition-transform">
                            <div class="flex items-center justify-between">
                                <div class="w-10 h-10 rounded-2xl ${goal.color} flex items-center justify-center text-white shadow-sm">
                                    <span class="material-symbols-outlined">${goal.icon}</span>
                                </div>
                                <span class="text-[10px] font-bold ${goal.onContainer} opacity-60">${Math.round(progress)}%</span>
                            </div>
                            <div>
                                <h4 class="font-bold text-base ${goal.onContainer}">${goal.name}</h4>
                                <p class="text-sm ${goal.onContainer} opacity-75">${formatCurrency(goal.current)} מתוך ${formatCurrency(goal.target)}</p>
                            </div>
                            <div class="w-full h-2 bg-white/50 rounded-full overflow-hidden">
                                <div class="h-full ${goal.color}" style="width: ${progress}%"></div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </section>

            <!-- Recent Transactions -->
            <section>
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-2xl font-bold">תנועות אחרונות</h3>
                    <button onclick="navigate('/transactions')" class="text-sm text-primary font-bold hover:underline">נהל הכל</button>
                </div>
                <div class="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
                    ${(() => {
                        const recentTransactions = [...currentTransactions]
                            .sort(compareTransactionsByDateDesc)
                            .slice(0, 7);
                            
                        return recentTransactions.map(t => {
                            const isExpense = t.type.includes('expense') || t.type === 'savings_deposit';
                            const colorClass = isExpense ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600';
                            const amountSign = isExpense ? '-' : '';
                            const tDate = parseDateLocal(t.date);
                            const installmentBadge = getInstallmentBadgeText(t, tDate.getMonth(), tDate.getFullYear());
                            const displayName = t.name;
                            
                            return `
                                <div onclick="renderTransactionModal(${JSON.stringify(t).replace(/"/g, '&quot;')})" class="min-w-[150px] bg-white rounded-2xl p-3 border border-surface-variant/30 shadow-sm flex flex-col gap-2 cursor-pointer hover:scale-[1.02] transition-transform">
                                    <div class="flex items-center justify-between">
                                        <div class="w-8 h-8 rounded-full ${colorClass} flex items-center justify-center">
                                            <span class="material-symbols-outlined text-sm">${TRANSACTION_TYPES[t.type]?.icon || 'receipt_long'}</span>
                                        </div>
                                        <div class="flex items-center gap-1.5">
                                            ${installmentBadge ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">תשלומים ${installmentBadge}</span>` : ''}
                                            <span class="text-xs text-on-surface-variant font-medium">${t.date.split('-').slice(1).reverse().join('/')}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-sm truncate">${displayName}</h4>
                                        <p class="text-xs text-on-surface-variant truncate">${t.category || 'ללא קטגוריה'}</p>
                                    </div>
                                    <p class="font-bold text-sm ${isExpense ? 'text-rose-600' : 'text-emerald-600'}">${amountSign}${formatCurrency(t.amount)}</p>
                                </div>
                            `;
                        }).join('');
                    })()}
                </div>
            </section>

            <!-- Charts Section (MAX Style) -->
            <section class="bg-white rounded-3xl border border-surface-variant/30 shadow-sm overflow-hidden">
                <!-- Tabs -->
                <div class="flex border-b border-surface-variant/30">
                    <button onclick="switchHomeChart('trend')" class="flex-1 py-3 flex items-center justify-center gap-2 transition-colors ${state.activeHomeChart === 'trend' ? 'bg-white text-on-surface' : 'bg-surface-variant/20 text-on-surface-variant'}">
                        <span class="material-symbols-outlined text-lg">bar_chart</span>
                        <span class="font-bold text-sm">גרף חודשים</span>
                        <span class="material-symbols-outlined text-base">${state.activeHomeChart === 'trend' ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>
                    </button>
                    <div class="w-[1px] bg-surface-variant/30"></div>
                    <button onclick="switchHomeChart('category')" class="flex-1 py-3 flex items-center justify-center gap-2 transition-colors ${state.activeHomeChart === 'category' ? 'bg-white text-on-surface' : 'bg-surface-variant/20 text-on-surface-variant'}">
                        <span class="material-symbols-outlined text-lg">donut_large</span>
                        <span class="font-bold text-sm">גרף קטגוריות</span>
                        <span class="material-symbols-outlined text-base">${state.activeHomeChart === 'category' ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>
                    </button>
                </div>

                <!-- Content -->
                <div class="p-3">
                    ${state.activeHomeChart === 'category' ? `
                        <div class="home-cat-wrap">
                            <!-- Category List (Left) -->
                            <div class="home-cat-list">
                                ${(() => {
                                    const currentTransactions = getFilteredTransactions('all');
                                    const expenses = currentTransactions.filter(t => t.type.includes('expense'));
                                    const categoryTotals = {};
                                    expenses.forEach(t => {
                                        const cat = t.category || 'אחר';
                                        categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
                                    });

                                    return Object.entries(categoryTotals)
                                        .sort(([, a], [, b]) => b - a)
                                        .slice(0, 5)
                                        .map(([cat, amount]) => {
                                            const categoryObj = state.categories.find(c => c.name === cat) || { icon: 'category' };
                                            return `
                                                <div class="home-cat-item">
                                                    <div class="home-cat-amount-row">
                                                        <span class="home-cat-amount">${formatCurrency(amount)}</span>
                                                        <span class="material-symbols-outlined home-cat-icon">${categoryObj.icon}</span>
                                                    </div>
                                                    <p class="home-cat-name">${cat}</p>
                                                </div>
                                            `;
                                        }).join('');
                                })()}
                            </div>

                            <!-- Doughnut Chart (Right) -->
                            <div class="home-cat-donut-col">
                                <div class="home-cat-donut-box">
                                    <canvas id="categoryChart"></canvas>
                                    <div class="home-cat-donut-label">
                                        <p>עסקאות<br>החודש</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-2 text-center">
                            <button onclick="navigate('/transactions')" class="text-cyan-500 font-black text-xl flex items-center justify-center gap-1 mx-auto">
                                לכל הקטגוריות >
                            </button>
                        </div>
                    ` : `
                        <div class="h-40 relative w-full">
                            <canvas id="trendChart"></canvas>
                        </div>
                        <p id="trendAverageText" class="mt-2 text-center text-[11px] text-on-surface-variant font-medium"></p>
                    `}
                </div>
            </section>
        </div>
    `;
}

function renderTransactions() {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const filterType = urlParams.get('filter') || 'all';
    const selectedCategory = urlParams.get('category') || 'all';
    
    const transactions = getFilteredTransactions(filterType);
    const categoryFiltered = selectedCategory === 'all' ? transactions : transactions.filter(t => t.category === selectedCategory);

    // "Remaining to spend" must always reflect the full current cycle, not the active list filter.
    const allCycleTransactions = getFilteredTransactions('all');
    const income = allCycleTransactions.filter(t => t.type.includes('income')).reduce((sum, t) => sum + t.amount, 0);
    const expenses = allCycleTransactions.filter(t => t.type.includes('expense')).reduce((sum, t) => sum + t.amount, 0);
    const savings = allCycleTransactions.filter(t => t.type === 'savings_deposit').reduce((sum, t) => sum + t.amount, 0);
    const remaining = income - expenses - savings;
    const totalAssets = state.accountBalances.reduce((sum, acc) => sum + acc.amount, 0);

    return `
        <div class="space-y-6 pb-10">
            <!-- Remaining to Spend -->
            <div class="bg-primary rounded-3xl p-6 text-on-primary shadow-lg shadow-primary/20 relative overflow-hidden mt-4">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div class="relative z-10">
                    <p class="text-sm opacity-80 mb-1">יתרה שנותרה לבזבוז החודש</p>
                    <h2 class="text-3xl font-bold mb-1">${formatCurrency(remaining)}</h2>
                    <p class="text-[10px] opacity-60 mb-6">סה״כ נכסים: ${formatCurrency(totalAssets)}</p>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                            <p class="text-[10px] opacity-80 uppercase tracking-wider mb-1">הכנסות החודש</p>
                            <p class="text-lg font-bold">${formatCurrency(income)}</p>
                        </div>
                        <div class="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                            <p class="text-[10px] opacity-80 uppercase tracking-wider mb-1">הוצאות והפרשות</p>
                            <p class="text-lg font-bold">${formatCurrency(expenses + savings)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="grid grid-cols-4 gap-2">
                <button onclick="renderTransactionModal({ type: 'variable_income' })" class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-variant/30 hover:bg-surface-variant/50 transition-colors">
                    <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <span class="material-symbols-outlined">add</span>
                    </div>
                    <span class="text-xs font-semibold">הכנסה</span>
                </button>
                <button onclick="renderTransactionModal({ type: 'variable_expense' })" class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-variant/30 hover:bg-surface-variant/50 transition-colors">
                    <div class="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                        <span class="material-symbols-outlined">remove</span>
                    </div>
                    <span class="text-xs font-semibold">הוצאה</span>
                </button>
                <button onclick="renderSavingsActionModal()" class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-variant/30 hover:bg-surface-variant/50 transition-colors">
                    <div class="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                        <span class="material-symbols-outlined">savings</span>
                    </div>
                    <span class="text-xs font-semibold">חיסכון</span>
                </button>
                <button onclick="renderAccountModal()" class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-variant/30 hover:bg-surface-variant/50 transition-colors">
                    <div class="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                        <span class="material-symbols-outlined">account_balance</span>
                    </div>
                    <span class="text-xs font-semibold">חשבון</span>
                </button>
            </div>

            <!-- Actions Title -->
            <div class="px-2">
                <h3 class="text-2xl font-bold mb-1">פעולות במחזור החודשי</h3>
                <p class="text-on-surface-variant text-base">ניהול ומעקב אחר כל התנועות הכספיות שלך.</p>
            </div>

            <!-- Categories -->
            <div class="space-y-4">
                <h4 class="text-lg font-bold px-2">חלוקה לקטגוריות</h4>
                <div class="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-2">
                    <button onclick="updateTransactionFilter('category', 'all')" class="px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all shadow-sm ${selectedCategory === 'all' ? 'bg-primary text-white' : 'bg-white text-on-surface border border-surface-variant/30'}">הכל</button>
                    ${state.categories.map(cat => `
                        <button onclick="updateTransactionFilter('category', '${cat.name}')" class="px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all shadow-sm ${selectedCategory === cat.name ? 'bg-primary text-white' : 'bg-white text-on-surface border border-surface-variant/30'}">${cat.name}</button>
                    `).join('')}
                </div>
            </div>

            <!-- Filter Navigation -->
            <div class="flex bg-surface-variant/20 p-1.5 rounded-2xl">
                ${['all', 'fixed', 'variable', 'income', 'expense'].map(f => `
                    <button onclick="updateTransactionFilter('filter', '${f}')" class="flex-1 py-2.5 rounded-xl text-base font-bold transition-all ${filterType === f ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}">
                        ${f === 'all' ? 'הכל' : f === 'fixed' ? 'קבועות' : f === 'variable' ? 'משתנות' : f === 'income' ? 'הכנסות' : 'הוצאות'}
                    </button>
                `).join('')}
            </div>

            <!-- Transaction List -->
            <div class="space-y-4">
                ${categoryFiltered.length > 0 ? categoryFiltered.sort(compareTransactionsByDateDesc).map(t => {
                    const tDate = parseDateLocal(t.date);
                    const installmentBadge = getInstallmentBadgeText(t, tDate.getMonth(), tDate.getFullYear());
                    const displayName = t.name;
                    return `
                    <div onclick="renderTransactionModal(${JSON.stringify(t).replace(/"/g, '&quot;')})" class="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm border border-surface-variant/10 active:scale-[0.98] transition-all cursor-pointer">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-2xl ${TRANSACTION_TYPES[t.type].color.replace('text', 'bg')}/10 flex items-center justify-center ${TRANSACTION_TYPES[t.type].color}">
                                <span class="material-symbols-outlined text-2xl">${TRANSACTION_TYPES[t.type].icon}</span>
                            </div>
                            <div>
                                <p class="font-extrabold text-on-surface">${displayName}</p>
                                <div class="flex items-center gap-2">
                                    <span class="text-xs font-bold text-on-surface-variant uppercase opacity-70">${t.category || 'כללי'}</span>
                                    <span class="w-1 h-1 bg-surface-variant rounded-full"></span>
                                    <span class="text-xs font-bold text-on-surface-variant opacity-70">${t.date}</span>
                                    ${installmentBadge ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">תשלומים ${installmentBadge}</span>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="text-left">
                            <p class="font-black text-lg ${t.type === 'savings_deposit' ? 'text-blue-600' : (t.type.includes('income') ? 'text-emerald-600' : 'text-rose-600')}">
                                ${t.type.includes('income') ? '' : '-'}${formatCurrency(t.amount)}
                            </p>
                            ${(!t.isInstallments && t.isRecurring) ? '<span class="text-[8px] font-bold bg-surface-variant/30 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">קבוע</span>' : ''}
                        </div>
                    </div>
                `;}).join('') : `
                    <div class="text-center py-20 opacity-40">
                        <span class="material-symbols-outlined text-6xl mb-4">history</span>
                        <p class="font-bold">אין תנועות להצגה</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

function updateTransactionFilter(key, value) {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    urlParams.set(key, value);
    if (key === 'filter') urlParams.set('category', 'all'); // Reset category when changing main filter
    navigate(`/transactions?${urlParams.toString()}`);
}

function handleQuickAddFromHash() {
    const basePath = state.currentPath.split('?')[0];
    if (basePath !== '/transactions') return;

    const params = getHashParams();
    if (params.get('quickAdd') !== '1') return;

    const merchant = String(params.get('merchant') || '').trim();
    const amount = Number(params.get('amount') || 0);
    const date = String(params.get('date') || formatDateLocal(new Date())).trim();
    const type = String(params.get('type') || 'variable_expense').trim();
    const signature = [merchant, amount, date, type].join('|');

    if (!merchant || !amount || state.quickAddLastHandled === signature) return;
    state.quickAddLastHandled = signature;

    setTimeout(() => {
        renderTransactionModal({
            name: merchant,
            amount: amount,
            date: date,
            type: type,
            category: 'אחר',
            isRecurring: false,
            desc: merchant
        });
    }, 0);
}

function renderSavings() {
    const totalTarget = state.savingsGoals.reduce((acc, goal) => acc + goal.target, 0);
    const totalCurrent = state.savingsGoals.reduce((acc, goal) => acc + goal.current, 0);
    const totalRemaining = totalTarget - totalCurrent;
    const preconfiguredFunds = state.accountBalances.filter(acc => acc.type !== 'checking');

    const currentCycleTransactions = getFilteredTransactions('all');
    const monthlySavings = currentCycleTransactions
        .filter(t => t.type === 'savings_deposit')
        .reduce((acc, t) => acc + t.amount, 0);

    return `
        <div class="space-y-8 pb-10">
            <!-- Summary Section -->
            <section class="bg-primary rounded-3xl p-6 text-on-primary shadow-lg shadow-primary/20 relative overflow-hidden mt-4">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div class="relative z-10">
                    <p class="text-sm opacity-80 mb-1">סה״כ נחסך</p>
                    <h2 class="text-3xl font-bold mb-1">${formatCurrency(totalCurrent, false)}</h2>
                    <p class="text-[10px] opacity-70 mb-6">${totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0}% מהיעד הכולל</p>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                            <p class="text-[10px] opacity-80 uppercase tracking-wider mb-1">הוקצה החודש</p>
                            <p class="text-lg font-bold">${formatCurrency(monthlySavings, false)}</p>
                        </div>
                        <div class="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                            <p class="text-[10px] opacity-80 uppercase tracking-wider mb-1">נותר ליעד</p>
                            <p class="text-lg font-bold">${formatCurrency(totalRemaining, false)}</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Savings Goals List -->
            <section class="space-y-4">
                <div class="flex justify-between items-center px-2">
                    <h3 class="text-2xl font-extrabold tracking-tight">יעדי חיסכון</h3>
                    <button onclick="renderSavingsModal()" class="bg-primary text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2">
                        <span class="material-symbols-outlined text-lg">add</span>
                        <span>הוסף חיסכון</span>
                    </button>
                </div>
                
                <div class="space-y-4">
                    ${state.savingsGoals.map(goal => {
                        const progress = (goal.current / goal.target) * 100;
                        const startDate = goal.startDate ? new Date(goal.startDate) : new Date();
                        const remainingMonths = getGoalRemainingMonths(goal);
                        const elapsedMonths = Math.max(0, (new Date().getFullYear() - startDate.getFullYear()) * 12 + (new Date().getMonth() - startDate.getMonth()));
                        const totalPlanMonths = Math.max(1, elapsedMonths + remainingMonths);
                        const endDate = getGoalEstimatedEndDate(goal);
                        
                        const now = new Date();
                        const currentMonthStr = now.toLocaleDateString('he-IL', { month: 'short', year: '2-digit' });
                        const timeProgress = Math.min(100, Math.max(0, (elapsedMonths / totalPlanMonths) * 100));

                        return `
                            <div onclick="renderSavingsModal(${JSON.stringify(goal).replace(/"/g, '&quot;')})" class="bg-white p-6 rounded-3xl border border-surface-variant/30 shadow-sm space-y-6 group hover:border-primary/20 transition-colors relative overflow-hidden cursor-pointer active:scale-[0.98]">
                                <div class="flex justify-between items-start relative z-10">
                                    <div class="flex items-center gap-4">
                                        <div class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${goal.container} ${goal.onContainer}">
                                            <span class="material-symbols-outlined text-3xl">${goal.icon}</span>
                                        </div>
                                        <div>
                                            <h4 class="font-extrabold text-lg">${goal.name}</h4>
                                            <p class="text-xs text-on-surface-variant font-bold">${formatCurrency(goal.current)} מתוך ${formatCurrency(goal.target)}</p>
                                            ${goal.monthlyAmount ? `<p class="text-[10px] font-black mt-0.5 ${goal.color.replace('bg-', 'text-')}">הפקדה חודשית: ${formatCurrency(goal.monthlyAmount)}</p>` : ''}
                                        </div>
                                    </div>
                                    <div class="text-left">
                                        <span class="text-xs font-black px-3 py-1 rounded-full shadow-sm ${goal.container} ${goal.onContainer}">
                                            ${Math.round(progress)}%
                                        </span>
                                        <button onclick="handleExtraDepositClick(event, '${goal.id}')" class="mt-2 text-[10px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                            הפקדה נוספת
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="space-y-4 relative z-10">
                                    <div class="relative pt-4">
                                        <div class="h-3 w-full bg-surface-variant/20 rounded-full overflow-hidden">
                                            <div class="h-full rounded-full relative z-10 shadow-inner ${goal.color}" style="width: ${progress}%"></div>
                                        </div>
                                        <div class="absolute top-0 h-8 w-px bg-on-surface/30 z-20 flex flex-col items-center" style="right: ${timeProgress}%">
                                            <div class="w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm -mt-1 ${goal.color}"></div>
                                            <div class="mt-4 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-md whitespace-nowrap flex flex-col items-center gap-0.5 ${goal.color}">
                                                <span>${currentMonthStr}</span>
                                                <span class="text-[8px] opacity-80">${formatCurrency(goal.current)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter px-1 pt-2">
                                        <div class="flex flex-col items-start">
                                            <span class="opacity-50 mb-0.5">התחלה</span>
                                            <span>${startDate.toLocaleDateString('he-IL', { month: 'short', year: '2-digit' })}</span>
                                        </div>
                                        <div class="flex flex-col items-end">
                                            <span class="opacity-50 mb-0.5">סיום משוער</span>
                                            <span>${endDate.toLocaleDateString('he-IL', { month: 'short', year: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </section>

            ${preconfiguredFunds.length > 0 ? `
                <section class="space-y-4">
                    <div class="px-2">
                        <h3 class="text-xl font-extrabold tracking-tight">קופות קיימות</h3>
                        <p class="text-on-surface-variant text-sm">יתרות שהוגדרו מראש מתוך ההגדרות.</p>
                    </div>
                    <div class="space-y-3">
                        ${preconfiguredFunds.map(fund => `
                            <div class="bg-white p-5 rounded-3xl border border-surface-variant/30 shadow-sm">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                            <span class="material-symbols-outlined">account_balance</span>
                                        </div>
                                        <div>
                                            <p class="font-extrabold text-on-surface">${fund.name}</p>
                                            <p class="text-xs text-on-surface-variant">קופה שהוגדרה מראש</p>
                                        </div>
                                    </div>
                                    <p class="text-xl font-black text-primary">${formatCurrency(fund.amount)}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            ` : ''}
        </div>
    `;
}

function renderForecast() {
    const totalBalance = state.accountBalances.reduce((sum, acc) => sum + acc.amount, 0);
    const forecastData = generateForecastData();
    const yearEndTotal = forecastData[11].total;
    const growthPercent = ((yearEndTotal - totalBalance) / totalBalance * 100).toFixed(1);

    return `
        <div class="space-y-8 pb-10">
            <div class="flex flex-col gap-6">
                <div>
                    <h1 class="text-3xl font-extrabold text-on-surface tracking-tight mb-2">תחזית</h1>
                    <p class="text-on-surface-variant text-sm">ניתוח מעמיק של מסלול הצמיחה הפיננסי שלך ל-12 החודשים הקרובים.</p>
                </div>
                
                <!-- Summary Card -->
                <div class="bg-primary-container p-6 rounded-3xl shadow-sm flex flex-col gap-1">
                    <span class="text-on-primary-container font-semibold text-xs">צפי הון בעוד שנה (עו״ש + חסכונות)</span>
                    <div class="flex items-baseline gap-2">
                        <span class="text-3xl font-extrabold text-on-primary-container">${formatCurrency(yearEndTotal, true)}</span>
                        <span class="font-bold text-xs px-2 py-0.5 rounded-full ${parseFloat(growthPercent) >= 0 ? 'bg-white/30 text-on-primary-container' : 'bg-error/20 text-error'}">
                            ${parseFloat(growthPercent) >= 0 ? '+' : ''}${growthPercent}%
                        </span>
                    </div>
                </div>
            </div>

            <!-- Growth Chart -->
            <div class="space-y-4">
                <div class="px-2">
                    <h3 class="text-2xl font-bold">מגמת צמיחה משוערת</h3>
                    <p class="text-on-surface-variant text-sm">תחזית צמיחת הנכסים בעו״ש והחסכונות שלך ל-12 החודשים הקרובים.</p>
                </div>
                <div class="bg-white p-6 rounded-3xl border border-surface-variant/30 shadow-sm">
                    <div class="h-72 w-full">
                        <canvas id="growthChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Monthly Forecast List -->
            <div class="space-y-6">
                <h3 class="text-2xl font-bold px-2">פירוט חודשי צפוי</h3>
                <div class="space-y-4">
                    ${forecastData.map((item, index) => `
                        <div class="bg-white p-6 rounded-3xl border border-surface-variant/30 shadow-sm">
                            <div class="flex items-center justify-between mb-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <span class="material-symbols-outlined">calendar_today</span>
                                    </div>
                                    <h4 class="text-lg font-extrabold">${item.fullMonth}</h4>
                                </div>
                                <div class="text-left relative">
                                    <button onclick="toggleForecastTooltip('total-${index}')" class="text-left">
                                        <p class="text-sm font-bold text-primary/70 uppercase tracking-wider">יתרה סופית</p>
                                        <p class="text-2xl font-black text-primary leading-tight">${formatCurrency(item.total)}</p>
                                        <p class="text-xs text-primary/80 mt-1">
                                            עו״ש: ${formatCurrency(item.checking, false)} | חיסכון: ${formatCurrency(item.savings, false)}
                                        </p>
                                    </button>

                                    <!-- Tooltip -->
                                    <div class="absolute ${state.forecastTooltipOpen === `total-${index}` ? 'block' : 'hidden'} z-20 bottom-full left-0 mb-2 bg-surface-variant p-3 rounded-2xl shadow-xl border border-primary/20 min-w-[220px] text-right animate-in fade-in slide-in-from-bottom-1">
                                        <p class="font-bold text-xs border-b border-primary/10 pb-1 mb-2">חישוב יתרה</p>
                                        <div class="space-y-1.5">
                                            <div class="flex justify-between gap-4">
                                                <span class="text-primary font-bold">${formatCurrency(item.openingChecking)}</span>
                                                <span class="text-on-surface-variant opacity-70">עו״ש פתיחה:</span>
                                            </div>
                                            <div class="flex justify-between gap-4">
                                                <span class="text-primary font-bold">${formatCurrency(item.openingSavings)}</span>
                                                <span class="text-on-surface-variant opacity-70">חיסכון פתיחה:</span>
                                            </div>
                                            <div class="flex justify-between gap-4">
                                                <span class="${item.netChange >= 0 ? 'text-emerald-600' : 'text-rose-600'} font-bold">${item.netChange >= 0 ? '+' : ''}${formatCurrency(item.netChange)}</span>
                                                <span class="text-on-surface-variant opacity-70">שינוי נטו בעו״ש:</span>
                                            </div>
                                            <div class="flex justify-between gap-4">
                                                <span class="text-blue-600 font-bold">+${formatCurrency(item.saving)}</span>
                                                <span class="text-on-surface-variant opacity-70">הפרשה לחיסכון:</span>
                                            </div>
                                            <div class="pt-1 border-t border-primary/10 flex justify-between gap-4">
                                                <span class="text-primary font-black">${formatCurrency(item.total)}</span>
                                                <span class="text-on-surface-variant font-bold">סה״כ סופי:</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-2 pt-4 border-t border-surface-variant/10">
                                <div class="relative">
                                    <button onclick="toggleForecastTooltip('income-${index}')" class="text-right">
                                        <p class="text-sm font-bold text-on-surface-variant opacity-80 uppercase">הכנסות</p>
                                        <p class="text-lg font-black text-emerald-600">${formatCurrency(item.income)}</p>
                                    </button>
                                    
                                    <!-- Tooltip -->
                                    <div class="absolute ${state.forecastTooltipOpen === `income-${index}` ? 'block' : 'hidden'} z-20 bottom-full right-0 mb-2 bg-white p-3 rounded-2xl shadow-xl border border-emerald-100 min-w-[160px] text-right animate-in fade-in slide-in-from-bottom-1">
                                        <p class="font-bold text-[10px] text-emerald-700 border-b border-emerald-50 pb-1 mb-2">פירוט הכנסות</p>
                                        <div class="space-y-2">
                                            ${item.incomeItems.length > 0 ? item.incomeItems.map(ii => `
                                                <div class="flex justify-between items-center gap-2">
                                                    <span class="font-bold text-[10px] text-emerald-600">${formatCurrency(ii.amount)}</span>
                                                    <div class="text-right">
                                                        <p class="font-bold text-[9px] leading-tight">${ii.name}</p>
                                                        <p class="text-[8px] text-on-surface-variant opacity-60">${ii.date.split('-').reverse().slice(0,2).join('/')}</p>
                                                    </div>
                                                </div>
                                            `).join('') : '<p class="text-[9px] text-on-surface-variant italic">אין הכנסות החודש</p>'}
                                        </div>
                                    </div>
                                </div>
                                <div class="relative">
                                    <button onclick="toggleForecastTooltip('expense-${index}')" class="text-right">
                                        <p class="text-sm font-bold text-on-surface-variant opacity-80 uppercase">הוצאות</p>
                                        <p class="text-lg font-black text-rose-600">${formatCurrency(-item.expense)}</p>
                                    </button>
                                    
                                    <!-- Tooltip -->
                                    <div class="absolute ${state.forecastTooltipOpen === `expense-${index}` ? 'block' : 'hidden'} z-20 bottom-full right-1/2 translate-x-1/2 mb-2 bg-white p-3 rounded-2xl shadow-xl border border-rose-100 min-w-[160px] text-right animate-in fade-in slide-in-from-bottom-1">
                                        <p class="font-bold text-[10px] text-rose-700 border-b border-rose-50 pb-1 mb-2">פירוט הוצאות</p>
                                        <div class="space-y-2">
                                            ${item.expenseItems.length > 0 ? item.expenseItems.map(ei => `
                                                <div class="flex justify-between items-center gap-2">
                                                    <span class="font-bold text-[10px] text-rose-600">${formatCurrency(-ei.amount)}</span>
                                                    <div class="text-right">
                                                        <p class="font-bold text-[9px] leading-tight">${ei.name}</p>
                                                        <p class="text-[8px] text-on-surface-variant opacity-60">${ei.date.split('-').reverse().slice(0,2).join('/')} ${ei.installmentBadge ? `• תשלומים ${ei.installmentBadge}` : ''}</p>
                                                    </div>
                                                </div>
                                            `).join('') : '<p class="text-[9px] text-on-surface-variant italic">אין הוצאות החודש</p>'}
                                        </div>
                                    </div>
                                </div>
                                <div class="relative">
                                    <button onclick="toggleForecastTooltip('saving-${index}')" class="text-right">
                                        <p class="text-sm font-bold text-on-surface-variant opacity-80 uppercase">חיסכון</p>
                                        <p class="text-lg font-black text-blue-600">${formatCurrency(-item.saving)}</p>
                                    </button>
                                    
                                    <!-- Tooltip -->
                                    <div class="absolute ${state.forecastTooltipOpen === `saving-${index}` ? 'block' : 'hidden'} z-20 bottom-full left-0 mb-2 bg-white p-3 rounded-2xl shadow-xl border border-blue-100 min-w-[160px] text-right animate-in fade-in slide-in-from-bottom-1">
                                        <p class="font-bold text-[10px] text-blue-700 border-b border-blue-50 pb-1 mb-2">פירוט חיסכון</p>
                                        <div class="space-y-2">
                                            ${item.savingsItems.length > 0 ? item.savingsItems.map(si => `
                                                <div class="flex justify-between items-center gap-2">
                                                    <span class="font-bold text-[10px] text-blue-600">${formatCurrency(-si.amount)}</span>
                                                    <div class="text-right">
                                                        <p class="font-bold text-[9px] leading-tight">${si.name}</p>
                                                    </div>
                                                </div>
                                            `).join('') : '<p class="text-[9px] text-on-surface-variant italic">אין הפרשות החודש</p>'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function generateForecastData() {
    const data = [];
    let currentChecking = state.accountBalances
        .filter(a => a.type === 'checking')
        .reduce((s, a) => s + a.amount, 0);

    const existingSavingsFromAccounts = state.accountBalances
        .filter(a => a.type !== 'checking')
        .reduce((s, a) => s + a.amount, 0);

    const existingSavingsFromGoals = state.savingsGoals
        .reduce((s, g) => s + (Number(g.current) || 0), 0);

    let currentSavings = existingSavingsFromAccounts + existingSavingsFromGoals;
    
    const now = new Date();
    const startMonth = state.settings.startMonth !== undefined ? state.settings.startMonth - 1 : now.getMonth();
    const startYear = state.settings.startYear || now.getFullYear();
    const nowMonth = now.getMonth();
    const nowYear = now.getFullYear();

    function appliesByFrequency(transaction, monthIndex, year) {
        const freq = String(transaction.frequency || 'monthly');
        const tDate = new Date(transaction.date || `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`);
        const monthsDiff = (year - tDate.getFullYear()) * 12 + (monthIndex - tDate.getMonth());
        if (monthsDiff < 0) return false;

        if (freq === 'monthly') return true;
        if (freq === 'bi-monthly') return monthsDiff % 2 === 0;
        if (freq === 'quarterly') return monthsDiff % 3 === 0;
        if (freq === 'semi-annually') return monthsDiff % 6 === 0;
        if (freq === 'annually' || freq === 'annual') return monthsDiff % 12 === 0;
        return true;
    }

    function transactionAppliesForMonth(transaction, monthIndex, year) {
        const installmentStatus = getInstallmentStatus(transaction, monthIndex, year);
        if (installmentStatus.enabled) return installmentStatus.active;

        if (transaction.isRecurring) {
            return appliesByFrequency(transaction, monthIndex, year);
        }

        const tDate = new Date(transaction.date);
        return tDate.getMonth() === monthIndex && tDate.getFullYear() === year;
    }

    function goalAppliesForMonth(goal, monthIndex, year) {
        const monthly = Number(goal?.monthlyAmount) || 0;
        if (monthly <= 0) return false;
        const startDate = new Date(goal?.startDate || `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`);
        const monthsPassed = (year - startDate.getFullYear()) * 12 + (monthIndex - startDate.getMonth());
        if (monthsPassed < 0) return false;
        const effectiveDuration = getGoalRemainingMonths(goal);
        return monthsPassed < effectiveDuration;
    }

    function getCanonicalSavingsTransactions() {
        const recurringByGoalId = new Map();
        const direct = [];

        state.transactions.forEach((t) => {
            if (!t || t.type !== 'savings_deposit') return;
            if (Number(t.amount) <= 0) return;

            const goalId = String(t.goalId || '').trim();
            if (t.isRecurring && goalId) {
                // Keep latest occurrence for each goal (legacy duplicate safety).
                recurringByGoalId.set(goalId, t);
                return;
            }

            direct.push(t);
        });

        return {
            direct,
            recurringByGoalId
        };
    }

    function isRecurringSavingsSkippedForMonth(transaction, monthIndex, year) {
        if (!transaction || !transaction.isRecurring) return false;
        const skipped = getSkippedCycleSetFromTransaction(transaction);
        if (!skipped.size) return false;
        const cycleKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
        return skipped.has(cycleKey);
    }

    const canonicalSavings = getCanonicalSavingsTransactions();

    for (let i = 0; i < 12; i++) {
        const forecastDate = new Date(startYear, startMonth + i, 1);
        const monthIndex = forecastDate.getMonth();
        const year = forecastDate.getFullYear();
        
        const incomeItems = [];
        const fixedIncome = state.transactions
            .filter(t => t.type === 'fixed_income')
            .reduce((sum, t) => {
                if (appliesByFrequency(t, monthIndex, year)) {
                    incomeItems.push({ name: t.name, amount: t.amount, date: t.date });
                    return sum + t.amount;
                }
                return sum;
            }, 0);

        // Include additional (non-fixed) incomes only in their exact month.
        const variableIncome = state.transactions
            .filter(t => t.type === 'variable_income')
            .reduce((sum, t) => {
                const tDate = new Date(t.date);
                if (tDate.getMonth() === monthIndex && tDate.getFullYear() === year) {
                    incomeItems.push({ name: t.name, amount: t.amount, date: t.date });
                    return sum + t.amount;
                }
                return sum;
            }, 0);
            
        const expenseItems = [];
        const fixedExpenses = state.transactions
            .filter(t => t.type === 'fixed_expense')
            .reduce((sum, t) => {
                if (transactionAppliesForMonth(t, monthIndex, year)) {
                    const installmentBadge = getInstallmentBadgeText(t, monthIndex, year);
                    expenseItems.push({
                        name: t.name,
                        installmentBadge: installmentBadge,
                        amount: t.amount,
                        date: t.date
                    });
                    return sum + t.amount;
                }
                return sum;
            }, 0);

        // Include known variable expenses in their exact month (especially current month expectations).
        const variableExpenses = state.transactions
            .filter(t => t.type === 'variable_expense')
            .reduce((sum, t) => {
                if (transactionAppliesForMonth(t, monthIndex, year)) {
                    const installmentBadge = getInstallmentBadgeText(t, monthIndex, year);
                    expenseItems.push({
                        name: t.name,
                        installmentBadge: installmentBadge,
                        amount: t.amount,
                        date: t.date
                    });
                    return sum + t.amount;
                }
                return sum;
            }, 0);
            
        const savingsItems = [];

        // Source of truth:
        // 1) recurring savings transactions linked to goals (canonical, deduped by goalId)
        // 2) direct savings transactions (one-time or recurring without goalId)
        // 3) fallback to goal.monthlyAmount only when no recurring tx exists for that goal
        let savingsDepositFromTransactions = 0;

        canonicalSavings.recurringByGoalId.forEach((t, goalId) => {
            const goal = state.savingsGoals.find((g) => String(g.id) === String(goalId));
            if (goal && !goalAppliesForMonth(goal, monthIndex, year)) return;
            if (isRecurringSavingsSkippedForMonth(t, monthIndex, year)) return;
            if (!appliesByFrequency({ ...t, frequency: t.frequency || 'monthly' }, monthIndex, year)) return;
            savingsItems.push({ name: t.name, amount: t.amount });
            savingsDepositFromTransactions += t.amount;
        });

        canonicalSavings.direct.forEach((t) => {
            if (t.isRecurring) {
                if (isRecurringSavingsSkippedForMonth(t, monthIndex, year)) return;
                if (!appliesByFrequency({ ...t, frequency: t.frequency || 'monthly' }, monthIndex, year)) return;
                savingsItems.push({ name: t.name, amount: t.amount });
                savingsDepositFromTransactions += t.amount;
                return;
            }

            const tDate = new Date(t.date);
            const exactMonth = tDate.getMonth() === monthIndex && tDate.getFullYear() === year;
            if (!exactMonth) return;
            savingsItems.push({ name: t.name, amount: t.amount });
            savingsDepositFromTransactions += t.amount;
        });

        const savingsDepositFromGoalsFallback = state.savingsGoals.reduce((sum, goal) => {
            const gid = String(goal.id || '').trim();
            if (!gid) return sum;
            if (canonicalSavings.recurringByGoalId.has(gid)) return sum;
            if (!goalAppliesForMonth(goal, monthIndex, year)) return sum;

            const monthly = Number(goal.monthlyAmount) || 0;
            if (monthly <= 0) return sum;
            savingsItems.push({ name: `הפקדה: ${goal.name}`, amount: monthly });
            return sum + monthly;
        }, 0);

        if (i === 0) {
            if (existingSavingsFromAccounts > 0) {
                savingsItems.unshift({ name: 'יתרות חיסכון קיימות (קופות/חשבונות)', amount: existingSavingsFromAccounts });
            }
            if (existingSavingsFromGoals > 0) {
                savingsItems.unshift({ name: 'סכום התחלתי ביעדי חיסכון', amount: existingSavingsFromGoals });
            }
        }
        
        const incomeTotal = fixedIncome + variableIncome;
        const expenseTotal = fixedExpenses + variableExpenses;
        const savingsDeposit = savingsDepositFromTransactions + savingsDepositFromGoalsFallback;
        const monthlyNet = incomeTotal - expenseTotal - savingsDeposit;
        const openingChecking = currentChecking;
        const openingSavings = currentSavings;
        const prevChecking = currentChecking;
        currentChecking += monthlyNet;
        currentSavings += savingsDeposit;
        
        data.push({
            month: forecastDate.toLocaleString('he-IL', { month: 'short' }),
            fullMonth: forecastDate.toLocaleString('he-IL', { month: 'long', year: 'numeric' }),
            income: incomeTotal,
            expense: expenseTotal,
            saving: savingsDeposit,
            checking: currentChecking,
            savings: currentSavings,
            total: currentChecking + currentSavings,
            incomeItems,
            expenseItems,
            savingsItems,
            openingChecking,
            openingSavings,
            prevTotal: prevChecking + (currentSavings - savingsDeposit),
            netChange: monthlyNet
        });
    }
    return data;
}

function renderSettings() {
    const fixedExpenses = state.transactions.filter(t => t.type === 'fixed_expense' || (t.type === 'variable_expense' && t.isRecurring));
    const fixedIncome = state.transactions.filter(t => t.type === 'fixed_income');

    return `
        <div class="space-y-8 pb-10">
            <!-- Profile Header -->
            <section class="flex flex-col items-center text-center space-y-4 py-4">
                <div class="relative group">
                    <div class="relative w-24 h-24 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                        <img id="profile-img-preview" alt="Profile" class="w-full h-full object-cover" src="${state.settings.profileImage}" referrerPolicy="no-referrer">
                    </div>
                    <button onclick="document.getElementById('profile-upload').click()" class="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-lg">
                        <span class="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <input type="file" id="profile-upload" class="hidden" accept="image/*" onchange="handleProfileImageUpload(event)">
                </div>
                <div class="flex flex-col items-center">
                    <h2 class="text-2xl font-extrabold tracking-tight">${state.settings.userName}</h2>
                    <p class="text-on-surface-variant text-sm font-medium">${state.settings.email || 'yonatan.i@example.com'}</p>
                </div>
            </section>

            <!-- Monthly Cycle Settings -->
            <section class="space-y-4">
                <div class="flex items-center gap-2 mb-2">
                    <span class="material-symbols-outlined text-primary">calendar_month</span>
                    <h3 class="text-lg font-bold">מחזור חודשי</h3>
                </div>
                <div class="bg-surface-variant/10 rounded-3xl p-6 space-y-6 border border-surface-variant/30">
                    <div>
                        <label class="text-sm font-bold text-on-surface-variant mb-4 block">יום תחילת החודש התקציבי</label>
                        <div class="grid grid-cols-4 gap-3">
                            ${[1, 2, 10, 15].map(day => `
                                <button onclick="updateCycleStartDay(${day})" class="py-3 rounded-xl font-bold transition-all shadow-sm ${state.settings.cycleStartDay === day ? 'bg-primary text-white' : 'bg-white text-on-surface hover:bg-surface-variant/20'}">
                                    ${day}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </section>

            <!-- Account Balances -->
            <section class="space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">account_balance</span>
                        <h3 class="text-lg font-bold">יתרות חשבון וחסכונות</h3>
                    </div>
                    <button onclick="renderAccountModal()" class="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
                        <span class="material-symbols-outlined text-sm">add_circle</span>
                        הוספת חשבון
                    </button>
                </div>
                <div class="space-y-3">
                    ${state.accountBalances.map(acc => `
                        <div onclick="renderAccountModal(${JSON.stringify(acc).replace(/"/g, '&quot;')})" class="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-surface-variant/30 cursor-pointer active:scale-[0.98] transition-all">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <span class="material-symbols-outlined">${acc.type === 'checking' ? 'account_balance' : 'savings'}</span>
                                </div>
                                <div>
                                    <p class="font-bold">${acc.name}</p>
                                    <p class="text-[10px] text-on-surface-variant">עודכן לאחרונה: ${new Date(acc.lastUpdated).toLocaleDateString('he-IL')}</p>
                                </div>
                            </div>
                            <span class="font-extrabold text-primary text-lg">${formatCurrency(acc.amount)}</span>
                        </div>
                    `).join('')}
                </div>
            </section>

            <!-- Fixed Income -->
            <section class="space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">payments</span>
                        <h3 class="text-lg font-bold">הכנסות קבועות</h3>
                    </div>
                    <button onclick="renderTransactionModal({ type: 'fixed_income' })" class="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
                        <span class="material-symbols-outlined text-sm">add_circle</span>
                        הוספת הכנסה
                    </button>
                </div>
                <div class="space-y-3">
                    ${fixedIncome.map(item => `
                        <div onclick="renderTransactionModal(${JSON.stringify(item).replace(/"/g, '&quot;')})" class="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border-r-4 border-primary cursor-pointer active:scale-[0.98] transition-all">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <span class="material-symbols-outlined">work</span>
                                </div>
                                <div>
                                    <p class="font-bold">${item.name}</p>
                                    <p class="text-xs text-on-surface-variant">${item.desc || 'הכנסה קבועה'}</p>
                                </div>
                            </div>
                            <span class="font-extrabold text-primary text-lg">${formatCurrency(item.amount)}</span>
                        </div>
                    `).join('')}
                </div>
            </section>

            <!-- Fixed Expenses -->
            <section class="space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-rose-600">receipt_long</span>
                        <h3 class="text-lg font-bold">הוצאות קבועות ומתעדכנות</h3>
                    </div>
                    <button onclick="renderTransactionModal({ type: 'fixed_expense' })" class="text-rose-600 font-bold text-sm flex items-center gap-1 hover:underline">
                        <span class="material-symbols-outlined text-sm">add_circle</span>
                        הוספת הוצאה
                    </button>
                </div>
                <div class="space-y-3">
                    ${fixedExpenses.map(item => {
                        const cycleStart = getCycleDates().start;
                        const installmentBadge = getInstallmentBadgeText(item, cycleStart.getMonth(), cycleStart.getFullYear());
                        const displayName = item.name;
                        return `
                        <div onclick="renderTransactionModal(${JSON.stringify(item).replace(/"/g, '&quot;')})" class="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-surface-variant/30 cursor-pointer active:scale-[0.98] transition-all">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                                    <span class="material-symbols-outlined">home</span>
                                </div>
                                <div>
                                    <p class="font-bold">${displayName}</p>
                                    <div class="flex items-center gap-2">
                                        ${item.isInstallments && installmentBadge
                                            ? `<span class="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-full font-bold">תשלומים ${installmentBadge}</span>`
                                            : `<span class="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] rounded-full font-bold">${((FREQUENCIES[item?.frequency]) || { label: 'חודשי' }).label}</span>`}
                                        ${item.type === 'variable_expense' ? '<span class="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-full font-bold">הוצאה משתנה מחזורית</span>' : ''}
                                        ${item.alert ? '<span class="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] rounded-full font-bold">תזכורת פעילה</span>' : ''}
                                        ${item.isVariablePrice ? '<span class="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] rounded-full font-bold">מחיר משתנה</span>' : ''}
                                    </div>
                                </div>
                            </div>
                            <p class="font-extrabold text-rose-600 text-lg">${formatCurrency(item.amount)}</p>
                        </div>
                    `;}).join('')}
                </div>
            </section>

            ${state.settings.householdMode === 'family' ? `
                <section class="space-y-3">
                    <button onclick="togglePartnerInvitePanel()" class="w-full bg-surface-variant/10 border border-surface-variant/30 rounded-2xl px-4 py-3 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary">group_add</span>
                            <span class="font-bold">הזמנת בן/בת זוג לחשבון</span>
                        </div>
                        <span class="material-symbols-outlined text-on-surface-variant">${state.partnerInviteExpanded ? 'expand_less' : 'expand_more'}</span>
                    </button>

                    ${state.partnerInviteExpanded ? `
                        <div class="bg-surface-variant/10 rounded-3xl p-6 space-y-4 border border-surface-variant/30">
                            <p class="text-sm text-on-surface-variant">אפשר לשלוח הזמנה ישירות בוואטסאפ כדי להתחבר לאותה מערכת נתונים.</p>
                            <div class="space-y-2">
                                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">מספר טלפון</label>
                                <input type="tel" id="partner-phone-input" dir="ltr" value="${state.settings.partnerPhone || ''}" placeholder="05XXXXXXXX" class="w-full h-14 px-4 rounded-2xl bg-white border-2 border-transparent focus:border-primary outline-none transition-all">
                            </div>
                            <button onclick="sendPartnerInvite()" class="w-full h-12 bg-primary text-white rounded-xl font-bold">
                                שליחת הזמנה בוואטסאפ
                            </button>
                        </div>
                    ` : ''}
                </section>
            ` : ''}

            <button onclick="logout()" class="w-full bg-rose-50 text-rose-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:bg-rose-100 transition-all mt-6">
                <span class="material-symbols-outlined">logout</span>
                התנתקות מהמערכת
            </button>
        </div>
    `;
}

function toggleForecastTooltip(key) {
    state.forecastTooltipOpen = state.forecastTooltipOpen === key ? null : key;
    render();
}

async function updateCycleStartDay(day) {
    state.settings.cycleStartDay = day;
    localStorage.setItem('budget_settings', JSON.stringify(state.settings));
    await saveDataToGAS('updateSettings', state.settings, { showLoading: true });
}

function switchHomeChart(type) {
    state.activeHomeChart = type;
    render();
}

function togglePartnerInvitePanel() {
    state.partnerInviteExpanded = !state.partnerInviteExpanded;
    render();
}

function logout() {
    state.settings.scriptUrl = '';
    state.settings.secretKey = '';
    state.isAuthenticated = false;
    localStorage.removeItem('budget_settings');
    render();
}

function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64 = e.target.result;
            state.settings.profileImage = base64;
            localStorage.setItem('budget_settings', JSON.stringify(state.settings));
            saveDataToGAS('updateSettings', state.settings); // Save settings to GAS
            render();
        };
        reader.readAsDataURL(file);
    }
}

function normalizePhoneForWhatsApp(rawPhone) {
    const digits = String(rawPhone || '').replace(/[^\d]/g, '');
    if (!digits) return '';
    if (digits.startsWith('972')) return digits;
    if (digits.startsWith('0')) return `972${digits.slice(1)}`;
    return digits;
}

function isValidIsraeliPhone(rawPhone) {
    const digits = String(rawPhone || '').replace(/[^\d]/g, '');
    if (!digits) return false;
    if (digits.startsWith('05') && digits.length === 10) return true;
    if (digits.startsWith('9725') && digits.length === 12) return true;
    return false;
}

function sendPartnerInvite() {
    const input = document.getElementById('partner-phone-input');
    const rawPhone = input ? input.value : (state.settings.partnerPhone || '');
    const normalizedPhone = normalizePhoneForWhatsApp(rawPhone);

    state.settings.partnerPhone = rawPhone || '';
    localStorage.setItem('budget_settings', JSON.stringify(state.settings));
    saveDataToGAS('updateSettings', state.settings);

    if (!isValidIsraeliPhone(rawPhone) || !normalizedPhone) {
        alert('נא להזין מספר ישראלי תקין (למשל 05XXXXXXXX).');
        return;
    }
    if (!state.settings.scriptUrl || !state.settings.secretKey) {
        alert('כדי לשלוח הזמנה צריך קודם להגדיר Script URL ו-Secret Key.');
        return;
    }

    const appBaseUrl = `${window.location.origin}${window.location.pathname}`;
    const form = new URLSearchParams();
    form.set('secret', state.settings.secretKey);
    form.set('action', 'createInviteToken');
    form.set('payload', JSON.stringify({
        appBaseUrl,
        partnerPhone: rawPhone,
        scriptUrl: state.settings.scriptUrl
    }));

    fetch(state.settings.scriptUrl, { method: 'POST', body: form })
        .then(res => res.json())
        .then(result => {
            if (!result || !result.ok || !result.loginLink) {
                throw new Error((result && result.message) || 'Failed to create invite token');
            }

            const message = [
                `היי! הוזמנת להצטרף לחשבון BudgetPro המשפחתי שלנו.`,
                ``,
                `כניסה מהירה (טוקן חד-פעמי):`,
                `${result.loginLink}`,
                ``,
                `פותחים את הקישור ולוחצים התחברות.`
            ].join('\n');

            const waUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
            window.open(waUrl, '_blank');
        })
        .catch((err) => {
            console.error('Invite token creation failed:', err);
            alert('לא הצלחנו ליצור הזמנה מאובטחת כרגע. נסה/י שוב בעוד רגע.');
        });
}

async function resolveInviteTokenIfPresent() {
    const prefill = getLoginPrefillFromHash();
    if (!prefill.inviteToken || !prefill.backend) return;

    try {
        const url = `${prefill.backend}?action=resolveInviteToken&token=${encodeURIComponent(prefill.inviteToken)}`;
        const res = await fetch(url);
        const result = await res.json();
        if (!result || !result.ok) {
            throw new Error((result && result.message) || 'Invalid invite token');
        }

        const scriptInput = document.getElementById('scriptUrl');
        const secretInput = document.getElementById('secretKey');
        if (scriptInput && secretInput) {
            scriptInput.value = result.scriptUrl || prefill.backend;
            secretInput.value = result.secretKey || '';
        }
    } catch (err) {
        console.error('Failed to resolve invite token:', err);
        alert('לינק ההזמנה לא תקין או שפג תוקפו.');
    }
}

function renderLogin() {
    const prefill = getLoginPrefillFromHash();
    return `
        <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
            <div class="w-full max-w-sm space-y-8">
                <div class="text-center">
                    <div class="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center text-on-primary mx-auto mb-6 shadow-xl shadow-primary/20">
                        <span class="material-symbols-outlined text-4xl">account_balance_wallet</span>
                    </div>
                    <h1 class="text-3xl font-bold text-primary mb-2">BudgetPro</h1>
                    <p class="text-on-surface-variant">התחבר למערכת ניהול התקציב שלך</p>
                </div>

                <div class="space-y-4">
                    <div class="space-y-2">
                        <label class="text-sm font-medium px-1">כתובת Script</label>
                        <input type="text" id="scriptUrl" value="${escapeHtmlAttr(prefill.scriptUrl || '')}" placeholder="https://script.google.com/..." class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-medium px-1">מפתח סודי</label>
                        <input type="password" id="secretKey" value="${escapeHtmlAttr(prefill.secretKey || '')}" placeholder="••••••••" class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                    </div>
                    <button onclick="handleLogin()" class="w-full h-14 bg-primary text-on-primary rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4">
                        התחברות
                    </button>
                </div>
            </div>
        </div>
    `;
}

function saveOnboardingDraft() {
    localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({
        step: state.onboardingStep,
        data: state.onboardingData
    }));
}

function updateOnboardingField(field, value) {
    state.onboardingData[field] = value;
    saveOnboardingDraft();
}

function selectOnboardingProfile(type) {
    state.onboardingData.profileType = type;
    saveOnboardingDraft();
    render();
}

function prevOnboardingStep() {
    state.onboardingStep = Math.max(0, state.onboardingStep - 1);
    saveOnboardingDraft();
    render();
}

function nextOnboardingStep() {
    if (state.onboardingStep === 1 && !String(state.onboardingData.name || '').trim()) {
        alert('כדי להמשיך, צריך שם קטן להיכרות.');
        return;
    }
    if (state.onboardingStep === 2 && !state.onboardingData.profileType) {
        alert('בחר/י סוג ניהול כדי שנתאים את החוויה.');
        return;
    }
    state.onboardingStep = Math.min(5, state.onboardingStep + 1);
    saveOnboardingDraft();
    render();
}

function finishOnboarding() {
    const name = String(state.onboardingData.name || '').trim() || 'משתמש';
    const cycleStartDay = Math.max(1, Math.min(28, Number(state.onboardingData.cycleStartDay) || 1));
    const checkingBalance = Number(state.onboardingData.checkingBalance) || 0;
    const fixedIncome = Number(state.onboardingData.fixedIncome) || 0;
    const spouseSalary = Number(state.onboardingData.spouseSalary) || 0;
    const fixedExpense = Number(state.onboardingData.fixedExpense) || 0;
    const today = formatDateLocal(new Date());

    state.settings.userName = name;
    state.settings.cycleStartDay = cycleStartDay;
    state.settings.householdMode = state.onboardingData.profileType || 'personal';
    state.settings.partnerPhone = state.onboardingData.partnerPhone || '';

    // Initialize first-run data from the onboarding answers.
    state.transactions = [];
    state.savingsGoals = [];
    state.accountBalances = [];

    if (checkingBalance > 0) {
        state.accountBalances.push({
            id: `acc-${Date.now()}`,
            name: 'חשבון עו״ש ראשי',
            amount: checkingBalance,
            type: 'checking',
            lastUpdated: new Date().toISOString()
        });
    }

    if (fixedIncome > 0) {
        state.transactions.push({
            id: `tx-inc-${Date.now()}`,
            name: 'הכנסה חודשית קבועה',
            amount: fixedIncome,
            type: 'fixed_income',
            date: today,
            category: 'משכורת',
            isRecurring: true,
            frequency: 'monthly',
            desc: 'הוגדר בשלב ההיכרות'
        });
    }

    if (spouseSalary > 0) {
        state.transactions.push({
            id: `tx-spouse-inc-${Date.now() + 2}`,
            name: 'משכורת בן/בת זוג',
            amount: spouseSalary,
            type: 'fixed_income',
            date: today,
            category: 'משכורת',
            isRecurring: true,
            frequency: 'monthly',
            desc: 'הוגדר בשלב ההיכרות'
        });
    }

    if (fixedExpense > 0) {
        state.transactions.push({
            id: `tx-exp-${Date.now() + 1}`,
            name: 'הוצאה חודשית קבועה',
            amount: fixedExpense,
            type: 'fixed_expense',
            date: today,
            category: 'מגורים',
            isRecurring: true,
            frequency: 'monthly',
            desc: 'הוגדר בשלב ההיכרות'
        });
    }

    localStorage.setItem('budget_settings', JSON.stringify(state.settings));
    localStorage.setItem(ONBOARDING_DONE_KEY, '1');
    localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    navigate('/login');
}

function renderOnboarding() {
    const step = state.onboardingStep;
    const progress = ((step + 1) / 6) * 100;

    const stepContent = (() => {
        if (step === 0) {
            return `
                <div class="space-y-6 text-center">
                    <div class="w-20 h-20 rounded-3xl bg-primary/15 mx-auto flex items-center justify-center text-primary">
                        <span class="material-symbols-outlined text-5xl">waving_hand</span>
                    </div>
                    <div>
                        <h1 class="text-3xl font-black text-on-surface">ברוכים הבאים ל-BudgetPro</h1>
                        <p class="text-on-surface-variant mt-2">כמה מסכים קלילים ונגדיר הכל יחד תוך דקה.</p>
                    </div>
                    <button onclick="nextOnboardingStep()" class="w-full h-14 bg-primary text-on-primary rounded-2xl font-bold text-lg shadow-lg shadow-primary/20">יאללה מתחילים</button>
                </div>
            `;
        }

        if (step === 1) {
            return `
                <div class="space-y-6">
                    <h2 class="text-2xl font-black">היי, מה שמך?</h2>
                    <p class="text-on-surface-variant">אנחנו רוצים להכיר אותך כדי להתאים את המערכת אישית.</p>
                    <input type="text" value="${state.onboardingData.name || ''}" oninput="updateOnboardingField('name', this.value)" placeholder="למשל: דניאל" class="w-full h-14 px-4 rounded-2xl bg-white border-2 border-surface-variant/40 focus:border-primary outline-none transition-all">
                </div>
            `;
        }

        if (step === 2) {
            return `
                <div class="space-y-6">
                    <h2 class="text-2xl font-black">איך ננהל את הכסף?</h2>
                    <p class="text-on-surface-variant">זה יעזור לנו לכוון את הדשבורד והסיכומים.</p>
                    <div class="grid grid-cols-1 gap-3">
                        <button onclick="selectOnboardingProfile('family')" class="p-5 rounded-2xl border-2 text-right transition-all ${state.onboardingData.profileType === 'family' ? 'border-primary bg-primary/10' : 'border-surface-variant/30 bg-white'}">
                            <p class="font-extrabold">אני כאן כדי לנהל תא משפחתי</p>
                            <p class="text-xs text-on-surface-variant mt-1">יותר דגש על תכנון משותף ויעדים משפחתיים.</p>
                        </button>
                        <button onclick="selectOnboardingProfile('personal')" class="p-5 rounded-2xl border-2 text-right transition-all ${state.onboardingData.profileType === 'personal' ? 'border-primary bg-primary/10' : 'border-surface-variant/30 bg-white'}">
                            <p class="font-extrabold">אני כאן כדי לנהל את התזרים האישי שלי</p>
                            <p class="text-xs text-on-surface-variant mt-1">יותר פוקוס על הכנסות, הוצאות ועמידה ביעדים.</p>
                        </button>
                    </div>

                    ${state.onboardingData.profileType === 'family' ? `
                        <div class="space-y-3 pt-2">
                            <p class="font-bold text-sm">תרצה/י להוסיף בן/בת זוג ולהזמין אותו/ה בהמשך?</p>
                            <div class="grid grid-cols-2 gap-3">
                                <button onclick="updateOnboardingField('invitePartner','yes'); render();" class="h-12 rounded-xl border-2 font-bold ${state.onboardingData.invitePartner === 'yes' ? 'border-primary bg-primary/10' : 'border-surface-variant/30 bg-white'}">כן</button>
                                <button onclick="updateOnboardingField('invitePartner','no'); render();" class="h-12 rounded-xl border-2 font-bold ${state.onboardingData.invitePartner === 'no' ? 'border-primary bg-primary/10' : 'border-surface-variant/30 bg-white'}">לא</button>
                            </div>
                            ${state.onboardingData.invitePartner === 'yes' ? `
                                <input type="tel" dir="ltr" value="${state.onboardingData.partnerPhone || ''}" oninput="updateOnboardingField('partnerPhone', this.value)" placeholder="טלפון בן/בת זוג (למשל 05XXXXXXXX)" class="w-full h-12 px-3 rounded-xl bg-white border border-surface-variant/40 outline-none focus:border-primary">
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        if (step === 3) {
            return `
                <div class="space-y-6">
                    <h2 class="text-2xl font-black">איך האפליקציה תעזור לך?</h2>
                    <div class="space-y-3">
                        <div class="p-4 rounded-2xl bg-white border border-surface-variant/30">
                            <p class="font-bold">תזרים חודשי חכם</p>
                            <p class="text-xs text-on-surface-variant">כמה נכנס, כמה יוצא, וכמה נשאר לבזבוז בכל מחזור.</p>
                        </div>
                        <div class="p-4 rounded-2xl bg-white border border-surface-variant/30">
                            <p class="font-bold">תחזית קדימה</p>
                            <p class="text-xs text-on-surface-variant">תמונת מצב עתידית עם הכנסות צפויות, הוצאות והפקדות לחיסכון.</p>
                        </div>
                        <div class="p-4 rounded-2xl bg-white border border-surface-variant/30">
                            <p class="font-bold">ניהול יעדי חיסכון</p>
                            <p class="text-xs text-on-surface-variant">מעקב יעד, הפקדות אוטומטיות והפקדות נוספות בכל רגע.</p>
                        </div>
                    </div>
                </div>
            `;
        }

        if (step === 4) {
            return `
                <div class="space-y-5">
                    <h2 class="text-2xl font-black">שאלון קצר להתחלה</h2>
                    <p class="text-on-surface-variant text-sm">הנתונים האלו יתנו בסיס ראשוני לתזרים ולתחזית.</p>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-1 col-span-2">
                            <label class="text-xs font-bold text-on-surface-variant">יום תחילת מחזור (כמו בהגדרות)</label>
                            <div class="grid grid-cols-4 gap-2">
                                ${[1,2,10,15].map(day => `
                                    <button type="button" onclick="updateOnboardingField('cycleStartDay', ${day}); render();" class="h-11 rounded-xl font-bold border transition-all ${Number(state.onboardingData.cycleStartDay || 1) === day ? 'bg-primary text-white border-primary' : 'bg-white border-surface-variant/40'}">${day}</button>
                                `).join('')}
                            </div>
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-bold text-on-surface-variant">יתרת עו״ש נוכחית</label>
                            <input type="number" min="0" value="${state.onboardingData.checkingBalance || ''}" oninput="updateOnboardingField('checkingBalance', this.value)" class="w-full h-12 px-3 rounded-xl bg-white border border-surface-variant/40 outline-none focus:border-primary">
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-bold text-on-surface-variant">הכנסה חודשית קבועה</label>
                            <input type="number" min="0" value="${state.onboardingData.fixedIncome || ''}" oninput="updateOnboardingField('fixedIncome', this.value)" class="w-full h-12 px-3 rounded-xl bg-white border border-surface-variant/40 outline-none focus:border-primary">
                        </div>
                        ${state.onboardingData.profileType === 'family' ? `
                            <div class="space-y-1 col-span-2">
                                <label class="text-xs font-bold text-on-surface-variant">שכר בן/בת זוג (אם יש)</label>
                                <input type="number" min="0" value="${state.onboardingData.spouseSalary || ''}" oninput="updateOnboardingField('spouseSalary', this.value)" class="w-full h-12 px-3 rounded-xl bg-white border border-surface-variant/40 outline-none focus:border-primary">
                            </div>
                        ` : ''}
                        <div class="space-y-1">
                            <label class="text-xs font-bold text-on-surface-variant">הוצאה חודשית קבועה</label>
                            <input type="number" min="0" value="${state.onboardingData.fixedExpense || ''}" oninput="updateOnboardingField('fixedExpense', this.value)" class="w-full h-12 px-3 rounded-xl bg-white border border-surface-variant/40 outline-none focus:border-primary">
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="space-y-6 text-center">
                <div class="w-20 h-20 rounded-3xl bg-emerald-100 mx-auto flex items-center justify-center text-emerald-600">
                    <span class="material-symbols-outlined text-5xl">check_circle</span>
                </div>
                <div>
                    <h2 class="text-3xl font-black">איזה כיף, סיימנו!</h2>
                    <p class="text-on-surface-variant mt-2">יצרנו בסיס התחלתי. בשלב הבא רק מתחברים לנתונים שלך ומתחילים לעבוד.</p>
                </div>
                <button onclick="finishOnboarding()" class="w-full h-14 bg-primary text-on-primary rounded-2xl font-bold text-lg shadow-lg shadow-primary/20">לעמוד ההתחברות</button>
            </div>
        `;
    })();

    return `
        <div class="min-h-screen bg-gradient-to-b from-background to-primary-container/20 px-4 py-6">
            <div class="max-w-2xl mx-auto">
                <div class="h-2 w-full bg-white/70 rounded-full overflow-hidden mb-6 border border-surface-variant/20">
                    <div class="h-full bg-primary transition-all duration-500" style="width: ${progress}%"></div>
                </div>

                <div class="bg-white/90 backdrop-blur-sm rounded-[2rem] p-6 md:p-8 border border-surface-variant/30 shadow-xl min-h-[68vh] flex flex-col justify-between">
                    <div class="transition-all duration-300 ease-out translate-y-0 opacity-100">
                        ${stepContent}
                    </div>

                    <div class="pt-6 flex items-center justify-between">
                        <button onclick="prevOnboardingStep()" class="h-11 px-4 rounded-xl border border-surface-variant/40 font-bold ${step === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}">חזרה</button>
                        <span class="text-xs text-on-surface-variant font-bold">שלב ${step + 1} מתוך 6</span>
                        <button onclick="nextOnboardingStep()" class="h-11 px-5 rounded-xl bg-primary text-white font-bold ${step === 5 ? 'opacity-0 pointer-events-none' : 'opacity-100'}">המשך</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- API Communication ---
function applyBootstrapData(result) {
    const applyStart = perfNow();
    if (!result || !result.ok) return false;
    const hasStateShape = (
        Object.prototype.hasOwnProperty.call(result, 'transactions') ||
        Object.prototype.hasOwnProperty.call(result, 'savingsGoals') ||
        Object.prototype.hasOwnProperty.call(result, 'accountBalances') ||
        Object.prototype.hasOwnProperty.call(result, 'categories') ||
        Object.prototype.hasOwnProperty.call(result, 'settings')
    );
    if (!hasStateShape) return false;

    if (Object.prototype.hasOwnProperty.call(result, 'transactions')) {
        state.transactions = (result.transactions || []).map((t) => {
            if (!t || typeof t !== 'object') return t;
            const isFixedExpense = t.type === 'fixed_expense';
            return {
                ...t,
                frequency: isFixedExpense && !FREQUENCIES[t.frequency] ? 'monthly' : t.frequency
            };
        });
    }
    if (Object.prototype.hasOwnProperty.call(result, 'savingsGoals')) {
        state.savingsGoals = result.savingsGoals || [];
    }
    if (Object.prototype.hasOwnProperty.call(result, 'accountBalances')) {
        state.accountBalances = result.accountBalances || [];
    }
    if (result.categories) {
        state.categories = result.categories.map(cat => {
            if (typeof cat === 'string') return { name: cat, icon: 'category' };
            return cat;
        });
    }
    if (result.settings) {
        // Keep local auth fields; server settings may be stale or empty.
        state.settings = {
            ...state.settings,
            ...result.settings,
            scriptUrl: state.settings.scriptUrl,
            secretKey: state.settings.secretKey
        };
    }
    perfLog('applyBootstrapData()', applyStart, `tx=${state.transactions.length}, goals=${state.savingsGoals.length}, acc=${state.accountBalances.length}`);
    return true;
}

function applyActionResultLocally(action, result, payload) {
    if (!result || !result.ok) return false;

    const upsertInList = (list, item) => {
        if (!item || !item.id) return list;
        const index = list.findIndex((v) => v && v.id === item.id);
        if (index === -1) return [...list, item];
        const next = list.slice();
        // Keep existing fields if backend response is partial.
        next[index] = { ...next[index], ...item };
        return next;
    };

    if ((action === 'upsertSettings' || action === 'updateSettings') && result.settings) {
        state.settings = {
            ...state.settings,
            ...result.settings,
            scriptUrl: state.settings.scriptUrl,
            secretKey: state.settings.secretKey
        };
        return true;
    }

    if ((action === 'addTransaction' || action === 'upsertTransaction' || action === 'updateTransaction') && result.transaction) {
        const tx = {
            ...result.transaction,
            frequency: result.transaction.type === 'fixed_expense' && !FREQUENCIES[result.transaction.frequency]
                ? 'monthly'
                : result.transaction.frequency
        };
        state.transactions = upsertInList(state.transactions, tx);
        return true;
    }

    if (action === 'deleteTransaction' && (result.deletedId || (payload && payload.id))) {
        const targetId = result.deletedId || payload.id;
        state.transactions = state.transactions.filter((t) => String(t.id) !== String(targetId));
        return true;
    }

    if ((action === 'addSavingsGoal' || action === 'upsertSavingsGoal' || action === 'updateSavingsGoal') && result.savingsGoal) {
        state.savingsGoals = upsertInList(state.savingsGoals, result.savingsGoal);
        return true;
    }

    if (action === 'deleteSavingsGoal' && result.deletedId) {
        state.savingsGoals = state.savingsGoals.filter((g) => String(g.id) !== String(result.deletedId));
        return true;
    }

    if ((action === 'addAccountBalance' || action === 'upsertAccountBalance' || action === 'updateAccountBalance') && result.accountBalance) {
        state.accountBalances = upsertInList(state.accountBalances, result.accountBalance);
        return true;
    }

    if (action === 'deleteAccountBalance' && result.deletedId) {
        state.accountBalances = state.accountBalances.filter((a) => String(a.id) !== String(result.deletedId));
        return true;
    }

    if ((action === 'addCategory' || action === 'upsertCategory') && result.categories) {
        state.categories = result.categories.map((cat) => (typeof cat === 'string' ? { name: cat, icon: 'category' } : cat));
        return true;
    }

    if (action === 'deleteCategory' && result.categories) {
        state.categories = result.categories.map((cat) => (typeof cat === 'string' ? { name: cat, icon: 'category' } : cat));
        return true;
    }

    if (result.state && result.state.ok) {
        if (action && action !== 'replaceAllData' && action !== 'syncAll' && action !== 'saveSetup' && action !== 'clearAllData') {
            const s = result.state || {};
            const looksEmptyState = Array.isArray(s.transactions) && Array.isArray(s.savingsGoals) && Array.isArray(s.accountBalances)
                && s.transactions.length === 0 && s.savingsGoals.length === 0 && s.accountBalances.length === 0;
            if (looksEmptyState) {
                console.warn('[SYNC_GUARD] Ignoring suspicious empty bootstrap payload on action:', action, result);
                return true;
            }
        }
        // Fallback for older backend payloads that still return full state.
        // Action-specific handlers above intentionally win to avoid accidental
        // state wipe from malformed legacy bootstrap responses.
        return applyBootstrapData(result.state);
    }

    // Fallback: apply any full bootstrap-like payload if returned.
    return applyBootstrapData(result);
}

async function fetchDataFromGAS(options = {}) {
    const totalStart = perfNow();
    if (!state.settings.scriptUrl || !state.settings.secretKey) return;
    const showLoading = options.showLoading !== false;
    if (showLoading) startLoading(options.loadingMessage || 'טוען נתונים מהקובץ...');

    try {
        const networkStart = perfNow();
        const response = await fetch(`${state.settings.scriptUrl}?secret=${encodeURIComponent(state.settings.secretKey)}&action=getBootstrapData`);
        perfLog('fetchDataFromGAS network', networkStart, `status=${response.status}`);
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error('Expected JSON but received:', text.substring(0, 100));
            if (text.includes('<!DOCTYPE')) {
                alert('שגיאת התחברות ל-Script. וודא שה-URL נכון ושה-Script פורסם כ-Web App עם גישה לכולם (Anyone).');
            }
            return;
        }

        const parseStart = perfNow();
        const result = await response.json();
        perfLog('fetchDataFromGAS parseJSON', parseStart);
        
        if (applyBootstrapData(result)) {
            ensureGoalRecurringTransactionsSyncedOnce();
            render();
        } else {
            console.error('Failed to fetch data:', result && result.message);
            if (result && result.message === 'Invalid secret key') {
                console.warn('Secret key rejected by backend. Keeping current session values for retry.');
            }
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        perfLog('fetchDataFromGAS total', totalStart, `showLoading=${showLoading}`);
        if (showLoading) stopLoading();
    }
}

async function saveDataToGAS(action, data, options = {}) {
    const totalStart = perfNow();
    if (!state.settings.scriptUrl || !state.settings.secretKey) return;
    const showLoading = options.showLoading === true;

    state.saveQueueSize += 1;
    if (showLoading) startLoading('שומר ומסנכרן נתונים...');

    const runSave = async () => {
        try {
            const prepStart = perfNow();
            const form = new URLSearchParams();
            form.set('secret', state.settings.secretKey);
            form.set('action', action);
            form.set('payload', JSON.stringify(data || {}));
            perfLog('saveDataToGAS preparePayload', prepStart, `action=${action}`);

            const networkStart = perfNow();
            const response = await fetch(state.settings.scriptUrl, {
                method: 'POST',
                body: form
            });
            perfLog('saveDataToGAS network', networkStart, `action=${action}, status=${response.status}`);

            if (!response.ok) {
                throw new Error(`Save failed with HTTP ${response.status}`);
            }

            const parseStart = perfNow();
            const result = await response.json();
            perfLog('saveDataToGAS parseJSON', parseStart, `action=${action}`);
            console.log('[DEBUG] saveDataToGAS result', {
                action,
                hasState: !!(result && result.state),
                hasDeletedId: !!(result && result.deletedId),
                hasTransaction: !!(result && result.transaction),
                ok: !!(result && result.ok),
                keys: result ? Object.keys(result) : []
            });
            if (action === 'deleteTransaction') {
                console.log('[DEBUG] deleteTransaction payload/result', { payload: data, result });
            }
            if (applyActionResultLocally(action, result, data)) {
                render();
            } else {
                console.warn('[SYNC_GUARD] Unexpected save response shape, keeping local state:', action, result);
                // Keep optimistic local state and avoid destructive full sync.
                render();
            }
        } catch (error) {
            console.error('Error saving data:', error);
            // Recovery sync if save failed.
            try {
                await fetchDataFromGAS({ showLoading: false });
            } catch (_) {}
        } finally {
            state.saveQueueSize = Math.max(0, state.saveQueueSize - 1);
            perfLog('saveDataToGAS total', totalStart, `action=${action}, queue=${state.saveQueueSize}`);
            if (showLoading) stopLoading();
        }
    };

    saveQueuePromise = saveQueuePromise.then(runSave);
    return saveQueuePromise;
}

// --- Modal Management ---
function openModal(contentHtml) {
    const container = document.getElementById('modal-container');
    const backdrop = document.getElementById('modal-backdrop');
    const content = document.getElementById('modal-content');
    
    content.innerHTML = contentHtml;
    container.classList.remove('hidden');
    
    // Trigger animations
    setTimeout(() => {
        backdrop.classList.replace('opacity-0', 'opacity-100');
        content.classList.replace('translate-y-full', 'translate-y-0');
    }, 10);
}

function closeModal() {
    const container = document.getElementById('modal-container');
    const backdrop = document.getElementById('modal-backdrop');
    const content = document.getElementById('modal-content');
    
    backdrop.classList.replace('opacity-100', 'opacity-0');
    content.classList.replace('translate-y-0', 'translate-y-full');
    
    setTimeout(() => {
        container.classList.add('hidden');
    }, 300);
}

function renderTransactionModal(transaction = null) {
    const isEdit = !!(transaction && transaction.id);
    const title = isEdit ? 'עריכת תנועה' : 'תנועה חדשה';
    
    const html = `
        <div class="space-y-6">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-3">
                    <h2 class="text-2xl font-black text-primary">${title}</h2>
                    <button onclick="renderCategoryModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title="הוספת קטגוריה">
                        <span class="material-symbols-outlined text-sm">add</span>
                    </button>
                </div>
                <button onclick="closeModal()" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <form id="transaction-form" class="space-y-4">
                <div class="space-y-1">
                    <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">שם התנועה</label>
                    <input type="text" name="name" value="${transaction?.name || ''}" required class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">סכום</label>
                        <input type="number" step="0.01" name="amount" value="${transaction?.amount || ''}" required class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">תאריך</label>
                        <input type="date" name="date" value="${transaction?.date || formatDateLocal(new Date())}" required class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">סוג תנועה</label>
                        <select name="type" id="transaction-type" onchange="toggleFrequencyDisplay(this.value)" class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all appearance-none">
                            ${Object.entries(TRANSACTION_TYPES).map(([key, val]) => `
                                <option value="${key}" ${transaction?.type === key ? 'selected' : ''}>${val.label}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="space-y-1">
                        <div class="flex items-center justify-between px-1">
                            <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">קטגוריה</label>
                            <button type="button" onclick="renderAddCategoryModal()" class="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
                                <span class="material-symbols-outlined text-xs">add</span>
                                הוסף חדש
                            </button>
                        </div>
                        <select name="category" class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all appearance-none">
                            <option value="" ${!transaction?.category ? 'selected' : ''}>בחר קטגוריה</option>
                            ${state.categories.map(cat => `
                                <option value="${cat.name}" ${transaction?.category === cat.name ? 'selected' : ''}>${cat.name}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div id="frequency-section" class="${(!transaction?.isInstallments && (transaction?.type?.startsWith('fixed') || (transaction?.type === 'variable_expense' && transaction?.isRecurring))) ? '' : 'hidden'} space-y-4">
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">תדירות</label>
                        <select name="frequency" class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all appearance-none">
                            ${Object.entries(FREQUENCIES).map(([key, val]) => `
                                <option value="${key}" ${transaction?.frequency === key ? 'selected' : ''}>${val.label}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div id="variable-price-section" class="${(transaction?.type === 'fixed_expense' || transaction?.type === 'variable_expense') ? '' : 'hidden'} flex items-center justify-between bg-surface-variant/10 p-4 rounded-2xl border border-surface-variant/30">
                        <div class="flex flex-col">
                            <label for="isVariablePrice" class="text-sm font-bold">מחיר משתנה</label>
                            <p class="text-[10px] text-on-surface-variant">הוצאה שסכומה משתנה (כמו חשמל)</p>
                        </div>
                        <input type="checkbox" id="isVariablePrice" name="isVariablePrice" ${transaction?.isVariablePrice ? 'checked' : ''} class="w-6 h-6 rounded-full border-surface-variant text-primary focus:ring-primary">
                    </div>
                </div>

                <div id="expense-reminder-section" class="${(transaction?.type === 'fixed_expense' || transaction?.type === 'variable_expense') ? '' : 'hidden'}">
                    <label class="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 cursor-pointer">
                        <input type="checkbox" name="alert" ${transaction?.alert ? 'checked' : ''} class="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-400">
                        <span class="text-sm font-bold text-amber-800">להפעיל תזכורת בתאריך החודשי של ההוצאה</span>
                    </label>
                </div>

                <div id="installments-section" class="${(transaction?.type === 'fixed_expense' || transaction?.type === 'variable_expense') ? '' : 'hidden'} space-y-3 bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                    <label class="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" id="isInstallments" name="isInstallments" onchange="toggleFrequencyDisplay(document.getElementById('transaction-type').value)" ${transaction?.isInstallments ? 'checked' : ''} class="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-400">
                        <span class="text-sm font-bold text-blue-900">זו הוצאה בתשלומים</span>
                    </label>
                    <div id="installments-details" class="${transaction?.isInstallments ? '' : 'hidden'} grid grid-cols-2 gap-3">
                        <div class="space-y-1">
                            <label class="text-xs font-bold text-blue-900/80 uppercase tracking-wider px-1">תאריך תשלום ראשון</label>
                            <input type="date" name="installmentsStartDate" value="${transaction?.installmentsStartDate || transaction?.date || formatDateLocal(new Date())}" class="w-full h-12 px-3 rounded-xl bg-white border border-blue-100 focus:border-primary outline-none transition-all">
                        </div>
                        <div class="space-y-1">
                            <label class="text-xs font-bold text-blue-900/80 uppercase tracking-wider px-1">מס׳ תשלומים</label>
                            <input type="number" name="installmentsTotal" min="2" step="1" value="${transaction?.installmentsTotal || ''}" class="w-full h-12 px-3 rounded-xl bg-white border border-blue-100 focus:border-primary outline-none transition-all" placeholder="למשל 10">
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2 py-2">
                    <input type="checkbox" id="isRecurring" name="isRecurring" onchange="toggleFrequencyDisplay(document.getElementById('transaction-type').value)" ${transaction?.isRecurring || transaction?.type?.startsWith('fixed') ? 'checked' : ''} class="w-5 h-5 rounded border-surface-variant text-primary focus:ring-primary">
                    <label for="isRecurring" class="text-sm font-bold">תנועה קבועה</label>
                </div>
                
                <div class="pt-4 flex gap-3">
                    <button type="submit" class="flex-1 h-14 bg-primary text-on-primary rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 active:scale-95 transition-all">
                        ${isEdit ? 'עדכון תנועה' : 'הוספת תנועה'}
                    </button>
                    ${isEdit ? `
                        <button type="button" onclick="handleDeleteTransaction('${transaction.id}')" class="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center active:scale-95 transition-all">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    ` : ''}
                </div>
            </form>
        </div>
    `;
    
    openModal(html);
    
    document.getElementById('transaction-form').onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const type = formData.get('type');
        const isVariablePrice = formData.get('isVariablePrice') === 'on';
        const isInstallments = (type === 'fixed_expense' || type === 'variable_expense') && formData.get('isInstallments') === 'on';
        const installmentsTotal = isInstallments ? normalizeInstallmentsTotal(formData.get('installmentsTotal')) : 0;
        const installmentsStartDate = isInstallments ? String(formData.get('installmentsStartDate') || formData.get('date') || formatDateLocal(new Date())) : '';

        if (isInstallments && installmentsTotal < 2) {
            alert('בהוצאה בתשלומים יש להזין לפחות 2 תשלומים.');
            return;
        }

        const isRecurring = isInstallments || formData.get('isRecurring') === 'on' || type.startsWith('fixed');
        const effectiveDate = isInstallments ? installmentsStartDate : String(formData.get('date'));
        
        const data = {
            id: transaction?.id || Date.now().toString(),
            name: formData.get('name'),
            amount: parseFloat(formData.get('amount')),
            date: effectiveDate,
            type: type,
            category: formData.get('category'),
            isRecurring: isRecurring,
            frequency: isInstallments ? 'monthly' : (isRecurring ? (formData.get('frequency') || transaction?.frequency || 'monthly') : ''),
            alert: (type === 'fixed_expense' || type === 'variable_expense') ? (formData.get('alert') === 'on') : false,
            isVariablePrice: (type === 'fixed_expense' || type === 'variable_expense') ? isVariablePrice : false,
            lastMonthAmount: (isVariablePrice && isEdit) ? transaction.amount : (transaction?.lastMonthAmount || 0),
            isInstallments: isInstallments,
            installmentsTotal: isInstallments ? installmentsTotal : '',
            installmentsStartDate: isInstallments ? installmentsStartDate : '',
            desc: formData.get('name'),
            goalId: transaction?.goalId || '',
            cycleDate: transaction?.cycleDate || ''
        };
        
        handleSaveTransaction(data, isEdit);
    };

    const typeSelect = document.getElementById('transaction-type');
    if (typeSelect) {
        toggleFrequencyDisplay(typeSelect.value);
    }
}

function toggleFrequencyDisplay(type) {
    const freqSection = document.getElementById('frequency-section');
    const varPriceSection = document.getElementById('variable-price-section');
    const reminderSection = document.getElementById('expense-reminder-section');
    const installmentsSection = document.getElementById('installments-section');
    const isRecurringCheckbox = document.getElementById('isRecurring');
    const isInstallmentsCheckbox = document.getElementById('isInstallments');

    const isExpenseType = type === 'fixed_expense' || type === 'variable_expense';
    const installmentsChecked = !!(isInstallmentsCheckbox && isInstallmentsCheckbox.checked);
    const shouldShowFrequency = !installmentsChecked && (type.startsWith('fixed') || (type === 'variable_expense' && isRecurringCheckbox && isRecurringCheckbox.checked));

    if (shouldShowFrequency) {
        freqSection.classList.remove('hidden');
    } else {
        freqSection.classList.add('hidden');
    }

    if (type.startsWith('fixed') && isRecurringCheckbox) {
        isRecurringCheckbox.checked = true;
    }

    if (varPriceSection) {
        if (isExpenseType) varPriceSection.classList.remove('hidden');
        else varPriceSection.classList.add('hidden');
    }

    if (reminderSection) {
        if (isExpenseType) reminderSection.classList.remove('hidden');
        else reminderSection.classList.add('hidden');
    }

    if (installmentsSection) {
        if (isExpenseType) installmentsSection.classList.remove('hidden');
        else installmentsSection.classList.add('hidden');
    }

    if (!isExpenseType && isInstallmentsCheckbox) {
        isInstallmentsCheckbox.checked = false;
    }

    toggleInstallmentsDetails();
}

function toggleInstallmentsDetails() {
    const isInstallmentsCheckbox = document.getElementById('isInstallments');
    const details = document.getElementById('installments-details');
    const frequencySection = document.getElementById('frequency-section');
    if (!details || !isInstallmentsCheckbox) return;

    if (isInstallmentsCheckbox.checked) {
        details.classList.remove('hidden');
        if (frequencySection) frequencySection.classList.add('hidden');
    } else {
        details.classList.add('hidden');
    }
}
function handleSaveTransaction(data, isEdit) {
    if (isEdit) {
        state.transactions = state.transactions.map(t => t.id === data.id ? data : t);
        saveDataToGAS('updateTransaction', data);
    } else {
        state.transactions.push(data);
        saveDataToGAS('addTransaction', data);
    }
    closeModal();
    render();
}

function handleDeleteTransaction(id) {
    const tx = state.transactions.find((t) => String(t.id) === String(id));
    const linkedGoal = tx && tx.goalId ? state.savingsGoals.find((g) => String(g.id) === String(tx.goalId)) : null;
    if (confirm('האם אתה בטוח שברצונך למחוק תנועה זו?')) {
        if (tx && tx.type === 'savings_deposit' && tx.isRecurring && linkedGoal) {
            const cycleKey = getCurrentCycleKey();
            const skipped = getSkippedCycleSetFromTransaction(tx);
            skipped.add(cycleKey);
            const updatedTx = {
                ...tx,
                cycleDate: buildSkippedCycleValue(skipped)
            };
            state.transactions = state.transactions.map((t) => (String(t.id) === String(tx.id) ? updatedTx : t));
            saveDataToGAS('updateTransaction', updatedTx);
            closeModal();
            render();
            return;
        }
        state.transactions = state.transactions.filter(t => t.id !== id);
        saveDataToGAS('deleteTransaction', { id });
        closeModal();
        render();
    }
}

function renderAddCategoryModal() {
    const html = `
        <div class="space-y-6">
            <div class="flex items-center justify-between mb-2">
                <h2 class="text-2xl font-black text-primary">קטגוריה חדשה</h2>
                <button onclick="closeModal()" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <form id="category-form" class="space-y-4">
                <div class="space-y-1">
                    <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">שם הקטגוריה</label>
                    <input type="text" id="new-category-name" required class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all" placeholder="למשל: חדר כושר">
                </div>
                
                <div class="space-y-1">
                    <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">אייקון</label>
                    <div class="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-surface-variant/10 rounded-2xl">
                        ${['restaurant', 'sports_esports', 'directions_car', 'medical_services', 'shopping_bag', 'home', 'school', 'redeem', 'verified_user', 'category', 'fitness_center', 'movie', 'flight', 'pets', 'work', 'build', 'payments', 'account_balance', 'local_gas_station', 'fastfood'].map(icon => `
                            <button type="button" onclick="selectCategoryIcon('${icon}')" class="category-icon-btn w-full aspect-square rounded-xl flex items-center justify-center hover:bg-primary/10 transition-all border-2 border-transparent" data-icon="${icon}">
                                <span class="material-symbols-outlined">${icon}</span>
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="new-category-icon" value="category">
                </div>
                
                <button type="submit" class="w-full h-14 bg-primary text-on-primary rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 active:scale-95 transition-all mt-4">
                    הוספת קטגוריה
                </button>
            </form>
        </div>
    `;
    
    openModal(html);
    
    document.getElementById('category-form').onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('new-category-name').value.trim();
        const icon = document.getElementById('new-category-icon').value;
        if (name) {
            handleSaveCategory({ name, icon });
        }
    };
}

function selectCategoryIcon(icon) {
    document.querySelectorAll('.category-icon-btn').forEach(btn => {
        btn.classList.remove('border-primary', 'bg-primary/10');
        if (btn.dataset.icon === icon) {
            btn.classList.add('border-primary', 'bg-primary/10');
        }
    });
    document.getElementById('new-category-icon').value = icon;
}

function handleSaveCategory(category) {
    if (state.categories.find(c => c.name === category.name)) {
        alert('קטגוריה זו כבר קיימת');
        return;
    }
    state.categories.push(category);
    saveDataToGAS('addCategory', category);
    closeModal();
    render();
}

function renderSavingsActionModal() {
    const hasGoals = state.savingsGoals.length > 0;

    const html = `
        <div class="space-y-6">
            <div class="flex items-center justify-between mb-2">
                <h2 class="text-2xl font-black text-primary">פעולת חיסכון</h2>
                <button onclick="closeModal()" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <button type="button" onclick="handleSavingsActionSelect('new')" class="w-full p-4 rounded-2xl border border-surface-variant/40 bg-white hover:bg-surface-variant/10 transition-all text-right">
                <p class="text-lg font-black text-on-surface">יצירת יעד חיסכון חדש</p>
                <p class="text-sm text-on-surface-variant mt-1">הגדרת יעד, תאריך התחלה והפקדה חודשית</p>
            </button>

            <button type="button" onclick="handleSavingsActionSelect('extra')" class="w-full p-4 rounded-2xl border border-surface-variant/40 ${hasGoals ? 'bg-white hover:bg-surface-variant/10' : 'bg-surface-variant/20 opacity-60 cursor-not-allowed'} transition-all text-right" ${hasGoals ? '' : 'disabled'}>
                <p class="text-lg font-black text-on-surface">הפקדה נוספת לחיסכון קיים</p>
                <p class="text-sm text-on-surface-variant mt-1">${hasGoals ? 'בחירת יעד קיים ועדכון ההפקדה של החודש' : 'אין עדיין יעדי חיסכון קיימים'}</p>
            </button>
        </div>
    `;

    openModal(html);
}

function handleSavingsActionSelect(mode) {
    if (mode === 'new') {
        renderSavingsModal();
        return;
    }

    if (!state.savingsGoals.length) {
        alert('לא קיימים עדיין יעדי חיסכון. בוא ניצור יעד חדש קודם.');
        renderSavingsModal();
        return;
    }

    renderSavingsGoalPickerModal();
}

function renderSavingsGoalPickerModal() {
    const goals = [...state.savingsGoals]
        .sort((a, b) => (Number(b.current) || 0) - (Number(a.current) || 0));

    if (!goals.length) {
        renderSavingsModal();
        return;
    }

    const html = `
        <div class="space-y-6">
            <div class="flex items-center justify-between mb-2">
                <h2 class="text-2xl font-black text-primary">בחירת חיסכון להפקדה</h2>
                <button onclick="closeModal()" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="space-y-3 max-h-[52vh] overflow-y-auto no-scrollbar pr-1">
                ${goals.map((goal) => `
                    <button type="button" onclick="renderExtraDepositModal('${goal.id}')" class="w-full p-4 rounded-2xl border border-surface-variant/40 bg-white hover:bg-surface-variant/10 transition-all text-right">
                        <div class="flex items-center justify-between gap-3">
                            <span class="material-symbols-outlined ${goal.color.replace('bg-', 'text-')}">savings</span>
                            <div class="min-w-0">
                                <p class="font-black text-lg truncate">${goal.name}</p>
                                <p class="text-sm text-on-surface-variant">נוכחי: ${formatCurrency(goal.current || 0)} • יעד: ${formatCurrency(goal.target || 0)}</p>
                            </div>
                        </div>
                    </button>
                `).join('')}
            </div>

            <button type="button" onclick="renderSavingsActionModal()" class="w-full h-12 rounded-2xl bg-surface-variant/20 text-on-surface font-bold">
                חזרה
            </button>
        </div>
    `;

    openModal(html);
}

function renderSavingsModal(goal = null) {
    const isEdit = !!goal;
    const title = isEdit ? 'עריכת חיסכון' : 'חיסכון חדש';
    
    const html = `
        <div class="space-y-6">
            <div class="flex items-center justify-between mb-2">
                <h2 class="text-2xl font-black text-primary">${title}</h2>
                <button onclick="closeModal()" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <form id="savings-form" class="space-y-4">
                <div class="space-y-1">
                    <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">שם היעד</label>
                    <input type="text" name="name" value="${goal?.name || ''}" required class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">יעד סופי</label>
                        <input type="number" name="target" value="${goal?.target || ''}" required class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">סכום נוכחי</label>
                        <input type="number" name="current" value="${goal?.current || '0'}" required class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">תאריך התחלה</label>
                        <input type="date" name="startDate" value="${goal?.startDate || formatDateLocal(new Date())}" required class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">הפקדה חודשית</label>
                        <input type="number" name="monthlyAmount" value="${goal?.monthlyAmount || ''}" required class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                    </div>
                </div>

                <div class="space-y-1">
                        <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">יום הפקדה</label>
                        <input type="number" name="depositDay" value="${goal?.depositDay || '10'}" min="1" max="31" required class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                </div>

                <div class="space-y-1">
                    <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">צבע</label>
                    <div class="grid grid-cols-5 gap-2">
                        ${PASTEL_COLORS.map(c => `
                            <button type="button" onclick="selectColor('${c.color}')" class="w-full aspect-square rounded-xl ${c.color} border-4 ${goal?.color === c.color ? 'border-primary' : 'border-transparent'}"></button>
                        `).join('')}
                    </div>
                    <input type="hidden" name="color" value="${goal?.color || PASTEL_COLORS[0].color}">
                </div>
                
                <div class="pt-4 flex gap-3">
                    <button type="submit" class="flex-1 h-14 bg-primary text-on-primary rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 active:scale-95 transition-all">
                        ${isEdit ? 'עדכון יעד' : 'הוספת יעד'}
                    </button>
                    ${isEdit ? `
                        <button type="button" onclick="handleDeleteSavings('${goal.id}')" class="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center active:scale-95 transition-all">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    ` : ''}
                </div>
            </form>
        </div>
    `;
    
    openModal(html);
    
    document.getElementById('savings-form').onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const selectedColor = PASTEL_COLORS.find(c => c.color === formData.get('color'));
        
        const data = {
            id: goal?.id || Date.now().toString(),
            name: formData.get('name'),
            target: parseFloat(formData.get('target')),
            current: parseFloat(formData.get('current')),
            monthlyAmount: parseFloat(formData.get('monthlyAmount')),
            depositDay: parseInt(formData.get('depositDay')),
            color: selectedColor.color,
            container: selectedColor.container,
            onContainer: selectedColor.onContainer,
            icon: goal?.icon || 'savings',
            startDate: formData.get('startDate')
        };
        
        handleSaveSavings(data, isEdit);
    };
}

function selectColor(color) {
    document.querySelector('input[name="color"]').value = color;
    document.querySelectorAll('#savings-form button[onclick^="selectColor"]').forEach(btn => {
        btn.classList.replace('border-primary', 'border-transparent');
        if (btn.classList.contains(color)) {
            btn.classList.replace('border-transparent', 'border-primary');
        }
    });
}

function handleSaveSavings(data, isEdit) {
    if (isEdit) {
        state.savingsGoals = state.savingsGoals.map(g => g.id === data.id ? data : g);
        saveDataToGAS('updateSavingsGoal', data);
    } else {
        state.savingsGoals.push(data);
        saveDataToGAS('addSavingsGoal', data);
    }
    syncRecurringDepositWithGoal(data, isEdit);
    closeModal();
    render();
}

function handleExtraDepositClick(event, goalId) {
    if (event) event.stopPropagation();
    renderExtraDepositModal(goalId);
}

function renderExtraDepositModal(goalId) {
    const goal = state.savingsGoals.find(g => g.id === goalId);
    if (!goal) return;

    const html = `
        <div class="space-y-6">
            <div class="flex items-center justify-between mb-2">
                <h2 class="text-2xl font-black text-primary">הפקדה נוספת</h2>
                <button onclick="closeModal()" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="bg-surface-variant/10 rounded-2xl p-4">
                <p class="text-xs text-on-surface-variant font-bold">יעד</p>
                <p class="text-lg font-extrabold">${goal.name}</p>
                <p class="text-xs text-on-surface-variant mt-1">סכום נוכחי: ${formatCurrency(goal.current)}</p>
            </div>
            
            <form id="extra-deposit-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">סכום הפקדה</label>
                        <input type="number" step="0.01" name="amount" min="0.01" required class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">תאריך</label>
                        <input type="date" name="date" value="${formatDateLocal(new Date())}" required class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                    </div>
                </div>

                <button type="submit" class="w-full h-14 bg-primary text-on-primary rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 active:scale-95 transition-all">
                    שמירת הפקדה
                </button>
            </form>
        </div>
    `;

    openModal(html);

    document.getElementById('extra-deposit-form').onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const amount = Number(formData.get('amount'));
        const date = String(formData.get('date') || formatDateLocal(new Date()));
        if (!amount || amount <= 0) return;

        const updatedGoal = {
            ...goal,
            current: (Number(goal.current) || 0) + amount
        };
        state.savingsGoals = state.savingsGoals.map(g => g.id === goal.id ? updatedGoal : g);
        saveDataToGAS('updateSavingsGoal', updatedGoal);

        const depositTransaction = {
            id: Date.now().toString(),
            name: `הפקדה נוספת: ${goal.name}`,
            amount: amount,
            type: 'savings_deposit',
            date: date,
            category: 'הפרשות לחסכון',
            isRecurring: false,
            goalId: goal.id,
            desc: 'הפקדה נוספת ידנית'
        };
        state.transactions.push(depositTransaction);
        saveDataToGAS('addTransaction', depositTransaction);

        closeModal();
        render();
    };
}

function handleDeleteSavings(id) {
    if (confirm('האם אתה בטוח שברצונך למחוק יעד זה?')) {
        const linkedRecurring = getGoalRecurringDepositTransaction(id);
        if (linkedRecurring) {
            state.transactions = state.transactions.filter((t) => String(t.id) !== String(linkedRecurring.id));
            saveDataToGAS('deleteTransaction', { id: linkedRecurring.id });
        }
        state.savingsGoals = state.savingsGoals.filter(g => g.id !== id);
        saveDataToGAS('deleteSavingsGoal', { id });
        closeModal();
        render();
    }
}

function renderCategoryModal() {
    const html = `
        <div class="space-y-6">
            <div class="flex items-center justify-between mb-2">
                <h2 class="text-2xl font-black text-primary">קטגוריה חדשה</h2>
                <button onclick="closeModal()" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <form id="category-form" class="space-y-4">
                <div class="space-y-1">
                    <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">שם הקטגוריה</label>
                    <input type="text" name="name" required class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                </div>
                
                <button type="submit" class="w-full h-14 bg-primary text-on-primary rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 active:scale-95 transition-all">
                    הוספת קטגוריה
                </button>
            </form>
        </div>
    `;
    
    openModal(html);
    
    document.getElementById('category-form').onsubmit = (e) => {
        e.preventDefault();
        const name = new FormData(e.target).get('name');
        if (name && !state.categories.includes(name)) {
            state.categories.push(name);
            saveDataToGAS('addCategory', { name });
            closeModal();
            renderTransactionModal(); // Re-open transaction modal to show new category
        }
    };
}
function renderAccountModal(account = null) {
    const isEdit = !!account;
    const title = isEdit ? 'עריכת חשבון' : 'חשבון חדש';
    
    const html = `
        <div class="space-y-6">
            <div class="flex items-center justify-between mb-2">
                <h2 class="text-2xl font-black text-primary">${title}</h2>
                <button onclick="closeModal()" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <form id="account-form" class="space-y-4">
                <div class="space-y-1">
                    <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">שם החשבון</label>
                    <input type="text" name="name" value="${account?.name || ''}" required class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">סכום נוכחי</label>
                        <input type="number" step="0.01" name="amount" value="${account?.amount || ''}" required class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all">
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">סוג חשבון</label>
                        <select name="type" class="w-full h-14 px-4 rounded-2xl bg-surface-variant/30 border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all appearance-none">
                            <option value="checking" ${account?.type === 'checking' ? 'selected' : ''}>עו״ש</option>
                            <option value="savings" ${account?.type === 'savings' ? 'selected' : ''}>חיסכון / השקעה</option>
                        </select>
                    </div>
                </div>
                
                <button type="submit" class="w-full h-14 bg-primary text-on-primary rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 active:scale-95 transition-all">
                    ${isEdit ? 'עדכון חשבון' : 'הוספת חשבון'}
                </button>
                ${isEdit ? `
                    <button type="button" onclick="handleDeleteAccount('${account.id}')" class="w-full h-14 bg-rose-50 text-rose-600 rounded-2xl font-bold flex items-center justify-center gap-2 active:bg-rose-100 transition-all">
                        <span class="material-symbols-outlined">delete</span>
                        מחיקת חשבון
                    </button>
                ` : ''}
            </form>
        </div>
    `;
    
    openModal(html);
    
    document.getElementById('account-form').onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            id: account?.id || Date.now().toString(),
            name: formData.get('name'),
            amount: parseFloat(formData.get('amount')),
            type: formData.get('type'),
            lastUpdated: new Date().toISOString()
        };
        
        handleSaveAccount(data, isEdit);
    };
}

function handleSaveAccount(data, isEdit) {
    if (isEdit) {
        state.accountBalances = state.accountBalances.map(a => a.id === data.id ? data : a);
        saveDataToGAS('updateAccountBalance', data);
    } else {
        state.accountBalances.push(data);
        saveDataToGAS('addAccountBalance', data);
    }
    closeModal();
    render();
}

function handleDeleteAccount(id) {
    if (confirm('האם אתה בטוח שברצונך למחוק חשבון זה?')) {
        state.accountBalances = state.accountBalances.filter(a => a.id !== id);
        saveDataToGAS('deleteAccountBalance', { id });
        closeModal();
        render();
    }
}
// --- Event Handlers ---
function handleLogin() {
    const scriptUrl = document.getElementById('scriptUrl').value;
    const secretKey = document.getElementById('secretKey').value;
    
    if (scriptUrl && secretKey) {
        state.settings.scriptUrl = scriptUrl;
        state.settings.secretKey = secretKey;
        localStorage.setItem('budget_settings', JSON.stringify(state.settings));
        fetchDataFromGAS();
        render();
    } else {
        alert('אנא הזן כתובת Script ומפתח סודי');
    }
}

function attachEventListeners() {
    // Attach any dynamic event listeners here
}

function initCharts() {
    const basePath = state.currentPath.split('?')[0];
    
    if (basePath === '/' || basePath === '') {
        initHomeCharts();
    } else if (basePath === '/forecast') {
        initForecastChart();
    }
}

function initHomeCharts() {
    const categoryCtx = document.getElementById('categoryChart');
    const trendCtx = document.getElementById('trendChart');
    
    if (categoryCtx) {
        // Category Breakdown Data
        const currentTransactions = getFilteredTransactions('all');
        const expenses = currentTransactions.filter(t => t.type.includes('expense'));
        const categoryTotals = {};
        expenses.forEach(t => {
            const cat = t.category || 'אחר';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
        });

        const categoryLabels = Object.keys(categoryTotals);
        const categoryData = Object.values(categoryTotals);

        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: categoryLabels,
                datasets: [{
                    data: categoryData,
                    backgroundColor: ['#64B5F6', '#FFB74D', '#81C784', '#E57373', '#BA68C8', '#4DB6AC', '#FFF176'],
                    borderWidth: 0,
                    cutout: '75%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    if (trendCtx) {
        // Monthly Trend Data (Last 5 months) in column style
        const trendData = [];
        const labels = [];
        for (let i = 4; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthName = d.toLocaleDateString('he-IL', { month: 'short' });
            labels.push(monthName);
            
            const monthTransactions = getFilteredTransactions('all', d);
            const monthExpenses = monthTransactions
                .filter(t => t.type.includes('expense'))
                .reduce((sum, t) => sum + t.amount, 0);
            trendData.push(monthExpenses);
        }

        const gradient = trendCtx.getContext('2d').createLinearGradient(0, 0, 0, 220);
        gradient.addColorStop(0, 'rgba(169, 228, 236, 0.95)');
        gradient.addColorStop(1, 'rgba(169, 228, 236, 0.45)');

        const avg = trendData.length ? trendData.reduce((a, b) => a + b, 0) / trendData.length : 0;
        const avgLabel = document.getElementById('trendAverageText');
        if (avgLabel) {
            avgLabel.textContent = `ממוצע חיובים של ${trendData.length} החודשים האחרונים: ${formatCurrency(avg, false)}`;
        }

        const valueLabelsPlugin = {
            id: 'valueLabelsPlugin',
            afterDatasetsDraw(chart) {
                const { ctx } = chart;
                ctx.save();
                ctx.fillStyle = '#2f2f33';
                ctx.font = '600 11px Assistant, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';

                const meta = chart.getDatasetMeta(0);
                meta.data.forEach((bar, index) => {
                    const value = trendData[index] || 0;
                    ctx.fillText(formatCurrency(value, false), bar.x, bar.y - 4);
                });
                ctx.restore();
            }
        };

        new Chart(trendCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'חיובים',
                    data: trendData,
                    backgroundColor: gradient,
                    borderWidth: 0,
                    borderRadius: 6,
                    barPercentage: 0.66,
                    categoryPercentage: 0.72
                }]
            },
            plugins: [valueLabelsPlugin],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { rtl: true, displayColors: false }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#1f1f24',
                            font: { size: 13, weight: '700' }
                        },
                        border: { display: false }
                    },
                    y: { 
                        beginAtZero: true,
                        grid: { display: false },
                        border: { display: false },
                        ticks: { display: false }
                    }
                }
            }
        });
    }
}

function initForecastChart() {
    const ctx = document.getElementById('growthChart');
    if (!ctx) return;

    const forecastData = generateForecastData();
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: forecastData.map(d => d.month),
            datasets: [
                {
                    label: 'נכסים בעו״ש',
                    data: forecastData.map(d => d.checking),
                    backgroundColor: '#FFB74D', // Pastel Orange
                    borderRadius: 4,
                    stack: 'Stack 0',
                },
                {
                    label: 'חיסכון',
                    data: forecastData.map(d => d.savings),
                    backgroundColor: '#64B5F6', // Pastel Blue
                    borderRadius: 4,
                    stack: 'Stack 0',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    rtl: true,
                    labels: {
                        font: { family: 'Assistant', weight: 'bold' }
                    }
                },
                tooltip: {
                    rtl: true,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value, false);
                        }
                    }
                }
            }
        }
    });
}

// --- Initialization ---
async function init() {
    const saved = localStorage.getItem('budget_settings');
    if (saved) {
        state.settings = JSON.parse(saved);
        if (!localStorage.getItem(ONBOARDING_DONE_KEY)) {
            // Preserve the current experience for existing users.
            localStorage.setItem(ONBOARDING_DONE_KEY, '1');
        }
    }

    const onboardingDraft = localStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (onboardingDraft) {
        try {
            const parsed = JSON.parse(onboardingDraft);
            if (parsed && typeof parsed === 'object') {
                state.onboardingStep = Number(parsed.step) || 0;
                state.onboardingData = {
                    ...state.onboardingData,
                    ...(parsed.data || {})
                };
            }
        } catch (_) {
            // Ignore malformed draft values.
        }
    }
    
    // Initial fetch from GAS if authenticated
    if (state.settings.scriptUrl && state.settings.secretKey) {
        try {
            await fetchDataFromGAS();
        } catch (e) {
            console.error('Initial fetch failed:', e);
        }
    }
    
    // Initial render
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.remove();
            render();
        }, 200);
    } else {
        render();
    }
}

init();
