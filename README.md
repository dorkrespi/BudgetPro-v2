# BudgetPro

A Hebrew (RTL), mobile-first personal-finance web app I built to run my own
household budget. It tracks fixed and variable income/expenses, recurring bills,
savings goals with monthly deposit schedules, account balances, and a rolling
12-month cash-flow forecast built around the salary cycle.

**Live demo:** https://dorkrespi.github.io/BudgetPro-v2/
*(The demo loads with placeholder data; connect your own Google Sheet backend to
persist anything — see [Deploy your own copy](#deploy-your-own-copy).)*

## Why I built it

Off-the-shelf budgeting apps assume a US-style monthly cycle and don't model
things like a bi-monthly electricity bill, a salary that lands mid-month, or a
savings goal you feed a fixed amount every payday. I wanted a forecast that
answers *"what will my checking account look like in March?"* given everything I
already know is coming. So I built the tool instead of fighting one.

## Features

- **Transactions** — fixed/variable income and expense, one-off or recurring
  (monthly, bi-monthly, quarterly), per-category, with variable-price bills that
  remember last month's amount.
- **Installments** — split a purchase into N monthly payments; the app shows
  "payment X of Y" and folds the remaining payments into the forecast.
- **Savings goals** — target amount, current balance, monthly deposit schedule,
  start date and duration; quick "add to savings" action from the home screen.
- **Account balances** — checking, savings, investment accounts as forecast
  starting points.
- **12-month forecast** — projects each month's closing balance from current
  balances plus all scheduled income, expenses, and deposits; respects skipped
  months and the configured salary-cycle start day.
- **Salary-cycle budgeting** — the budget month runs from your payday, not the
  1st.
- **Onboarding flow** + **partner invite links** — generate a one-time token so a
  partner can connect to the same backend without sharing the secret key.
- **Categories & charts** — editable categories with icons; category-breakdown
  donut and forecast charts (Chart.js).

## Architecture

```
┌─────────────────────┐        POST (action + payload + secret)        ┌──────────────────────┐
│  index.html + app.js │  ───────────────────────────────────────────▶ │  Google Apps Script   │
│  vanilla JS, no build│  ◀───────────────────────────────────────────  │  code.gs (Web App)    │
│  Tailwind + Chart.js  │                JSON state                     └──────────┬───────────┘
│  via CDN              │                                                          │ typed schema
└─────────────────────┘                                                           ▼
        localStorage: settings, onboarding, per-bill reminders          ┌──────────────────────┐
                                                                        │  Google Sheet         │
                                                                        │  Settings │ Transactions
                                                                        │  SavingsGoals │ AccountBalances
                                                                        │  Categories │ InviteTokens
                                                                        └──────────────────────┘
```

- **Frontend** — a single `index.html` shell plus `app.js` (~3,600 lines of
  vanilla JS: hash-router, string-template views, modal system, single state
  object).
  No framework, no build step. Tailwind and Chart.js load from a CDN.
- **Backend** — `code.gs`, a Google Apps Script Web App deployed against a Google
  Sheet. It exposes a small JSON API (`getBootstrapData`, `syncAll`,
  `upsertTransaction`, `deleteSavingsGoal`, `createInviteToken`, …) over a typed
  sheet schema, with header-mapped read/write helpers so the Sheet stays
  human-readable.
- **Auth** — the client sends a shared `secret` with every write; the script
  checks it against a `SECRET_KEY` script property. The `scriptUrl` and
  `secretKey` are entered by the user in-app and kept in `localStorage` — nothing
  is committed to this repo.

## Deploy your own copy

1. **Create a Google Sheet.** Extensions → Apps Script.
2. **Paste `code.gs`** into the script editor (replace the default `Code.gs`).
3. **Set a secret.** Project Settings → Script Properties → add
   `SECRET_KEY` = *any long random string*.
4. **Deploy → New deployment → Web app.** Execute as *me*, access *Anyone*.
   Copy the `/exec` URL.
5. **Open the app** (the live demo, or your own copy of `index.html` + `app.js`
   hosted anywhere static). In onboarding, paste the `/exec` URL and the same
   secret. First sync creates the sheet tabs and seeds default categories.

To host the frontend yourself, any static host works — this repo is served as-is
by GitHub Pages from the repo root.

## Development

There is nothing to install or build. Open `index.html` with any static file
server:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

Edit `app.js` / `index.html` and refresh. Backend changes go in `code.gs` and are
re-deployed from the Apps Script editor (or with [`clasp`](https://github.com/google/clasp)).

## Credits

Scaffolded in Google AI Studio, then rebuilt by hand as the vanilla-JS app it is
today, with AI-assisted development (Cursor / Claude) along the way.
