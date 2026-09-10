const APP = {
  SHEETS: {
    SETTINGS: 'Settings',
    TRANSACTIONS: 'Transactions',
    SAVINGS_GOALS: 'SavingsGoals',
    ACCOUNT_BALANCES: 'AccountBalances',
    CATEGORIES: 'Categories',
    INVITE_TOKENS: 'InviteTokens'
  },
  HEADERS: {
    SETTINGS: ['key', 'value'],
    TRANSACTIONS: [
      'id',
      'name',
      'amount',
      'type',
      'date',
      'category',
      'desc',
      'isRecurring',
      'frequency',
      'alert',
      'goalId',
      'cycleDate',
      'isVariablePrice',
      'lastMonthAmount',
      'isInstallments',
      'installmentsTotal',
      'installmentsStartDate'
    ],
    SAVINGS_GOALS: [
      'id',
      'name',
      'target',
      'current',
      'icon',
      'color',
      'container',
      'onContainer',
      'note',
      'startDate',
      'durationMonths',
      'depositDay',
      'monthlyAmount'
    ],
    ACCOUNT_BALANCES: ['id', 'name', 'amount', 'type', 'lastUpdated'],
    CATEGORIES: ['name'],
    INVITE_TOKENS: ['token', 'scriptUrl', 'secretKey', 'partnerPhone', 'createdAt', 'expiresAt', 'usedAt', 'isUsed']
  },
  DEFAULT_SETTINGS: {
    userName: '',
    cycleStartDay: 1,
    startMonth: 1,
    startYear: new Date().getFullYear(),
    autoRecalculate: true,
    profileImage: '',
    scriptUrl: '',
    secretKey: ''
  },
  DEFAULT_CATEGORIES: ['מזון', 'פנאי', 'תחבורה', 'בריאות', 'קניות', 'מגורים', 'אחר']
};

function getSecretConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    secret:
      props.getProperty('secretkey') ||
      props.getProperty('SECRET_KEY') ||
      props.getProperty('BUDGET_SHARED_SECRET') ||
      ''
  };
}

function validateSecret_(provided) {
  const expected = String(getSecretConfig_().secret || '').trim();
  if (!expected) return true;

  const actual = String(provided || '').trim();
  if (actual !== expected) throw new Error('Invalid secret key');
  return true;
}

function doGet(e) {
  return handleApiRequest_(e);
}

function doPost(e) {
  return handleApiRequest_(e);
}

function handleApiRequest_(e) {
  try {
    const params = (e && e.parameter) || {};
    const body = parseJsonBody_(e);

    let action = String(params.action || '').trim();
    if (!action && body && body.action) action = String(body.action || '').trim();

    let payload;
    if (params.payload !== undefined && String(params.payload) !== '') {
      payload = parsePayload_(params.payload);
    } else if (body && Object.prototype.hasOwnProperty.call(body, 'payload')) {
      payload = body.payload || {};
    } else if (body && !Object.prototype.hasOwnProperty.call(body, 'action')) {
      payload = body;
    } else {
      payload = {};
    }

    const secret = String(params.secret || (body && body.secret) || '').trim();
    if (action !== 'resolveInviteToken') {
      validateSecret_(secret);
    }

    let result;
    switch (action) {
      case 'getBootstrapData':
      case 'getState':
        result = getBootstrapData();
        break;

      case 'saveSetup':
      case 'replaceAllData':
      case 'syncAll':
        result = replaceAllData(payload);
        break;

      case 'upsertSettings':
      case 'updateSettings':
        result = upsertSettings(payload);
        break;

      case 'addTransaction':
      case 'upsertTransaction':
      case 'updateTransaction':
        result = upsertTransaction(payload);
        break;

      case 'deleteTransaction':
        result = deleteTransaction(payload.id || payload);
        break;

      case 'addSavingsGoal':
      case 'upsertSavingsGoal':
      case 'updateSavingsGoal':
        result = upsertSavingsGoal(payload);
        break;

      case 'deleteSavingsGoal':
        result = deleteSavingsGoal(payload.id || payload);
        break;

      case 'addAccountBalance':
      case 'upsertAccountBalance':
      case 'updateAccountBalance':
        result = upsertAccountBalance(payload);
        break;

      case 'deleteAccountBalance':
        result = deleteAccountBalance(payload.id || payload);
        break;

      case 'addCategory':
      case 'upsertCategory':
        result = upsertCategory(payload.name || payload.category || payload);
        break;

      case 'deleteCategory':
        result = deleteCategory(payload.name || payload.category || payload);
        break;

      case 'createInviteToken':
        result = createInviteToken(payload, secret);
        break;

      case 'resolveInviteToken':
        result = resolveInviteToken(payload.token || params.token || '');
        break;

      case 'resetDemoData':
      case 'clearAllData':
        result = clearAllData();
        break;

      case 'ping':
      default:
        if (action && action !== 'ping') {
          throw new Error('Unknown action: ' + action);
        }
        result = {
          ok: true,
          message: 'BudgetPro backend is running',
          actions: [
            'getBootstrapData',
            'replaceAllData',
            'upsertSettings',
            'upsertTransaction',
            'deleteTransaction',
            'upsertSavingsGoal',
            'deleteSavingsGoal',
            'upsertAccountBalance',
            'deleteAccountBalance',
            'upsertCategory',
            'deleteCategory'
          ]
        };
        break;
    }

    return jsonReply_(result, params.callback);
  } catch (err) {
    return jsonReply_(
      { ok: false, message: err && err.message ? err.message : String(err) },
      (e && e.parameter && e.parameter.callback) || ''
    );
  }
}

function getBootstrapData() {
  ensureAppSheets_();

  const state = readAppState_();
  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    settings: state.settings,
    transactions: state.transactions,
    savingsGoals: state.savingsGoals,
    accountBalances: state.accountBalances,
    categories: state.categories
  };
}

function replaceAllData(payload) {
  ensureAppSheets_();
  payload = payload || {};

  const current = readAppState_();

  const settings = Object.prototype.hasOwnProperty.call(payload, 'settings')
    ? normalizeSettingsObject_(payload.settings)
    : current.settings;

  const transactions = Array.isArray(payload.transactions)
    ? payload.transactions.map(normalizeTransactionRow_)
    : current.transactions;

  const savingsGoals = Array.isArray(payload.savingsGoals)
    ? payload.savingsGoals.map(normalizeSavingsGoalRow_)
    : current.savingsGoals;

  const accountBalances = Array.isArray(payload.accountBalances)
    ? payload.accountBalances.map(normalizeAccountBalanceRow_)
    : current.accountBalances;

  const categories = Array.isArray(payload.categories)
    ? normalizeCategoryList_(payload.categories)
    : current.categories;

  writeSettings_(settings);
  writeTableFromObjects_(APP.SHEETS.TRANSACTIONS, APP.HEADERS.TRANSACTIONS, transactions);
  writeTableFromObjects_(APP.SHEETS.SAVINGS_GOALS, APP.HEADERS.SAVINGS_GOALS, savingsGoals);
  writeTableFromObjects_(APP.SHEETS.ACCOUNT_BALANCES, APP.HEADERS.ACCOUNT_BALANCES, accountBalances);
  writeCategories_(categories);

  return getBootstrapData();
}

function upsertSettings(payload) {
  ensureAppSheets_();
  const merged = Object.assign({}, readSettings_(), payload || {});
  writeSettings_(merged);
  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    settings: normalizeSettingsObject_(merged)
  };
}

function upsertTransaction(payload) {
  ensureAppSheets_();
  const item = upsertById_(
    APP.SHEETS.TRANSACTIONS,
    APP.HEADERS.TRANSACTIONS,
    payload,
    normalizeTransactionRow_
  );

  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    transaction: item
  };
}

function deleteTransaction(id) {
  ensureAppSheets_();
  const deletedId = removeById_(APP.SHEETS.TRANSACTIONS, APP.HEADERS.TRANSACTIONS, id);
  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    deletedId: deletedId
  };
}

function upsertSavingsGoal(payload) {
  ensureAppSheets_();
  const item = upsertById_(
    APP.SHEETS.SAVINGS_GOALS,
    APP.HEADERS.SAVINGS_GOALS,
    payload,
    normalizeSavingsGoalRow_
  );

  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    savingsGoal: item
  };
}

function deleteSavingsGoal(id) {
  ensureAppSheets_();
  const deletedId = removeById_(APP.SHEETS.SAVINGS_GOALS, APP.HEADERS.SAVINGS_GOALS, id);
  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    deletedId: deletedId
  };
}

function upsertAccountBalance(payload) {
  ensureAppSheets_();
  const item = upsertById_(
    APP.SHEETS.ACCOUNT_BALANCES,
    APP.HEADERS.ACCOUNT_BALANCES,
    payload,
    normalizeAccountBalanceRow_
  );

  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    accountBalance: item
  };
}

function deleteAccountBalance(id) {
  ensureAppSheets_();
  const deletedId = removeById_(APP.SHEETS.ACCOUNT_BALANCES, APP.HEADERS.ACCOUNT_BALANCES, id);
  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    deletedId: deletedId
  };
}

function upsertCategory(value) {
  ensureAppSheets_();

  const name = String(value || '').trim();
  if (!name) throw new Error('Category name is required');

  const categories = readCategories_();
  if (categories.indexOf(name) === -1) categories.push(name);
  writeCategories_(categories);

  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    categories: categories
  };
}

function deleteCategory(value) {
  ensureAppSheets_();

  const name = String(value || '').trim();
  if (!name) return getBootstrapData();

  const categories = readCategories_().filter(function(v) {
    return String(v).trim() !== name;
  });

  writeCategories_(categories);
  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    categories: categories
  };
}

function clearAllData() {
  ensureAppSheets_();

  writeSettings_(APP.DEFAULT_SETTINGS);
  writeTableFromObjects_(APP.SHEETS.TRANSACTIONS, APP.HEADERS.TRANSACTIONS, []);
  writeTableFromObjects_(APP.SHEETS.SAVINGS_GOALS, APP.HEADERS.SAVINGS_GOALS, []);
  writeTableFromObjects_(APP.SHEETS.ACCOUNT_BALANCES, APP.HEADERS.ACCOUNT_BALANCES, []);
  writeCategories_(APP.DEFAULT_CATEGORIES.slice());

  return getBootstrapData();
}

function createInviteToken(payload, secret) {
  ensureAppSheets_();
  payload = payload || {};

  const appBaseUrl = String(payload.appBaseUrl || '').trim();
  const partnerPhone = String(payload.partnerPhone || '').trim();
  const scriptUrl = String(payload.scriptUrl || '').trim() || String(readSettings_().scriptUrl || '').trim();
  const resolvedSecret = String(secret || '').trim();

  if (!appBaseUrl) throw new Error('appBaseUrl is required');
  if (!scriptUrl) throw new Error('scriptUrl is required');
  if (!resolvedSecret) throw new Error('secret is required');

  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 days

  const rows = readObjects_(APP.SHEETS.INVITE_TOKENS, APP.HEADERS.INVITE_TOKENS);
  rows.push({
    token: token,
    scriptUrl: scriptUrl,
    secretKey: resolvedSecret,
    partnerPhone: partnerPhone,
    createdAt: createdAt,
    expiresAt: expiresAt,
    usedAt: '',
    isUsed: false
  });
  writeTableFromObjects_(APP.SHEETS.INVITE_TOKENS, APP.HEADERS.INVITE_TOKENS, rows);

  const loginLink =
    appBaseUrl.replace(/\/+$/, '') +
    '/#/login?backend=' + encodeURIComponent(scriptUrl) +
    '&inviteToken=' + encodeURIComponent(token);

  return {
    ok: true,
    token: token,
    expiresAt: expiresAt,
    loginLink: loginLink
  };
}

function resolveInviteToken(tokenValue) {
  ensureAppSheets_();
  const token = String(tokenValue || '').trim();
  if (!token) throw new Error('Token is required');

  const rows = readObjects_(APP.SHEETS.INVITE_TOKENS, APP.HEADERS.INVITE_TOKENS);
  let foundIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i].token || '').trim() === token) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex === -1) throw new Error('Invite token not found');
  const row = rows[foundIndex];

  const isUsed = toBool_(row.isUsed);
  if (isUsed) throw new Error('Invite token already used');

  const expiresAt = String(row.expiresAt || '').trim();
  if (expiresAt) {
    const exp = toDate_(expiresAt);
    if (exp && exp.getTime() < Date.now()) throw new Error('Invite token expired');
  }

  rows[foundIndex].isUsed = true;
  rows[foundIndex].usedAt = new Date().toISOString();
  writeTableFromObjects_(APP.SHEETS.INVITE_TOKENS, APP.HEADERS.INVITE_TOKENS, rows);

  return {
    ok: true,
    scriptUrl: String(row.scriptUrl || '').trim(),
    secretKey: String(row.secretKey || '').trim()
  };
}

function readAppState_() {
  return {
    settings: readSettings_(),
    transactions: readObjects_(APP.SHEETS.TRANSACTIONS, APP.HEADERS.TRANSACTIONS).map(normalizeTransactionRow_),
    savingsGoals: readObjects_(APP.SHEETS.SAVINGS_GOALS, APP.HEADERS.SAVINGS_GOALS).map(normalizeSavingsGoalRow_),
    accountBalances: readObjects_(APP.SHEETS.ACCOUNT_BALANCES, APP.HEADERS.ACCOUNT_BALANCES).map(normalizeAccountBalanceRow_),
    categories: readCategories_()
  };
}

function normalizeTransactionRow_(row) {
  row = row || {};
  return {
    id: String(row.id || Utilities.getUuid()),
    name: String(row.name || '').trim(),
    amount: toNumber_(row.amount),
    type: String(row.type || 'variable_expense').trim(),
    date: normalizeDateOnly_(row.date),
    category: String(row.category || '').trim(),
    desc: String(row.desc || '').trim(),
    isRecurring: toBool_(row.isRecurring),
    frequency: normalizeNullableString_(row.frequency),
    alert: toBool_(row.alert),
    goalId: normalizeNullableString_(row.goalId),
    cycleDate: normalizeNullableString_(row.cycleDate),
    isVariablePrice: toBool_(row.isVariablePrice),
    lastMonthAmount: toNumber_(row.lastMonthAmount),
    isInstallments: toBool_(row.isInstallments),
    installmentsTotal: normalizeNullableInteger_(row.installmentsTotal),
    installmentsStartDate: normalizeNullableDateOnly_(row.installmentsStartDate)
  };
}

function normalizeSavingsGoalRow_(row) {
  row = row || {};
  return {
    id: String(row.id || Utilities.getUuid()),
    name: String(row.name || '').trim(),
    target: toNumber_(row.target),
    current: toNumber_(row.current),
    icon: String(row.icon || 'savings').trim(),
    color: String(row.color || 'bg-blue-400').trim(),
    container: String(row.container || 'bg-blue-50').trim(),
    onContainer: String(row.onContainer || 'text-blue-900').trim(),
    note: normalizeNullableString_(row.note),
    startDate: normalizeNullableDateOnly_(row.startDate),
    durationMonths: normalizeNullableInteger_(row.durationMonths),
    depositDay: normalizeNullableInteger_(row.depositDay),
    monthlyAmount: toNumber_(row.monthlyAmount)
  };
}

function normalizeAccountBalanceRow_(row) {
  row = row || {};

  const rawType = String(row.type || '').trim();
  const validTypes = ['checking', 'savings', 'pension', 'other'];
  const type = validTypes.indexOf(rawType) === -1 ? 'other' : rawType;

  return {
    id: String(row.id || Utilities.getUuid()),
    name: String(row.name || '').trim(),
    amount: toNumber_(row.amount),
    type: type,
    lastUpdated: normalizeIsoDateTime_(row.lastUpdated)
  };
}

function normalizeSettingsObject_(raw) {
  const input = raw || {};
  return {
    userName: String(input.userName || APP.DEFAULT_SETTINGS.userName),
    cycleStartDay: clampInteger_(input.cycleStartDay, 1, 28, APP.DEFAULT_SETTINGS.cycleStartDay),
    startMonth: clampInteger_(input.startMonth, 1, 12, APP.DEFAULT_SETTINGS.startMonth),
    startYear: clampInteger_(input.startYear, 1900, 3000, APP.DEFAULT_SETTINGS.startYear),
    autoRecalculate: toBoolWithDefault_(input.autoRecalculate, APP.DEFAULT_SETTINGS.autoRecalculate),
    profileImage: String(input.profileImage || APP.DEFAULT_SETTINGS.profileImage),
    scriptUrl: String(input.scriptUrl || APP.DEFAULT_SETTINGS.scriptUrl),
    secretKey: String(input.secretKey || APP.DEFAULT_SETTINGS.secretKey)
  };
}

function normalizeCategoryList_(arr) {
  const out = [];
  (arr || []).forEach(function(v) {
    const name = String(v || '').trim();
    if (name && out.indexOf(name) === -1) out.push(name);
  });

  return out;
}

function normalizeNullableString_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeNullableInteger_(value) {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (isNaN(n) || !isFinite(n)) return '';
  return Math.round(n);
}

function normalizeDateOnly_(value) {
  if (!value) {
    const d = new Date();
    return toDateOnly_(d);
  }

  const d = toDate_(value);
  if (!d) {
    const fallback = new Date();
    return toDateOnly_(fallback);
  }

  return toDateOnly_(d);
}

function normalizeNullableDateOnly_(value) {
  if (value === null || value === undefined || value === '') return '';
  const d = toDate_(value);
  return d ? toDateOnly_(d) : '';
}

function normalizeIsoDateTime_(value) {
  if (!value) return new Date().toISOString();
  const d = toDate_(value);
  if (!d) return new Date().toISOString();
  return d.toISOString();
}

function toDateOnly_(date) {
  return Utilities.formatDate(date, 'UTC', 'yyyy-MM-dd');
}

function toDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value;

  const text = String(value || '').trim();
  if (!text) return null;

  const parsed = new Date(text);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
}

function readSettings_() {
  const sheet = getSheet_(APP.SHEETS.SETTINGS, APP.HEADERS.SETTINGS);
  const values = sheet.getDataRange().getValues();
  const raw = {};

  for (let i = 1; i < values.length; i++) {
    const key = String(values[i][0] || '').trim();
    if (!key) continue;
    raw[key] = values[i][1];
  }

  return normalizeSettingsObject_(Object.assign({}, APP.DEFAULT_SETTINGS, raw));
}

function writeSettings_(settings) {
  const normalized = normalizeSettingsObject_(Object.assign({}, APP.DEFAULT_SETTINGS, settings || {}));
  const rows = Object.keys(normalized).map(function(key) {
    return [key, normalized[key]];
  });

  writeValues_(APP.SHEETS.SETTINGS, APP.HEADERS.SETTINGS, rows);
}

function readCategories_() {
  const rows = readObjects_(APP.SHEETS.CATEGORIES, APP.HEADERS.CATEGORIES);
  const list = rows.map(function(row) {
    return String(row.name || '').trim();
  }).filter(function(v) {
    return !!v;
  });

  const normalized = normalizeCategoryList_(list);
  if (!normalized.length) return APP.DEFAULT_CATEGORIES.slice();
  return normalized;
}

function writeCategories_(categories) {
  const rows = normalizeCategoryList_(categories).map(function(name) {
    return { name: name };
  });

  writeTableFromObjects_(APP.SHEETS.CATEGORIES, APP.HEADERS.CATEGORIES, rows);
}

function upsertById_(sheetName, headers, payload, normalizeFn) {
  payload = payload || {};

  const sheet = getSheet_(sheetName, headers);
  const rowCount = sheet.getLastRow();
  const id = String(payload.id || '').trim();
  const idColumn = headers.indexOf('id') + 1;

  let targetSheetRow = -1;
  let existing = {};
  if (id && idColumn > 0 && rowCount >= 2) {
    const idValues = sheet.getRange(2, idColumn, rowCount - 1, 1).getValues();
    for (let i = 0; i < idValues.length; i++) {
      if (String(idValues[i][0] || '').trim() === id) {
        targetSheetRow = i + 2;
        break;
      }
    }
  }

  if (targetSheetRow >= 2) {
    const raw = sheet.getRange(targetSheetRow, 1, 1, headers.length).getValues()[0];
    headers.forEach(function(h, i) {
      existing[h] = raw[i];
    });
  }

  const normalized = normalizeFn(Object.assign({}, existing, payload));
  const rowValues = headers.map(function(h) {
    return normalized[h];
  });

  if (targetSheetRow >= 2) {
    sheet.getRange(targetSheetRow, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.getRange(rowCount + 1, 1, 1, headers.length).setValues([rowValues]);
  }

  return normalized;
}

function removeById_(sheetName, headers, id) {
  const sheet = getSheet_(sheetName, headers);
  const target = String(id || '').trim();
  if (!target) return '';
  const rowCount = sheet.getLastRow();
  const idColumn = headers.indexOf('id') + 1;
  if (rowCount < 2 || idColumn <= 0) return '';

  const idValues = sheet.getRange(2, idColumn, rowCount - 1, 1).getValues();
  for (let i = 0; i < idValues.length; i++) {
    if (String(idValues[i][0] || '').trim() === target) {
      sheet.deleteRow(i + 2);
      return target;
    }
  }

  return '';
}

function parsePayload_(raw) {
  if (raw === null || raw === undefined || raw === '') return {};
  if (typeof raw === 'object') return raw;

  try {
    return JSON.parse(String(raw));
  } catch (err) {
    return {};
  }
}

function parseJsonBody_(e) {
  const raw = e && e.postData && e.postData.contents;
  if (!raw) return null;

  const text = String(raw).trim();
  if (!text) return null;
  if (text[0] !== '{' && text[0] !== '[') return null;

  try {
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}

function jsonReply_(obj, callback) {
  const json = JSON.stringify(obj);

  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function readObjects_(sheetName, headers) {
  const sheet = getSheet_(sheetName, headers);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const rows = [];

  for (let r = 0; r < data.length; r++) {
    const empty = data[r].every(function(v) {
      return v === '' || v === null;
    });

    if (empty) continue;

    const obj = {};
    headers.forEach(function(h, i) {
      obj[h] = data[r][i];
    });
    rows.push(obj);
  }

  return rows;
}

function writeTableFromObjects_(sheetName, headers, rows) {
  const values = (rows || []).map(function(row) {
    return headers.map(function(h) {
      return row[h];
    });
  });

  writeValues_(sheetName, headers, values);
}

function writeValues_(sheetName, headers, rows) {
  const sheet = getSheet_(sheetName, headers);
  clearTableBody_(sheet, headers.length);

  if (!rows || !rows.length) return;
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function clearTableBody_(sheet, colCount) {
  const maxRows = sheet.getMaxRows();

  if (maxRows > 1) {
    sheet.getRange(2, 1, maxRows - 1, colCount).clearContent();
  }
}

function ensureAppSheets_() {
  Object.keys(APP.SHEETS).forEach(function(key) {
    getSheet_(APP.SHEETS[key], APP.HEADERS[key] || ['value']);
  });

  const settingsSheet = getSheet_(APP.SHEETS.SETTINGS, APP.HEADERS.SETTINGS);
  if (settingsSheet.getLastRow() < 2) {
    writeSettings_(APP.DEFAULT_SETTINGS);
  }

  const categoriesSheet = getSheet_(APP.SHEETS.CATEGORIES, APP.HEADERS.CATEGORIES);
  if (categoriesSheet.getLastRow() < 2) {
    writeCategories_(APP.DEFAULT_CATEGORIES.slice());
  }
}

function getSheet_(sheetName, headers) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) sheet = ss.insertSheet(sheetName);

  const headerValues = headers.slice();

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headerValues.length).setValues([headerValues]);
    styleHeaderRow_(sheet, headerValues.length);
  } else {
    const firstRow = sheet.getRange(1, 1, 1, headerValues.length).getValues()[0];
    const mismatch = headerValues.some(function(h, i) {
      return String(firstRow[i] || '').trim() !== h;
    });

    if (mismatch) {
      sheet.getRange(1, 1, 1, headerValues.length).setValues([headerValues]);
      styleHeaderRow_(sheet, headerValues.length);
    }
  }

  return sheet;
}

function styleHeaderRow_(sheet, colCount) {
  sheet
    .getRange(1, 1, 1, colCount)
    .setFontWeight('bold')
    .setBackground('#0f172a')
    .setFontColor('#ffffff');

  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 30);

  for (let c = 1; c <= colCount; c++) {
    sheet.autoResizeColumn(c);
  }
}

function getSpreadsheet_() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;

  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) {
    throw new Error('No active spreadsheet found. Attach the script to a Sheet or set SPREADSHEET_ID.');
  }

  return SpreadsheetApp.openById(id);
}

function toNumber_(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;

  const n = parseFloat(
    String(value)
      .replace(/,/g, '')
      .replace(/[^\d.-]/g, '')
  );

  return isNaN(n) ? 0 : n;
}

function toBool_(value) {
  if (value === true || value === false) return value;
  const t = String(value || '').trim().toLowerCase();
  return ['true', '1', 'yes', 'y', 'on', 'כן', 'פעיל'].indexOf(t) !== -1;
}

function toBoolWithDefault_(value, fallback) {
  if (value === null || value === undefined || value === '') return !!fallback;
  return toBool_(value);
}

function clampInteger_(value, min, max, fallback) {
  const n = Number(value);
  if (isNaN(n) || !isFinite(n)) return fallback;

  const rounded = Math.round(n);
  return Math.max(min, Math.min(max, rounded));
}
